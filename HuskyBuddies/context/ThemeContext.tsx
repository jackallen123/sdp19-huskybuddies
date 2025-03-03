// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MD3Theme, PaperProvider } from 'react-native-paper';
import { auth } from '@/backend/firebase/firebaseConfig';
import { getUserSettings, updateUserSettings } from '@/backend/firebase/firestoreService';
import { UserSettings } from '@/backend/data/mockDatabase';
import { darkTheme, lightTheme } from '@/themes/theme';
import { onAuthStateChanged } from 'firebase/auth';

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;

  notificationsEnabled: boolean;
  toggleNotifications: () => void;

  textSize: number;
  setTextSize: (size: number) => void;

  theme: MD3Theme;
}

// default
const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  notificationsEnabled: false,
  toggleNotifications: () => {},
  textSize: 16,
  setTextSize: () => {},
  theme: lightTheme,
});

// hook creation 
export const useThemeSettings = () => useContext(ThemeContext);

// wrap app
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [textSize, setTextSizeValue] = useState(16);

  // auth before showing UI
  const [initializing, setInitializing] = useState(true);

  // load from database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // load users settings
      if (user) {
        try {
          const settings = (await getUserSettings(user.uid)) as UserSettings;

          if (settings) {
            setDarkMode(settings.darkModeEnabled);
            setNotificationsEnabled(settings.notificationsEnabled);
            setTextSizeValue(settings.textSize);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
      setInitializing(false);
    });

    // clean up
    return () => unsubscribe();
  }, []);

  // save changed values to database
  useEffect(() => {
    const saveSettings = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await updateUserSettings(user.uid, {
            darkModeEnabled: darkMode,
            notificationsEnabled,
            textSize,
          });
        } catch (error) {
          console.error('Error updating settings:', error);
        }
      }
    };

    // only save after we're done initializing (so we don't overwrite defaults)
    if (!initializing) {
      saveSettings();
    }

  }, [darkMode, notificationsEnabled, textSize, initializing]);

  // toggle
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);
  const setTextSize = (size: number) => setTextSizeValue(size);

  // set theme
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <ThemeContext.Provider
        value={{
          darkMode,
          toggleDarkMode,
          notificationsEnabled,
          toggleNotifications,
          textSize,
          setTextSize,
          theme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </PaperProvider>
  );
};
