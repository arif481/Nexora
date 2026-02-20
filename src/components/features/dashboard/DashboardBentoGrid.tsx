'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { DraggableWidget } from './DraggableWidget';

interface DashboardBentoGridProps {
    widgets: { id: string; content: React.ReactNode; className?: string }[];
    storageKey: string;
}

export function DashboardBentoGrid({ widgets, storageKey }: DashboardBentoGridProps) {
    const [items, setItems] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts, to allow clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        // Load from local storage or set default
        const saved = localStorage.getItem(storageKey);
        const widgetIds = widgets.map(w => w.id);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Only keep ids that still exist
                const validParsed = parsed.filter((id: string) => widgetIds.includes(id));
                // Append any new widgets that aren't in saved
                const newIds = widgetIds.filter(id => !validParsed.includes(id));
                setItems([...validParsed, ...newIds]);
            } catch (e) {
                setItems(widgetIds);
            }
        } else {
            setItems(widgetIds);
        }
        setMounted(true);
    }, [widgets, storageKey]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);

                const newItems = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem(storageKey, JSON.stringify(newItems));
                return newItems;
            });
        }
    };

    if (!mounted) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                {widgets.map(w => (
                    <div key={w.id} className={w.className}>
                        {w.content}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                    {items.map(id => {
                        const widget = widgets.find(w => w.id === id);
                        if (!widget) return null;

                        return (
                            <DraggableWidget
                                key={id}
                                id={id}
                                className={widget.className}
                            >
                                {widget.content}
                            </DraggableWidget>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
