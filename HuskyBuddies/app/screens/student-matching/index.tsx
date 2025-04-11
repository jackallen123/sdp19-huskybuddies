"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/Colors"
import {
  getAllUsers,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getUserCourses,
  getUserProfilePicture,
  getUserStudyPreferences,
  getUserInterests,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../../../backend/firebase/firestoreService"
import { auth } from "../../../backend/firebase/firebaseConfig"
import { ActivityIndicator } from "react-native-paper"
import { useFocusEffect } from "@react-navigation/native"

const IndexScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserCourses, setCurrentUserCourses] = useState([])
  const [currentUserPreferences, setCurrentUserPreferences] = useState([])
  const [currentUserInterests, setCurrentUserInterests] = useState([])
  const [currentUserProfilePicture, setCurrentUserProfilePicture] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [displayedStudents, setDisplayedStudents] = useState([])
  const [studentCourses, setStudentCourses] = useState({})
  const [sharedCourses, setSharedCourses] = useState({})
  const [studyPreferences, setStudyPreferences] = useState({})
  const [interests, setInterests] = useState({})
  const [sharedPreferences, setSharedPreferences] = useState({})
  const [sharedInterests, setSharedInterests] = useState({})
  const [profilePictures, setProfilePictures] = useState({})
  const [friendRequests, setFriendRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshingFriends, setRefreshingFriends] = useState(false)
  const [refreshingData, setRefreshingData] = useState(false)

  // Profile completion state
  const [profileComplete, setProfileComplete] = useState(false)
  const [profileChecks, setProfileChecks] = useState({
    hasPicture: false,
    hasCourses: false,
    hasPreferences: false,
    hasInterests: false,
  })

  // Track expanded cards
  const [expandedCards, setExpandedCards] = useState({})

  // Filter states
  const [classesFilterEnabled, setClassesFilterEnabled] = useState(false)
  const [preferencesFilterEnabled, setPreferencesFilterEnabled] = useState(false)
  const [interestsFilterEnabled, setInterestsFilterEnabled] = useState(false)

  // Toggle card expansion
  const toggleCardExpansion = (studentId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  // Function to check if user profile is complete
  const checkProfileCompletion = async (userId) => {
    if (!userId) return false

    try {
      // Check for profile picture
      const profilePic = await getUserProfilePicture(userId)
      const hasPicture = !!profilePic

      // Check for courses
      const courses = await getUserCourses(userId)
      const hasCourses = courses && courses.length > 0

      // Check for study preferences (including additional)
      const preferences = await getUserStudyPreferences(userId)
      const hasPreferences = preferences && preferences.length > 0

      // Check for interests (including additional)
      const userInterests = await getUserInterests(userId)
      const hasInterests = userInterests && userInterests.length > 0

      // Update state with individual checks
      setProfileChecks({
        hasPicture,
        hasCourses,
        hasPreferences,
        hasInterests,
      })

      // All requirements must be met
      const isComplete = hasPicture && hasCourses && hasPreferences && hasInterests
      setProfileComplete(isComplete)

      // Store current user data
      setCurrentUserProfilePicture(profilePic)
      setCurrentUserCourses(courses || [])
      setCurrentUserPreferences(preferences || [])
      setCurrentUserInterests(userInterests || [])

      return isComplete
    } catch (error) {
      console.error("Error checking profile completion:", error)
      return false
    }
  }

  // Function to fetch friends and friend requests
  const fetchFriendsAndRequests = async () => {
    if (!currentUser) return

    setRefreshingFriends(true)
    try {
      // Get friends list
      const friendsList = await getFriends(currentUser.uid)
      setFriends(friendsList)

      // Get incoming friend requests
      const incomingRequests = await getIncomingFriendRequests(currentUser.uid)
      setFriendRequests(incomingRequests)

      // Get outgoing friend requests
      const outgoing = await getOutgoingFriendRequests(currentUser.uid)
      setOutgoingRequests(outgoing)
    } catch (error) {
      console.error("Error fetching friends data:", error)
    } finally {
      setRefreshingFriends(false)
    }
  }

  // Function to find shared items (courses, preferences, interests)
  const findSharedItems = (userItems, otherItems, nameField = null) => {
    const shared = []

    if (!userItems || !otherItems) return shared

    for (const userItem of userItems) {
      for (const otherItem of otherItems) {
        // If nameField is provided, compare that field (for courses)
        // Otherwise compare the items directly (for preferences and interests)
        const userValue = nameField ? userItem[nameField] : userItem
        const otherValue = nameField ? otherItem[nameField] : otherItem

        if (userValue === otherValue) {
          shared.push(userValue)
          break
        }
      }
    }

    return shared
  }

  // Function to fetch all student data
  const fetchAllStudentData = async (showLoadingIndicator = true) => {
    if (!auth.currentUser) return

    if (showLoadingIndicator) {
      setLoading(true)
    } else {
      setRefreshingData(true)
    }

    try {
      const user = auth.currentUser
      setCurrentUser(user)

      // First check if profile is complete
      const isProfileComplete = await checkProfileCompletion(user.uid)

      // If profile is not complete, we can stop here
      if (!isProfileComplete) {
        if (showLoadingIndicator) {
          setLoading(false)
        } else {
          setRefreshingData(false)
        }
        return
      }

      // Get all users
      const users = await getAllUsers()
      setAllStudents(users)

      // Get data for all students
      const coursesMap = {}
      const sharedCoursesMap = {}
      const preferencesMap = {}
      const interestsMap = {}
      const sharedPreferencesMap = {}
      const sharedInterestsMap = {}
      const picturesMap = {}

      for (const student of users) {
        if (student.id !== user.uid) {
          // Get student courses
          const courses = await getUserCourses(student.id)
          if (courses) {
            coursesMap[student.id] = courses

            // Find shared courses
            const shared = findSharedItems(currentUserCourses, courses, "name")
            if (shared.length > 0) {
              sharedCoursesMap[student.id] = shared
            }
          }

          // Get student study preferences (now includes additional preferences)
          const preferences = await getUserStudyPreferences(student.id)
          if (preferences) {
            preferencesMap[student.id] = preferences

            // Find shared preferences
            const sharedPrefs = findSharedItems(currentUserPreferences, preferences)
            if (sharedPrefs.length > 0) {
              sharedPreferencesMap[student.id] = sharedPrefs
            }
          }

          // Get student interests (now includes additional interests)
          const studentInterests = await getUserInterests(student.id)
          if (studentInterests) {
            interestsMap[student.id] = studentInterests

            // Find shared interests
            const sharedInts = findSharedItems(currentUserInterests, studentInterests)
            if (sharedInts.length > 0) {
              sharedInterestsMap[student.id] = sharedInts
            }
          }

          // Get profile picture
          const profilePic = await getUserProfilePicture(student.id)
          if (profilePic) {
            picturesMap[student.id] = profilePic
          }
        }
      }

      // Add current user's profile picture to the map
      if (currentUserProfilePicture) {
        picturesMap[user.uid] = currentUserProfilePicture
      }

      setStudentCourses(coursesMap)
      setSharedCourses(sharedCoursesMap)
      setStudyPreferences(preferencesMap)
      setInterests(interestsMap)
      setSharedPreferences(sharedPreferencesMap)
      setSharedInterests(sharedInterestsMap)
      setProfilePictures(picturesMap)

      // Show all students by default (no filters)
      const allOtherStudents = users.filter((student) => student.id !== user.uid)
      setDisplayedStudents(allOtherStudents)

      // Fetch friends and requests
      await fetchFriendsAndRequests()
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      if (showLoadingIndicator) {
        setLoading(false)
      } else {
        setRefreshingData(false)
      }
    }
  }

  // Initial data loading
  useEffect(() => {
    fetchAllStudentData(true)
  }, [])

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always check profile completion when screen comes into focus
      if (auth.currentUser) {
        console.log("Screen focused, refreshing data...")
        fetchAllStudentData(false)
      }

      return () => {
        // This runs when the screen loses focus
        console.log("Screen unfocused")
      }
    }, []),
  )

  // Refresh friends and requests when modal is opened
  useEffect(() => {
    if (modalVisible && currentUser && profileComplete) {
      fetchFriendsAndRequests()
    }
  }, [modalVisible])

  // Apply filters based on current filter states
  useEffect(() => {
    if (!currentUser || !profileComplete) return

    // Start with all students except current user
    let filteredStudents = allStudents.filter((student) => student.id !== currentUser.uid)

    // Apply class filter if enabled
    if (classesFilterEnabled) {
      filteredStudents = filteredStudents.filter(
        (student) => sharedCourses[student.id] && sharedCourses[student.id].length > 0,
      )
    }

    // Apply preferences filter if enabled
    if (preferencesFilterEnabled) {
      filteredStudents = filteredStudents.filter(
        (student) => sharedPreferences[student.id] && sharedPreferences[student.id].length > 0,
      )
    }

    // Apply interests filter if enabled
    if (interestsFilterEnabled) {
      filteredStudents = filteredStudents.filter(
        (student) => sharedInterests[student.id] && sharedInterests[student.id].length > 0,
      )
    }

    setDisplayedStudents(filteredStudents)
  }, [
    classesFilterEnabled,
    preferencesFilterEnabled,
    interestsFilterEnabled,
    currentUser,
    allStudents,
    profileComplete,
  ])

  const toggleClassesFilter = () => {
    setClassesFilterEnabled(!classesFilterEnabled)
  }

  const togglePreferencesFilter = () => {
    setPreferencesFilterEnabled(!preferencesFilterEnabled)
  }

  const toggleInterestsFilter = () => {
    setInterestsFilterEnabled(!interestsFilterEnabled)
  }

  const handleSendRequest = async (studentId) => {
    try {
      if (!outgoingRequests.includes(studentId) && !friends.some((friend) => friend === studentId)) {
        await sendFriendRequest(currentUser.uid, studentId)
        setOutgoingRequests([...outgoingRequests, studentId])
      }
    } catch (error) {
      console.error("Error sending friend request:", error)
    }
  }

  const handleCancelRequest = async (studentId) => {
    try {
      await cancelFriendRequest(currentUser.uid, studentId)
      setOutgoingRequests(outgoingRequests.filter((id) => id !== studentId))
    } catch (error) {
      console.error("Error canceling friend request:", error)
    }
  }

  const handleAcceptRequest = async (studentId) => {
    try {
      await acceptFriendRequest(currentUser.uid, studentId)
      // Refresh friends and requests after accepting
      await fetchFriendsAndRequests()
    } catch (error) {
      console.error("Error accepting friend request:", error)
    }
  }

  const handleRejectRequest = async (studentId) => {
    try {
      await rejectFriendRequest(currentUser.uid, studentId)
      setFriendRequests(friendRequests.filter((id) => id !== studentId))
    } catch (error) {
      console.error("Error rejecting friend request:", error)
    }
  }

  const handleRemoveFriend = async (studentId) => {
    try {
      await removeFriend(currentUser.uid, studentId)
      setFriends(friends.filter((id) => id !== studentId))
    } catch (error) {
      console.error("Error removing friend:", error)
    }
  }

  const getStudentName = (id) => {
    const student = allStudents.find((s) => s.id === id)
    return student ? student.name || `${student.firstName} ${student.lastName}` : "Unknown User"
  }

  const getStudentImage = (id) => {
    // First check if we have the profile picture in our cache
    if (profilePictures[id]) {
      return profilePictures[id]
    }

    // Fall back to any image in the user document
    const student = allStudents.find((s) => s.id === id)
    return student?.profilePicture || student?.image || "https://via.placeholder.com/50"
  }

  const renderProfileChecklist = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeftPlaceholder}></View>
          <Text style={styles.headerText}>Complete Your Profile</Text>
          <View style={styles.headerLeftPlaceholder}></View>
        </View>

        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeader}>
            <Ionicons name="alert-circle" size={24} color={COLORS.UCONN_NAVY} />
            <Text style={styles.checklistTitle}>Complete your profile to start matching with buddies</Text>
          </View>

          <View style={styles.checklistItems}>
            <View style={styles.checklistItem}>
              <View style={styles.checkIconContainer}>
                {profileChecks.hasPicture ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#6B7280" />
                )}
              </View>
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkItemTitle}>Upload a profile picture</Text>
                <Text style={styles.checkItemDescription}>Add a photo so others can recognize you</Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              <View style={styles.checkIconContainer}>
                {profileChecks.hasCourses ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#6B7280" />
                )}
              </View>
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkItemTitle}>Add your courses</Text>
                <Text style={styles.checkItemDescription}>Select at least one course you're taking</Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              <View style={styles.checkIconContainer}>
                {profileChecks.hasPreferences ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#6B7280" />
                )}
              </View>
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkItemTitle}>Add study preferences</Text>
                <Text style={styles.checkItemDescription}>Select at least one study preference</Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              <View style={styles.checkIconContainer}>
                {profileChecks.hasInterests ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#6B7280" />
                )}
              </View>
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkItemTitle}>Add your interests</Text>
                <Text style={styles.checkItemDescription}>Select at least one interest</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchAllStudentData(true)}>
            <Ionicons name="refresh" size={18} color={COLORS.UCONN_NAVY} style={styles.buttonIcon} />
            <Text style={styles.refreshButtonText}>Refresh Profile Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
      </SafeAreaView>
    )
  }

  // If profile is not complete, show the checklist
  if (!profileComplete) {
    return renderProfileChecklist()
  }

  // Otherwise show the matching interface
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftPlaceholder}></View>
        <Text style={styles.headerText}>Match with a Buddy</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="people" size={24} color={"#fff"} />
        </TouchableOpacity>
      </View>

      {refreshingData && (
        <View style={styles.refreshingBanner}>
          <ActivityIndicator size="small" color={COLORS.UCONN_NAVY} />
          <Text style={styles.refreshingText}>Refreshing student data...</Text>
        </View>
      )}

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScrollView}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              classesFilterEnabled ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={toggleClassesFilter}
          >
            <Ionicons
              name={classesFilterEnabled ? "checkmark-circle" : "school-outline"}
              size={18}
              color={classesFilterEnabled ? "#fff" : COLORS.UCONN_NAVY}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                classesFilterEnabled ? styles.filterButtonTextActive : styles.filterButtonTextInactive,
              ]}
            >
              Matching Classes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              preferencesFilterEnabled ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={togglePreferencesFilter}
          >
            <Ionicons
              name={preferencesFilterEnabled ? "checkmark-circle" : "options-outline"}
              size={18}
              color={preferencesFilterEnabled ? "#fff" : COLORS.UCONN_NAVY}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                preferencesFilterEnabled ? styles.filterButtonTextActive : styles.filterButtonTextInactive,
              ]}
            >
              Study Preferences
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              interestsFilterEnabled ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={toggleInterestsFilter}
          >
            <Ionicons
              name={interestsFilterEnabled ? "checkmark-circle" : "heart-outline"}
              size={18}
              color={interestsFilterEnabled ? "#fff" : COLORS.UCONN_NAVY}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                interestsFilterEnabled ? styles.filterButtonTextActive : styles.filterButtonTextInactive,
              ]}
            >
              Interests
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {displayedStudents.length === 0 ? (
        <View style={styles.emptyResults}>
          <Ionicons name="search" size={48} color={COLORS.UCONN_NAVY} />
          <Text style={styles.emptyResultsText}>No students match your filters</Text>
          <Text style={styles.emptyResultsSubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={displayedStudents}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: getStudentImage(item.id) }} style={styles.avatar} />
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.profileName}>
                    {item.name || `${item.firstName || ""} ${item.lastName || ""}`}
                  </Text>

                  {/* Display shared classes count */}
                  {sharedCourses[item.id] && sharedCourses[item.id].length > 0 ? (
                    <View style={styles.sharedClassesCountContainer}>
                      <Ionicons name="school" size={14} color={COLORS.UCONN_NAVY} style={styles.sharedIcon} />
                      <Text style={styles.sharedClassesCount}>
                        {sharedCourses[item.id].length} shared{" "}
                        {sharedCourses[item.id].length === 1 ? "class" : "classes"}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noSharedClasses}>No shared classes</Text>
                  )}

                  {/* Display shared preferences count */}
                  {sharedPreferences[item.id] && sharedPreferences[item.id].length > 0 && (
                    <View style={styles.sharedPreferencesCountContainer}>
                      <Ionicons name="options" size={14} color="#1E40AF" style={styles.sharedIcon} />
                      <Text style={styles.sharedPreferencesCount}>
                        {sharedPreferences[item.id].length} shared{" "}
                        {sharedPreferences[item.id].length === 1 ? "preference" : "preferences"}
                      </Text>
                    </View>
                  )}

                  {/* Display shared interests count */}
                  {sharedInterests[item.id] && sharedInterests[item.id].length > 0 && (
                    <View style={styles.sharedInterestsCountContainer}>
                      <Ionicons name="heart" size={14} color="#92400E" style={styles.sharedIcon} />
                      <Text style={styles.sharedInterestsCount}>
                        {sharedInterests[item.id].length} shared{" "}
                        {sharedInterests[item.id].length === 1 ? "interest" : "interests"}
                      </Text>
                    </View>
                  )}
                </View>

                {friends.includes(item.id) ? (
                  <Text style={styles.friendLabel}>Friend</Text>
                ) : outgoingRequests.includes(item.id) ? (
                  <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelRequest(item.id)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.requestButton} onPress={() => handleSendRequest(item.id)}>
                    <Ionicons name="person-add" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* More Details Button */}
              <TouchableOpacity style={styles.moreDetailsButton} onPress={() => toggleCardExpansion(item.id)}>
                <Text style={styles.moreDetailsText}>{expandedCards[item.id] ? "Hide Details" : "More Details"}</Text>
                <Ionicons
                  name={expandedCards[item.id] ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.UCONN_NAVY}
                />
              </TouchableOpacity>

              {/* Expandable Details Section */}
              {expandedCards[item.id] && (
                <View style={styles.expandedDetails}>
                  {/* Display shared courses */}
                  {sharedCourses[item.id] && sharedCourses[item.id].length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Shared Classes:</Text>
                      <View style={styles.tagsContainer}>
                        {sharedCourses[item.id].map((course, index) => (
                          <View key={`course-${index}`} style={styles.courseTag}>
                            <Text style={styles.courseTagText}>{course}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Display study preferences */}
                  {studyPreferences[item.id] && studyPreferences[item.id].length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Study Preferences:</Text>
                      <View style={styles.tagsContainer}>
                        {studyPreferences[item.id].map((preference, index) => (
                          <View
                            key={`pref-${index}`}
                            style={[
                              styles.preferenceTag,
                              sharedPreferences[item.id]?.includes(preference) ? styles.sharedPreferenceTag : {},
                            ]}
                          >
                            <Text
                              style={[
                                styles.preferenceTagText,
                                sharedPreferences[item.id]?.includes(preference) ? styles.sharedTagText : {},
                              ]}
                            >
                              {preference}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Display interests */}
                  {interests[item.id] && interests[item.id].length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Interests:</Text>
                      <View style={styles.tagsContainer}>
                        {interests[item.id].map((interest, index) => (
                          <View
                            key={`int-${index}`}
                            style={[
                              styles.interestTag,
                              sharedInterests[item.id]?.includes(interest) ? styles.sharedInterestTag : {},
                            ]}
                          >
                            <Text
                              style={[
                                styles.interestTagText,
                                sharedInterests[item.id]?.includes(interest) ? styles.sharedTagText : {},
                              ]}
                            >
                              {interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buddies & Requests</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.UCONN_NAVY} />
              </TouchableOpacity>
            </View>

            {refreshingFriends && (
              <View style={styles.refreshingIndicator}>
                <ActivityIndicator size="small" color={COLORS.UCONN_NAVY} />
                <Text style={styles.refreshingText}>Refreshing...</Text>
              </View>
            )}

            {friendRequests.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Buddy Requests</Text>
                {friendRequests.map((id) => (
                  <View key={id} style={styles.friendRequestItem}>
                    <View style={styles.userInfo}>
                      <Image source={{ uri: getStudentImage(id) }} style={styles.smallAvatar} />
                      <View>
                        <Text style={styles.userName}>{getStudentName(id)}</Text>
                        {sharedCourses[id] && sharedCourses[id].length > 0 && (
                          <Text style={styles.sharedClassesText}>
                            {sharedCourses[id].length} shared {sharedCourses[id].length === 1 ? "class" : "classes"}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(id)}>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectRequest(id)}>
                        <Ionicons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {friends.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Buddies</Text>
                {friends.map((id) => (
                  <View key={id} style={styles.friendItem}>
                    <View style={styles.userInfo}>
                      <Image source={{ uri: getStudentImage(id) }} style={styles.smallAvatar} />
                      <View>
                        <Text style={styles.userName}>{getStudentName(id)}</Text>
                        {sharedCourses[id] && sharedCourses[id].length > 0 && (
                          <Text style={styles.sharedClassesText}>
                            {sharedCourses[id].length} shared {sharedCourses[id].length === 1 ? "class" : "classes"}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFriend(id)}>
                      <Ionicons name="person-remove" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {!refreshingFriends && friendRequests.length === 0 && friends.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.UCONN_NAVY} />
                <Text style={styles.emptyStateText}>No friends or requests yet</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 20,
    paddingTop: 60,
    marginBottom: 10,
    borderRadius: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerLeftPlaceholder: {
    width: 40, // Same width as the icon button on the right
  },
  iconButton: {
    width: 40,
    alignItems: "center",
  },
  refreshingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F7FF",
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  refreshingText: {
    marginLeft: 8,
    color: COLORS.UCONN_NAVY,
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  filtersScrollView: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: COLORS.UCONN_NAVY,
    borderColor: COLORS.UCONN_NAVY,
  },
  filterButtonInactive: {
    backgroundColor: "transparent",
    borderColor: COLORS.UCONN_NAVY,
  },
  filterButtonText: {
    fontWeight: "500",
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filterButtonTextInactive: {
    color: COLORS.UCONN_NAVY,
  },
  buttonIcon: {
    marginRight: 6,
  },
  refreshingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  emptyResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
    marginTop: 16,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  card: {
    padding: 16,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sharedClassesCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sharedPreferencesCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  sharedInterestsCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  sharedIcon: {
    marginRight: 4,
  },
  sharedClassesCount: {
    fontSize: 12,
    color: COLORS.UCONN_NAVY,
  },
  sharedPreferencesCount: {
    fontSize: 12,
    color: "#1E40AF",
  },
  sharedInterestsCount: {
    fontSize: 12,
    color: "#92400E",
  },
  noSharedClasses: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  moreDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  moreDetailsText: {
    color: COLORS.UCONN_NAVY,
    fontWeight: "500",
    marginRight: 4,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  courseTag: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  courseTagText: {
    fontSize: 12,
    color: "#1F2937",
  },
  preferenceTag: {
    backgroundColor: "#DBEAFE", // Light blue background
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  preferenceTagText: {
    fontSize: 12,
    color: "#1E40AF", // Darker blue text
  },
  interestTag: {
    backgroundColor: "#FEF3C7", // Light yellow background
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  interestTagText: {
    fontSize: 12,
    color: "#92400E", // Brown text
  },
  sharedPreferenceTag: {
    backgroundColor: "#93C5FD", // Brighter blue for shared preferences
  },
  sharedInterestTag: {
    backgroundColor: "#FDE68A", // Brighter yellow for shared interests
  },
  sharedTagText: {
    fontWeight: "bold",
  },
  friendLabel: {
    fontSize: 14,
    color: COLORS.UCONN_NAVY,
    fontWeight: "bold",
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EF4444",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    color: COLORS.UCONN_NAVY,
  },
  friendRequestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  sharedClassesText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#10B981",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },

  // Profile Checklist Styles
  checklistContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7FF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
    marginLeft: 12,
    flex: 1,
  },
  checklistItems: {
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  checkIconContainer: {
    width: 40,
    alignItems: "center",
  },
  checkTextContainer: {
    flex: 1,
  },
  checkItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  checkItemDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  refreshButton: {
    backgroundColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: COLORS.UCONN_NAVY,
    fontWeight: "500",
    fontSize: 14,
  },
})

export default IndexScreen
