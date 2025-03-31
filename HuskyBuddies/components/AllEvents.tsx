import type React from "react"
import { useState, useEffect } from "react"
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import { COLORS } from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { type Timestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/backend/firebase/firebaseConfig"
import { getUserId, FetchAllEventsFromDatabase } from "@/backend/firebase/firestoreService"

// event setup for database 
interface Event {
  id: string
  title: string
  date: Timestamp
  description: string
  isadded?: boolean
  createdBy: string
}

interface AllEventsProps {
  onBack: () => void
  events: Event[]
  onAddToCalendar: (event: Event) => Promise<void>
}

const AllEvents: React.FC<AllEventsProps> = ({ onBack, events: initialEvents, onAddToCalendar }) => {
  const [localEvents, setLocalEvents] = useState<Event[]>(initialEvents || [])
  const [loading, setLoading] = useState(!initialEvents || initialEvents.length === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setLocalEvents(initialEvents.map((event) => ({ ...event, isadded: event.isadded ?? false }))) // Ensure isadded is false by default
      setLoading(false)
    } else {
      fetchEvents()
    }
  }, [initialEvents])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const userId = await getUserId()

      if (!userId) {
        setError("User not logged in.")
        return
      }

      // fetch all events from all users
      const unsubscribe = FetchAllEventsFromDatabase(userId, (fetchedEvents: Event[]) => {
        // isadded should be false for all events when they are first fetched
        const eventsWithDefaultIsAdded = fetchedEvents.map((event) => ({ ...event, isadded: event.isadded ?? false }))
        setLocalEvents(eventsWithDefaultIsAdded)
      })

      return () => unsubscribe()
    } catch (err) {
      console.error("Error fetching events:", err)
      setError("Failed to load events. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // allows the toggle button to function and add other user events to calendar
  const handleToggleEvent = async (event: Event) => {
    try {
      // Get the current user ID
      const currentUserId = await getUserId()

      if (!currentUserId) {
        console.error("Current user ID not available. Cannot update event.")
        return
      }

      const updatedIsAdded = !event.isadded

      setLocalEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, isadded: updatedIsAdded } : e)))

      console.log(`Updating event ${event.id} in user ${currentUserId}'s allEvents collection`)
      console.log(`Setting isadded to: ${updatedIsAdded}`)

      // Update the event in the current user's allEvents collection
      const allEventsRef = doc(db, "users", currentUserId, "allEvents", event.id)
      await updateDoc(allEventsRef, { isadded: updatedIsAdded })

      // If the update was successful, call onAddToCalendar to sync with parent component
      if (onAddToCalendar) {
        await onAddToCalendar({
          ...event,
          isadded: updatedIsAdded,
        })
      }

      console.log(`Event ${updatedIsAdded ? "added to" : "removed from"} calendar: ${event.title}`)
    } catch (error) {
      console.error("Error updating event: ", error)

      setLocalEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, isadded: event.isadded } : e)))
      setError("Failed to update event. Please try again.")
    }
  }
  
  // Formatting for page consistency 
  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventText}>
        {item.date.toDate().toLocaleDateString()}{" "}
        {item.date.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
      <Text style={styles.eventText}>{item.description}</Text>

      <TouchableOpacity
        style={[styles.addToCalendarButton, item.isadded ? styles.removeButton : styles.addButton]}
        onPress={() => handleToggleEvent(item)} 
      >
        <Text style={styles.addToCalendarButtonText}>{item.isadded ? "Remove from Calendar" : "Add to Calendar"}</Text>
      </TouchableOpacity>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
      </TouchableOpacity>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerText}>All Events</Text>
      </View>
      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchEvents}>
        <Ionicons name="refresh" size={24} color={COLORS.UCONN_WHITE} />
      </TouchableOpacity>
    </View>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (localEvents.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noEventsText}>No events available</Text>
        </View>
      )
    }

    return (
      <>
        <Text style={styles.postedEventsTitle}>Available Events: {localEvents.length}</Text>
        <FlatList
          style={styles.eventsContainer}
          data={localEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
        />
      </>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.UCONN_NAVY} />
      {renderHeader()}
      {renderContent()}
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
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  eventText: {
    fontSize: 16,
    color: "#000",
  },
  addToCalendarButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: COLORS.UCONN_NAVY,
  },
  removeButton: {
    backgroundColor: "#FF4C4C",
  },
  addToCalendarButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 14,
  },
  postedEventsTitle: {
    fontSize: 20,
    color: COLORS.UCONN_NAVY,
    marginBottom: 0,
    padding: 15,
    paddingTop: 1,
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
    paddingTop: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  errorText: {
    fontSize: 16,
    color: "#FF4C4C",
    textAlign: "center",
    marginBottom: 15,
  },
  noEventsText: {
    fontSize: 18,
    color: COLORS.UCONN_NAVY,
  },
  retryButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
    marginLeft: "auto",
  },
})

export default AllEvents

