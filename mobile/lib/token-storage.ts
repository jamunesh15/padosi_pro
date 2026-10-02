import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'padosipro.session-token';
const isWeb = Platform.OS === 'web';

// SecureStore keeps the token in the Android Keystore / iOS Keychain; the web preview falls back to localStorage.
export const tokenStorage = {
  get: () => (isWeb ? Promise.resolve(localStorage.getItem(KEY)) : SecureStore.getItemAsync(KEY)),
  set: (token: string) =>
    isWeb
      ? Promise.resolve(localStorage.setItem(KEY, token))
      : SecureStore.setItemAsync(KEY, token),
  clear: () =>
    isWeb ? Promise.resolve(localStorage.removeItem(KEY)) : SecureStore.deleteItemAsync(KEY),
};
