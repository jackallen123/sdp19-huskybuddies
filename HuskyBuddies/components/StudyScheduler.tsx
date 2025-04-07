import { useState, useEffect } from "react"
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { COLORS } from "@/constants/Colors"
import { db } from "@/backend/firebase/firebaseConfig"
import { Timestamp, collection, onSnapshot } from "firebase/firestore"
import {
  FetchStudySessionsFromDatabase,
  AddStudySessionToDatabase,
  DeleteStudySessionFromDatabase,
  getFullName,
} from "@/backend/firebase/firestoreService"
import { useTheme } from "react-native-paper"


// Study session setup for database
interface StudySession {
  id: string
  title: string
  date: Timestamp
  friends: string[]
  createdBy: string
  creatorName?: string
}

// Interface for friend with ID and name
interface Friend {
  id: string
  name: string
}

type StudySchedulerProps = {
  onBack: () => void
  onSchedule: (session: StudySession) => void
  onDeleteSession: (id: string) => void
  currentUserId: string
}

export default function StudyScheduler({ onBack, onSchedule, currentUserId }: StudySchedulerProps) {
  const theme = useTheme()
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [date, setDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [scheduledSessions, setScheduledSessions] = useState<StudySession[]>([])
  const [friendsList, setFriendsList] = useState<Friend[]>([])
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Fetch friends list from database and get their full names
  useEffect(() => {
    if (!currentUserId) return

    const friendsRef = collection(db, "users", currentUserId, "friends")
    setLoading(true)

    const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
      const friendIds = snapshot.docs.map((doc) => doc.data().friendId)

      // Fetch full names for all friends
      const friendsWithNames: Friend[] = []

      for (const friendId of friendIds) {
        try {
          const name = await getFullName(friendId)
          if (name) {
            friendsWithNames.push({
              id: friendId,
              name: name,
            })
          } else {

            // If name can't be fetched, use ID 
            friendsWithNames.push({
              id: friendId,
              name: friendId,
            })
          }
        } catch (error) {
          console.error(`Error fetching name for friend ${friendId}:`, error)
          friendsWithNames.push({
            id: friendId,
            name: friendId,
          })
        }
      }

      setFriendsList(friendsWithNames)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUserId])

  // Fetch study sessions from database
  useEffect(() => {
    const unsubscribe = FetchStudySessionsFromDatabase(currentUserId, (sessions: StudySession[]) => {
      const formattedSessions = sessions.map((session: StudySession) => ({
        id: session.id,
        title: session.title,
        date: session.date,
        friends: session.friends,
        createdBy: session.createdBy,
      }))
      setScheduledSessions(formattedSessions)

      // Fetch creator names for each session
      formattedSessions.forEach((session) => {
        fetchCreatorName(session.createdBy)
      })
    })

    return () => unsubscribe()
  }, [currentUserId])

  // Fetch creator name for a given user ID
  const fetchCreatorName = async (userId: string) => {
    if (!userId || creatorNames[userId]) return

    try {
      const name = await getFullName(userId)
      if (name) {
        setCreatorNames((prev) => ({
          ...prev,
          [userId]: name,
        }))
      }
    } catch (error) {
      console.error("Error fetching creator name:", error)
    }
  }

  // Allow friends selection
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]))
  }

  // Get friend name by ID
  const getFriendNameById = (friendId: string): string => {
    const friend = friendsList.find((f) => f.id === friendId)
    return friend ? friend.name : friendId
  }

  // Create a study session
  const scheduleSession = async () => {
    if (date && selectedFriends.length > 0) {
      // Get friend names for the title
      const friendNames = selectedFriends.map((id) => getFriendNameById(id))

      const newSession: StudySession = {
        id: "",
        title: `Study session with ${friendNames.join(", ")}`,
        date: Timestamp.fromDate(date),
        friends: selectedFriends,
        createdBy: currentUserId,
      }

      await AddStudySessionToDatabase(
        currentUserId,
        newSession.id,
        newSession.title,
        newSession.date,
        newSession.friends,
      )
      onSchedule(newSession)
      setSelectedFriends([])
      setDate(null)
      alert("Study session scheduled!")
    } else {
      alert("Please select at least one friend and set a date and time.")
    }
  }

  // Deleting a study session
  const handleDeleteStudySession = async (id: string, sessionFriends: string[] = []) => {
    try {
      // Find the session to get the friends list if not provided
      if (sessionFriends.length === 0) {
        const session = scheduledSessions.find((s) => s.id === id)
        if (session) {
          sessionFriends = session.friends || []
        }
      }

      // Delete the session for the creator and all participants
      await DeleteStudySessionFromDatabase(currentUserId, id, sessionFriends)
      alert("Study session deleted!")
    } catch (error) {
      console.error("Error deleting study session:", error)
      alert("Error deleting study session")
    }
  }

  // Date/time format display
  const formatDate = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }
    return "Invalid Date"
  }

  // Formatting for page consistency
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Study Scheduler</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Schedule a Study Session</Text>
        {loading ? (
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading friends...</Text>
        ) : friendsList.length > 0 ? (
          friendsList.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.friendItem,
                selectedFriends.includes(friend.id) && styles.selectedFriend,
                { borderColor: theme.colors.primary }
              ]}
              onPress={() => toggleFriendSelection(friend.id)}
            >
              <Text style={[styles.friendText, { color: theme.colors.onBackground }]}>{friend.name}</Text>
              {selectedFriends.includes(friend.id) && (
                <Ionicons name="checkmark" size={20} color={theme.colors.onPrimary} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.friendText, { color: theme.colors.onBackground }]}>No friends found.</Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.inputText, { color: theme.colors.onBackground }]}>{date ? date.toLocaleString() : "Select Date & Time"}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false)
              if (selectedDate) {
                setDate(selectedDate)
                setShowTimePicker(true)
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false)
              if (selectedTime && date) {
                setDate(new Date(date.setHours(selectedTime.getHours(), selectedTime.getMinutes())))
              }
            }}
          />
        )}
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={[styles.scheduleButton, { backgroundColor: theme.colors.primary }]} onPress={scheduleSession}>
          <Text style={[styles.scheduleButtonText, { color: theme.colors.onPrimary }]}>Schedule Study Session</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { flex: 1 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Scheduled Study Sessions:</Text>
        <ScrollView style={styles.scrollContainer}>
          {scheduledSessions.length > 0 ? (
            scheduledSessions.map((session) => (
              <View key={session.id} style={[styles.sessionBox, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.sessionDetails}>
                  <Text style={[styles.sessionText, { color: theme.colors.onBackground }]}>{session.title}</Text>
                  <Text style={[styles.sessionDate, { color: theme.colors.onBackground }]}>{session.date ? formatDate(session.date) : "Invalid Date"}</Text>
                  {/* Display creator name */}
                  <Text style={[styles.creatorText, { color: theme.colors.onBackground }]}>Created by: {creatorNames[session.createdBy] || "Loading..."}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteStudySession(session.id, session.friends)}
                  style={[styles.deleteButton, { backgroundColor: theme.colors.error || "#FF4C4C" }]}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.friendText, { color: theme.colors.onBackground }]}> No sessions scheduled yet.</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

// Styles to keep pages consistent
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
  backButton: {
    padding: 8,
  },
  formContainer: {
    padding: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
    marginBottom: 20,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.UCONN_NAVY,
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderColor: COLORS.UCONN_NAVY,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  selectedFriend: {
    backgroundColor: COLORS.UCONN_GREY,
  },
  friendText: {
    color: COLORS.UCONN_NAVY,
    fontSize: 16,
  },
  loadingText: {
    color: COLORS.UCONN_NAVY,
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: "#000",
  },
  buttonWrapper: {
    alignItems: "center",
  },
  scheduleButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 8,
    paddingHorizontal: 100,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  scheduleButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    paddingBottom: 10,
  },
  scheduledSessionsContainer: {
    padding: 10,
    marginTop: 20,
  },
  scheduledSessionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
    marginBottom: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  sessionBox: {
    backgroundColor: COLORS.UCONN_WHITE,
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sessionDate: {
    fontSize: 16,
    marginBottom: 8,
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.UCONN_NAVY,
    fontStyle: "italic",
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: "#FF4C4C",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
  },
})