/**
 * Repository switcher dropdown component
 * Allows switching between recent repositories and closing the current one
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Folder, X, Loader2, FolderOpen, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/api/client';
import { useRepoStore } from '@/stores';
import { cn } from '@/lib/utils';

interface RepoSwitcherProps {
  onOpenRepo?: () => void;
  onInitRepo?: () => void;
  onCloneRepo?: () => void;
  onCloseRepo?: () => void;
}

export function RepoSwitcher({ onOpenRepo, onInitRepo, onCloneRepo, onCloseRepo }: RepoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const repository = useRepoStore((state) => state.repository);
  const setRepository = useRepoStore((state) => state.setRepository);
  const reset = useRepoStore((state) => state.reset);
  const queryClient = useQueryClient();

  // Fetch recent repos
  const { data: recentReposData, isLoading: reposLoading } = useQuery({
    queryKey: ['recentRepos'],
    queryFn: () => apiClient.getRecentRepos(),
  });

  const recentRepos = recentReposData?.repos ?? [];
  // Filter out current repo from the list
  const otherRepos = recentRepos.filter((r) => r.path !== repository?.path);

  // Switch to another repo
  const switchMutation = useMutation({
    mutationFn: (path: string) => apiClient.openRepo({ path }),
    onSuccess: (data) => {
      setRepository(data.repository);
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
    },
  });

  // Close current repo
  const closeMutation = useMutation({
    mutationFn: () => apiClient.closeRepo(),
    onSuccess: () => {
      reset();
      setIsOpen(false);
      onCloseRepo?.();
    },
  });

  const handleSwitch = (path: string) => {
    switchMutation.mutate(path);
  };

  const handleClose = () => {
    closeMutation.mutate();
  };

  if (!repository) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 px-2 h-9',
            'text-sm font-medium'
          )}
        >
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate">{repository.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {/* Current repo info */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <span className="font-medium">{repository.name}</span>
            <span className="text-xs text-muted-foreground truncate">{repository.path}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Quick actions */}
        <DropdownMenuItem onClick={onOpenRepo}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Open Repository...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInitRepo}>
          <Plus className="mr-2 h-4 w-4" />
          Initialize New...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCloneRepo}>
          <Download className="mr-2 h-4 w-4" />
          Clone Repository...
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Recent repos */}
        {reposLoading ? (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </DropdownMenuItem>
        ) : otherRepos.length > 0 ? (
          <>
            <DropdownMenuLabel>Recent Repositories</DropdownMenuLabel>
            {otherRepos.slice(0, 5).map((repo) => (
              <DropdownMenuItem
                key={repo.path}
                onClick={() => handleSwitch(repo.path)}
                disabled={switchMutation.isPending}
              >
                <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate flex-1">{repo.name}</span>
                {switchMutation.isPending && switchMutation.variables === repo.path && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}

        {/* Close current repo */}
        <DropdownMenuItem
          onClick={handleClose}
          disabled={closeMutation.isPending}
          className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          {closeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Close Repository
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
