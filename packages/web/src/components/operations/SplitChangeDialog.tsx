/**
 * Split Change Dialog
 * Allows splitting a change by selecting which files go to the new change
 */

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Split, Loader2, FileText, Check } from 'lucide-react';
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
import type { Commit, FileChange } from '@jujutsu-gui/shared';

interface SplitChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commit: Commit | null;
  files?: FileChange[];
  onSuccess?: () => void;
}

export function SplitChangeDialog({ open, onOpenChange, commit, files = [], onSuccess }: SplitChangeDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Split mutation
  const splitMutation = useMutation({
    mutationFn: () => apiClient.splitChange(commit!.changeId, Array.from(selectedFiles)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
      onOpenChange(false);
      setSelectedFiles(new Set());
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.size === 0 || selectedFiles.size === files.length) return;
    splitMutation.mutate();
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map((f) => f.path)));
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  // Group files by status
  const groupedFiles = useMemo(() => {
    return files.reduce((acc, file) => {
      const status = file.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(file);
      return acc;
    }, {} as Record<string, FileChange[]>);
  }, [files]);

  if (!commit) return null;

  const canSplit = selectedFiles.size > 0 && selectedFiles.size < files.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Change
          </DialogTitle>
          <DialogDescription>
            Select files to move to a new change. The remaining files will stay in the current change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Current commit info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change to split</div>
              <div className="font-mono text-sm">{commit.changeId.slice(0, 8)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {commit.description || '(no description)'}
              </div>
            </div>

            {/* File selection */}
            {files.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Files to move to new change ({selectedFiles.size}/{files.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={selectNone}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-auto">
                  {Object.entries(groupedFiles).map(([status, statusFiles]) => (
                    <div key={status}>
                      <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0">
                        {status} ({statusFiles.length})
                      </div>
                      {statusFiles.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => toggleFile(file.path)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedFiles.has(file.path) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              selectedFiles.has(file.path)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {selectedFiles.has(file.path) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-mono truncate flex-1">{file.path}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No files to split</p>
              </div>
            )}

            {/* Warning if invalid selection */}
            {!canSplit && files.length > 0 && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                Select at least one file but not all files to split the change.
              </div>
            )}

            {/* Error message */}
            {splitMutation.isError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {splitMutation.error instanceof Error
                  ? splitMutation.error.message
                  : 'Failed to split change'}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={splitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={splitMutation.isPending || !canSplit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {splitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  <Split className="mr-2 h-4 w-4" />
                  Split
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SplitChangeDialog;
