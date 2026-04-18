/**
 * Application state store using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Commit, Repository, FileChange } from '@jujutsu-gui/shared';

// Repository state
interface RepoState {
  repository: Repository | null;
  commits: Commit[];
  selectedCommit: Commit | null;
  files: FileChange[];
  isLoading: boolean;
  error: string | null;
}

interface RepoActions {
  setRepository: (repo: Repository | null) => void;
  setCommits: (commits: Commit[]) => void;
  setSelectedCommit: (commit: Commit | null) => void;
  setFiles: (files: FileChange[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialRepoState: RepoState = {
  repository: null,
  commits: [],
  selectedCommit: null,
  files: [],
  isLoading: false,
  error: null,
};

export const useRepoStore = create<RepoState & RepoActions>((set) => ({
  ...initialRepoState,
  setRepository: (repository) => set({ repository }),
  setCommits: (commits) => set({ commits }),
  setSelectedCommit: (selectedCommit) => set({ selectedCommit }),
  setFiles: (files) => set({ files }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialRepoState),
}));

// UI state
interface UIState {
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  activeTab: 'commits' | 'files' | 'operations';
  theme: 'light' | 'dark' | 'system';
  commandPaletteOpen: boolean;
  showGridLines: boolean;
  gridLayoutOptions: {
    rowHeight: number;
    columnWidth: number;
  };
}

interface UIActions {
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setTheme: (theme: UIState['theme']) => void;
  toggleCommandPalette: () => void;
  toggleGridLines: () => void;
  setGridLayoutOptions: (options: Partial<UIState['gridLayoutOptions']>) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      detailPanelOpen: true,
      activeTab: 'commits',
      theme: 'system',
      commandPaletteOpen: false,
      showGridLines: true,
      gridLayoutOptions: {
        rowHeight: 64,
        columnWidth: 200,
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleDetailPanel: () => set((state) => ({ detailPanelOpen: !state.detailPanelOpen })),
      setActiveTab: (activeTab) => set({ activeTab }),
      setTheme: (theme) => set({ theme }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      toggleGridLines: () => set((state) => ({ showGridLines: !state.showGridLines })),
      setGridLayoutOptions: (options) =>
        set((state) => ({
          gridLayoutOptions: { ...state.gridLayoutOptions, ...options },
        })),
    }),
    {
      name: 'jjgui-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        showGridLines: state.showGridLines,
      }),
    }
  )
);

// Selection state
interface SelectionState {
  selectedFiles: string[];
  selectedBookmark: string | null;
  searchQuery: string;
}

interface SelectionActions {
  setSelectedFiles: (files: string[]) => void;
  toggleFileSelection: (path: string) => void;
  setSelectedBookmark: (bookmark: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
}

const initialSelectionState: SelectionState = {
  selectedFiles: [],
  selectedBookmark: null,
  searchQuery: '',
};

export const useSelectionStore = create<SelectionState & SelectionActions>((set) => ({
  ...initialSelectionState,
  setSelectedFiles: (selectedFiles) => set({ selectedFiles }),
  toggleFileSelection: (path) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(path)
        ? state.selectedFiles.filter((f) => f !== path)
        : [...state.selectedFiles, path],
    })),
  setSelectedBookmark: (selectedBookmark) => set({ selectedBookmark }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearSelection: () => set(initialSelectionState),
}));
