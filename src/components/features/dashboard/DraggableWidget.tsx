'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function DraggableWidget({ id, children, className }: DraggableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative group',
                isDragging && 'opacity-50',
                className
            )}
        >
            <div
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-900/50 text-dark-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                {...attributes}
                {...listeners}
            >
                <GripHorizontal className="w-4 h-4" />
            </div>
            {children}
        </div>
    );
}
