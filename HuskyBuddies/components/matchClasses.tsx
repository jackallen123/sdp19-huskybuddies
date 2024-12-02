import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors'; 

// Mock data for student profiles
const studentProfiles = [
  { id: '1', name: 'Alice', image: 'https://i.pravatar.cc/150?img=1', classes: ['Math', 'Physics', 'Chemistry'], interests: ['Reading', 'Chess'], location: 'Storrs' },
  { id: '2', name: 'Bob', image: 'https://i.pravatar.cc/150?img=2', classes: ['Physics', 'Biology', 'English'], interests: ['Sports', 'Music'], location: 'Storrs' },
  { id: '3', name: 'Charlie', image: 'https://i.pravatar.cc/150?img=3', classes: ['Math', 'Computer Science', 'English'], interests: ['Gaming', 'Coding'], location: 'Storrs' },
  { id: '4', name: 'Diana', image: 'https://i.pravatar.cc/150?img=4', classes: ['Chemistry', 'Biology', 'Physics'], interests: ['Art', 'Cooking'], location: 'Hartford' },
  { id: '5', name: 'Eva', image: 'https://i.pravatar.cc/150?img=5', classes: ['Literature', 'History', 'Art'], interests: ['Reading', 'Painting'], location: 'Hartford' },
];

const USER_ID = '1'; // Current user ID

export default function MatchingClasses ({onBack}:{onBack:() => void}) {
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [buddyList, setBuddyList] = useState([]);

  const findMatches = () => {
    const filteredMatches = studentProfiles.filter(student => 
      student.id !== USER_ID &&  // Exclude the student with the current user id '1'
      student.classes.some(cls => studentProfiles[0].classes.includes(cls))
    );
    setMatchedStudents(filteredMatches);
  };

  // Adds a student from the list of matches to the user's buddy list.
  const addBuddy = (studentId) => {
    const studentToAdd = studentProfiles.find(s => s.id === studentId);
    if (!buddyList.some(buddy => buddy.id === studentId)) {
      setBuddyList([...buddyList, studentToAdd]);
    }
  };

  const toggleBuddy = (studentId) => {
    const isAlreadyBuddy = buddyList.some(buddy => buddy.id === studentId);
    if (isAlreadyBuddy) {
      setBuddyList(buddyList.filter(buddy => buddy.id !== studentId));
    } else {
      const studentToAdd = studentProfiles.find(s => s.id === studentId);
      setBuddyList([...buddyList, studentToAdd]);
    }
  };

  const renderStudentCard = ({ item }) => {
    const isMatched = buddyList.some(buddy => buddy.id === item.id);
    return (
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: item.image }} style={styles.avatar} />
          <Text style={styles.profileName}>{item.name}</Text>
        </View>
        <Text style={styles.infoText}>Classes: {item.classes.join(', ')}</Text>
        <TouchableOpacity 
          style={[styles.matchButton, isMatched && styles.matchedButton]} 
          onPress={() => toggleBuddy(item.id)}
        >
          <Text style={styles.matchButtonText}>
            {isMatched ? 'Unmatch' : 'Match'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
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

      <View style={styles.filterButtonsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={findMatches}
        >
          <Text style={styles.filterButtonText}>Find Matches by Classes</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Your Matches</Text>
    </View>
  );

  const renderFooter = () => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Match By Classes</Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={'#002654'} />
      </TouchableOpacity>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={matchedStudents}
        renderItem={renderStudentCard}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.matchesText}>No matches found. Try finding matches!</Text>}
        ListFooterComponent={renderFooter}
      />
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
      justifyContent: 'center',
      alignItems: 'center',
  },
  headerText: {
      color: COLORS.UCONN_WHITE,
      fontSize: 20,
      fontWeight: 'bold',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterButtonsContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 12,
    borderRadius: 8,
  },
  filterButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
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
  infoText: {
    marginBottom: 4,
  },
  matchButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  matchedButton: {
    backgroundColor: '#FF6347',
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buddyListSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  backButton: {
    padding: 8,
    marginTop: 16,
  },
  matchesText: {
    marginLeft: 32,
    flex: 1,
  },
});