/**
 * New Change Dialog
 * Dialog for creating a new change
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
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

interface NewChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afterRevision?: string;
}

export function NewChangeDialog({ open, onOpenChange, afterRevision }: NewChangeDialogProps) {
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const repository = useRepoStore((state) => state.repository);

  const newMutation = useMutation({
    mutationFn: () => apiClient.newChange({ description: description || undefined, after: afterRevision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
      setDescription('');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Change
            </DialogTitle>
            <DialogDescription>
              Create a new change in the repository.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter commit message..."
              />
            </div>
            {afterRevision && (
              <div className="text-xs text-muted-foreground">
                After: <code className="font-mono">{afterRevision}</code>
              </div>
            )}
          </div>
          {newMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {newMutation.error instanceof Error ? newMutation.error.message : 'Failed to create change'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={newMutation.isPending || !repository}>
              {newMutation.isPending ? (
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
