'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    createProject,
    updateProject as modifyProject,
    deleteProject as removeProject,
    subscribeToProjects
} from '@/lib/services/projects';
import type { Project } from '@/types';

export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToProjects(
            user.uid,
            (data) => {
                setProjects(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addProject = useCallback(
        async (data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await createProject(user.uid, data);
        },
        [user]
    );

    const updateProject = useCallback(
        async (id: string, updates: Partial<Project>) => await modifyProject(id, updates),
        []
    );

    const deleteProject = useCallback(
        async (id: string) => await removeProject(id),
        []
    );

    return { projects, loading, error, addProject, updateProject, deleteProject };
}
