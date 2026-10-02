import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, type TextInput, View } from 'react-native';

// Without a visible label (e.g. search), pass accessibilityLabel so screen readers still name the field.
export type TextFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  icon?: LucideIcon;
  prefix?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  revealable?: boolean;
};

export const TextField = React.forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    icon,
    prefix,
    error,
    hint,
    optional,
    revealable,
    multiline,
    onFocus,
    onBlur,
    ...inputProps
  },
  ref
) {
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(true);
  const id = React.useId();

  return (
    <View className="gap-2">
      {label ? (
        <Label nativeID={id}>
          {label}
          {optional ? (
            <Text className="text-[13px] font-normal text-muted-foreground"> (optional)</Text>
          ) : null}
        </Label>
      ) : null}
      <View
        className={cn(
          'flex-row items-center gap-3 rounded-lg border bg-card px-4',
          multiline ? 'items-start py-3' : 'h-14',
          error ? 'border-destructive' : focused ? 'border-primary' : 'border-input'
        )}>
        {icon ? (
          <Icon
            as={icon}
            size={18}
            className={cn('text-muted-foreground', multiline && 'mt-0.5')}
          />
        ) : null}
        {prefix ? <Text className="font-semibold">{prefix}</Text> : null}
        <Input
          ref={ref}
          aria-labelledby={label ? id : undefined}
          aria-invalid={!!error}
          multiline={multiline}
          secureTextEntry={revealable ? hidden : inputProps.secureTextEntry}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={cn(
            'h-full flex-1 rounded-none border-0 bg-transparent px-0',
            multiline && 'min-h-[72px] py-0'
          )}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          // "Next" moves focus without closing the keyboard in between.
          submitBehavior={inputProps.returnKeyType === 'next' ? 'submit' : undefined}
          {...inputProps}
        />
        {revealable ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Icon as={hidden ? Eye : EyeOff} size={18} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="error">{error}</Text>
      ) : hint ? (
        <Text variant="muted">{hint}</Text>
      ) : null}
    </View>
  );
});
