import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import type { Task } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type TaskItemProps = {
  task: Task;
  selected?: boolean;
  onToggle?: () => void;
};

// Selectable when onToggle is passed (task picker), read-only otherwise (home list).
export function TaskItem({ task, selected = false, onToggle }: TaskItemProps) {
  const content = (
    <View className="flex-1 gap-1">
      <Text className="font-medium">{task.name}</Text>
      <Text variant="muted">{task.description}</Text>
    </View>
  );

  if (!onToggle) {
    return <View className="rounded-lg border border-input bg-card px-4 py-3.5">{content}</View>;
  }

  return (
    <Pressable
      onPress={onToggle}
      role="checkbox"
      aria-checked={selected}
      accessibilityLabel={task.name}
      className={cn(
        'flex-row items-center gap-4 rounded-lg border px-4 py-3.5',
        selected ? 'border-primary bg-accent' : 'border-input bg-card active:bg-accent'
      )}>
      {content}
      <Checkbox checked={selected} onCheckedChange={onToggle} className="size-5 rounded-[6px]" />
    </Pressable>
  );
}
