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

interface ProfileEditorProps {
  onClose: () => void;
}

const studyPreferenceOptions = ['Group Study', 'Individual Study', 'Library', 'Coffee Shop', 'Outdoors', 'Other'];
const interestOptions = ['Sports', 'Music', 'Art', 'Technology', 'Science', 'Literature', 'Other'];

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [isCommuter, setIsCommuter] = useState(false);
  const [studyPreferences, setStudyPreferences] = useState<string[]>([]);
  const [otherStudyPreference, setOtherStudyPreference] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState('');
  
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
            setInterests(profileData.interests || []);
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
          otherStudyPreference,
          interests,
          otherInterest,
          major,
          clubs,
          socialMediaLinks
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >

        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.UCONN_WHITE} />
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

          {/* study preferences */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Study Preferences</Text>
            <View style={styles.optionsContainer}>
              {studyPreferenceOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    studyPreferences.includes(option) && styles.selectedOptionButton
                  ]}
                  onPress={() => toggleOption(option, studyPreferences, setStudyPreferences)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    studyPreferences.includes(option) && styles.selectedOptionButtonText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {studyPreferences.includes('Other') && (
              <TextInput
                style={[styles.input, styles.customInput]}
                value={otherStudyPreference}
                onChangeText={setOtherStudyPreference}
                placeholder="Enter study preference"
                placeholderTextColor={COLORS.UCONN_GREY}
              />
            )}
          </View>

          {/* interests */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Interests</Text>
            <View style={styles.optionsContainer}>
              {interestOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    interests.includes(option) && styles.selectedOptionButton
                  ]}
                  onPress={() => toggleOption(option, interests, setInterests)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    interests.includes(option) && styles.selectedOptionButtonText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {interests.includes('Other') && (
              <TextInput
                style={[styles.input, styles.customInput]}
                value={otherInterest}
                onChangeText={setOtherInterest}
                placeholder="Enter interest"
                placeholderTextColor={COLORS.UCONN_GREY}
              />
            )}
          </View>

          {/* major */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Major</Text>
            <DropDownPicker
              open={open}
              value={major}
              items={majors}
              setOpen={setOpen}
              setValue={setMajor}
              setItems={setMajors}
              placeholder="Select your major..."
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyles}
              listMode="SCROLLVIEW"
            />
          </View>

          {/* club */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Clubs</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentClub}
                onChangeText={setCurrentClub}
                placeholder="Enter a club"
                placeholderTextColor={COLORS.UCONN_GREY}
                onSubmitEditing={addClub}
              />

              <TouchableOpacity style={styles.addButton} onPress={addClub}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {clubs.map((club) => (
                <View key={club} style={styles.tag}>
                  <Text style={styles.tagText}>{club}</Text>
                  <TouchableOpacity onPress={() => removeClub(club)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.UCONN_WHITE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* social media links */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Social Media Links</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentLink}
                onChangeText={setCurrentLink}
                placeholder="Enter a social media link"
                placeholderTextColor={COLORS.UCONN_GREY}
                onSubmitEditing={addLink}
              />

              <TouchableOpacity style={styles.addButton} onPress={addLink}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {socialMediaLinks.map((link) => (
                <View key={link} style={styles.tag}>
                  <Text style={styles.tagText}>{link}</Text>
                  <TouchableOpacity onPress={() => removeLink(link)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.UCONN_WHITE} />
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
    backgroundColor: COLORS.UCONN_NAVY,
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
    backgroundColor: COLORS.UCONN_NAVY,
  },
  optionButtonText: {
    color: COLORS.UCONN_NAVY,
  },
  selectedOptionButtonText: {
    color: COLORS.UCONN_WHITE,
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