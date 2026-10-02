import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

type FormMessageProps = {
  message?: string | null;
  tone?: 'error' | 'success';
  className?: string;
};

export function FormMessage({ message, tone = 'error', className }: FormMessageProps) {
  if (!message) return null;
  const isError = tone === 'error';

  return (
    <View
      accessibilityLiveRegion="polite"
      className={cn(
        'flex-row items-start gap-3 rounded-lg border px-4 py-3',
        isError ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-accent',
        className
      )}>
      <Icon
        as={isError ? CircleAlert : CircleCheck}
        size={18}
        className={cn('mt-0.5', isError ? 'text-destructive' : 'text-primary')}
      />
      <Text
        className={cn('flex-1 text-sm leading-5', isError ? 'text-destructive' : 'text-primary')}>
        {message}
      </Text>
    </View>
  );
}
