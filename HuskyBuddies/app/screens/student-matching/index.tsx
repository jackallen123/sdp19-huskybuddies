import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

// Mock data for student profiles
const studentProfiles = [
  { id: '1', name: 'Alice', image: 'https://i.pravatar.cc/150?img=1', classes: ['Math', 'Physics', 'Chemistry'] },
  { id: '2', name: 'Bob', image: 'https://i.pravatar.cc/150?img=2', classes: ['Physics', 'Biology', 'English'] },
  { id: '3', name: 'Charlie', image: 'https://i.pravatar.cc/150?img=3', classes: ['Math', 'Computer Science', 'English'] },
  { id: '4', name: 'Dan', image: 'https://i.pravatar.cc/150?img=4', classes: ['Chemistry', 'Biology', 'Physics'] },
];

export default function MatchingPage() {
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [buddyList, setBuddyList] = useState([]);

  const findMatches = () => {
    // Matches based on shared classes
    // TODO: Add selectable filters based on classes, interests, location
    const matches = studentProfiles.filter(student => 
      student.classes.some(cls => studentProfiles[0].classes.includes(cls))
    );
    setMatchedStudents(matches);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Student Matching Page</Text>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionHeader}>Your Profile</Text>
        <View style={styles.profileInfo}>
          <Image source={{ uri: studentProfiles[0].image }} style={styles.avatar} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{studentProfiles[0].name}</Text>
            <Text>Classes: {studentProfiles[0].classes.join(', ')}</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

// Style sheet for the student matching page screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 16,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  findMatchesButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  findMatchesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchesSection: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  classesText: {
    marginBottom: 8,
  },
});
