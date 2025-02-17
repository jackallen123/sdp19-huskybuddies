import React, { useState, useEffect } from 'react';
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
import { getAllStudents, getStudentProfile, sendFriendRequest, acceptFriendRequest, declineFriendRequest, getFriendList } from '../backend/firebase/firestoreService.js';

const USER_ID = '1'; // Current user ID

export default function MatchingClasses ({onBack}:{onBack:() => void}) {
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendList, setFriendList] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchFriends();
  }, []);

  const fetchStudents = async () => {
    const students = await getAllStudents();
    const filteredMatches = students.filter(student => 
      student.id !== USER_ID &&
      student.classes.some(cls => students.find(s => s.id === USER_ID)?.classes.includes(cls))
    );
    setMatchedStudents(filteredMatches);
  };

  const fetchFriends = async () => {
    const friends = await getFriendList(USER_ID);
    setFriendList(friends);
  };

  const handleSendRequest = async (studentId) => {
    await sendFriendRequest(USER_ID, studentId);
    alert('Friend request sent!');
  };

  const handleAcceptRequest = async (studentId) => {
    await acceptFriendRequest(USER_ID, studentId);
    setFriendRequests(friendRequests.filter(id => id !== studentId));
    fetchFriends();
  };

  const handleDeclineRequest = async (studentId) => {
    await declineFriendRequest(USER_ID, studentId);
    setFriendRequests(friendRequests.filter(id => id !== studentId));
  };

  const renderStudentCard = ({ item }) => {
    const isFriend = friendList.includes(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: item.image }} style={styles.avatar} />
          <Text style={styles.profileName}>{item.name}</Text>
        </View>
        <Text style={styles.infoText}>Classes: {item.classes.join(', ')}</Text>
        <TouchableOpacity 
          style={[styles.matchButton, isFriend && styles.matchedButton]} 
          onPress={() => handleSendRequest(item.id)}
          disabled={isFriend}
        >
          <Text style={styles.matchButtonText}>{isFriend ? 'Friends' : 'Send Request'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.profileSection}>
        <Text style={styles.sectionHeader}>Your Profile</Text>
        <View style={styles.profileInfo}>
          <Image source={{ uri: getStudentProfile(USER_ID).image }} style={styles.avatar} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{getStudentProfile(USER_ID).name}</Text>
            <Text>Classes: {getStudentProfile(USER_ID).classes.join(', ')}</Text>
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
      {friendList.length > 0 ? (
        friendList.map((buddy) => (   //buddy should just be the id of each buddy here
          <View key={buddy} style={styles.buddyItem}>
            <Image source={{ uri: getStudentProfile(buddy).image }} style={styles.smallAvatar} />
            <Text style={styles.buddyName}>{getStudentProfile(buddy).name}</Text>
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
        //ListHeaderComponent={renderHeader}
        data={matchedStudents}
        renderItem={renderStudentCard}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.matchesText}>No matches found. Try finding matches!</Text>}
        //ListFooterComponent={renderFooter}
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
