'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Layers,
  Plus,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Star,
  Sparkles,
  Check,
  X,
  MoreHorizontal,
  Edit3,
  Trash2,
  FolderOpen,
  Tag,
  Calendar,
  Zap,
  Award,
  BarChart3,
  Timer,
  Lightbulb,
  FileText,
  Video,
  Link,
  LogIn,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Footprints,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useStudy, useUpcomingExams, useStudyStats } from '@/hooks/useStudy';
import { extractSyllabusDraft } from '@/lib/services/gemini';
import { cn } from '@/lib/utils';
import type { Subject, Topic, Resource, ExamDate, Grade } from '@/types';

const colorOptions = [
  '#f7df1e', '#ef4444', '#61dafb', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'
];

const resourceTypeIcons: Record<string, any> = {
  textbook: BookOpen,
  video: Video,
  article: FileText,
  paper: FileText,
  course: GraduationCap,
  other: Link,
};

export default function StudyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    subjects, 
    loading: studyLoading, 
    createSubject,
    updateSubject,
    deleteSubject,
    addStudyTime,
    addTopic,
    updateTopic,
    removeTopic,
    addResource,
    toggleResourceCompletion,
    addExam,
    updateExamPreparation,
    addGrade,
  } = useStudy();
  const { exams: upcomingExams } = useUpcomingExams();
  const studyStats = useStudyStats(subjects);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isSyllabusImportOpen, setIsSyllabusImportOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const { openAIPanel } = useUIStore();

  const loading = authLoading || studyLoading;

  const toggleExpanded = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      await deleteSubject(subjectId);
      if (selectedSubject?.id === subjectId) {
        setSelectedSubject(null);
      }
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <PageContainer title="Study" subtitle="Track your academic progress">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading subjects...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Study" subtitle="Track your academic progress">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to track your studies</h3>
            <p className="text-dark-400 mb-6">
              Organize subjects, track topics, and monitor your academic progress.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  const SubjectCard = ({ subject }: { subject: Subject }) => {
    const isExpanded = expandedSubjects.has(subject.id);
    const completedTopics = subject.topics.filter(t => t.masteryLevel >= 80).length;
    const completedResources = subject.resources.filter(r => r.completed).length;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group relative rounded-xl overflow-hidden',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-opacity-50 transition-all'
        )}
        style={{ borderColor: `${subject.color}30` }}
      >
        {/* Color accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: subject.color }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="p-2.5 rounded-xl cursor-pointer"
              style={{ backgroundColor: `${subject.color}20` }}
              onClick={() => setSelectedSubject(subject)}
            >
              <GraduationCap className="w-5 h-5" style={{ color: subject.color }} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleExpanded(subject.id)}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-all"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-dark-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-dark-400" />
                )}
              </button>
              <button
                onClick={() => handleDeleteSubject(subject.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          <h3 
            className="font-semibold text-white mb-1 cursor-pointer hover:text-neon-cyan transition-colors"
            onClick={() => setSelectedSubject(subject)}
          >
            {subject.name}
          </h3>
          {subject.description && (
            <p className="text-sm text-dark-400 line-clamp-1 mb-3">{subject.description}</p>
          )}

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-dark-500" />
              <span className="text-xs text-dark-400">{subject.topics.length} topics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="text-xs text-dark-400">{formatStudyTime(subject.studyTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500">Mastery</span>
            <span className="text-xs font-medium" style={{ color: subject.color }}>
              {subject.masteryLevel}%
            </span>
          </div>
          <Progress value={subject.masteryLevel} variant="cyan" size="sm" />

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-dark-700/50"
              >
                {/* Topics */}
                {subject.topics.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-dark-300 mb-2">Topics ({completedTopics}/{subject.topics.length})</h4>
                    <div className="space-y-1.5">
                      {subject.topics.slice(0, 3).map(topic => (
                        <div key={topic.id} className="flex items-center justify-between">
                          <span className="text-xs text-dark-400">{topic.name}</span>
                          <Badge variant={topic.masteryLevel >= 80 ? 'green' : topic.masteryLevel >= 50 ? 'cyan' : 'default'} size="sm">
                            {topic.masteryLevel}%
                          </Badge>
                        </div>
                      ))}
                      {subject.topics.length > 3 && (
                        <span className="text-xs text-dark-500">+{subject.topics.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Upcoming Exams */}
                {subject.examDates.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-dark-300 mb-2">Upcoming Exams</h4>
                    <div className="space-y-1.5">
                      {subject.examDates.slice(0, 2).map(exam => (
                        <div key={exam.id} className="flex items-center justify-between">
                          <span className="text-xs text-dark-400">{exam.name}</span>
                          <span className="text-xs text-dark-500">
                            {new Date(exam.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {subject.resources.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-dark-300 mb-2">Resources ({completedResources}/{subject.resources.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {subject.resources.slice(0, 4).map(resource => {
                        const Icon = resourceTypeIcons[resource.type] || Link;
                        return (
                          <span
                            key={resource.id}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-xs flex items-center gap-1",
                              resource.completed ? "bg-neon-green/20 text-neon-green" : "bg-dark-800/50 text-dark-400"
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {resource.title.substring(0, 15)}{resource.title.length > 15 && '...'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setSelectedSubject(subject)}
                >
                  View Details
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Study" subtitle="Track your academic progress">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Subjects</span>
              <GraduationCap className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{studyStats.totalSubjects}</p>
            <p className="text-xs text-dark-500">{studyStats.totalTopics} total topics</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Study Time</span>
              <Timer className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">{formatStudyTime(studyStats.totalStudyTime)}</p>
            <p className="text-xs text-dark-500">total tracked</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Avg Mastery</span>
              <Brain className="w-6 h-6 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-white">{studyStats.averageMastery}%</p>
            <p className="text-xs text-dark-500">across all subjects</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Upcoming</span>
              <Calendar className="w-6 h-6 text-neon-purple" />
            </div>
            <p className="text-2xl font-bold text-white">{upcomingExams.length}</p>
            <p className="text-xs text-dark-500">exams scheduled</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subjects List */}
          <div className="lg:col-span-2">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">My Subjects</h2>
                  <p className="text-sm text-dark-400">Manage your study subjects and topics</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAIPanel()}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    AI Study Help
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSyllabusImportOpen(true)}
                    leftIcon={<UploadCloud className="w-4 h-4" />}
                  >
                    Upload Syllabus
                  </Button>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={() => setIsCreateSubjectOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <EmptyState
                    icon={<GraduationCap className="w-12 h-12" />}
                    title="No subjects yet"
                    description="Add your first subject to start tracking your academic progress"
                    action={
                      <Button variant="glow" onClick={() => setIsCreateSubjectOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Subject
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map(subject => (
                      <SubjectCard key={subject.id} subject={subject} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Exams */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-neon-orange" />
                  Upcoming Exams
                </h3>
              </CardHeader>
              <CardContent>
                {upcomingExams.length === 0 ? (
                  <p className="text-sm text-dark-400 text-center py-4">No upcoming exams</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.slice(0, 5).map(exam => {
                      const subject = subjects.find(s => s.examDates.some(e => e.id === exam.id));
                      const daysUntil = Math.ceil((new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={exam.id} className="p-3 rounded-lg bg-dark-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">{exam.name}</h4>
                            <Badge 
                              variant={daysUntil <= 3 ? 'orange' : daysUntil <= 7 ? 'cyan' : 'default'}
                              size="sm"
                            >
                              {daysUntil}d
                            </Badge>
                          </div>
                          {subject && (
                            <p className="text-xs text-dark-400 mb-2">{subject.name}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-dark-500">Preparation</span>
                            <span className="text-xs text-dark-400">{exam.preparationStatus}%</span>
                          </div>
                          <Progress value={exam.preparationStatus} variant="cyan" size="sm" className="mt-1" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-neon-green" />
                  Recent Grades
                </h3>
              </CardHeader>
              <CardContent>
                {subjects.flatMap(s => s.grades.map(g => ({ ...g, subjectName: s.name, subjectColor: s.color }))).length === 0 ? (
                  <p className="text-sm text-dark-400 text-center py-4">No grades recorded</p>
                ) : (
                  <div className="space-y-3">
                    {subjects
                      .flatMap(s => s.grades.map(g => ({ ...g, subjectName: s.name, subjectColor: s.color })))
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map(grade => {
                        const percentage = Math.round((grade.score / grade.maxScore) * 100);
                        return (
                          <div key={grade.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30">
                            <div>
                              <p className="text-sm text-white">{grade.name}</p>
                              <p className="text-xs text-dark-400">{grade.subjectName}</p>
                            </div>
                            <Badge
                              variant={percentage >= 90 ? 'green' : percentage >= 70 ? 'cyan' : percentage >= 50 ? 'orange' : 'default'}
                            >
                              {percentage}%
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                  Quick Actions
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreateSubjectOpen(true)}
                >
                  Add New Subject
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<UploadCloud className="w-4 h-4" />}
                  onClick={() => setIsSyllabusImportOpen(true)}
                >
                  AI Syllabus Import
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                  onClick={() => selectedSubject && setIsAddTopicOpen(true)}
                  disabled={!selectedSubject}
                >
                  Add Topic
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  leftIcon={<Calendar className="w-4 h-4" />}
                  onClick={() => selectedSubject && setIsAddExamOpen(true)}
                  disabled={!selectedSubject}
                >
                  Schedule Exam
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  leftIcon={<Award className="w-4 h-4" />}
                  onClick={() => selectedSubject && setIsAddGradeOpen(true)}
                  disabled={!selectedSubject}
                >
                  Record Grade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Subject Modal */}
        <Modal
          isOpen={isCreateSubjectOpen}
          onClose={() => setIsCreateSubjectOpen(false)}
          title="Create New Subject"
        >
          <CreateSubjectForm 
            onClose={() => setIsCreateSubjectOpen(false)}
            onSubmit={async (data) => {
              await createSubject(data);
              setIsCreateSubjectOpen(false);
            }}
          />
        </Modal>

        {/* AI Syllabus Import Modal */}
        <Modal
          isOpen={isSyllabusImportOpen}
          onClose={() => setIsSyllabusImportOpen(false)}
          title="Import Syllabus with AI"
        >
          <SyllabusImportForm
            onClose={() => setIsSyllabusImportOpen(false)}
            onSubmit={async (data) => {
              await createSubject(data);
              setIsSyllabusImportOpen(false);
            }}
          />
        </Modal>

        {/* Subject Detail Modal */}
        <Modal
          isOpen={!!selectedSubject}
          onClose={() => setSelectedSubject(null)}
          title={selectedSubject?.name || 'Subject Details'}
          size="lg"
        >
          {selectedSubject && (
            <SubjectDetailView
              subject={selectedSubject}
              onAddTopic={() => setIsAddTopicOpen(true)}
              onAddResource={() => setIsAddResourceOpen(true)}
              onAddExam={() => setIsAddExamOpen(true)}
              onAddGrade={() => setIsAddGradeOpen(true)}
              onToggleResource={async (resourceId, completed) => {
                await toggleResourceCompletion(selectedSubject.id, resourceId, completed);
              }}
              onUpdateTopicMastery={async (topicId, mastery) => {
                await updateTopic(selectedSubject.id, topicId, { masteryLevel: mastery });
              }}
              onAddStudyTime={async (minutes) => {
                await addStudyTime(selectedSubject.id, minutes);
              }}
            />
          )}
        </Modal>

        {/* Add Topic Modal */}
        <Modal
          isOpen={isAddTopicOpen}
          onClose={() => setIsAddTopicOpen(false)}
          title="Add Topic"
        >
          <AddTopicForm
            onClose={() => setIsAddTopicOpen(false)}
            onSubmit={async (data) => {
              if (selectedSubject) {
                await addTopic(selectedSubject.id, data);
                setIsAddTopicOpen(false);
              }
            }}
          />
        </Modal>

        {/* Add Resource Modal */}
        <Modal
          isOpen={isAddResourceOpen}
          onClose={() => setIsAddResourceOpen(false)}
          title="Add Resource"
        >
          <AddResourceForm
            onClose={() => setIsAddResourceOpen(false)}
            onSubmit={async (data) => {
              if (selectedSubject) {
                await addResource(selectedSubject.id, data);
                setIsAddResourceOpen(false);
              }
            }}
          />
        </Modal>

        {/* Add Exam Modal */}
        <Modal
          isOpen={isAddExamOpen}
          onClose={() => setIsAddExamOpen(false)}
          title="Schedule Exam"
        >
          <AddExamForm
            onClose={() => setIsAddExamOpen(false)}
            onSubmit={async (data) => {
              if (selectedSubject) {
                await addExam(selectedSubject.id, data);
                setIsAddExamOpen(false);
              }
            }}
          />
        </Modal>

        {/* Add Grade Modal */}
        <Modal
          isOpen={isAddGradeOpen}
          onClose={() => setIsAddGradeOpen(false)}
          title="Record Grade"
        >
          <AddGradeForm
            onClose={() => setIsAddGradeOpen(false)}
            onSubmit={async (data) => {
              if (selectedSubject) {
                await addGrade(selectedSubject.id, data);
                setIsAddGradeOpen(false);
              }
            }}
          />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Create Subject Form
function CreateSubjectForm({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: { name: string; description?: string; color: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(colorOptions[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, description: description || undefined, color });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Subject Name</label>
        <Input
          placeholder="e.g., Mathematics, History"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Description</label>
        <Input
          placeholder="Optional description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Color</label>
        <div className="flex gap-2">
          {colorOptions.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-8 h-8 rounded-full transition-all',
                color === c ? 'ring-2 ring-offset-2 ring-offset-dark-900 ring-white' : ''
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !name}>
          {submitting ? 'Creating...' : 'Create Subject'}
        </Button>
      </div>
    </form>
  );
}

function SyllabusImportForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; color: string; topics: Topic[] }) => Promise<void>;
}) {
  const [syllabusText, setSyllabusText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusText.trim() && !selectedFile) {
      setError('Add syllabus text or upload a file first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const filePayload = selectedFile
        ? {
            name: selectedFile.name,
            mimeType: selectedFile.type || 'application/octet-stream',
            base64: await fileToBase64(selectedFile),
          }
        : undefined;

      const draft = await extractSyllabusDraft({
        text: syllabusText.trim() || undefined,
        file: filePayload,
      });

      const now = Date.now();
      const topics: Topic[] = draft.milestones.map((milestone, index) => ({
        id: `topic_${now}_${index}`,
        name: milestone.title,
        description: milestone.description || `Milestone ${index + 1} from syllabus`,
        masteryLevel: 0,
        studyTime: 0,
        resources: [],
        notes: [],
        weakAreas: [],
      }));

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      await onSubmit({
        name: draft.subjectName || 'Imported Subject',
        description: draft.summary || 'Created from syllabus import',
        color,
        topics,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to import syllabus');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="p-3 rounded-lg bg-dark-800/40 border border-dark-700/50">
        <p className="text-sm text-dark-300">
          Upload a syllabus (PDF/image/text) or paste text. AI will create one subject and topic milestones automatically.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Upload File</label>
        <Input
          type="file"
          accept=".pdf,.txt,.md,image/*"
          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
        />
        {selectedFile && (
          <p className="text-xs text-dark-400 mt-1">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Or Paste Syllabus Text</label>
        <textarea
          placeholder="Paste your syllabus here for AI parsing..."
          value={syllabusText}
          onChange={e => setSyllabusText(e.target.value)}
          rows={6}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-status-error">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Analyzing...' : 'Import with AI'}
        </Button>
      </div>
    </form>
  );
}

// Subject Detail View
function SubjectDetailView({
  subject,
  onAddTopic,
  onAddResource,
  onAddExam,
  onAddGrade,
  onToggleResource,
  onUpdateTopicMastery,
  onAddStudyTime,
}: {
  subject: Subject;
  onAddTopic: () => void;
  onAddResource: () => void;
  onAddExam: () => void;
  onAddGrade: () => void;
  onToggleResource: (resourceId: string, completed: boolean) => Promise<void>;
  onUpdateTopicMastery: (topicId: string, mastery: number) => Promise<void>;
  onAddStudyTime: (minutes: number) => Promise<void>;
}) {
  const [studyMinutes, setStudyMinutes] = useState('');
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);
  const [stepAnimationKey, setStepAnimationKey] = useState(0);
  const [milestoneBloom, setMilestoneBloom] = useState<string | null>(null);

  const completedMilestones = subject.topics.filter(topic => topic.masteryLevel >= 80).length;
  const milestoneProgress = subject.topics.length > 0
    ? Math.round((completedMilestones / subject.topics.length) * 100)
    : 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hours`;
    return `${hours}h ${mins}m`;
  };

  const handleLogProgress = async () => {
    if (!studyMinutes || isLoggingProgress) return;

    const minutes = Math.max(1, parseInt(studyMinutes, 10));
    if (Number.isNaN(minutes)) return;

    setIsLoggingProgress(true);
    try {
      await onAddStudyTime(minutes);
      setStudyMinutes('');
      setStepAnimationKey(Date.now());

      const nextMilestone = subject.topics.find(topic => topic.masteryLevel < 80);
      if (nextMilestone) {
        const masteryIncrease = Math.max(5, Math.min(20, Math.round(minutes / 6)));
        const nextMastery = Math.min(100, nextMilestone.masteryLevel + masteryIncrease);

        await onUpdateTopicMastery(nextMilestone.id, nextMastery);

        if (nextMilestone.masteryLevel < 80 && nextMastery >= 80) {
          setMilestoneBloom(nextMilestone.name);
          setTimeout(() => setMilestoneBloom(null), 2200);
        }
      }
    } finally {
      setIsLoggingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-dark-800/50">
          <p className="text-2xl font-bold text-white">{subject.masteryLevel}%</p>
          <p className="text-xs text-dark-400">Mastery</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-dark-800/50">
          <p className="text-2xl font-bold text-white">{subject.topics.length}</p>
          <p className="text-xs text-dark-400">Topics</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-dark-800/50">
          <p className="text-2xl font-bold text-white">{formatTime(subject.studyTime)}</p>
          <p className="text-xs text-dark-400">Study Time</p>
        </div>
      </div>

      {/* Add Study Time */}
      <div className="relative overflow-hidden p-3 rounded-lg bg-dark-800/30 border border-dark-700/50">
        <label className="block text-sm font-medium text-dark-200 mb-2">Log Study Time</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Minutes"
            value={studyMinutes}
            onChange={e => setStudyMinutes(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleLogProgress}
            disabled={!studyMinutes || isLoggingProgress}
          >
            {isLoggingProgress ? 'Adding...' : 'Add'}
          </Button>
        </div>

        <AnimatePresence>
          {stepAnimationKey > 0 && (
            <motion.div
              key={stepAnimationKey}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
              className="pointer-events-none absolute inset-0"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 18, x: -18 + index * 16, scale: 0.7 }}
                  animate={{ opacity: [0, 1, 0], y: -22, scale: 1 }}
                  transition={{ duration: 0.9, delay: index * 0.08 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 text-neon-cyan"
                >
                  <Footprints className="w-4 h-4" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {milestoneBloom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 p-2 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-xs text-neon-pink"
            >
              🌸 Milestone complete: {milestoneBloom}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Milestone Path */}
      <div className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">Milestone Path</h4>
          <Badge variant="pink" size="sm">
            {completedMilestones}/{subject.topics.length}
          </Badge>
        </div>
        <Progress value={milestoneProgress} variant="pink" size="sm" />
        {subject.topics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {subject.topics.map(topic => (
              <div key={topic.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark-900/40">
                <span className="text-sm">{topic.masteryLevel >= 80 ? '🌸' : '👣'}</span>
                <span className={cn(
                  'text-xs truncate',
                  topic.masteryLevel >= 80 ? 'text-neon-pink' : 'text-dark-300'
                )}>
                  {topic.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-dark-200">Topics</h4>
          <Button variant="ghost" size="sm" onClick={onAddTopic} leftIcon={<Plus className="w-3 h-3" />}>
            Add
          </Button>
        </div>
        {subject.topics.length === 0 ? (
          <p className="text-sm text-dark-400 text-center py-4">No topics yet</p>
        ) : (
          <div className="space-y-2">
            {subject.topics.map(topic => (
              <div key={topic.id} className="p-3 rounded-lg bg-dark-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">{topic.name}</span>
                  <Badge variant={topic.masteryLevel >= 80 ? 'green' : topic.masteryLevel >= 50 ? 'cyan' : 'default'}>
                    {topic.masteryLevel}%
                  </Badge>
                </div>
                <Progress value={topic.masteryLevel} variant="cyan" size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-dark-200">Resources</h4>
          <Button variant="ghost" size="sm" onClick={onAddResource} leftIcon={<Plus className="w-3 h-3" />}>
            Add
          </Button>
        </div>
        {subject.resources.length === 0 ? (
          <p className="text-sm text-dark-400 text-center py-4">No resources yet</p>
        ) : (
          <div className="space-y-2">
            {subject.resources.map(resource => {
              const Icon = resourceTypeIcons[resource.type] || Link;
              return (
                <div 
                  key={resource.id} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-dark-800/30 cursor-pointer"
                  onClick={() => onToggleResource(resource.id, !resource.completed)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    resource.completed ? "bg-neon-green text-dark-900" : "border border-dark-500"
                  )}>
                    {resource.completed && <Check className="w-3 h-3" />}
                  </div>
                  <Icon className="w-4 h-4 text-dark-400" />
                  <span className={cn(
                    "text-sm flex-1",
                    resource.completed ? "text-dark-400 line-through" : "text-white"
                  )}>
                    {resource.title}
                  </span>
                  <Badge variant="outline" size="sm">{resource.type}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exams */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-dark-200">Exams</h4>
          <Button variant="ghost" size="sm" onClick={onAddExam} leftIcon={<Plus className="w-3 h-3" />}>
            Add
          </Button>
        </div>
        {subject.examDates.length === 0 ? (
          <p className="text-sm text-dark-400 text-center py-4">No exams scheduled</p>
        ) : (
          <div className="space-y-2">
            {subject.examDates.map(exam => (
              <div key={exam.id} className="p-3 rounded-lg bg-dark-800/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{exam.name}</span>
                  <span className="text-xs text-dark-400">{new Date(exam.date).toLocaleDateString()}</span>
                </div>
                <Badge variant="outline" size="sm">{exam.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grades */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-dark-200">Grades</h4>
          <Button variant="ghost" size="sm" onClick={onAddGrade} leftIcon={<Plus className="w-3 h-3" />}>
            Add
          </Button>
        </div>
        {subject.grades.length === 0 ? (
          <p className="text-sm text-dark-400 text-center py-4">No grades recorded</p>
        ) : (
          <div className="space-y-2">
            {subject.grades.map(grade => {
              const percentage = Math.round((grade.score / grade.maxScore) * 100);
              return (
                <div key={grade.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30">
                  <div>
                    <span className="text-sm text-white">{grade.name}</span>
                    <p className="text-xs text-dark-400">{grade.score}/{grade.maxScore}</p>
                  </div>
                  <Badge variant={percentage >= 90 ? 'green' : percentage >= 70 ? 'cyan' : 'orange'}>
                    {percentage}%
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Topic Form
function AddTopicForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Topic>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, description: description || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Topic Name</label>
        <Input
          placeholder="e.g., Calculus, World War II"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Description</label>
        <Input
          placeholder="Optional description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !name}>
          {submitting ? 'Adding...' : 'Add Topic'}
        </Button>
      </div>
    </form>
  );
}

// Add Resource Form
function AddResourceForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Resource>) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Resource['type']>('textbook');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ title, type, url: url || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Resource Title</label>
        <Input
          placeholder="e.g., Textbook Chapter 5"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as Resource['type'])}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        >
          <option value="textbook">Textbook</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="paper">Paper</option>
          <option value="course">Course</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">URL (optional)</label>
        <Input
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !title}>
          {submitting ? 'Adding...' : 'Add Resource'}
        </Button>
      </div>
    </form>
  );
}

// Add Exam Form
function AddExamForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<ExamDate>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ExamDate['type']>('quiz');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, date: new Date(date), type });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Exam Name</label>
        <Input
          placeholder="e.g., Midterm, Chapter 5 Quiz"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Date</label>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as ExamDate['type'])}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        >
          <option value="quiz">Quiz</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="assignment">Assignment</option>
          <option value="project">Project</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !name || !date}>
          {submitting ? 'Scheduling...' : 'Schedule Exam'}
        </Button>
      </div>
    </form>
  );
}

// Add Grade Form
function AddGradeForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Grade>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [type, setType] = useState('quiz');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ 
        name, 
        score: parseFloat(score), 
        maxScore: parseFloat(maxScore),
        type,
        date: new Date(),
        weight: 1,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Grade Name</label>
        <Input
          placeholder="e.g., Chapter 5 Quiz"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Score</label>
          <Input
            type="number"
            placeholder="85"
            value={score}
            onChange={e => setScore(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Max Score</label>
          <Input
            type="number"
            placeholder="100"
            value={maxScore}
            onChange={e => setMaxScore(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Type</label>
        <Input
          placeholder="e.g., quiz, homework, test"
          value={type}
          onChange={e => setType(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !name || !score}>
          {submitting ? 'Recording...' : 'Record Grade'}
        </Button>
      </div>
    </form>
  );
}
