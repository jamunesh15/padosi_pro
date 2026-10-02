import '@/global.css';

import { StateView } from '@/components/state-view';
import { queryClient } from '@/lib/query-client';
import { SessionProvider, useSession } from '@/lib/session';
import { COLORS, NAV_THEME } from '@/lib/theme';
import { Figtree_600SemiBold, useFonts } from '@expo-google-fonts/figtree';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { WifiOff } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={NAV_THEME}>
          <StatusBar style="dark" />
          <RootNavigator />
          <PortalHost />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded] = useFonts({ Figtree_600SemiBold });
  const { state, user, restore, signOut } = useSession();
  const ready = fontsLoaded && state.status !== 'loading';

  React.useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (state.status === 'offline') {
    return (
      <View className="flex-1 bg-background">
        <StateView
          icon={WifiOff}
          title="Can't load your account"
          message={state.message}
          actionLabel="Try again"
          onAction={restore}
          secondaryLabel="Log out"
          onSecondary={signOut}
        />
      </View>
    );
  }

  // Guards decide which screens exist; index.tsx sends the user to the right one.
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && !user.profileCompleted}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Protected guard={!!user?.profileCompleted}>
        <Stack.Screen name="tasks" />
        <Stack.Screen name="home" />
      </Stack.Protected>
    </Stack>
  );
}
