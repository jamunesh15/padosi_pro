import { StateView } from '@/components/state-view';
import { router } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-background">
      <StateView
        icon={Compass}
        title="Page not found"
        message="This screen doesn't exist."
        actionLabel="Go to start"
        onAction={() => router.replace('/')}
      />
    </View>
  );
}
