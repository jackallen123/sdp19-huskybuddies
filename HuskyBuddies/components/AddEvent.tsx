import { useState, useEffect } from "react"
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/Colors"
import DateTimePicker from "@react-native-community/datetimepicker"
import {
  AddEventToDatabase,
  FetchEventsFromDatabase,
  DeleteEventFromDatabase,
} from "@/backend/firebase/firestoreService"
import { Timestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { useTheme } from "react-native-paper"

// Event setup for database
interface Event {
  id: string
  title: string
  date: Timestamp
  description: string
  isadded?: boolean
  createdBy: string
}

const AddEvent: React.FC<{
  onBack: () => void
  onAddEvent: (event: Event) => void
  onDeleteEvent: (id: string) => void
  events: Event[]
}> = ({ onBack, onAddEvent, onDeleteEvent, events: initialEvents }) => {
  const theme = useTheme();
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [events, setEvents] = useState<Event[]>(initialEvents || [])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get the current users id so we can get their events
  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (user) {
      setCurrentUserId(user.uid)
    }
  }, [])

  // Fetch events only current user has made
  useEffect(() => {
    if (currentUserId) {
      const unsubscribe = FetchEventsFromDatabase(currentUserId, (fetchedEvents: Event[]) => {
        setEvents(fetchedEvents); 
      });
  
      return () => unsubscribe();
    }
  }, [currentUserId]);
  
  // Make sure all fields
  const handleSubmit = async () => {
    if (!title || !description || !date || !currentUserId) {
      alert("Please fill out all fields!")
      return
    }

    try {
      // Generate a unique ID for the event
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Add event to the database - pass the ID as a separate parameter
      await AddEventToDatabase(currentUserId, eventId, title, Timestamp.fromDate(date), description, false)

      // Create the event object for local state
      const newEvent: Event = {
        id: eventId,
        title,
        date: Timestamp.fromDate(date),
        description,
        isadded: false,
        createdBy: currentUserId,
      }

      // Add event to local state
      onAddEvent(newEvent)

      // Clear form inputs
      setTitle("")
      setDate(null)
      setDescription("")

      alert("Event posted successfully!")
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
      <Text style={[styles.eventTitle, { color: theme.colors.onBackground }]}>{item.title}</Text>
      <Text style={[styles.eventText, { color: theme.colors.onBackground }]}>
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
      <Text style={[styles.eventText, { color: theme.colors.onBackground }]}>{item.description}</Text>
      <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Event Poster</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Post a New Event</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          placeholderTextColor={theme.colors.onSurface}
          style={[styles.input, { borderColor: theme.colors.onSurface, color: theme.colors.onBackground }]}
        />

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

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          placeholderTextColor={theme.colors.onSurface}
          style={[styles.textarea, { borderColor: theme.colors.onSurface, color: theme.colors.onBackground }]}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity onPress={handleSubmit} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Post Event</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.postedEventsTitle, { color: theme.colors.onBackground }]}>Posted Events:</Text>

      <FlatList
        style={styles.eventsContainer}
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_WHITE,
  },
  backButton: {
    padding: 8,
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
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
  },
  section: {
    padding: 0,
  },
  textarea: {
    height: 60,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 150,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
  },
  postedEventsTitle: {
    fontSize: 20,
    marginBottom: 0,
    padding: 15,
    paddingTop: 1,
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
    paddingTop: 1,
  },
  eventItem: {
    marginBottom: 12,
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  eventText: {
    fontSize: 16,
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

export default AddEvent

