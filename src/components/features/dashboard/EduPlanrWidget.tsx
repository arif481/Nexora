import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useTodayEvents } from '@/hooks/useCalendar';
import { useMemo } from 'react';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useIntegrations } from '@/hooks/useIntegrations';

export function EduPlanrWidget() {
    const { integrations } = useIntegrations();
    const { tasks } = useTasks();
    const { events } = useTodayEvents();

    const academicTasks = useMemo(() => {
        return tasks.filter(t => t.source === 'eduplanr' && t.status !== 'done').slice(0, 3);
    }, [tasks]);

    const studySessions = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => e.source === 'eduplanr' && new Date(e.startTime) > now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 2);
    }, [events]);

    if (!integrations.eduplanr?.connected) {
        return null;
    }

    return (
        <Card variant="glass" className="h-full border-neon-cyan/20">
            <CardHeader
                title="Academic Focus"
                icon={<GraduationCap className="w-5 h-5 text-neon-cyan" />}
                action={
                    <span className="text-xs text-dark-400 flex items-center gap-1">
                        Via EduPlanr <BookOpen className="w-3 h-3" />
                    </span>
                }
            />
            <CardContent>
                {academicTasks.length === 0 && studySessions.length === 0 ? (
                    <p className="text-sm text-dark-400 text-center py-4">No academic tasks today. Take a break!</p>
                ) : (
                    <div className="space-y-4">
                        {studySessions.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Upcoming Sessions</h4>
                                <div className="space-y-2">
                                    {studySessions.map(session => (
                                        <a
                                            href={`https://eduplanr.app/session/${session.externalId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            key={session.id}
                                            className="p-2 rounded-xl bg-dark-800/40 border border-neon-cyan/10 flex justify-between items-center hover:bg-dark-800/60 transition-colors block w-full"
                                        >
                                            <span className="text-sm font-medium text-white truncate ml-1">{session.title}</span>
                                            <Badge variant="cyan" size="sm">{formatTime(new Date(session.startTime))}</Badge>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {academicTasks.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 mt-4">Assignments due soon</h4>
                                <div className="space-y-2">
                                    {academicTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-purple shrink-0" />
                                            <span className="text-sm text-dark-200 truncate">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
