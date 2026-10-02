import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { SelectedTask } from '@/lib/api/types';
import { groupByCategory } from '@/lib/group-tasks';
import { Check } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

type ConfirmTasksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: SelectedTask[];
  saving: boolean;
  error?: string | null;
  onConfirm: () => void;
};

export function ConfirmTasksDialog({
  open,
  onOpenChange,
  tasks,
  saving,
  error,
  onConfirm,
}: ConfirmTasksDialogProps) {
  const count = tasks.length;

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Confirm your tasks</DialogTitle>
          <DialogDescription>
            Your Lifestyle Manager will start with{' '}
            {count === 1 ? 'this task' : `these ${count} tasks`}. You can change them later.
          </DialogDescription>
        </DialogHeader>
        <ScrollView className="max-h-72 grow-0" contentContainerClassName="gap-4">
          {groupByCategory(tasks).map((group) => (
            <View key={group.id} className="gap-2">
              <Text variant="label">{group.name}</Text>
              {group.tasks.map((task) => (
                <View key={task.id} className="flex-row items-center gap-2">
                  <Icon as={Check} size={16} className="text-primary" />
                  <Text className="flex-1">{task.name}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
        <FormMessage message={error} />
        <DialogFooter className="flex-col gap-3">
          <SubmitButton label="Confirm and save" pending={saving} onPress={onConfirm} />
          <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
            <Text>Keep editing</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
