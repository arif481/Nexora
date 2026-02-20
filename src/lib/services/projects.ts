/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Project } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Project from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertProjectFromFirestore = (doc: any): Project => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        color: data.color,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const createProject = async (
    userId: string,
    projectData: Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!projectData.name) {
        throw new Error('Project name is required');
    }

    const projectsRef = collection(db, COLLECTIONS.PROJECTS);

    const newProject = {
        ...projectData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(projectsRef, newProject);
    return docRef.id;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);

    const cleanUpdates: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(updates).forEach(([key, value]: [string, any]) => {
        if (value !== undefined) {
            if (value instanceof Date) {
                cleanUpdates[key] = Timestamp.fromDate(value);
            } else {
                cleanUpdates[key] = value;
            }
        }
    });

    cleanUpdates.updatedAt = serverTimestamp();
    await updateDoc(projectRef, cleanUpdates);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    await deleteDoc(projectRef);
};

export const subscribeToProjects = (
    userId: string,
    callback: (projects: Project[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const projectsRef = collection(db, COLLECTIONS.PROJECTS);
    const q = query(
        projectsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const projects = snapshot.docs.map(convertProjectFromFirestore);
            callback(projects);
        },
        (error) => {
            console.error('Error in projects subscription:', error);
            if (onError) onError(error);
        }
    );
};
