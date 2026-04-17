/**
 * Rebase Change Dialog
 * Allows rebasing a change to a different parent
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GitMerge, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';
import type { Commit } from '@jujutsu-gui/shared';

interface RebaseChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commit: Commit | null;
}

export function RebaseChangeDialog({ open, onOpenChange, commit }: RebaseChangeDialogProps) {
  const [destination, setDestination] = useState('');
  const [insertAfter, setInsertAfter] = useState(true);
  const queryClient = useQueryClient();

  const rebaseMutation = useMutation({
    mutationFn: () => {
      if (!commit) throw new Error('No change selected');
      return apiClient.moveChange(commit.changeId, { destination, insertAfter });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
      setDestination('');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rebaseMutation.mutate();
  };

  if (!commit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Rebase Change
            </DialogTitle>
            <DialogDescription>
              Move this change to a different parent in the commit history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current commit info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change to rebase</div>
              <div className="font-mono text-sm">{commit.changeId.slice(0, 8)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {commit.description || '(no description)'}
              </div>
            </div>

            {/* Destination input */}
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination Revision</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., main, @-, or change ID"
                required
              />
              <p className="text-xs text-muted-foreground">
                The revision to rebase this change onto. Use a branch name, change ID, or revset.
              </p>
            </div>

            {/* Insert after/before toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={insertAfter}
                onChange={(e) => setInsertAfter(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Insert after destination (default behavior)
              </span>
            </label>
          </div>
          {rebaseMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {rebaseMutation.error instanceof Error ? rebaseMutation.error.message : 'Failed to rebase change'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={rebaseMutation.isPending || !destination.trim()}>
              {rebaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rebasing...
                </>
              ) : (
                <>
                  <GitMerge className="mr-2 h-4 w-4" />
                  Rebase
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RebaseChangeDialog;
