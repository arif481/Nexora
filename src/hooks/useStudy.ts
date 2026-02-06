'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Subject, Topic, Resource, ExamDate, Grade } from '@/types';
import {
  subscribeToSubjects,
  subscribeToUpcomingExams,
  createSubject,
  updateSubject,
  deleteSubject,
  addStudyTime,
  addTopic,
  updateTopic,
  removeTopic,
  addResource,
  toggleResourceCompletion,
  addExamDate,
  updateExamPreparation,
  addGrade,
} from '@/lib/services/study';

interface UseStudyReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  createSubject: (data: CreateSubjectData) => Promise<string>;
  updateSubject: (subjectId: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  addStudyTime: (subjectId: string, minutes: number) => Promise<void>;
  addTopic: (subjectId: string, data: Partial<Topic>) => Promise<void>;
  updateTopic: (subjectId: string, topicId: string, updates: Partial<Topic>) => Promise<void>;
  removeTopic: (subjectId: string, topicId: string) => Promise<void>;
  addResource: (subjectId: string, data: Partial<Resource>) => Promise<void>;
  toggleResourceCompletion: (subjectId: string, resourceId: string, completed: boolean) => Promise<void>;
  addExam: (subjectId: string, data: Partial<ExamDate>) => Promise<void>;
  updateExamPreparation: (subjectId: string, examId: string, preparationStatus: number) => Promise<void>;
  addGrade: (subjectId: string, data: Partial<Grade>) => Promise<void>;
  refresh: () => void;
}

interface CreateSubjectData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export function useStudy(): UseStudyReturn {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToSubjects(
      user.uid,
      (fetchedSubjects) => {
        setSubjects(fetchedSubjects);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Study subscription error:', err);
        setError(err.message);
        setSubjects([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateSubject = useCallback(
    async (data: CreateSubjectData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const subjectId = await createSubject(user.uid, data);
        return subjectId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateSubject = useCallback(
    async (subjectId: string, updates: Partial<Subject>): Promise<void> => {
      try {
        await updateSubject(subjectId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteSubject = useCallback(
    async (subjectId: string): Promise<void> => {
      try {
        await deleteSubject(subjectId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleAddStudyTime = useCallback(
    async (subjectId: string, minutes: number): Promise<void> => {
      try {
        await addStudyTime(subjectId, minutes);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleAddTopic = useCallback(
    async (subjectId: string, data: Partial<Topic>): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await addTopic(subjectId, data, subject.topics);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleUpdateTopic = useCallback(
    async (subjectId: string, topicId: string, updates: Partial<Topic>): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await updateTopic(subjectId, topicId, updates, subject.topics);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleRemoveTopic = useCallback(
    async (subjectId: string, topicId: string): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await removeTopic(subjectId, topicId, subject.topics);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleAddResource = useCallback(
    async (subjectId: string, data: Partial<Resource>): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await addResource(subjectId, data, subject.resources);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleToggleResourceCompletion = useCallback(
    async (subjectId: string, resourceId: string, completed: boolean): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await toggleResourceCompletion(subjectId, resourceId, completed, subject.resources);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleAddExam = useCallback(
    async (subjectId: string, data: Partial<ExamDate>): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await addExamDate(subjectId, data, subject.examDates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleUpdateExamPreparation = useCallback(
    async (subjectId: string, examId: string, preparationStatus: number): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await updateExamPreparation(subjectId, examId, preparationStatus, subject.examDates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const handleAddGrade = useCallback(
    async (subjectId: string, data: Partial<Grade>): Promise<void> => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) throw new Error('Subject not found');

      try {
        await addGrade(subjectId, data, subject.grades);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [subjects]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    subjects,
    loading,
    error,
    createSubject: handleCreateSubject,
    updateSubject: handleUpdateSubject,
    deleteSubject: handleDeleteSubject,
    addStudyTime: handleAddStudyTime,
    addTopic: handleAddTopic,
    updateTopic: handleUpdateTopic,
    removeTopic: handleRemoveTopic,
    addResource: handleAddResource,
    toggleResourceCompletion: handleToggleResourceCompletion,
    addExam: handleAddExam,
    updateExamPreparation: handleUpdateExamPreparation,
    addGrade: handleAddGrade,
    refresh,
  };
}

// Hook for upcoming exams
export function useUpcomingExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<(ExamDate & { subjectId: string; subjectName: string; subjectColor: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUpcomingExams(
      user.uid,
      (fetchedExams) => {
        setExams(fetchedExams);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching upcoming exams:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { exams, loading };
}

// Hook for study statistics
export function useStudyStats(subjects: Subject[]) {
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudyTime: 0,
    averageMastery: 0,
    totalTopics: 0,
    totalResources: 0,
    completedResources: 0,
    upcomingExams: 0,
    averageGrade: 0,
  });

  useEffect(() => {
    const now = new Date();

    const totalStudyTime = subjects.reduce((sum, s) => sum + s.studyTime, 0);
    const averageMastery = subjects.length > 0
      ? subjects.reduce((sum, s) => sum + s.masteryLevel, 0) / subjects.length
      : 0;
    const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
    const totalResources = subjects.reduce((sum, s) => sum + s.resources.length, 0);
    const completedResources = subjects.reduce(
      (sum, s) => sum + s.resources.filter((r) => r.completed).length,
      0
    );
    const upcomingExams = subjects.reduce(
      (sum, s) => sum + s.examDates.filter((e) => new Date(e.date) > now).length,
      0
    );

    // Calculate average grade across all subjects
    const allGrades = subjects.flatMap((s) => s.grades);
    const averageGrade = allGrades.length > 0
      ? allGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / allGrades.length
      : 0;

    setStats({
      totalSubjects: subjects.length,
      totalStudyTime,
      averageMastery,
      totalTopics,
      totalResources,
      completedResources,
      upcomingExams,
      averageGrade,
    });
  }, [subjects]);

  return stats;
}
