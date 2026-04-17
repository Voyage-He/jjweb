/**
 * Open Repository Dialog
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FolderOpen, Loader2 } from 'lucide-react';
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

interface OpenRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OpenRepoDialog({ open, onOpenChange, onSuccess }: OpenRepoDialogProps) {
  const [path, setPath] = useState('');
  const setRepository = useRepoStore((state) => state.setRepository);

  const openMutation = useMutation({
    mutationFn: () => apiClient.openRepo({ path }),
    onSuccess: (data) => {
      setRepository(data.repository);
      onOpenChange(false);
      setPath('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Open Repository
            </DialogTitle>
            <DialogDescription>
              Open an existing Jujutsu or Git repository.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="path">Repository Path</Label>
              <Input
                id="path"
                placeholder="/path/to/repository"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the path to a directory containing a .jj or .git folder.
              </p>
            </div>
          </div>
          {openMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {openMutation.error instanceof Error ? openMutation.error.message : 'Failed to open repository'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={openMutation.isPending || !path.trim()}>
              {openMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                'Open'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
