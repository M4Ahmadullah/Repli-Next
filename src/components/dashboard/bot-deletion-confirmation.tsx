import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BotDeletionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
  botName: string;
  onDeleteSuccess: () => void;
}

export function BotDeletionConfirmation({
  isOpen,
  onClose,
  botId,
  botName,
  onDeleteSuccess
}: BotDeletionConfirmationProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmationText !== botName) {
      toast.error('Please type the bot name exactly to confirm deletion');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bot deleted successfully!', {
          description: 'The bot has been permanently removed from your account.',
          duration: 4000,
          style: {
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669',
          },
        });
        onDeleteSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('Delete bot error:', error);
      toast.error('Failed to delete bot', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Bot
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the bot{' '}
            <strong>{botName}</strong> and all of its data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{botName}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Enter bot name to confirm"
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmationText !== botName || isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Bot
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 