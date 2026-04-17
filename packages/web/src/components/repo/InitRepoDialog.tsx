/**
 * Initialize Repository Dialog
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FolderPlus, Loader2 } from 'lucide-react';
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
import { useRepoStore } from '@/stores';

interface InitRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InitRepoDialog({ open, onOpenChange, onSuccess }: InitRepoDialogProps) {
  const [path, setPath] = useState('');
  const [useGit, setUseGit] = useState(true);
  const setRepository = useRepoStore((state) => state.setRepository);

  const initMutation = useMutation({
    mutationFn: () => apiClient.initRepo({ path, git: useGit }),
    onSuccess: (data) => {
      setRepository(data.repository);
      onOpenChange(false);
      setPath('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Initialize Repository
            </DialogTitle>
            <DialogDescription>
              Create a new Jujutsu repository at the specified path.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="path">Directory Path</Label>
              <Input
                id="path"
                placeholder="/path/to/new/repository"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useGit"
                checked={useGit}
                onChange={(e) => setUseGit(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="useGit" className="font-normal">
                Use Git backend (recommended)
              </Label>
            </div>
          </div>
          {initMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {initMutation.error instanceof Error ? initMutation.error.message : 'Failed to initialize repository'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={initMutation.isPending || !path.trim()}>
              {initMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Initialize'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
