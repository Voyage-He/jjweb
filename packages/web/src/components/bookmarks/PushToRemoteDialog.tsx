/**
 * Push to Remote Dialog Component
 * Allows pushing a bookmark to a remote
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/api/client';
import type { Bookmark } from '@jujutsu-gui/shared';

interface PushToRemoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark | null;
  onSuccess?: () => void;
}

export function PushToRemoteDialog({ open, onOpenChange, bookmark, onSuccess }: PushToRemoteDialogProps) {
  const [remote, setRemote] = useState('origin');
  const [force, setForce] = useState(false);
  const queryClient = useQueryClient();

  const pushMutation = useMutation({
    mutationFn: async () => {
      // Note: This would need a corresponding API endpoint
      // For now, we'll simulate it
      const response = await fetch('/api/bookmarks/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookmark!.name,
          remote,
          force,
        }),
      });
      if (!response.ok) throw new Error('Push failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushMutation.mutate();
  };

  if (!bookmark) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Push to Remote
          </DialogTitle>
          <DialogDescription>
            Push the bookmark to a remote repository.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Bookmark info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-violet-500" />
                <span className="font-medium">{bookmark.name}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Target: {bookmark.target.slice(0, 8)}
              </div>
            </div>

            {/* Remote selection */}
            <div>
              <Label htmlFor="remote">Remote</Label>
              <Input
                id="remote"
                value={remote}
                onChange={(e) => setRemote(e.target.value)}
                placeholder="origin"
                className="mt-1"
              />
            </div>

            {/* Force push option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Force push (use with caution)
              </span>
            </label>

            {/* Warning for force push */}
            {force && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
                Force push will overwrite the remote branch. Use with extreme caution.
              </div>
            )}

            {/* Error message */}
            {pushMutation.isError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {pushMutation.error instanceof Error
                  ? pushMutation.error.message
                  : 'Failed to push bookmark'}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pushMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pushMutation.isPending}
              className={force ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {pushMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Push
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PushToRemoteDialog;
