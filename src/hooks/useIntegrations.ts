'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToIntegrations,
  subscribeToLinkedAccounts,
  connectAppleCalendar as connectAppleCalendarService,
  connectDataIntegration,
  disconnectGoogleCalendar,
  disconnectAppleCalendar,
  disconnectDataIntegration,
  queueIntegrationSyncJob,
  unlinkAccount,
  type IntegrationKey,
  type UserIntegrations,
  type UserLinkedAccounts,
  SUPPORTED_INTEGRATIONS,
} from '@/lib/services/integrations';

// Hook for managing external integrations
export function useIntegrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegrations>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIntegrations({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToIntegrations(user.uid, (data) => {
      setIntegrations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Connect Google Calendar - opens Client-Side OAuth flow
  const connectGoogleCalendar = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID;

    if (!clientId) {
      console.warn('Google Calendar integration requires setup. Please add NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID to your environment variables.');
      if (typeof window !== 'undefined') {
        const message = 'Google Calendar integration is not configured yet.';
        window.confirm(message);
      }
      return;
    }

    // Pointing to the new static callback route
    const redirectUri = `${window.location.origin}/Nexora/auth/callback`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=consent`;

    // Listen for the postMessage from the popup
    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'NEXORA_OAUTH_SUCCESS' && event.data?.payload?.provider === 'googleCalendar') {
        window.removeEventListener('message', messageListener);
        const { accessToken } = event.data.payload;
        try {
          await connectDataIntegration(user?.uid || '', 'googleCalendar', {
            syncMode: 'two-way',
            platform: 'web',
            autoImport: { calendar: true },
            credentials: { accessToken },
          });
        } catch (err) {
          console.error('Failed to capture Google Calendar token', err);
        }
      }
    };

    window.addEventListener('message', messageListener);
    window.open(authUrl, 'nexora_oauth', 'width=600,height=700');
  }, [user]);

  const connectAppleCalendar = useCallback(async () => {
    if (!user) return;
    try {
      await connectAppleCalendarService(user.uid, user.email || undefined);
    } catch (error) {
      console.error('Failed to connect Apple Calendar:', error);
    }
  }, [user]);

  const connectProvider = useCallback(async (
    provider: IntegrationKey,
    overrides: Record<string, unknown> = {},
    customToken?: string
  ) => {
    if (!user) return;

    try {
      const config = { ...overrides };
      if (customToken) {
        config.credentials = {
          accessToken: customToken,
        };
      }
      await connectDataIntegration(user.uid, provider, config);
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      throw error;
    }
  }, [user]);

  const requestSync = useCallback(async (provider: IntegrationKey) => {
    if (!user) return null;

    try {
      const jobId = await queueIntegrationSyncJob(user.uid, provider, 'manual');
      return jobId;
    } catch (error) {
      console.error(`Failed to queue sync for ${provider}:`, error);
      throw error;
    }
  }, [user]);

  // Disconnect integration
  const disconnect = useCallback(async (service: IntegrationKey) => {
    if (!user) return;

    try {
      if (service === 'googleCalendar') {
        await disconnectGoogleCalendar(user.uid);
      } else if (service === 'appleCalendar') {
        await disconnectAppleCalendar(user.uid);
      } else {
        await disconnectDataIntegration(user.uid, service);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${service}:`, error);
      throw error;
    }
  }, [user]);

  return {
    integrations,
    loading,
    supportedIntegrations: SUPPORTED_INTEGRATIONS,
    isGoogleCalendarConnected: integrations.googleCalendar?.connected ?? false,
    isAppleCalendarConnected: integrations.appleCalendar?.connected ?? false,
    connectGoogleCalendar,
    connectAppleCalendar,
    connectProvider,
    disconnect,
    requestSync,
  };
}

// Hook for managing linked OAuth accounts (Google sign-in detection)
export function useLinkedAccounts() {
  const { user } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<UserLinkedAccounts>({});
  const [loading, setLoading] = useState(true);

  // Check if user signed in with Google
  const getProviderData = useCallback(() => {
    if (!user) return {};

    const providerData: UserLinkedAccounts = {};

    user.providerData.forEach(provider => {
      if (provider.providerId === 'google.com') {
        providerData.google = {
          provider: 'google',
          providerId: provider.uid,
          email: provider.email || undefined,
          displayName: provider.displayName || undefined,
          photoURL: provider.photoURL || undefined,
          linkedAt: new Date(),
        };
      }
    });

    return providerData;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLinkedAccounts({});
      setLoading(false);
      return;
    }

    const authProviders = getProviderData();

    const unsubscribe = subscribeToLinkedAccounts(user.uid, (firestoreAccounts) => {
      setLinkedAccounts({
        ...firestoreAccounts,
        ...authProviders,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, getProviderData]);

  const connectAccount = useCallback((provider: 'google' | 'github' | 'twitter' | 'linkedin') => {
    if (provider === 'google') {
      console.info('To connect Google, user should sign out and sign in with Google.');
    }
  }, []);

  const disconnectAccount = useCallback(async (provider: 'google' | 'github' | 'twitter' | 'linkedin') => {
    if (!user) return;

    try {
      await unlinkAccount(user.uid, provider);
    } catch (error) {
      console.error(`Failed to unlink ${provider}:`, error);
      throw error;
    }
  }, [user]);

  return {
    linkedAccounts,
    loading,
    isGoogleLinked: !!linkedAccounts.google,
    isGitHubLinked: false,
    isTwitterLinked: false,
    isLinkedInLinked: false,
    connectAccount,
    disconnectAccount,
  };
}
