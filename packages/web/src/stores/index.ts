/**
 * Application state store using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Commit, Repository, FileChange } from '@jujutsu-gui/shared';

// Revision column configuration
export interface RevisionColumn {
  id: string;
  label: string;
  width: number | 'flex';
  visible: boolean;
}

const defaultRevisionColumns: RevisionColumn[] = [
  { id: 'changeId', label: 'Change ID', width: 100, visible: true },
  { id: 'message', label: 'Message', width: 'flex', visible: true },
  { id: 'author', label: 'Author', width: 120, visible: true },
  { id: 'date', label: 'Date', width: 140, visible: true },
];

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

export const useRepoStore = create<RepoState & RepoActions>()(
  persist(
    (set) => ({
      ...initialRepoState,
      setRepository: (repository) => set({ repository }),
      setCommits: (commits) => set({ commits }),
      setSelectedCommit: (selectedCommit) => set({ selectedCommit }),
      setFiles: (files) => set({ files }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set(initialRepoState),
    }),
    {
      name: 'jjgui-repo-storage',
      partialize: (state) => ({
        repository: state.repository,
      }),
    }
  )
);

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
    trackWidth: number;
  };
  maxGraphWidth: number;
  revisionColumns: RevisionColumn[];
}

interface UIActions {
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setTheme: (theme: UIState['theme']) => void;
  toggleCommandPalette: () => void;
  toggleGridLines: () => void;
  setGridLayoutOptions: (options: Partial<UIState['gridLayoutOptions']>) => void;
  setRevisionColumns: (columns: RevisionColumn[]) => void;
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
        rowHeight: 48,
        trackWidth: 32,
      },
      maxGraphWidth: 800,
      revisionColumns: defaultRevisionColumns,
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
      setRevisionColumns: (revisionColumns) => set({ revisionColumns }),
    }),
    {
      name: 'jjgui-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        showGridLines: state.showGridLines,
        revisionColumns: state.revisionColumns,
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
