import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Image, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions} from 'react-native';
import { COLORS } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import uconnMajors from '../backend/data/uconn-majors.json';
import { getUserProfile, updateUserProfile, updateProfilePicture } from '@/backend/firebase/firestoreService';
import { auth } from '@/backend/firebase/firebaseConfig';
import { UserProfile } from '@/backend/data/mockDatabase';

import { useTheme } from 'react-native-paper';

interface ProfileEditorProps {
  onClose: () => void;
}

const studyPreferenceOptions = ['Group Study', 'Individual Study', 'Library', 'Coffee Shop', 'Outdoors'];
const interestOptions = ['Sports', 'Music', 'Art', 'Technology', 'Science', 'Literature'];

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [isCommuter, setIsCommuter] = useState(false);
  
  const [studyPreferences, setStudyPreferences] = useState<string[]>([]);
  const [additionalStudyPreferences, setAdditionalStudyPreferences] = useState<string[]>([]);
  const [currentStudyPreference, setCurrentStudyPreference] = useState('');
  
  const [interests, setInterests] = useState<string[]>([]);
  const [additionalInterests, setAdditionalInterests] = useState<string[]>([]);
  const [currentAdditionalInterest, setCurrentAdditionalInterest] = useState('');

  // for opening or closing the dropdown
  const [open, setOpen] = useState(false);
  const [major, setMajor] = useState<string | null>(null);
  const [majors, setMajors] = useState(
    uconnMajors.map((majorItem) => ({ label: majorItem, value: majorItem }))
  );
  const [clubs, setClubs] = useState<string[]>([]);
  const [currentClub, setCurrentClub] = useState('');
  const [socialMediaLinks, setSocialMediaLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  
  const theme = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);

  // fetch profile from Firestore on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const profileData = (await getUserProfile(user.uid)) as UserProfile;
          if (profileData) {
            setName(profileData.name || '');
            setIsCommuter(profileData.isCommuter || false);
            setProfilePicture(profileData.profilePicture || null);
            setStudyPreferences(profileData.studyPreferences || []);
            setAdditionalStudyPreferences(profileData.additionalStudyPreferences || []);
            setInterests(profileData.interests || []);
            setAdditionalInterests(profileData.additionalInterests || []);
            setMajor(profileData.major || null);
            setClubs(profileData.clubs || []);
            setSocialMediaLinks(profileData.socialMediaLinks || []);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    fetchProfile();
  }, []);

  // image picker handler
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setProfilePicture(selectedUri);
      const user = auth.currentUser;
      if (user) {
        try {
          await updateProfilePicture(user.uid, selectedUri);
        } catch (error) {
          console.error('Error updating profile picture:', error);
        }
      }
    }
  };

  // save profile to Firestore
  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const profileData = {
          name,
          isCommuter,
          profilePicture,
          studyPreferences,
          additionalStudyPreferences,
          interests,
          additionalInterests,
          major,
          clubs,
          socialMediaLinks,
        };
        await updateUserProfile(user.uid, profileData);
        onClose();
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  {/* needed for keyboard - it was covering text boxes while typing */}
  const handleFocus = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };

  {/* pick options for study preferences and interests */}
  const toggleOption = (
    option: string,
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (array.includes(option)) {
      setArray(array.filter(item => item !== option));
    } else {
      setArray([...array, option]);
    }
  };

  {/* add club */}
  const addClub = () => {
    if (currentClub.trim() !== '' && !clubs.includes(currentClub.trim())) {
      setClubs([...clubs, currentClub.trim()]);
      setCurrentClub('');
    }
  };
  const removeClub = (club: string) => {
    setClubs(clubs.filter(c => c !== club));
  };

  {/* add social media links */}
  const addLink = () => {
    if (currentLink.trim() !== '' && !socialMediaLinks.includes(currentLink.trim())) {
      setSocialMediaLinks([...socialMediaLinks, currentLink.trim()]);
      setCurrentLink('');
    }
  };
  const removeLink = (link: string) => {
    setSocialMediaLinks(socialMediaLinks.filter(l => l !== link));
  };

  {/* add other interests */}
  const addAdditionalInterest = () => {
    if (currentAdditionalInterest.trim() !== '' && !additionalInterests.includes(currentAdditionalInterest.trim())) {
      setAdditionalInterests([...additionalInterests, currentAdditionalInterest.trim()]);
      setCurrentAdditionalInterest('');
    }
  };

  const removeAdditionalInterest = (interest: string) => {
    setAdditionalInterests(additionalInterests.filter(i => i !== interest));
  };

  {/* add other study preferences */}
  const addAdditionalStudyPreference = () => {
    if (currentStudyPreference.trim() !== '' && !additionalStudyPreferences.includes(currentStudyPreference.trim())) {
      setAdditionalStudyPreferences([...additionalStudyPreferences, currentStudyPreference.trim()]);
      setCurrentStudyPreference('');
    }
  };
  const removeAdditionalStudyPreference = (pref: string) => {
    setAdditionalStudyPreferences(additionalStudyPreferences.filter(p => p !== pref));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >

        {/* header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.onPrimary}/>
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveButton, { color: theme.colors.onPrimary }]}>Save</Text>
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
                <Ionicons name="camera" size={40} color={theme.colors.onBackground} />
              </View>
            )}
          </TouchableOpacity>

          {/* name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.onBackground, borderColor: theme.colors.outline }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.UCONN_GREY}
              onFocus={() => handleFocus(0)}
            />
          </View>

          {/* commuter switch */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Commuter</Text>
            <Switch
              value={isCommuter}
              onValueChange={setIsCommuter}
              trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
              thumbColor={isCommuter ? theme.colors.onPrimary : theme.colors.outline}
            />
          </View>

          {/* study preferences */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Study Preferences</Text>
            <View style={styles.optionsContainer}>
              {studyPreferenceOptions.map((option) => (
                <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: studyPreferences.includes(option)
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: studyPreferences.includes(option)
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
                  onPress={() => toggleOption(option, studyPreferences, setStudyPreferences)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      {
                        color: studyPreferences.includes(option) ? theme.colors.onPrimary : theme.colors.onBackground,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        {/* additional study preferences */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onBackground }]}>Other Study Preferences</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.tagInput, { borderColor: theme.colors.outline, color: theme.colors.onBackground }]}
              value={currentStudyPreference}
              onChangeText={setCurrentStudyPreference}
              placeholder="Enter other study preference"
              placeholderTextColor={COLORS.UCONN_GREY}
              onSubmitEditing={addAdditionalStudyPreference}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addAdditionalStudyPreference}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {additionalStudyPreferences.map((pref) => (
              <View key={pref} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.tagText, { color: theme.colors.onPrimary }]}>{pref}</Text>
                <TouchableOpacity onPress={() => removeAdditionalStudyPreference(pref)}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

          {/* interests */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Interests</Text>
            <View style={styles.optionsContainer}>
              {interestOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                  styles.optionButton,
                  {
                    backgroundColor: interests.includes(option)
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: interests.includes(option)
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
                  onPress={() => toggleOption(option, interests, setInterests)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      {
                        color: interests.includes(option) ? theme.colors.onPrimary : theme.colors.onBackground,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* additional interests */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onBackground }]}>Other Interests</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.tagInput, { borderColor: theme.colors.outline, color: theme.colors.onBackground }]}
              value={currentAdditionalInterest}
              onChangeText={setCurrentAdditionalInterest}
              placeholder="Enter other interests"
              placeholderTextColor={COLORS.UCONN_GREY}
              onSubmitEditing={addAdditionalInterest}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addAdditionalInterest}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {additionalInterests.map((interest) => (
              <View key={interest} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.tagText, { color: theme.colors.onPrimary }]}>{interest}</Text>
                <TouchableOpacity onPress={() => removeAdditionalInterest(interest)}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

          {/* major */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Major</Text>
            <DropDownPicker
              open={open}
              value={major}
              items={majors}
              setOpen={setOpen}
              setValue={setMajor}
              setItems={setMajors}
              placeholder="Select your major..."
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.onSecondaryContainer,
                  borderColor: theme.colors.outline,
                },
              ]}
              dropDownContainerStyle={[
                styles.dropdownContainer,
                {
                  backgroundColor: theme.colors.onSecondaryContainer,
                  borderColor: theme.colors.outline,
                },
              ]}
              placeholderStyle={[
                styles.placeholderStyles,
                {
                  color: theme.colors.onBackground,
                },
              ]}
              textStyle={{
                  color: theme.colors.onSurface,
                }}
              listItemLabelStyle={{
                  color: theme.colors.onSurface,
                }}
              listMode="SCROLLVIEW"
            />
          </View>

          {/* club */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Clubs</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.tagInput, { borderColor: theme.colors.outline, color: theme.colors.onBackground }]}
                value={currentClub}
                onChangeText={setCurrentClub}
                placeholder="Enter a club"
                placeholderTextColor={COLORS.UCONN_GREY}
                onSubmitEditing={addClub}
              />

              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addClub}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {clubs.map((club) => (
                <View key={club} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.tagText, { color: theme.colors.onPrimary }]}>{club}</Text>
                  <TouchableOpacity onPress={() => removeClub(club)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.UCONN_WHITE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* social media links */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Social Media Links</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.tagInput, { borderColor: theme.colors.outline, color: theme.colors.onBackground }]}
                value={currentLink}
                onChangeText={setCurrentLink}
                placeholder="Enter a social media link"
                placeholderTextColor={COLORS.UCONN_GREY}
                onSubmitEditing={addLink}
              />

              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addLink}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {socialMediaLinks.map((link) => (
                <View key={link} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.tagText, { color: theme.colors.onPrimary }]}>{link}</Text>
                  <TouchableOpacity onPress={() => removeLink(link)}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
  },
  saveButton: {
    color: COLORS.UCONN_WHITE,
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
  customInput: {
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderColor: COLORS.UCONN_NAVY,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedOptionButton: {
  },
  optionButtonText: {
  },
  selectedOptionButtonText: {
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.UCONN_GREY,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: 'black',
  },
  addButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: COLORS.UCONN_WHITE,
    marginRight: 4,
  },
  dropdown: {
    borderColor: COLORS.UCONN_GREY,
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: COLORS.UCONN_GREY,
    borderRadius: 8,
  },
  placeholderStyles: {
    color: COLORS.UCONN_GREY,
  },  
});

export default ProfileEditor;