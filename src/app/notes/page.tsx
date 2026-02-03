'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Tag,
  Folder,
  FileText,
  Link2,
  Star,
  StarOff,
  Archive,
  Trash2,
  Edit3,
  MoreHorizontal,
  Clock,
  ChevronRight,
  Grid3X3,
  List,
  Sparkles,
  Brain,
  Hash,
  Eye,
  Lock,
  Globe,
  BookOpen,
  Lightbulb,
  Share2,
  Copy,
  Download,
  Image,
  Code,
  Paperclip,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate, formatRelativeDate, truncateText } from '@/lib/utils';
import type { Note, NoteFolder } from '@/types';

// Mock notes for demonstration
const mockNotes: Note[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Project Nexora Architecture',
    content: `# Nexora Architecture Overview

## Core Modules
- **Dashboard**: Central command hub
- **Tasks**: AI-powered task management
- **Calendar**: Smart scheduling
- **Notes**: Knowledge base with linking

## Tech Stack
- Next.js 14 with App Router
- Firebase for backend
- Zustand for state management
- Framer Motion for animations

## Key Features
1. Natural language processing
2. Context-aware suggestions
3. Cross-module intelligence
4. Offline-first sync`,
    folderId: 'work',
    tags: ['project', 'architecture', 'nexora'],
    linkedNoteIds: ['2', '3'],
    linkedTaskIds: [],
    isPinned: true,
    isArchived: false,
    aiSummary: 'Technical architecture overview for the Nexora AI personal assistant project, covering core modules and tech stack.',
    aiTags: ['software-architecture', 'nextjs', 'firebase'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Meeting Notes: Q2 Planning',
    content: `# Q2 Planning Meeting

**Date**: March 15, 2024
**Attendees**: Team leads, Product, Engineering

## Key Decisions
- Launch MVP by end of April
- Focus on core features first
- Weekly sync meetings

## Action Items
- [ ] Finalize design specs
- [ ] Set up CI/CD pipeline
- [ ] Create user testing plan

## Notes
The team agreed on prioritizing user experience over feature count. Quality is the main focus.`,
    folderId: 'work',
    tags: ['meeting', 'planning', 'q2'],
    linkedNoteIds: ['1'],
    linkedTaskIds: ['task-1', 'task-2'],
    isPinned: false,
    isArchived: false,
    aiSummary: 'Q2 planning meeting notes covering MVP launch timeline, team priorities, and action items.',
    aiTags: ['meeting-notes', 'planning', 'q2-2024'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Reading Notes: Atomic Habits',
    content: `# Atomic Habits by James Clear

## Key Concepts

### The 4 Laws of Behavior Change
1. **Make it obvious** - Design your environment
2. **Make it attractive** - Temptation bundling
3. **Make it easy** - Reduce friction
4. **Make it satisfying** - Immediate rewards

### Identity-Based Habits
Focus on who you want to become, not just what you want to achieve.

> "Every action you take is a vote for the type of person you wish to become."

## Personal Applications
- Morning routine optimization
- Deep work sessions
- Reading habit stack`,
    folderId: 'personal',
    tags: ['book', 'self-improvement', 'habits'],
    linkedNoteIds: [],
    linkedTaskIds: [],
    isPinned: true,
    isArchived: false,
    aiSummary: 'Summary of key concepts from Atomic Habits, focusing on the 4 laws of behavior change and identity-based habits.',
    aiTags: ['book-notes', 'self-improvement', 'productivity'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    userId: 'user1',
    title: 'Daily Journal Template',
    content: `# Daily Journal

## Morning Check-in
- Energy level: /10
- Mood: 
- Intentions for today:

## Gratitude
1. 
2. 
3. 

## Today's Priorities
- [ ] 
- [ ] 
- [ ] 

## Evening Reflection
- What went well?
- What could be improved?
- Key learnings:`,
    folderId: 'personal',
    tags: ['template', 'journal', 'daily'],
    linkedNoteIds: [],
    linkedTaskIds: [],
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    userId: 'user1',
    title: 'API Documentation Notes',
    content: `# Firebase API Notes

## Authentication
\`\`\`javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
\`\`\`

## Firestore
- Real-time updates with onSnapshot
- Batched writes for multiple operations
- Security rules are critical

## Common Patterns
1. Optimistic updates
2. Pagination with cursors
3. Composite indexes`,
    folderId: 'work',
    tags: ['code', 'firebase', 'api'],
    linkedNoteIds: ['1'],
    linkedTaskIds: [],
    isPinned: false,
    isArchived: false,
    aiTags: ['technical', 'firebase', 'javascript'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
];

const mockFolders: NoteFolder[] = [
  { id: 'work', userId: 'user1', name: 'Work', color: '#00f0ff', parentId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'personal', userId: 'user1', name: 'Personal', color: '#a855f7', parentId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ideas', userId: 'user1', name: 'Ideas', color: '#f97316', parentId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'archive', userId: 'user1', name: 'Archive', color: '#6b7280', parentId: null, createdAt: new Date(), updatedAt: new Date() },
];

type ViewMode = 'grid' | 'list';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [folders, setFolders] = useState<NoteFolder[]>(mockFolders);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
      note.aiTags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    let result = [...notes].filter(n => !n.isArchived);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query)) ||
          note.aiSummary?.toLowerCase().includes(query)
      );
    }

    // Folder filter
    if (selectedFolder) {
      result = result.filter(note => note.folderId === selectedFolder);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(note =>
        selectedTags.some(tag => 
          note.tags.includes(tag) || note.aiTags?.includes(tag)
        )
      );
    }

    // Sort: pinned first, then by updated date
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return result;
  }, [notes, searchQuery, selectedFolder, selectedTags]);

  // Stats
  const stats = useMemo(() => ({
    total: notes.filter(n => !n.isArchived).length,
    pinned: notes.filter(n => n.isPinned).length,
    linked: notes.filter(n => n.linkedNoteIds.length > 0).length,
    archived: notes.filter(n => n.isArchived).length,
  }), [notes]);

  const togglePin = (noteId: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      )
    );
  };

  const archiveNote = (noteId: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, isArchived: true } : note
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const getFolderColor = (folderId: string | undefined) => {
    if (!folderId) return '#6b7280';
    return folders.find(f => f.id === folderId)?.color || '#6b7280';
  };

  const getFolderName = (folderId: string | undefined) => {
    if (!folderId) return 'Uncategorized';
    return folders.find(f => f.id === folderId)?.name || 'Uncategorized';
  };

  const NoteCard = ({ note }: { note: Note }) => {
    const folderColor = getFolderColor(note.folderId);
    const preview = truncateText(note.content.replace(/[#*`\[\]]/g, ''), 150);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => setSelectedNote(note)}
        className={cn(
          'group relative rounded-xl cursor-pointer transition-all duration-200',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-neon-cyan/30 hover:bg-dark-800/50',
          viewMode === 'grid' ? 'p-4' : 'p-3'
        )}
      >
        {/* Folder indicator */}
        <div
          className="absolute top-0 left-4 w-8 h-1 rounded-b-full"
          style={{ backgroundColor: folderColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2 mt-2">
          <div className="flex items-center gap-2 min-w-0">
            {note.isPinned && (
              <Star className="w-4 h-4 text-neon-orange flex-shrink-0 fill-neon-orange" />
            )}
            <h3 className="font-medium text-white truncate">{note.title}</h3>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              className="p-1.5 rounded-lg hover:bg-dark-700/50"
            >
              {note.isPinned ? (
                <StarOff className="w-4 h-4 text-dark-400" />
              ) : (
                <Star className="w-4 h-4 text-dark-400" />
              )}
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                archiveNote(note.id);
              }}
              className="p-1.5 rounded-lg hover:bg-dark-700/50"
            >
              <Archive className="w-4 h-4 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Preview */}
        {viewMode === 'grid' && (
          <p className="text-sm text-dark-400 line-clamp-3 mb-3">{preview}</p>
        )}

        {/* AI Summary badge */}
        {note.aiSummary && viewMode === 'grid' && (
          <div className="p-2 mb-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-neon-purple" />
              <span className="text-xs font-medium text-neon-purple">AI Summary</span>
            </div>
            <p className="text-xs text-dark-300 line-clamp-2">{note.aiSummary}</p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="outline" size="sm">
              <Hash className="w-2.5 h-2.5 mr-0.5" />
              {tag}
            </Badge>
          ))}
          {note.tags.length > 4 && (
            <span className="text-xs text-dark-500">+{note.tags.length - 4}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-dark-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Folder className="w-3 h-3" style={{ color: folderColor }} />
              {getFolderName(note.folderId)}
            </span>
            {note.linkedNoteIds.length > 0 && (
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {note.linkedNoteIds.length}
              </span>
            )}
          </div>
          <span>{formatRelativeDate(note.updatedAt)}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Notes" subtitle="Your knowledge base">
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Button
              variant="glow"
              className="w-full"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>

            {/* Folders */}
            <Card variant="glass">
              <CardHeader title="Folders" />
              <CardContent className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    selectedFolder === null
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'text-dark-300 hover:bg-dark-800/50'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">All Notes</span>
                  <span className="ml-auto text-xs">{stats.total}</span>
                </button>

                {folders.map(folder => {
                  const count = notes.filter(n => n.folderId === folder.id && !n.isArchived).length;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                        selectedFolder === folder.id
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'text-dark-300 hover:bg-dark-800/50'
                      )}
                    >
                      <Folder className="w-4 h-4" style={{ color: folder.color }} />
                      <span className="text-sm">{folder.name}</span>
                      <span className="ml-auto text-xs">{count}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card variant="glass">
              <CardHeader title="Tags" />
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.slice(0, 15).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setSelectedTags(prev => [...prev, tag]);
                        }
                      }}
                      className={cn(
                        'px-2 py-1 rounded-md text-xs transition-colors',
                        selectedTags.includes(tag)
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'bg-dark-800/50 text-dark-300 hover:text-white'
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-4 h-4 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-neon-orange" />
                    <span className="text-xs font-medium text-dark-200">Related Topics</span>
                  </div>
                  <p className="text-xs text-dark-400">
                    Your notes about "architecture" could be linked with "API documentation".
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Ask AI
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* View mode toggle */}
                <div className="flex items-center p-1 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  {[
                    { mode: 'grid' as ViewMode, icon: Grid3X3 },
                    { mode: 'list' as ViewMode, icon: List },
                  ].map(({ mode, icon: Icon }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        viewMode === mode
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'text-dark-400 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Grid/List */}
            {filteredNotes.length > 0 ? (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'space-y-3'
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No notes found"
                description={
                  searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Start by creating your first note'
                }
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Note
                  </Button>
                }
              />
            )}
          </motion.div>
        </div>

        {/* Create Note Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Note"
          size="lg"
        >
          <NoteEditor onClose={() => setIsCreateModalOpen(false)} folders={folders} />
        </Modal>

        {/* Note Viewer Modal */}
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={selectedNote?.title || 'Note'}
          size="xl"
        >
          {selectedNote && (
            <NoteViewer
              note={selectedNote}
              onClose={() => setSelectedNote(null)}
              onEdit={() => {
                setIsEditorOpen(true);
              }}
              onDelete={() => {
                deleteNote(selectedNote.id);
              }}
              folders={folders}
            />
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Note Editor Component
function NoteEditor({
  note,
  onClose,
  folders,
}: {
  note?: Note;
  onClose: () => void;
  folders: NoteFolder[];
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [folderId, setFolderId] = useState(note?.folderId || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag.toLowerCase()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save note to store
    console.log({ title, content, folderId, tags });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        placeholder="Note title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Content
        </label>
        <textarea
          placeholder="Start writing... (Markdown supported)"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={12}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm font-mono',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50',
            'resize-none'
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Folder
          </label>
          <select
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-dark-800/50 border border-dark-700/50',
              'text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
            )}
          >
            <option value="">No folder</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" variant="ghost" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag} variant="cyan" size="sm">
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* AI Enhancement */}
      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">AI Enhancement</span>
        </div>
        <p className="text-sm text-dark-300 mb-3">
          Let AI help you organize this note with automatic tagging, summarization, and linking suggestions.
        </p>
        <Button type="button" variant="glass" size="sm">
          <Brain className="w-4 h-4 mr-1" />
          Enhance with AI
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          {note ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}

// Note Viewer Component
function NoteViewer({
  note,
  onClose,
  onEdit,
  onDelete,
  folders,
}: {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  folders: NoteFolder[];
}) {
  const folder = folders.find(f => f.id === note.folderId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {note.isPinned && (
            <Star className="w-5 h-5 text-neon-orange fill-neon-orange" />
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{note.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
              {folder && (
                <span className="flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5" style={{ color: folder.color }} />
                  {folder.name}
                </span>
              )}
              <span>Updated {formatRelativeDate(note.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {note.aiSummary && (
        <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-medium text-neon-purple">AI Summary</span>
          </div>
          <p className="text-sm text-dark-200">{note.aiSummary}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-dark-200 text-sm leading-relaxed">
            {note.content}
          </pre>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {note.tags.map(tag => (
          <Badge key={tag} variant="outline" size="sm">
            <Hash className="w-3 h-3 mr-0.5" />
            {tag}
          </Badge>
        ))}
        {note.aiTags?.map(tag => (
          <Badge key={tag} variant="purple" size="sm">
            <Sparkles className="w-3 h-3 mr-0.5" />
            {tag}
          </Badge>
        ))}
      </div>

      {/* Linked Notes */}
      {note.linkedNoteIds.length > 0 && (
        <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
          <h4 className="text-sm font-medium text-dark-200 mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Linked Notes
          </h4>
          <div className="flex flex-wrap gap-2">
            {note.linkedNoteIds.map(id => (
              <Badge key={id} variant="outline" size="sm" className="cursor-pointer hover:bg-dark-700/50">
                <FileText className="w-3 h-3 mr-1" />
                Note #{id}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-dark-700/50">
        <Button
          variant="ghost"
          size="sm"
          className="text-status-error hover:text-status-error"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
