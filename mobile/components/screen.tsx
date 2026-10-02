import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  className?: string;
};

// Page shell: safe-area padding, keyboard avoidance and an optional footer pinned above the keyboard.
export function Screen({ children, footer, scroll = true, className }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('grow px-5 pb-6 pt-6', className)}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1 px-5 pt-6', className)}>{children}</View>
      )}
      {footer ? <View className="gap-4 px-5 pt-3">{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}
