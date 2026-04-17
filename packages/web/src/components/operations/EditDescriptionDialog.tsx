/**
 * Edit Description Dialog
 * Dialog for editing commit/change messages
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';

interface EditDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeId: string | null;
  currentDescription?: string;
}

export function EditDescriptionDialog({
  open,
  onOpenChange,
  changeId,
  currentDescription = '',
}: EditDescriptionDialogProps) {
  const [description, setDescription] = useState(currentDescription);
  const queryClient = useQueryClient();

  // Update local state when props change
  useEffect(() => {
    setDescription(currentDescription);
  }, [currentDescription]);

  const editMutation = useMutation({
    mutationFn: () => {
      if (!changeId) throw new Error('No change selected');
      return apiClient.editDescription(changeId, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Edit Description
            </DialogTitle>
            <DialogDescription>
              Update the commit message for this change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter commit message..."
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                rows={5}
              />
            </div>
            {changeId && (
              <div className="text-xs text-muted-foreground">
                Change ID: <code className="font-mono">{changeId}</code>
              </div>
            )}
          </div>
          {editMutation.error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {editMutation.error instanceof Error ? editMutation.error.message : 'Failed to update description'}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMutation.isPending || !changeId}>
              {editMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
