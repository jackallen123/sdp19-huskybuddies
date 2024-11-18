import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, Alert} from 'react-native';
import { COLORS } from '../../../constants/Colors';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import Schedule from '@/components/schedule';
import ProfileEditor from '@/components/ProfileEditor';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [textSize, setTextSize] = useState(16);
  const [showSchedule, setShowSchedule] = React.useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const router = useRouter();
  
  const handleManageCourses = () => {
    // navigate to schedule page
    setShowSchedule(true);
  }

  const handleEditProfile = () => {
    setShowProfileEditor(true);
  }

  const handleSignOut = () => {
    // sign out logic
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            // delete account logic
            Alert.alert(
              "Account Deleted",
              "Your account has been successfully deleted.",
              [
                {
                  text: "OK",
                  onPress: () => router.replace('/')
                }
              ]
            );
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={[styles.settingText, { fontSize: textSize }]}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.UCONN_NAVY} />
            </TouchableOpacity>

            {/* Manage Courses */}
            <TouchableOpacity style={styles.settingItem} onPress={handleManageCourses}>
              <Text style={[styles.settingText, { fontSize: textSize }]}>Manage Courses</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.UCONN_NAVY} />
            </TouchableOpacity>

            {/* enable notifications */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: textSize }]}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.UCONN_WHITE, true: COLORS.UCONN_NAVY }}
                thumbColor={notificationsEnabled ? COLORS.UCONN_WHITE : COLORS.UCONN_NAVY}
              />
            </View>

            {/* enable dark mode */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: textSize }]}>Dark Mode</Text>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: COLORS.UCONN_WHITE, true: COLORS.UCONN_NAVY }}
                thumbColor={darkModeEnabled ? COLORS.UCONN_WHITE : COLORS.UCONN_NAVY}
              />
            </View>

            {/* change font size */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, { fontSize: textSize }]}>Text Size</Text>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { fontSize: textSize }]}>A</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={textSize}
                  onValueChange={setTextSize}
                  minimumTrackTintColor={COLORS.UCONN_NAVY}
                  maximumTrackTintColor={COLORS.UCONN_GREY}
                  thumbTintColor={COLORS.UCONN_NAVY}
                />
                <Text style={[styles.sliderLabel, { fontSize: textSize * 1.5 }]}>A</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
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