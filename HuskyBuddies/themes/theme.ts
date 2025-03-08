import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { COLORS } from '@/constants/Colors';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.UCONN_NAVY,
    background: COLORS.UCONN_WHITE,
    surface: COLORS.UCONN_WHITE,
    error: '#FF3B30',
    onPrimary: COLORS.UCONN_WHITE,
    onBackground: COLORS.UCONN_NAVY,
    onSurface: COLORS.UCONN_NAVY,
    onSecondaryContainer: COLORS.UCONN_WHITE,
    onPrimaryContainer: COLORS.UCONN_NAVY
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.UCONN_DARK_HEADER,
    background: COLORS.UCONN_DARK_BACKGROUND,
    surface: COLORS.UCONN_DARK_HEADER,
    error: '#FF3B30',
    onPrimary: COLORS.UCONN_WHITE,
    onBackground: COLORS.UCONN_WHITE,
    onSurface: COLORS.UCONN_WHITE,
    onSecondaryContainer: COLORS.UCONN_GREY,
    onPrimaryContainer: COLORS.UCONN_DARK_BACKGROUND
  },
};
