import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

export function TaskListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View className="gap-3" accessibilityLabel="Loading tasks">
      <Skeleton className="h-4 w-40 bg-muted" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-[72px] w-full rounded-lg bg-muted" />
      ))}
    </View>
  );
}
