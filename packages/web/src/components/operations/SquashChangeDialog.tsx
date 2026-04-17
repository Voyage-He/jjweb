/**
 * Squash Change Dialog
 * Allows squashing changes into their parent
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Merge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/api/client';
import type { Commit } from '@jujutsu-gui/shared';

interface SquashChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commit: Commit | null;
  onSuccess?: () => void;
}

export function SquashChangeDialog({ open, onOpenChange, commit, onSuccess }: SquashChangeDialogProps) {
  const [description, setDescription] = useState('');
  const [keepOriginal, setKeepOriginal] = useState(false);
  const queryClient = useQueryClient();

  const squashMutation = useMutation({
    mutationFn: () => apiClient.squashChange(commit!.changeId, { description, keepOriginal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
      onOpenChange(false);
      setDescription('');
      setKeepOriginal(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    squashMutation.mutate();
  };

  if (!commit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Squash Change
          </DialogTitle>
          <DialogDescription>
            Squash this change into its parent. The changes will be combined.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Current commit info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change to squash</div>
              <div className="font-mono text-sm">{commit.changeId.slice(0, 8)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {commit.description || '(no description)'}
              </div>
            </div>

            {/* Parent info */}
            {commit.parents.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Into parent</div>
                <div className="font-mono text-sm">{commit.parents[0].slice(0, 8)}</div>
              </div>
            )}

            {/* Combined description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Combined Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Leave empty to use parent's description"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm resize-none"
                rows={4}
              />
            </div>

            {/* Keep original option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepOriginal}
                onChange={(e) => setKeepOriginal(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Keep original change (creates a copy)
              </span>
            </label>

            {/* Error message */}
            {squashMutation.isError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {squashMutation.error instanceof Error
                  ? squashMutation.error.message
                  : 'Failed to squash change'}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={squashMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={squashMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {squashMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Squashing...
                </>
              ) : (
                <>
                  <Merge className="mr-2 h-4 w-4" />
                  Squash
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SquashChangeDialog;
