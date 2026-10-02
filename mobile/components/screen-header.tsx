import { BrandMark } from '@/components/brand-mark';
import { Text } from '@/components/ui/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: ReactNode;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="pb-8">
      <BrandMark />
      <Text variant="title" className="mt-6">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="lead" className="mt-3">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
