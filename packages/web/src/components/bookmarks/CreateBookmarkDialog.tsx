/**
 * Create Bookmark Dialog
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2 } from 'lucide-react';
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

interface CreateBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRevision?: string;
}

export function CreateBookmarkDialog({
  open,
  onOpenChange,
  targetRevision,
}: CreateBookmarkDialogProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(targetRevision || '');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => apiClient.createBookmark({ name, target: target || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      setName('');
      setTarget('');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Create Bookmark
            </DialogTitle>
            <DialogDescription>
              Create a new bookmark pointing to a commit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Bookmark Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-feature"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Target Revision (optional)</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="@- or change ID"
              />
              <p className="text-xs text-muted-foreground">
                Defaults to the current working copy if not specified.
              </p>
            </div>
          </div>
          {createMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create bookmark'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
