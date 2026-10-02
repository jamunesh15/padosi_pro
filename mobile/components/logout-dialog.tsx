import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

type LogoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LogoutDialog({ open, onOpenChange, onConfirm }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Log out?</DialogTitle>
          <DialogDescription>You'll need your email and password to log back in.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-3">
          <Button variant="destructive" onPress={onConfirm}>
            <Text>Log out</Text>
          </Button>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
