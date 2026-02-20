import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Code, Quote, Image as ImageIcon, Table as TableIcon, Undo, Redo } from 'lucide-react';
import { suggestion } from '../features/notes/suggestion';
import type { Note } from '@/types';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    notes?: Note[];
    readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const toggleAction = (action: () => void) => (e: React.MouseEvent) => {
        e.preventDefault();
        action();
    };

    const btnClass = (isActive: boolean) => cn(
        "p-1.5 rounded-md transition-colors flex items-center justify-center",
        isActive ? "bg-neon-cyan/20 text-neon-cyan" : "text-dark-300 hover:bg-dark-700 hover:text-white"
    );

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-dark-700 bg-dark-800/50">
            <button onClick={toggleAction(() => editor.chain().focus().toggleBold().run())} className={btnClass(editor.isActive('bold'))} title="Bold">
                <Bold className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().toggleItalic().run())} className={btnClass(editor.isActive('italic'))} title="Italic">
                <Italic className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().toggleStrike().run())} className={btnClass(editor.isActive('strike'))} title="Strikethrough">
                <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-dark-600 mx-1"></div>

            <button onClick={toggleAction(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
                <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
                <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-dark-600 mx-1"></div>

            <button onClick={toggleAction(() => editor.chain().focus().toggleBulletList().run())} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
                <List className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().toggleOrderedList().run())} className={btnClass(editor.isActive('orderedList'))} title="Ordered List">
                <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-dark-600 mx-1"></div>

            <button onClick={toggleAction(() => editor.chain().focus().toggleCodeBlock().run())} className={btnClass(editor.isActive('codeBlock'))} title="Code Block">
                <Code className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().toggleBlockquote().run())} className={btnClass(editor.isActive('blockquote'))} title="Quote">
                <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-dark-600 mx-1"></div>

            <button onClick={toggleAction(() => editor.chain().focus().undo().run())} disabled={!editor.can().undo()} className={btnClass(false)} title="Undo">
                <Undo className="w-4 h-4" />
            </button>
            <button onClick={toggleAction(() => editor.chain().focus().redo().run())} disabled={!editor.can().redo()} className={btnClass(false)} title="Redo">
                <Redo className="w-4 h-4" />
            </button>
        </div>
    );
};

export function RichTextEditor({ content, onChange, placeholder = 'Write something...', notes = [], readOnly = false }: RichTextEditorProps) {
    const editor = useEditor({
        editable: !readOnly,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-neon-cyan underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full text-sm my-4',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-dark-600 bg-dark-800 p-2 font-semibold',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-dark-600 p-2',
                },
            }),
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'bg-dark-900 rounded-lg p-4 font-mono text-sm overflow-x-auto',
                },
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention bg-neon-purple/20 text-neon-purple rounded px-1.5 py-0.5 cursor-pointer font-medium',
                },
                suggestion: {
                    char: '[[',
                    ...suggestion(notes)
                },
            })
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[200px] p-4 tiptap text-white marker:text-neon-cyan',
            },
        },
    });

    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Keep state in sync without breaking cursor
            // editor.commands.setContent(content, false)
        }
    }, [content, editor]);

    return (
        <div className={cn("bg-dark-800 border border-dark-700 rounded-lg overflow-hidden flex flex-col", readOnly && "border-none bg-transparent")}>
            {!readOnly && <MenuBar editor={editor} />}
            <div className="custom-scrollbar overflow-y-auto max-h-[60vh]">
                <EditorContent editor={editor} />
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        .tiptap p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap a {
          color: #06b6d4;
          text-decoration: underline;
        }
        .tiptap ul p, .tiptap ol p {
          display: inline;
        }
      `}} />
        </div>
    );
}
