import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors';
import { 
  getAllUsers, 
  sendFriendRequest, 
  cancelFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend 
} from '../backend/firebase/firestoreService';
import { auth } from '../backend/firebase/firebaseConfig';

export default function MatchingClasses({ onBack }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user);
        const users = await getAllUsers();
        const filteredMatches = users.filter(student => 
          student.id !== user.uid && 
          student.classes && student.classes.some(cls => user.classes && user.classes.includes(cls))
        );
        setMatchedStudents(filteredMatches);
      }
    };
    fetchUserData();
  }, []);

  const handleSendRequest = async (studentId) => {
    if (!outgoingRequests.includes(studentId) && !friends.includes(studentId)) {
      await sendFriendRequest(currentUser.uid, studentId);
      setOutgoingRequests([...outgoingRequests, studentId]);
    }
  };

  const handleCancelRequest = async (studentId) => {
    await cancelFriendRequest(currentUser.uid, studentId);
    setOutgoingRequests(outgoingRequests.filter(id => id !== studentId));
  };

  const handleAcceptRequest = async (studentId) => {
    await acceptFriendRequest(currentUser.uid, studentId);
    setFriends([...friends, studentId]);
    setFriendRequests(friendRequests.filter(id => id !== studentId));
  };

  const handleRejectRequest = async (studentId) => {
    await rejectFriendRequest(currentUser.uid, studentId);
    setFriendRequests(friendRequests.filter(id => id !== studentId));
  };

  const handleRemoveFriend = async (studentId) => {
    await removeFriend(currentUser.uid, studentId);
    setFriends(friends.filter(id => id !== studentId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={'#fff'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Match By Classes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="people" size={24} color={'#fff'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.filterButton} onPress={() => setMatchedStudents(matchedStudents)}>
        <Text style={styles.filterButtonText}>Find Matches by Classes</Text>
      </TouchableOpacity>

      <FlatList
        data={matchedStudents}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.avatar} />
            <Text style={styles.profileName}>{item.name}</Text>
            <TouchableOpacity 
              style={styles.requestButton} 
              onPress={() => handleSendRequest(item.id)}
            >
              <Text style={styles.buttonText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.id}
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <Text style={styles.sectionHeader}>Friend Requests</Text>
          {friendRequests.map(id => (
            <View key={id} style={styles.friendRequestItem}>
              <Text>{matchedStudents.find(s => s.id === id)?.name || 'Unknown'}</Text>
              <TouchableOpacity onPress={() => handleAcceptRequest(id)}>
                <Text>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRejectRequest(id)}>
                <Text>Reject</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.UCONN_WHITE },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.UCONN_NAVY },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { padding: 16, margin: 8, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  profileName: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  requestButton: { marginTop: 8, padding: 8, backgroundColor: '#4CAF50', borderRadius: 4 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  filterButton: { padding: 12, backgroundColor: COLORS.UCONN_NAVY, margin: 16, borderRadius: 8, alignItems: 'center' },
  filterButtonText: { color: '#fff', fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  friendRequestItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1 },
  cancelButton: { backgroundColor: '#FF6347', padding: 8, borderRadius: 4, alignItems: 'center', marginTop: 8 },
});
