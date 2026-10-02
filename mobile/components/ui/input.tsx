import { COLORS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'h-14 w-full min-w-0 rounded-lg border border-input bg-card px-4 text-base text-foreground',
        props.editable === false && 'opacity-50',
        Platform.select({ web: 'outline-none' }),
        className
      )}
      placeholderTextColor={COLORS.mutedForeground}
      {...props}
    />
  );
}

export { Input };
