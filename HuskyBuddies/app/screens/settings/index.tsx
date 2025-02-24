import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, Alert} from 'react-native';
import { COLORS } from '../../../constants/Colors';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import Schedule from '@/components/schedule';
import ProfileEditor from '@/components/ProfileEditor';
import { Ionicons } from '@expo/vector-icons';
import { signOutUser, deleteUserAccount } from '@/backend/firebase/authService';
import { auth } from '@/backend/firebase/firebaseConfig';
import { getUserSettings, updateUserSettings } from '@/backend/firebase/firestoreService';
import { UserSettings } from '../../../backend/data/mockDatabase'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: false,
    darkModeEnabled: false,
    textSize: 16,
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const router = useRouter();

  // fetch user settings
  useEffect(() => {
    const fetchSettings = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userSettings = await getUserSettings(user.uid);
          
          if (userSettings) {
            // update local state
            setSettings(userSettings as UserSettings);
          }

        } catch (error) {
          console.error("Error fetching user settings:", error);
          Alert.alert("Error", "Failed to load settings. Please try again.");
        }
      }
    };
    fetchSettings();
  }, []);
  
  const handleSettingChange = async (setting: keyof UserSettings, value: boolean | number) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // update local state
        const updatedSettings = { ...settings, [setting]: value };
        // update settings in database - only changed ones for better complexity
        await updateUserSettings(user.uid, { [setting]: value });
        setSettings(updatedSettings);
      } catch (error) {
        console.error("Error updating user settings:", error);
        Alert.alert("Error", "Failed to update settings. Please try again.");
      }
    }
  };
  
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
    <View style={styles.container}>
      {showSchedule ? (
        <Schedule onBack={() => setShowSchedule(false)} /> // Conditional rendering for schedule page
      ) : (
        <>
          {/* headers */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerText}>Settings</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView}>

            {/* edit profile */}
            <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
              <Text style={[styles.settingText, { fontSize: settings.textSize }]}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.UCONN_NAVY} />
            </TouchableOpacity>

            {/* Manage Courses */}
            <TouchableOpacity style={styles.settingItem} onPress={handleManageCourses}>
              <Text style={[styles.settingText, { fontSize: settings.textSize }]}>Manage Courses</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.UCONN_NAVY} />
            </TouchableOpacity>

            {/* enable notifications */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: settings.textSize }]}>Enable Notifications</Text>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
                trackColor={{ false: COLORS.UCONN_WHITE, true: COLORS.UCONN_NAVY }}
                thumbColor={settings.notificationsEnabled ? COLORS.UCONN_WHITE : COLORS.UCONN_NAVY}
              />
            </View>

            {/* enable dark mode */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: settings.textSize }]}>Dark Mode</Text>
              <Switch
                value={settings.darkModeEnabled}
                onValueChange={(value) => handleSettingChange('darkModeEnabled', value)}
                trackColor={{ false: COLORS.UCONN_WHITE, true: COLORS.UCONN_NAVY }}
                thumbColor={settings.darkModeEnabled ? COLORS.UCONN_WHITE : COLORS.UCONN_NAVY}
              />
            </View>

            {/* change font size */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: settings.textSize }]}>Text Size</Text>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { fontSize: settings.textSize }]}>A</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={settings.textSize}
                  onValueChange={(value) => handleSettingChange('textSize', value)}
                  minimumTrackTintColor={COLORS.UCONN_NAVY}
                  maximumTrackTintColor={COLORS.UCONN_GREY}
                  thumbTintColor={COLORS.UCONN_NAVY}
                />
                <Text style={[styles.sliderLabel, { fontSize: settings.textSize * 1.5 }]}>A</Text>
              </View>
            </View>

            {/* sign out */}
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>

            {/* delete account */}
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
              <Text style={styles.buttonText}>Delete Account</Text>
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
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
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
    color: COLORS.UCONN_WHITE,
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
    color: COLORS.UCONN_NAVY,
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
    color: COLORS.UCONN_NAVY,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
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