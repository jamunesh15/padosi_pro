import { DefaultTheme, type Theme } from 'expo-router/react-navigation';

// Plain values for places that can't read Tailwind classes (navigation, icons, placeholders).
export const COLORS = {
  background: '#FAFAF7',
  foreground: '#101828',
  card: '#FFFFFF',
  primary: '#155C49',
  mutedForeground: '#667085',
  border: '#D0D5DD',
  destructive: '#D92D20',
};

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    background: COLORS.background,
    border: COLORS.border,
    card: COLORS.card,
    notification: COLORS.destructive,
    primary: COLORS.primary,
    text: COLORS.foreground,
  },
};
