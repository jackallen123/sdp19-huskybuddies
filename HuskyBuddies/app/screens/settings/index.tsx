import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, Alert} from 'react-native';
import { COLORS } from '../../../constants/Colors';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import Schedule from '@/components/schedule';
import ProfileEditor from '@/components/ProfileEditor';
import { Ionicons } from '@expo/vector-icons';
import { signOutUser, deleteUserAccount } from '@/backend/firebase/authService';
import { auth } from '@/backend/firebase/firebaseConfig';
import { useTheme } from 'react-native-paper';
import { useThemeSettings } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const router = useRouter();

  // destructuring from global theme context
  const { darkMode, toggleDarkMode, notificationsEnabled, toggleNotifications, textSize, setTextSize} = useThemeSettings();

  // set theme which changes based on darkMode set or not
  const theme = useTheme();
  
  const handleManageCourses = () => {
    // navigate to schedule page
    setShowSchedule(true);
  }

  const handleEditProfile = () => {
    setShowProfileEditor(true);
  }

  const handleSignOut = async () => {
    try {
      await signOutUser(); // signs out the user from Firebase
      router.replace('/'); // redirects user to login screen
    } catch (error) {
      const errorMessage = (error as Error).message;
      Alert.alert("Error signing out", errorMessage);
    }
  };

  {/* add an alert to prompt user for actually deleting account - no actual logic yet though */}
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            const user = auth.currentUser; // Get the current user
  
            if (user) {
              try {
                // Pass the user object to deleteUserAccount
                await deleteUserAccount(user);
                Alert.alert("Account deleted", "Your account has been successfully deleted.", [
                  {
                    text: "OK",
                    onPress: () => router.replace('/'),
                  },
                ]);
              } catch (error) {
                const errorMessage = (error as Error).message;
                Alert.alert("Error deleting account", errorMessage);
              }
            } else {
              Alert.alert("No user found", "You are not logged in.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };
  

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showSchedule ? (
        <Schedule onBack={() => setShowSchedule(false)} /> // Conditional rendering for schedule page
      ) : (
        <>
          {/* headers */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Settings</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView}>

            {/* edit profile */}
            <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
            <Text style={[styles.settingText, { fontSize: textSize, color: theme.colors.onBackground }]}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>

            {/* Manage Courses */}
            <TouchableOpacity style={styles.settingItem} onPress={handleManageCourses}>
            <Text style={[styles.settingText, { fontSize: textSize, color: theme.colors.onBackground }]}>Manage Courses</Text>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>

            {/* enable notifications */}
            <View style={styles.settingItem}>
            <Text style={[styles.settingText, { fontSize: textSize, color: theme.colors.onBackground }]}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: theme.colors.surface, true: theme.colors.surface }}
                thumbColor={notificationsEnabled ? theme.colors.onBackground : theme.colors.outline}
              />
            </View>

            {/* enable dark mode */}
            <View style={styles.settingItem}>
            <Text style={[styles.settingText, { fontSize: textSize, color: theme.colors.onBackground }]}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.colors.surface, true: theme.colors.surface }}
                thumbColor={darkMode ? theme.colors.onBackground : theme.colors.outline}
              />
            </View>

            {/* change font size */}
            <View style={styles.settingItem}>
            <Text style={[styles.settingText, { fontSize: textSize, color: theme.colors.onBackground }]}>Text Size</Text>
              <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { fontSize: textSize, color: theme.colors.onBackground }]}>A</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={textSize}
                  onValueChange={setTextSize}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.onSurface}
                  thumbTintColor={theme.colors.primary}
                />
                <Text style={[styles.sliderLabel, { fontSize: textSize * 1.5, color: theme.colors.onBackground }]}>A</Text>
              </View>
            </View>

            {/* sign out */}
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleSignOut}>
              <Text style={[styles.buttonText, { fontSize: textSize, color: theme.colors.onPrimary }]}>Sign Out</Text>
            </TouchableOpacity>

            {/* delete account */}
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
              <Text style={[styles.buttonText, { fontSize: textSize }]}>Delete Account</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* profile editor */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={showProfileEditor}
            onRequestClose={() => setShowProfileEditor(false)}
            >
              <ProfileEditor onClose={() => setShowProfileEditor(false)} />
            </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
},
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    // in theme
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingText: {
    // in theme
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
  },
});