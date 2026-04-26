import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { useRepoStore } from './stores';
import { Layout } from './components/layout';
import { RepoSelectView } from './components/repo';
import { RevisionTable } from './components/commits';
import { WorkingCopyPanel } from './components/working-copy';
import { useWebSocket } from './hooks/useWebSocket';
import { apiClient } from './api/client';
import type { ServerMessage, Commit } from '@jujutsu-gui/shared';
import { ToastProvider, useToast } from './components/ui/Toast';

// Operation dialogs
import { NewChangeDialog } from './components/operations/NewChangeDialog';
import { EditDescriptionDialog } from './components/operations/EditDescriptionDialog';
import { AbandonChangeDialog } from './components/operations/AbandonChangeDialog';
import { RebaseChangeDialog } from './components/operations/RebaseChangeDialog';
import { SquashChangeDialog } from './components/operations/SquashChangeDialog';
import { SplitChangeDialog } from './components/operations/SplitChangeDialog';
import { CreateBookmarkDialog } from './components/bookmarks/CreateBookmarkDialog';

// Dialog state type
interface DialogState {
  newChange: boolean;
  editDescription: boolean;
  abandon: boolean;
  rebase: boolean;
  squash: boolean;
  split: boolean;
  createBookmark: boolean;
}

function AppContent() {
  // Initialize repoOpen based on persisted repository state
  const persistedRepository = useRepoStore((state) => state.repository);
  const [repoOpen, setRepoOpen] = useState(!!persistedRepository);
  const { toast } = useToast();

  // Dialog state
  const [dialogs, setDialogs] = useState<DialogState>({
    newChange: false,
    editDescription: false,
    abandon: false,
    rebase: false,
    squash: false,
    split: false,
    createBookmark: false,
  });

  // Helper to open/close dialogs
  const openDialog = (dialog: keyof DialogState) => setDialogs((prev) => ({ ...prev, [dialog]: true }));
  const closeDialog = (dialog: keyof DialogState) => setDialogs((prev) => ({ ...prev, [dialog]: false }));

  const repository = useRepoStore((state) => state.repository);
  const commits = useRepoStore((state) => state.commits);
  const selectedCommit = useRepoStore((state) => state.selectedCommit);
  const setCommits = useRepoStore((state) => state.setCommits);
  const setSelectedCommit = useRepoStore((state) => state.setSelectedCommit);
  const setFiles = useRepoStore((state) => state.setFiles);
  const reset = useRepoStore((state) => state.reset);

  // Fetch commits when repository is open
  const { data: logData, refetch: refetchLog, error: logError } = useQuery({
    queryKey: ['log', repository?.path],
    queryFn: () => apiClient.getLog({ limit: 200 }),
    enabled: !!repository,
  });

  // Fetch working copy status
  const { data: workingCopyData, refetch: refetchWorkingCopy } = useQuery({
    queryKey: ['workingCopy', repository?.path],
    queryFn: () => apiClient.getWorkingCopyStatus(),
    enabled: !!repository,
  });

  // Fetch selected commit's file changes for split dialog
  const { data: commitDetailData } = useQuery({
    queryKey: ['commitDetail', selectedCommit?.id],
    queryFn: () => apiClient.getCommitDetail(selectedCommit!.changeId),
    enabled: !!selectedCommit,
  });

  // Update store when data changes
  useEffect(() => {
    if (logData?.commits) {
      setCommits(logData.commits);
      console.log('[App] setCommits called with', logData.commits.length, 'commits');
      const withBookmarks = logData.commits.filter((c: Commit) => c.bookmarks && c.bookmarks.length > 0);
      console.log('[App] Commits with bookmarks:', withBookmarks.length);
      withBookmarks.forEach((c: Commit) => {
        console.log(`[App] Commit ${c.changeId?.slice(0, 8)}: bookmarks=`, c.bookmarks?.map(b => b.name));
      });
    }
  }, [logData, setCommits]);

  useEffect(() => {
    if (workingCopyData?.status?.files) {
      setFiles(workingCopyData.status.files);
    }
  }, [workingCopyData, setFiles]);

  // Handle repository restoration failure (e.g., repo was deleted or moved)
  useEffect(() => {
    if (logError && repository && repoOpen) {
      console.error('[App] Failed to load persisted repository:', logError);
      toast('Repository not found. Please select a repository.', 'error');
      reset();
      setRepoOpen(false);
    }
  }, [logError, repository, repoOpen, reset, toast]);

  // Handle WebSocket messages
  const handleWSMessage = (message: ServerMessage) => {
    switch (message.type) {
      case 'file:changed':
      case 'file:added':
      case 'file:deleted':
        refetchWorkingCopy();
        break;
      case 'working_copy:changed':
        refetchWorkingCopy();
        break;
      case 'commit:created':
      case 'commit:updated':
        refetchLog();
        break;
    }
  };

  useWebSocket({ onMessage: handleWSMessage });

  // Handle commit selection
  const handleCommitSelect = (commit: Commit) => {
    setSelectedCommit(commit);
  };

  // Working copy actions
  const handleDiscardFile = async (path: string) => {
    await apiClient.discardFileChanges(path);
    refetchWorkingCopy();
  };

  const handleRestoreFile = async (path: string) => {
    await apiClient.restoreFile(path);
    refetchWorkingCopy();
  };

  const handleAddToGitignore = async (path: string) => {
    await apiClient.addToIgnore({ path });
    refetchWorkingCopy();
  };

  const handleDiscardAll = async () => {
    // Discard all changes
    if (workingCopyData?.status?.files) {
      for (const file of workingCopyData.status.files) {
        await apiClient.discardFileChanges(file.path);
      }
      refetchWorkingCopy();
    }
  };

  // Change operation callbacks
  const handleNewChange = () => openDialog('newChange');
  const handleEditDescription = () => openDialog('editDescription');
  const handleAbandon = () => openDialog('abandon');
  const handleRebase = () => openDialog('rebase');
  const handleSquash = () => openDialog('squash');
  const handleSplit = () => openDialog('split');
  const handleCreateBookmark = () => openDialog('createBookmark');

  // Handle editing a revision (switching working copy)
  const handleEditRevision = async (commit: Commit) => {
    // Don't do anything if clicking on the current working copy
    if (commit.isWorkingCopy) return;

    try {
      await apiClient.editRevision(commit.changeId);
      // Refresh both the log and working copy status
      refetchLog();
      refetchWorkingCopy();
      toast(`Switched to ${commit.changeId.slice(0, 8)}`, 'success');
    } catch (error) {
      console.error('Failed to edit revision:', error);
      toast('Failed to switch working copy', 'error');
    }
  };

  // Show repo selection if no repository is open
  if (!repository || !repoOpen) {
    return <RepoSelectView onRepoOpen={() => setRepoOpen(true)} />;
  }

  // Main app layout
  return (
    <>
      <Layout
        sidebar={
          <WorkingCopyPanel
            status={workingCopyData?.status ?? null}
            loading={false}
            onDiscardFile={handleDiscardFile}
            onRestoreFile={handleRestoreFile}
            onAddToGitignore={handleAddToGitignore}
            onDiscardAll={handleDiscardAll}
          />
        }
        main={
          <RevisionTable
            commits={commits || []}
            selectedCommit={selectedCommit}
            onCommitSelect={handleCommitSelect}
            onCommitEdit={handleEditRevision}
            onNewChange={handleNewChange}
            onEditDescription={handleEditDescription}
            onAbandon={handleAbandon}
            onRebase={handleRebase}
            onSquash={handleSquash}
            onSplit={handleSplit}
            onCreateBookmark={handleCreateBookmark}
          />
        }
        onOpenRepo={() => {
          setRepoOpen(false);
          setTimeout(() => {
            // Trigger open dialog - this will be handled by showing repo select view first
            setRepoOpen(false);
          }, 100);
        }}
        onInitRepo={() => {
          reset();
          setRepoOpen(false);
        }}
        onCloneRepo={() => {
          reset();
          setRepoOpen(false);
        }}
        onCloseRepo={() => {
          setRepoOpen(false);
        }}
      />

      {/* Operation Dialogs */}
      <NewChangeDialog
        open={dialogs.newChange}
        onOpenChange={(open) => !open && closeDialog('newChange')}
        afterRevision={selectedCommit?.changeId}
      />

      <EditDescriptionDialog
        open={dialogs.editDescription}
        onOpenChange={(open) => !open && closeDialog('editDescription')}
        changeId={selectedCommit?.changeId ?? null}
        currentDescription={selectedCommit?.description}
      />

      <AbandonChangeDialog
        open={dialogs.abandon}
        onOpenChange={(open) => !open && closeDialog('abandon')}
        changeId={selectedCommit?.changeId ?? null}
        changeDescription={selectedCommit?.description}
      />

      <RebaseChangeDialog
        open={dialogs.rebase}
        onOpenChange={(open) => !open && closeDialog('rebase')}
        commit={selectedCommit}
      />

      <SquashChangeDialog
        open={dialogs.squash}
        onOpenChange={(open) => !open && closeDialog('squash')}
        commit={selectedCommit}
      />

      <SplitChangeDialog
        open={dialogs.split}
        onOpenChange={(open) => !open && closeDialog('split')}
        commit={selectedCommit}
        files={commitDetailData?.files}
      />

      <CreateBookmarkDialog
        open={dialogs.createBookmark}
        onOpenChange={(open) => !open && closeDialog('createBookmark')}
        targetRevision={selectedCommit?.changeId}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
