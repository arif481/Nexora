'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToIntegrations,
  subscribeToLinkedAccounts,
  disconnectGoogleCalendar,
  unlinkAccount,
  type UserIntegrations,
  type UserLinkedAccounts,
} from '@/lib/services/integrations';

// Hook for managing Google Calendar integration
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

  // Connect Google Calendar - opens OAuth flow
  const connectGoogleCalendar = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID;
    
    if (!clientId) {
      alert('Google Calendar integration requires setup. Please add NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID to your environment variables.');
      return;
    }
    
    const redirectUri = `${window.location.origin}/Nexora/api/integrations/google-calendar/callback`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    
    window.open(authUrl, '_blank', 'width=600,height=700');
  }, []);

  // Disconnect Google Calendar
  const disconnect = useCallback(async (service: keyof UserIntegrations) => {
    if (!user) return;

    try {
      if (service === 'googleCalendar') {
        await disconnectGoogleCalendar(user.uid);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${service}:`, error);
      throw error;
    }
  }, [user]);

  return {
    integrations,
    loading,
    isGoogleCalendarConnected: integrations.googleCalendar?.connected ?? false,
    connectGoogleCalendar,
    disconnect,
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
      alert('To connect Google, please sign out and sign in with Google.');
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
