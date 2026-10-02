import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { House } from 'lucide-react-native';
import { View } from 'react-native';

export function BrandMark() {
  return (
    <View className="gap-2">
      <View className="h-12 w-12 items-center justify-center rounded-lg bg-primary">
        <Icon as={House} size={24} className="text-primary-foreground" />
      </View>
      <Text variant="eyebrow">PadosiPro</Text>
    </View>
  );
}
