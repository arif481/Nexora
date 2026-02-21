import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: ModalType | null;
  modalData: Record<string, unknown>;

  // Command palette
  commandPaletteOpen: boolean;

  // Quick actions
  quickActionsOpen: boolean;

  // Notifications
  notificationPanelOpen: boolean;

  // AI Assistant
  aiPanelOpen: boolean;
  aiMinimized: boolean;

  // Theme
  theme: 'dark' | 'light' | 'system';

  // Focus mode
  focusModeActive: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  toggleQuickActions: () => void;
  toggleNotificationPanel: () => void;
  toggleAIPanel: () => void;
  openAIPanel: () => void;
  closeAIPanel: () => void;
  setAIMinimized: (minimized: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleFocusMode: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

type ModalType =
  | 'create-task'
  | 'edit-task'
  | 'create-event'
  | 'edit-event'
  | 'create-note'
  | 'edit-note'
  | 'create-habit'
  | 'journal-entry'
  | 'settings'
  | 'profile'
  | 'focus-session'
  | 'quick-capture'
  | 'search'
  | 'ai-chat'
  | 'bulk-import'
  | 'confirmation';

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: {},
      commandPaletteOpen: false,
      quickActionsOpen: false,
      notificationPanelOpen: false,
      aiPanelOpen: false,
      aiMinimized: false,
      theme: 'dark',
      focusModeActive: false,
      globalLoading: false,
      loadingMessage: '',

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      openModal: (modal, data = {}) =>
        set({ activeModal: modal, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: {} }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      toggleQuickActions: () =>
        set((state) => ({ quickActionsOpen: !state.quickActionsOpen })),

      toggleNotificationPanel: () =>
        set((state) => ({
          notificationPanelOpen: !state.notificationPanelOpen,
        })),

      toggleAIPanel: () =>
        set((state) => ({ aiPanelOpen: !state.aiPanelOpen, aiMinimized: false })),

      openAIPanel: () => set({ aiPanelOpen: true, aiMinimized: false }),

      closeAIPanel: () => set({ aiPanelOpen: false }),

      setAIMinimized: (minimized) => set({ aiMinimized: minimized }),

      setTheme: (theme) => set({ theme }),

      toggleFocusMode: () =>
        set((state) => ({
          focusModeActive: !state.focusModeActive,
          sidebarCollapsed: !state.focusModeActive ? true : state.sidebarCollapsed,
          notificationPanelOpen: false,
          aiPanelOpen: false,
        })),

      setGlobalLoading: (loading, message = '') =>
        set({ globalLoading: loading, loadingMessage: message }),
    }),
    {
      name: 'nexora-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
