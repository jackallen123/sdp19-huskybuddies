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

  // Adds a student from the list of matches to the user's buddy list.
  const addBuddy = (studentId) => {
    const studentToAdd = studentProfiles.find(s => s.id === studentId);
    if (!buddyList.some(buddy => buddy.id === studentId)) {
      setBuddyList([...buddyList, studentToAdd]);
    }
  };

  const renderStudentCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <Text style={styles.profileName}>{item.name}</Text>
      </View>
      <Text style={styles.classesText}>Shared Classes: {item.classes.filter(cls => studentProfiles[0].classes.includes(cls)).join(', ')}</Text>
      <TouchableOpacity 
        style={styles.matchButton} 
        onPress={() => addBuddy(item.id)}
        disabled={buddyList.some(buddy => buddy.id === item.id)}
      >
        <Text style={styles.matchButtonText}>
          {buddyList.some(buddy => buddy.id === item.id) ? 'Matched' : 'Match'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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

      <TouchableOpacity style={styles.matchButton} onPress={findMatches}>
        <Text style={styles.matchButtonText}>Find Matches</Text>
      </TouchableOpacity>

      <View style={styles.matchesSection}>
        <Text style={styles.sectionHeader}>Your Matches</Text>
        <FlatList
          data={matchedStudents}
          renderItem={renderStudentCard}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text>No matches found. Try finding matches!</Text>}
        />
      </View>

      <View style={styles.buddyListSection}>
        <Text style={styles.sectionHeader}>Your Buddy List</Text>
        {buddyList.length > 0 ? (
          buddyList.map((buddy) => (
            <View key={buddy.id} style={styles.buddyItem}>
              <Image source={{ uri: buddy.image }} style={styles.smallAvatar} />
              <Text style={styles.buddyName}>{buddy.name}</Text>
            </View>
          ))
        ) : (
          <Text>You haven't matched with anyone yet.</Text>
        )}
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
  matchButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buddyListSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  buddyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  buddyName: {
    fontSize: 14,
  },
});
