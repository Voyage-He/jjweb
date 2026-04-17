/**
 * Repository selection/initialization view
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitBranch, FolderPlus, Download, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/api/client';
import { useRepoStore } from '@/stores';
import { InitRepoDialog } from './InitRepoDialog';
import { CloneRepoDialog } from './CloneRepoDialog';
import { OpenRepoDialog } from './OpenRepoDialog';
import { RecentReposList, type RecentRepo } from './RecentReposList';

interface RepoSelectViewProps {
  onRepoOpen: () => void;
}

export function RepoSelectView({ onRepoOpen }: RepoSelectViewProps) {
  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const setRepository = useRepoStore((state) => state.setRepository);
  const queryClient = useQueryClient();

  // Fetch recent repos
  const { data: recentReposData } = useQuery({
    queryKey: ['recentRepos'],
    queryFn: () => apiClient.getRecentRepos(),
  });

  const recentRepos: RecentRepo[] = recentReposData?.repos ?? [];

  // Open recent repo mutation
  const openRecentMutation = useMutation({
    mutationFn: (path: string) => apiClient.openRepo({ path }),
    onSuccess: (data) => {
      setRepository(data.repository);
      onRepoOpen();
    },
  });

  // Remove recent repo mutation
  const removeRecentMutation = useMutation({
    mutationFn: (path: string) => apiClient.removeRecentRepo(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentRepos'] });
    },
  });

  const handleOpenRecent = (path: string) => {
    openRecentMutation.mutate(path);
  };

  const handleRemoveRecent = (path: string) => {
    removeRecentMutation.mutate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GitBranch className="h-10 w-10 text-blue-500" />
            <h1 className="text-3xl font-bold">Jujutsu GUI</h1>
          </div>
          <p className="text-muted-foreground">
            A visual interface for the Jujutsu version control system
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setOpenDialogOpen(true)}
            >
              <FolderOpen className="h-6 w-6" />
              <span>Open</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setInitDialogOpen(true)}
            >
              <FolderPlus className="h-6 w-6" />
              <span>Initialize</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setCloneDialogOpen(true)}
            >
              <Download className="h-6 w-6" />
              <span>Clone</span>
            </Button>
          </div>

          {/* Recent Repositories */}
          <RecentReposList
            repos={recentRepos}
            onOpen={handleOpenRecent}
            onRemove={handleRemoveRecent}
            isLoading={openRecentMutation.isPending}
            loadingPath={openRecentMutation.variables}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Requires Jujutsu (jj) to be installed and available in PATH</p>
        </div>
      </div>

      {/* Dialogs */}
      <OpenRepoDialog
        open={openDialogOpen}
        onOpenChange={setOpenDialogOpen}
        onSuccess={onRepoOpen}
      />
      <InitRepoDialog
        open={initDialogOpen}
        onOpenChange={setInitDialogOpen}
        onSuccess={onRepoOpen}
      />
      <CloneRepoDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        onSuccess={onRepoOpen}
      />
    </div>
  );
}
