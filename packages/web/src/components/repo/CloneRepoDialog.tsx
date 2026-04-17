/**
 * Clone Repository Dialog
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
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

interface CloneRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CloneRepoDialog({ open, onOpenChange, onSuccess }: CloneRepoDialogProps) {
  const [url, setUrl] = useState('');
  const [path, setPath] = useState('');
  const setRepository = useRepoStore((state) => state.setRepository);

  const cloneMutation = useMutation({
    mutationFn: () => apiClient.cloneRepo({ url, path }),
    onSuccess: (data) => {
      setRepository(data.repository);
      onOpenChange(false);
      setUrl('');
      setPath('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cloneMutation.mutate();
  };

  // Auto-suggest path from URL
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!path && newUrl) {
      // Extract repo name from URL
      const match = newUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) {
        setPath(match[1]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Clone Repository
            </DialogTitle>
            <DialogDescription>
              Clone an existing repository from a remote URL.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Repository URL</Label>
              <Input
                id="url"
                placeholder="https://github.com/user/repo.git"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="path">Destination Path</Label>
              <Input
                id="path"
                placeholder="/path/to/clone"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
              />
            </div>
          </div>
          {cloneMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {cloneMutation.error instanceof Error ? cloneMutation.error.message : 'Failed to clone repository'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={cloneMutation.isPending || !url.trim() || !path.trim()}>
              {cloneMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
