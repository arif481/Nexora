'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { IntegrationKey } from '@/lib/services/integrations';
import {
  addSyncLog,
  subscribeToSyncJobs,
  subscribeToSyncLogs,
  type IntegrationSyncJob,
  type IntegrationSyncLog,
} from '@/lib/services/sync';
import { queueIntegrationSyncJob } from '@/lib/services/integrations';

interface UseAutoSyncReturn {
  jobs: IntegrationSyncJob[];
  logs: IntegrationSyncLog[];
  loading: boolean;
  requestSync: (provider: IntegrationKey) => Promise<string | null>;
}

export function useAutoSync(maxJobs: number = 12, maxLogs: number = 24): UseAutoSyncReturn {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<IntegrationSyncJob[]>([]);
  const [logs, setLogs] = useState<IntegrationSyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setJobs([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeJobs = subscribeToSyncJobs(user.uid, (nextJobs) => {
      setJobs(nextJobs);
      setLoading(false);
    }, maxJobs);

    const unsubscribeLogs = subscribeToSyncLogs(user.uid, (nextLogs) => {
      setLogs(nextLogs);
    }, maxLogs);

    return () => {
      unsubscribeJobs();
      unsubscribeLogs();
    };
  }, [user, maxJobs, maxLogs]);

  const requestSync = useCallback(async (provider: IntegrationKey): Promise<string | null> => {
    if (!user) return null;

    const jobId = await queueIntegrationSyncJob(user.uid, provider, 'manual');
    await addSyncLog(user.uid, provider, 'info', 'Manual sync requested', { jobId });
    return jobId;
  }, [user]);

  return {
    jobs,
    logs,
    loading,
    requestSync,
  };
}
