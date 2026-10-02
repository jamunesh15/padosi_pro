import { Button, type ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/lib/theme';
import { ActivityIndicator } from 'react-native';

type SubmitButtonProps = Omit<ButtonProps, 'children'> & {
  label: string;
  pending?: boolean;
};

export function SubmitButton({ label, pending, disabled, variant, ...props }: SubmitButtonProps) {
  const spinnerColor = variant === 'outline' ? COLORS.primary : '#FFFFFF';

  return (
    <Button
      variant={variant}
      disabled={disabled || pending}
      accessibilityState={{ busy: pending, disabled: disabled || pending }}
      {...props}>
      {pending ? <ActivityIndicator color={spinnerColor} /> : <Text>{label}</Text>}
    </Button>
  );
}
