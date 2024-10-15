import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Image, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions} from 'react-native';
import { COLORS } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileEditorProps {
  onClose: () => void;
}

{/* needed for keyboard - it was covering text boxes while typing */}
const { height } = Dimensions.get('window');

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [isCommuter, setIsCommuter] = useState(false);
  const [studyPreferences, setStudyPreferences] = useState('');
  const [interests, setInterests] = useState('');
  const [major, setMajor] = useState('');
  const [clubs, setClubs] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  {/* pick profle picture */}
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };


  {/* save edits to profile */}
  const handleSave = () => {
    onClose();
  };

  {/* needed for keyboard - it was covering text boxes while typing */}
  const handleFocus = (y: number) => {
    scrollViewRef.current?.scrollTo({ y: y, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* needed for keyboard - it was covering text boxes while typing */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >

        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.UCONN_NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >

          {/* profle picture */}
          <TouchableOpacity style={styles.profilePictureContainer} onPress={handlePickImage}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Ionicons name="camera" size={40} color={COLORS.UCONN_NAVY} />
              </View>
            )}
          </TouchableOpacity>

          {/* name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.UCONN_GREY}
              onFocus={() => handleFocus(0)}
            />
          </View>

          {/* commuter switch */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Commuter</Text>
            <Switch
              value={isCommuter}
              onValueChange={setIsCommuter}
              trackColor={{ false: COLORS.UCONN_WHITE, true: COLORS.UCONN_NAVY }}
              thumbColor={isCommuter ? COLORS.UCONN_WHITE : COLORS.UCONN_NAVY}
            />
          </View>

          {/* this was on the web thing - not sure how we want this (drop down?) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Study Preferences</Text>
            <TextInput
              style={styles.input}
              value={studyPreferences}
              onChangeText={setStudyPreferences}
              placeholder="Enter your study preferences"
              placeholderTextColor={COLORS.UCONN_GREY}
              multiline
              onFocus={() => handleFocus(height * 0.2)}
            />
          </View>

          {/* interests */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Interests</Text>
            <TextInput
              style={styles.input}
              value={interests}
              onChangeText={setInterests}
              placeholder="Enter your interests"
              placeholderTextColor={COLORS.UCONN_GREY}
              multiline
              onFocus={() => handleFocus(height * 0.3)}
            />
          </View>

          {/* major */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              value={major}
              onChangeText={setMajor}
              placeholder="Enter your major"
              placeholderTextColor={COLORS.UCONN_GREY}
              onFocus={() => handleFocus(height * 0.4)}
            />
          </View>

          {/* club */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Clubs</Text>
            <TextInput
              style={styles.input}
              value={clubs}
              onChangeText={setClubs}
              placeholder="Enter your clubs"
              placeholderTextColor={COLORS.UCONN_GREY}
              multiline
              onFocus={() => handleFocus(height * 0.5)}
            />
          </View>

          {/* social media links - again not sure how we want this to look */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Links</Text>
            <TextInput
              style={styles.input}
              value={socialMedia}
              onChangeText={setSocialMedia}
              placeholder="Enter your social media links"
              placeholderTextColor={COLORS.UCONN_GREY}
              multiline
              onFocus={() => handleFocus(height * 0.6)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.UCONN_GREY,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
  },
  saveButton: {
    color: COLORS.UCONN_NAVY,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.UCONN_GREY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.UCONN_GREY,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: 'black',
  },
});

export default ProfileEditor;