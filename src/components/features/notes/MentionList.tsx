import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MentionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.label });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (!props.items.length) {
        return (
            <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-glass p-2 text-sm text-dark-400 z-50">
                No notes found
            </div>
        );
    }

    return (
        <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-glass overflow-hidden flex flex-col min-w-[200px] z-50">
            {props.items.map((item: any, index: number) => (
                <button
                    key={index}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        index === selectedIndex ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                    )}
                    onClick={() => selectItem(index)}
                >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = 'MentionList';
