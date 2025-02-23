import React, { useState } from 'react';
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

const studentProfiles = [
  { id: '1', name: 'Alice', image: 'https://i.pravatar.cc/150?img=1', classes: ['Math', 'Physics', 'Chemistry'] },
  { id: '2', name: 'Bob', image: 'https://i.pravatar.cc/150?img=2', classes: ['Physics', 'Biology', 'English'] },
  { id: '3', name: 'Charlie', image: 'https://i.pravatar.cc/150?img=3', classes: ['Math', 'Computer Science', 'English'] }
];

const USER_ID = '1';

export default function MatchingClasses({ onBack }) {
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const findMatches = () => {
    const filteredMatches = studentProfiles.filter(student => 
      student.id !== USER_ID && 
      student.classes.some(cls => studentProfiles[0].classes.includes(cls))
    );
    setMatchedStudents(filteredMatches);
  };

  const sendFriendRequest = (studentId) => {
    if (!outgoingRequests.includes(studentId) && !friends.includes(studentId)) {
      setOutgoingRequests([...outgoingRequests, studentId]);
    }
  };

  const cancelFriendRequest = (studentId) => {
    setOutgoingRequests(outgoingRequests.filter(id => id !== studentId));
  };

  const acceptFriendRequest = (studentId) => {
    setFriends([...friends, studentId]);
    setFriendRequests(friendRequests.filter(id => id !== studentId));
  };

  const rejectFriendRequest = (studentId) => {
    setFriendRequests(friendRequests.filter(id => id !== studentId));
  };

  const removeFriend = (studentId) => {
    setFriends(friends.filter(id => id !== studentId));
  };

  const renderStudentCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.avatar} />
      <Text style={styles.profileName}>{item.name}</Text>
      {friends.includes(item.id) ? (
        <TouchableOpacity style={styles.removeButton} onPress={() => removeFriend(item.id)}>
          <Text style={styles.buttonText}>Remove Friend</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.requestButton, outgoingRequests.includes(item.id) && styles.cancelButton]} 
          onPress={() => outgoingRequests.includes(item.id) ? cancelFriendRequest(item.id) : sendFriendRequest(item.id)}
        >
          <Text style={styles.buttonText}>{outgoingRequests.includes(item.id) ? 'Cancel Request' : 'Send Request'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Match By Classes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="people" size={24} color={'#fff'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={'#002654'} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton} onPress={findMatches}>
        <Text style={styles.filterButtonText}>Find Matches by Classes</Text>
      </TouchableOpacity>

      <FlatList
        data={matchedStudents}
        renderItem={renderStudentCard}
        keyExtractor={item => item.id}
      />
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
