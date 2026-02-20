'use client';

import { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { MoreHorizontal, Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { cn, getDeadlineStatus } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

// The columns for Kanban
const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-neon-cyan/50 text-neon-cyan' },
    { id: 'in-progress', title: 'In Progress', color: 'border-neon-purple/50 text-neon-purple' },
    { id: 'review', title: 'Review', color: 'border-neon-orange/50 text-neon-orange' },
    { id: 'done', title: 'Done', color: 'border-neon-green/50 text-neon-green' },
];

interface KanbanBoardProps {
    tasks: Task[];
    onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
    onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: any) => setActiveId(event.active.id as string);

    const handleDragEnd = (event: any) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if over a column directly or over a task inside a column
        let newStatus: TaskStatus | null = null;
        if (COLUMNS.map(c => c.id as string).includes(overId as string)) {
            newStatus = overId as TaskStatus;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) newStatus = overTask.status;
        }

        if (newStatus) {
            const activeTask = tasks.find(t => t.id === activeId);
            if (activeTask && activeTask.status !== newStatus) {
                onTaskMove(activeTask.id, newStatus);
            }
        }
    };

    const currentTaskMap = useMemo(() => {
        const map: Record<TaskStatus, Task[]> = { 'todo': [], 'in-progress': [], 'review': [], 'done': [] };
        tasks.forEach(t => { if (map[t.status]) map[t.status].push(t); });
        return map;
    }, [tasks]);

    const activeTask = useMemo(() => activeId ? tasks.find(t => t.id === activeId) : null, [activeId, tasks]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-full items-start scrollbar-thin">
                {COLUMNS.map(col => (
                    <KanbanColumn key={col.id} column={col} tasks={currentTaskMap[col.id]} onTaskClick={onTaskClick} />
                ))}
            </div>
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeTask ? <KanbanCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ column, tasks, onTaskClick }: { column: any, tasks: Task[], onTaskClick: (task: Task) => void }) {
    const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });

    return (
        <div ref={setNodeRef} className="flex flex-col flex-1 min-w-[300px] max-w-[350px] bg-dark-900/40 rounded-xl border border-glass-border p-3 h-full">
            <div className={cn("flex items-center justify-between mb-3 border-b pb-2", column.color)}>
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="default" size="sm" className="bg-dark-800">{tasks.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 custom-scrollbar min-h-[150px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)}
                </SortableContext>
            </div>
        </div>
    );
}

function SortableTaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => {
            // Prevent click if dragging happened
            if (e.defaultPrevented) return;
            onClick?.();
        }}>
            <KanbanCard task={task} />
        </div>
    );
}

function KanbanCard({ task }: { task: Task }) {
    const deadlineStatus = task.dueDate ? getDeadlineStatus(new Date(task.dueDate)) : null;
    const isDone = task.status === 'done';

    return (
        <div className={cn("bg-dark-800 border border-glass-border hover:border-white/20 transition-all rounded-xl p-3 shadow-glass cursor-grab active:cursor-grabbing", isDone && "opacity-60")}>
            <div className="flex justify-between items-start mb-2">
                <h4 className={cn("font-medium text-white text-sm line-clamp-2 leading-tight", isDone && "line-through text-white/50")}>{task.title}</h4>
                <div className="shrink-0 ml-2"><PriorityBadge priority={task.priority} /></div>
            </div>

            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-dark-700 text-white/60">#{tag}</span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-white/50 mt-auto pt-2 border-t border-glass-border/50">
                <div className="flex gap-2">
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                        </div>
                    )}
                    {task.estimatedDuration && (
                        <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimatedDuration}m
                        </div>
                    )}
                </div>

                {task.dueDate && (
                    <div className={cn("flex items-center", deadlineStatus === 'overdue' && !isDone ? "text-red-400 font-bold" : "")}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                )}
            </div>
        </div>
    );
}
