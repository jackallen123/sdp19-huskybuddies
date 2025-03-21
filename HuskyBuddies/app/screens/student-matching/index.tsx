import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors';
import { 
  getAllUsers, 
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getUserCourses,
  sendFriendRequest, 
  cancelFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend 
} from '../../../backend/firebase/firestoreService';
import { auth } from '../../../backend/firebase/firebaseConfig';
import { ActivityIndicator } from "react-native-paper";

const IndexScreen = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserCourses, setCurrentUserCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [studentCourses, setStudentCourses] = useState({});
  const [sharedCourses, setSharedCourses] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchingEnabled, setMatchingEnabled] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          setCurrentUser(user);
          
          // Get all users
          const users = await getAllUsers();
          setAllStudents(users);
          
          // Get current user's courses
          const userCourses = await getUserCourses(user.uid);
          setCurrentUserCourses(userCourses);
          
          // Get courses for all students
          const coursesMap = {};
          const sharedCoursesMap = {};
          
          for (const student of users) {
            if (student.id !== user.uid) {
              const courses = await getUserCourses(student.id);
              coursesMap[student.id] = courses;
              
              // Find shared courses
              const shared = findSharedCourses(userCourses, courses);
              if (shared.length > 0) {
                sharedCoursesMap[student.id] = shared;
              }
            }
          }
          
          setStudentCourses(coursesMap);
          setSharedCourses(sharedCoursesMap);
          
          // Filter for matched students by default
          const filteredMatches = users.filter(student => 
            student.id !== user.uid && 
            sharedCoursesMap[student.id] && 
            sharedCoursesMap[student.id].length > 0
          );
          setMatchedStudents(filteredMatches);
          
          // Get friends list
          const friendsList = await getFriends(user.uid);
          setFriends(friendsList);
          
          // Get incoming friend requests
          const incomingRequests = await getIncomingFriendRequests(user.uid);
          setFriendRequests(incomingRequests);
          
          // Get outgoing friend requests
          const outgoing = await getOutgoingFriendRequests(user.uid);
          setOutgoingRequests(outgoing);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Find courses with matching names
  const findSharedCourses = (userCourses, otherCourses) => {
    const shared = [];
    
    for (const userCourse of userCourses) {
      for (const otherCourse of otherCourses) {
        if (userCourse.name === otherCourse.name) {
          shared.push(userCourse.name);
          break;
        }
      }
    }
    
    return shared;
  };

  const toggleMatchingFilter = () => {
    setMatchingEnabled(!matchingEnabled);
    
    if (!matchingEnabled) {
      // Filter for students with matching classes
      const filteredMatches = allStudents.filter(student => 
        student.id !== currentUser.uid && 
        sharedCourses[student.id] && 
        sharedCourses[student.id].length > 0
      );
      setMatchedStudents(filteredMatches);
    } else {
      // Show all students except current user
      const allOtherStudents = allStudents.filter(student => student.id !== currentUser.uid);
      setMatchedStudents(allOtherStudents);
    }
  };

  const handleSendRequest = async (studentId) => {
    try {
      if (!outgoingRequests.includes(studentId) && !friends.some(friend => friend === studentId)) {
        await sendFriendRequest(currentUser.uid, studentId);
        setOutgoingRequests([...outgoingRequests, studentId]);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleCancelRequest = async (studentId) => {
    try {
      await cancelFriendRequest(currentUser.uid, studentId);
      setOutgoingRequests(outgoingRequests.filter(id => id !== studentId));
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };

  const handleAcceptRequest = async (studentId) => {
    try {
      await acceptFriendRequest(currentUser.uid, studentId);
      setFriends([...friends, studentId]);
      setFriendRequests(friendRequests.filter(id => id !== studentId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = async (studentId) => {
    try {
      await rejectFriendRequest(currentUser.uid, studentId);
      setFriendRequests(friendRequests.filter(id => id !== studentId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleRemoveFriend = async (studentId) => {
    try {
      await removeFriend(currentUser.uid, studentId);
      setFriends(friends.filter(id => id !== studentId));
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const getStudentName = (id) => {
    const student = allStudents.find(s => s.id === id);
    return student ? student.name || `${student.firstName} ${student.lastName}` : 'Unknown User';
  };

  const getStudentImage = (id) => {
    const student = allStudents.find(s => s.id === id);
    return student?.profilePicture || student?.image || 'https://via.placeholder.com/50';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
        {/* <Text style={styles.loadingText}>Loading students...</Text> */}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftPlaceholder}></View>
        <Text style={styles.headerText}>Match with a Buddy</Text>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="people" size={24} color={'#fff'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.matchButton, 
          matchingEnabled ? styles.matchButtonActive : styles.matchButtonInactive
        ]} 
        onPress={toggleMatchingFilter}
      >
        <Ionicons 
          name={matchingEnabled ? "checkmark-circle" : "filter"} 
          size={20} 
          color={'#fff'} 
          style={styles.buttonIcon} 
        />
        <Text style={styles.matchButtonText}>
          {matchingEnabled ? "Matching Classes Only" : "Show All Students"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={matchedStudents}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image 
              source={{ uri: item.profilePicture || item.image || 'https://via.placeholder.com/50' }} 
              style={styles.avatar} 
            />
            <View style={styles.cardContent}>
              <Text style={styles.profileName}>{item.name || `${item.firstName || ''} ${item.lastName || ''}`}</Text>
              
              {/* Display shared courses */}
              {sharedCourses[item.id] && sharedCourses[item.id].length > 0 ? (
                <View style={styles.sharedCoursesContainer}>
                  <Text style={styles.sharedCoursesLabel}>Shared Classes:</Text>
                  {sharedCourses[item.id].map((course, index) => (
                    <View key={index} style={styles.courseTag}>
                      <Text style={styles.courseTagText}>{course}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSharedClasses}>No shared classes</Text>
              )}
            </View>
            {friends.includes(item.id) ? (
              <Text style={styles.friendLabel}>Friend</Text>
            ) : outgoingRequests.includes(item.id) ? (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => handleCancelRequest(item.id)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.requestButton} 
                onPress={() => handleSendRequest(item.id)}
              >
                <Ionicons name="person-add" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={item => item.id}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friends & Requests</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.UCONN_NAVY} />
              </TouchableOpacity>
            </View>

            {friendRequests.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Friend Requests</Text>
                {friendRequests.map(id => (
                  <View key={id} style={styles.friendRequestItem}>
                    <View style={styles.userInfo}>
                      <Image 
                        source={{ uri: getStudentImage(id) }} 
                        style={styles.smallAvatar} 
                      />
                      <View>
                        <Text style={styles.userName}>{getStudentName(id)}</Text>
                        {sharedCourses[id] && sharedCourses[id].length > 0 && (
                          <Text style={styles.sharedClassesText}>
                            {sharedCourses[id].length} shared {sharedCourses[id].length === 1 ? 'class' : 'classes'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.acceptButton} 
                        onPress={() => handleAcceptRequest(id)}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton} 
                        onPress={() => handleRejectRequest(id)}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {friends.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Friends</Text>
                {friends.map(id => (
                  <View key={id} style={styles.friendItem}>
                    <View style={styles.userInfo}>
                      <Image 
                        source={{ uri: getStudentImage(id) }} 
                        style={styles.smallAvatar} 
                      />
                      <View>
                        <Text style={styles.userName}>{getStudentName(id)}</Text>
                        {sharedCourses[id] && sharedCourses[id].length > 0 && (
                          <Text style={styles.sharedClassesText}>
                            {sharedCourses[id].length} shared {sharedCourses[id].length === 1 ? 'class' : 'classes'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={() => handleRemoveFriend(id)}
                    >
                      <Ionicons name="person-remove" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {friendRequests.length === 0 && friends.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.UCONN_NAVY} />
                <Text style={styles.emptyStateText}>No friends or requests yet</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.UCONN_WHITE
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.UCONN_NAVY,
    fontSize: 16
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerLeftPlaceholder: {
    width: 40, // Same width as the icon button on the right
  },
  iconButton: {
    width: 40,
    alignItems: 'center'
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8
  },
  matchButtonActive: {
    backgroundColor: COLORS.UCONN_NAVY,
  },
  matchButtonInactive: {
    backgroundColor: '#6B7280',
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  buttonIcon: {
    marginRight: 6
  },
  card: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    margin: 8, 
    backgroundColor: '#fff', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  cardContent: {
    flex: 1,
    marginLeft: 12
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
    backgroundColor: '#E5E7EB'
  },
  profileName: { 
    fontSize: 16, 
    fontWeight: 'bold'
  },
  sharedCoursesContainer: {
    marginTop: 4,
    flexDirection: 'column',
  },
  sharedCoursesLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2
  },
  courseTag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    alignSelf: 'flex-start'
  },
  courseTagText: {
    fontSize: 12,
    color: '#1F2937'
  },
  noSharedClasses: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic'
  },
  friendLabel: {
    fontSize: 14,
    color: COLORS.UCONN_NAVY,
    fontWeight: 'bold'
  },
  requestButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.UCONN_NAVY, 
    borderRadius: 8
  },
  cancelButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EF4444', 
    borderRadius: 8
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: { 
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY
  },
  closeButton: {
    padding: 8,
    borderRadius: 20
  },
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 16,
    marginBottom: 12,
    color: COLORS.UCONN_NAVY
  },
  friendRequestItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  friendItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E5E7EB'
  },
  userName: {
    fontSize: 16,
    fontWeight: '500'
  },
  sharedClassesText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  acceptButton: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  }
});

export default IndexScreen;