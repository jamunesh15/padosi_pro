import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  invalid?: boolean;
  editable?: boolean;
};

// One real input drives six display boxes, which keeps paste and SMS/email autofill working.
export function OtpInput({ value, onChange, length = 6, invalid, editable = true }: OtpInputProps) {
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="relative flex-row gap-2">
      {Array.from({ length }, (_, index) => {
        const active = focused && index === Math.min(value.length, length - 1);
        return (
          <View
            key={index}
            className={cn(
              'h-14 flex-1 items-center justify-center rounded-lg border bg-card',
              invalid ? 'border-destructive' : active ? 'border-primary' : 'border-input'
            )}>
            <Text className="font-heading text-2xl">{value[index] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        autoFocus
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        accessibilityLabel="Verification code"
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}
