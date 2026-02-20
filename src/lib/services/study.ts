// Study Service - Real-time Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Subject, Topic, Resource, ExamDate, Grade } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Subject from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertSubjectFromFirestore = (doc: any): Subject => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    color: data.color || '#06b6d4',
    icon: data.icon,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topics: (data.topics || []).map((t: any) => ({
      ...t,
      lastStudied: convertTimestamp(t.lastStudied),
    })),
    resources: data.resources || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    examDates: (data.examDates || []).map((e: any) => ({
      ...e,
      date: convertTimestamp(e.date),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    grades: (data.grades || []).map((g: any) => ({
      ...g,
      date: convertTimestamp(g.date),
    })),
    studyTime: data.studyTime || 0,
    masteryLevel: data.masteryLevel || 0,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

// Create a new subject
export const createSubject = async (
  userId: string,
  subjectData: Partial<Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);

  const newSubject = {
    userId,
    name: subjectData.name || 'New Subject',
    description: subjectData.description || '',
    color: subjectData.color || '#06b6d4',
    icon: subjectData.icon || null,
    topics: subjectData.topics || [],
    resources: subjectData.resources || [],
    examDates: subjectData.examDates || [],
    grades: subjectData.grades || [],
    studyTime: 0,
    masteryLevel: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(subjectsRef, newSubject);
  return docRef.id;
};

// Update a subject
export const updateSubject = async (
  subjectId: string,
  updates: Partial<Subject>
): Promise<void> => {
  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a subject
export const deleteSubject = async (subjectId: string): Promise<void> => {
  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await deleteDoc(subjectRef);
};

// Add study time to a subject
export const addStudyTime = async (
  subjectId: string,
  minutes: number
): Promise<void> => {
  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  const subjectDoc = await getDoc(subjectRef);

  if (!subjectDoc.exists()) {
    throw new Error('Subject not found');
  }

  const currentTime = subjectDoc.data().studyTime || 0;

  await updateDoc(subjectRef, {
    studyTime: currentTime + minutes,
    updatedAt: serverTimestamp(),
  });
};

// Add topic to a subject
export const addTopic = async (
  subjectId: string,
  topicData: Partial<Topic>,
  existingTopics: Topic[]
): Promise<void> => {
  const newTopic: Topic = {
    id: `topic_${Date.now()}`,
    name: topicData.name || 'New Topic',
    description: topicData.description,
    masteryLevel: 0,
    studyTime: 0,
    resources: [],
    notes: [],
    weakAreas: [],
  };

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    topics: [...existingTopics, newTopic],
    updatedAt: serverTimestamp(),
  });
};

// Update topic in a subject
export const updateTopic = async (
  subjectId: string,
  topicId: string,
  updates: Partial<Topic>,
  existingTopics: Topic[]
): Promise<void> => {
  const updatedTopics = existingTopics.map(t =>
    t.id === topicId ? { ...t, ...updates, lastStudied: new Date() } : t
  );

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    topics: updatedTopics,
    updatedAt: serverTimestamp(),
  });
};

// Remove topic from a subject
export const removeTopic = async (
  subjectId: string,
  topicId: string,
  existingTopics: Topic[]
): Promise<void> => {
  const updatedTopics = existingTopics.filter(t => t.id !== topicId);

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    topics: updatedTopics,
    updatedAt: serverTimestamp(),
  });
};

// Add resource to a subject
export const addResource = async (
  subjectId: string,
  resourceData: Partial<Resource>,
  existingResources: Resource[]
): Promise<void> => {
  const newResource: Resource = {
    id: `resource_${Date.now()}`,
    title: resourceData.title || 'New Resource',
    type: resourceData.type || 'other',
    url: resourceData.url,
    notes: resourceData.notes,
    rating: resourceData.rating,
    completed: false,
  };

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    resources: [...existingResources, newResource],
    updatedAt: serverTimestamp(),
  });
};

// Toggle resource completion
export const toggleResourceCompletion = async (
  subjectId: string,
  resourceId: string,
  completed: boolean,
  existingResources: Resource[]
): Promise<void> => {
  const updatedResources = existingResources.map(r =>
    r.id === resourceId ? { ...r, completed } : r
  );

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    resources: updatedResources,
    updatedAt: serverTimestamp(),
  });
};

// Add exam date
export const addExamDate = async (
  subjectId: string,
  examData: Partial<ExamDate>,
  existingExams: ExamDate[]
): Promise<void> => {
  const newExam: ExamDate = {
    id: `exam_${Date.now()}`,
    name: examData.name || 'New Exam',
    date: examData.date || new Date(),
    type: examData.type || 'quiz',
    topics: examData.topics || [],
    preparationStatus: 0,
  };

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    examDates: [...existingExams, newExam],
    updatedAt: serverTimestamp(),
  });
};

// Update exam preparation status
export const updateExamPreparation = async (
  subjectId: string,
  examId: string,
  preparationStatus: number,
  existingExams: ExamDate[]
): Promise<void> => {
  const updatedExams = existingExams.map(e =>
    e.id === examId ? { ...e, preparationStatus } : e
  );

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    examDates: updatedExams,
    updatedAt: serverTimestamp(),
  });
};

// Add grade
export const addGrade = async (
  subjectId: string,
  gradeData: Partial<Grade>,
  existingGrades: Grade[]
): Promise<void> => {
  const newGrade: Grade = {
    id: `grade_${Date.now()}`,
    name: gradeData.name || 'New Grade',
    score: gradeData.score || 0,
    maxScore: gradeData.maxScore || 100,
    weight: gradeData.weight || 1,
    date: gradeData.date || new Date(),
    type: gradeData.type || 'quiz',
  };

  // Calculate new mastery level based on grades
  const allGrades = [...existingGrades, newGrade];
  const totalWeight = allGrades.reduce((sum, g) => sum + g.weight, 0);
  const weightedSum = allGrades.reduce((sum, g) => sum + (g.score / g.maxScore * 100 * g.weight), 0);
  const masteryLevel = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  await updateDoc(subjectRef, {
    grades: allGrades,
    masteryLevel,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to user's subjects
export const subscribeToSubjects = (
  userId: string,
  callback: (subjects: Subject[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(
    subjectsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const subjects = snapshot.docs.map(convertSubjectFromFirestore);
      callback(subjects);
    },
    (error) => {
      console.error('Error subscribing to subjects:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get upcoming exams across all subjects
export const subscribeToUpcomingExams = (
  userId: string,
  callback: (exams: (ExamDate & { subjectId: string; subjectName: string; subjectColor: string })[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(
    subjectsRef,
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const now = new Date();
      const allExams: (ExamDate & { subjectId: string; subjectName: string; subjectColor: string })[] = [];

      snapshot.docs.forEach(doc => {
        const subject = convertSubjectFromFirestore(doc);
        subject.examDates
          .filter(e => new Date(e.date) >= now)
          .forEach(exam => {
            allExams.push({
              ...exam,
              subjectId: subject.id,
              subjectName: subject.name,
              subjectColor: subject.color,
            });
          });
      });

      // Sort by date
      allExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(allExams);
    },
    (error) => {
      console.error('Error subscribing to upcoming exams:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Batch delete subjects
export const batchDeleteSubjects = async (subjectIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  subjectIds.forEach((subjectId) => {
    const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
    batch.delete(subjectRef);
  });

  await batch.commit();
};
