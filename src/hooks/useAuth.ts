'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { createOrUpdateUser, updateLastLogin, updateStreak } from '@/lib/services/user';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create or update user profile in Firestore
        try {
          await createOrUpdateUser(user.uid, {
            email: user.email || '',
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
          });
          await updateStreak(user.uid);
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }
      setState({ user, loading: false, error: null });
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      await createOrUpdateUser(result.user.uid, {
        email,
        displayName,
      });

      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signOut(auth);
      setState({ user: null, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await sendPasswordResetEmail(auth, email);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const deleteAccount = useCallback(async () => {
    const currentUser = state.user;
    if (!currentUser) throw new Error('Not authenticated');

    // All collections that store per-user documents
    const userQueryCollections = [
      COLLECTIONS.TASKS,
      COLLECTIONS.CALENDAR_EVENTS,
      COLLECTIONS.NOTES,
      COLLECTIONS.JOURNAL_ENTRIES,
      COLLECTIONS.HABITS,
      COLLECTIONS.SUBJECTS,
      COLLECTIONS.WELLNESS_ENTRIES,
      COLLECTIONS.TRANSACTIONS,
      COLLECTIONS.BUDGETS,
      COLLECTIONS.SUBSCRIPTIONS,
      COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS,
      COLLECTIONS.FINANCE_PEOPLE_ENTRIES,
      COLLECTIONS.FINANCE_PEOPLE_TYPES,
      COLLECTIONS.NOTIFICATIONS,
      COLLECTIONS.FOCUS_SESSIONS,
      COLLECTIONS.FOCUS_BLOCKS,
      COLLECTIONS.INTEGRATION_SYNC_JOBS,
      COLLECTIONS.INTEGRATION_SYNC_LOGS,
      COLLECTIONS.INTEGRATION_MAPPINGS,
      COLLECTIONS.INTEGRATION_SYNC_INBOX,
      'aiConversations',
      'aiFeedback',
      'goals',
    ];

    // Collections where the doc ID === userId
    const userDocCollections = [
      COLLECTIONS.USERS,
      COLLECTIONS.USER_INTEGRATIONS,
      COLLECTIONS.USER_LINKED_ACCOUNTS,
    ];

    // Batch delete queried collections
    for (const colName of userQueryCollections) {
      try {
        const q = query(collection(db, colName), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) continue;

        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch {
        // Skip collections that don't exist or fail
      }
    }

    // Delete user-keyed documents
    for (const colName of userDocCollections) {
      try {
        await deleteDoc(doc(db, colName, currentUser.uid));
      } catch {
        // Skip if doesn't exist
      }
    }

    // Delete the Firebase Auth user
    await deleteUser(currentUser);
    setState({ user: null, loading: false, error: null });
  }, [state.user]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    deleteAccount,
    clearError,
    isAuthenticated: !!state.user,
  };
}

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
}
