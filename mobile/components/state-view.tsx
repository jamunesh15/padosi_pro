import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type StateViewProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

// Shared empty and error state, always with a way forward so no screen is a dead end.
export function StateView({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: StateViewProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-12">
      <Icon as={icon} size={28} className="text-muted-foreground" />
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text variant="muted" className="text-center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" size="sm" className="mt-2 px-5" onPress={onAction}>
          <Text>{actionLabel}</Text>
        </Button>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button variant="link" size="link" onPress={onSecondary}>
          <Text>{secondaryLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}
