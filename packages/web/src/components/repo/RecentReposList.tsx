/**
 * Recent Repositories List Component
 */

import { Folder, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RecentRepo {
  path: string;
  name: string;
  lastOpened: number;
}

interface RecentReposListProps {
  repos: RecentRepo[];
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  isLoading?: boolean;
  loadingPath?: string;
}

export function RecentReposList({ repos, onOpen, onRemove, isLoading, loadingPath }: RecentReposListProps) {
  if (repos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent repositories</p>
        <p className="text-sm">Open a repository to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Repositories</h3>
      {repos.map((repo) => (
        <div
          key={repo.path}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800',
            'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group'
          )}
          onClick={() => !isLoading && onOpen(repo.path)}
        >
          <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{repo.name}</p>
            <p className="text-xs text-muted-foreground truncate">{repo.path}</p>
          </div>
          {isLoading && loadingPath === repo.path ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(repo.path);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
