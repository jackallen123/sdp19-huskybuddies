import type React from "react"
import { useState, useEffect } from "react"
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/Colors"
import DateTimePicker from "@react-native-community/datetimepicker"
import { AddEventToDatabase, DeleteEventFromDatabase, getFullName } from "@/backend/firebase/firestoreService"
import { Timestamp, collection, onSnapshot, getDocs } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "@/backend/firebase/firebaseConfig"

// Event setup for database
interface Event {
  id: string
  title: string
  date: Timestamp
  description: string
  isadded?: boolean
  createdBy: string
  creatorName?: string
}

const AddEvent: React.FC<{
  onBack: () => void
  onAddEvent: (event: Event) => void
  onDeleteEvent: (id: string) => void
  events: Event[]
}> = ({ onBack, onAddEvent, onDeleteEvent, events: initialEvents }) => {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [events, setEvents] = useState<Event[]>(initialEvents || [])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Get the current users id so we can get their events
  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (user) {
      setCurrentUserId(user.uid)

      // Fetch the user's full name
      const fetchUserName = async () => {
        try {
          const fullName = await getFullName(user.uid)
          setCurrentUserName(fullName)
        } catch (error) {
          console.error("Error fetching user name:", error)
        }
      }
      fetchUserName()
    } 
  }, [])

  // Fetch events and check to ensure only current user's events are shown
  const fetchEvents = async () => {
    if (!currentUserId) {
      console.error("Cannot fetch events: No current user ID")
      return
    }

    try {
      // Get all events from the user's events collection
      const eventsRef = collection(db, "users", currentUserId, "events")
      const snapshot = await getDocs(eventsRef)

      if (snapshot.empty) {
        setEvents([])
        setLoading(false)
        return
      }

      // Filter to ensure only current user's events
      const allEvents = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || "",
          date: data.date,
          description: data.description || "",
          isadded: data.isadded || false,
          createdBy: data.createdBy || currentUserId,
          creatorName: data.creatorName || currentUserName,
        }
      })

      // Additional check to ensure only events created by the current user are shown
      const filteredEvents = allEvents.filter((event) => {
        const isCurrentUserEvent =
          event.createdBy === currentUserId ||
          (event.creatorName === currentUserName && event.creatorName !== "Unknown User")

        return isCurrentUserEvent
      })

      setEvents(filteredEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
      Alert.alert("Error", "Failed to load events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time listener for events with additional check
  useEffect(() => {
    if (!currentUserId) return

    setLoading(true)

    // Get events directly from the events collection
    const eventsRef = collection(db, "users", currentUserId, "events")

    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        if (snapshot.empty) {
          setEvents([])
          setLoading(false)
          return
        }

        // Map the documents to Event objects
        const allEvents = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || "",
            date: data.date,
            description: data.description || "",
            isadded: data.isadded || false,
            createdBy: data.createdBy || currentUserId,
            creatorName: data.creatorName || currentUserName || "Unknown User",
          }
        })

        // Additional check to ensure only events created by the current user are shown
        const filteredEvents = allEvents.filter((event) => {
          const isCurrentUserEvent =
            event.createdBy === currentUserId ||
            (event.creatorName === currentUserName && event.creatorName !== "Unknown User")

          if (!isCurrentUserEvent) {
          }
          return isCurrentUserEvent
        })

    
        setEvents(filteredEvents)
        setLoading(false)
      },
      (error) => {
        console.error("Error in events listener:", error)
        setDebugInfo(`Listener error: ${error.message}`)
        setLoading(false)
      },
    )

    // Initial fetch to ensure we have data
    fetchEvents()

    return () => {
      unsubscribe()
    }
  }, [currentUserId, currentUserName])

  // Make sure all fields
  const handleSubmit = async () => {
    if (!title || !description || !date || !currentUserId) {
      alert("Please fill out all fields!")
      return
    }

    try {
      // Generate a unique ID for the event
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Use the user's name
      const creatorName = currentUserName || "Unknown User"

      await AddEventToDatabase(
        currentUserId,
        eventId,
        title,
        Timestamp.fromDate(date),
        description,
        false, // Set isadded to true by default for user's own events
        currentUserId, 
        creatorName, 
      )

      // Create the event object for local state
      const newEvent: Event = {
        id: eventId,
        title,
        date: Timestamp.fromDate(date),
        description,
        isadded: false, // Set isadded to true by default for user's own events
        createdBy: currentUserId,
        creatorName: creatorName,
      }

      // Call onAddEvent to update parent component
      onAddEvent(newEvent)

      // Clear form inputs
      setTitle("")
      setDate(null)
      setDescription("")

      alert("Event posted successfully!")

      // Refresh events to ensure the new event appears
      setTimeout(fetchEvents, 500)
    } catch (error) {
      console.error("Error adding event:", error)
      alert("Failed to add event. Please try again.")
    }
  }

  // Delete an event
  const handleDeleteEvent = async (id: string) => {
    try {
      if (currentUserId) {
        await DeleteEventFromDatabase(currentUserId, id)
        // Call the onDeleteEvent prop to update parent component state
        onDeleteEvent(id)
        // Update local state
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id))
        alert("Event deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event. Please try again.")
    }
  }

  // Formatting for page consistency
  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventText}>
        {item.date
          ? new Date(item.date.toDate()).toLocaleString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "No date available"}
      </Text>
      <Text style={styles.eventText}>{item.description}</Text>
      <Text style={styles.creatorText}>Created By: {item.creatorName || currentUserName || "Unknown User"}</Text>
      <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Event Poster</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Post a New Event</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
        />

        <View style={styles.section}>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputText}>{date ? date.toLocaleString() : "Select Date & Time"}</Text>
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

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          placeholderTextColor="#B0B0B0"
          style={styles.textarea}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Post Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsHeaderContainer}>
        <Text style={styles.postedEventsTitle}>Your Posted Events:</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.noEventsContainer}>
          <Text>No events posted yet. Create your first event above!</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.eventsContainer}
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
        />
      )}
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
  eventItem: {
    marginBottom: 12,
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
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
  section: {
    padding: 0,
  },
  textarea: {
    height: 60,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 150,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
  eventsHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 15,
  },
  postedEventsTitle: {
    fontSize: 20,
    color: COLORS.UCONN_NAVY,
    marginBottom: 0,
    padding: 15,
    paddingTop: 1,
    flex: 1,
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
    paddingTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
  eventText: {
    fontSize: 16,
    color: "#000",
  },
  creatorText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
  },
})

export default AddEvent
