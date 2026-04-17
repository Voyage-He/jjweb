/**
 * Abandon Change Dialog
 * Confirmation dialog for abandoning a change
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/api/client';

interface AbandonChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeId: string | null;
  changeDescription?: string;
}

export function AbandonChangeDialog({
  open,
  onOpenChange,
  changeId,
  changeDescription,
}: AbandonChangeDialogProps) {
  const queryClient = useQueryClient();

  const abandonMutation = useMutation({
    mutationFn: () => {
      if (!changeId) throw new Error('No change selected');
      return apiClient.abandonChange(changeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['workingCopy'] });
      onOpenChange(false);
    },
  });

  const handleConfirm = () => {
    abandonMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Abandon Change
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The change will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Are you sure you want to abandon this change?
              </p>
              {changeId && (
                <p className="text-xs mt-1 text-red-600 dark:text-red-300">
                  Change: <code className="font-mono">{changeId}</code>
                </p>
              )}
              {changeDescription && (
                <p className="text-xs mt-1 text-red-600 dark:text-red-300 truncate">
                  {changeDescription}
                </p>
              )}
            </div>
          </div>
        </div>
        {abandonMutation.error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
            {abandonMutation.error instanceof Error ? abandonMutation.error.message : 'Failed to abandon change'}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={abandonMutation.isPending || !changeId}
            onClick={handleConfirm}
          >
            {abandonMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abandoning...
              </>
            ) : (
              'Abandon'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
