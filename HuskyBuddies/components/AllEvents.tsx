import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native"
import { COLORS } from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { type Timestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/backend/firebase/firebaseConfig"
import {
  getUserId,
  FetchAllEventsFromDatabase,
  SyncAllEventsFromDatabase,
  getFullName,
} from "@/backend/firebase/firestoreService"
import { useTheme } from "react-native-paper"

// event setup for database
interface Event {
  id: string
  title: string
  date: Timestamp
  description: string
  isadded?: boolean
  createdBy: string
  creatorName?: string
}

interface AllEventsProps {
  onBack: () => void
  events: Event[]
  onAddToCalendar: (event: Event) => Promise<void>
}

const AllEvents: React.FC<AllEventsProps> = ({ onBack, events: initialEvents, onAddToCalendar }) => {
  const theme = useTheme();
  const [localEvents, setLocalEvents] = useState<Event[]>(initialEvents || [])
  const [loading, setLoading] = useState(!initialEvents || initialEvents.length === 0)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [creatorNames, setCreatorNames] = useState<{ [key: string]: string }>({})

  // Get the current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const uid = await getUserId()
      setCurrentUserId(uid)
    }

    fetchUserId()
  }, [])

  // Get creator names when the current user changes
  useEffect(() => {
    const fetchCreatorNames = async () => {
      const uniqueCreatorIds = [...new Set(localEvents.map((event) => event.createdBy))]
      const namesMap: { [key: string]: string } = {}

      for (const creatorId of uniqueCreatorIds) {
        if (creatorId === currentUserId) {
          namesMap[creatorId] = "You"
        } else {
          try {
            const name = await getFullName(creatorId)
            namesMap[creatorId] = name || creatorId
          } catch (error) {
            console.error("Error fetching name:", error)
            namesMap[creatorId] = creatorId
          }
        }
      }

      setCreatorNames(namesMap)
    }

    // Only fetch if we have events and current user
    if (localEvents.length > 0 && currentUserId) {
      fetchCreatorNames()
    }
  }, [localEvents, currentUserId])

  // Set up the real-time listener that keeps the list of events active and current
  useEffect(() => {
    setupEventListener()

    // Clean up the listener
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  // Update local state when events are updated from other users
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {

      // Merge with existing events
      setLocalEvents((prevEvents) => {
        const eventMap = new Map(prevEvents.map((event) => [event.id, event]))

        initialEvents.forEach((event) => {
          const existingEvent = eventMap.get(event.id)
          eventMap.set(event.id, {
            ...event,
            isadded: existingEvent ? existingEvent.isadded : (event.isadded ?? false),
          })
        })

        return Array.from(eventMap.values())
      })

      setLoading(false)
    }
  }, [initialEvents])

  const setupEventListener = async () => {
    try {
      const userId = await getUserId()

      if (!userId) {
        setError("User not logged in.")
        return
      }

      setLoading(true)

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Store the unsubscribe function to clean it up later
      const unsubscribe = FetchAllEventsFromDatabase(userId, (fetchedEvents: Event[]) => {

        if (!fetchedEvents || fetchedEvents.length === 0) {
          setLocalEvents([])
          setLoading(false)
          return
        }

        // Get rid of duplicate events 
        const uniqueEventsMap = new Map()

        fetchedEvents.forEach((event) => {
          const uniqueKey = `${event.id}-${event.createdBy}`
          uniqueEventsMap.set(uniqueKey, event)
        })

        const deduplicatedEvents = Array.from(uniqueEventsMap.values())

        // Update events list 
        setLocalEvents(deduplicatedEvents)
        setLoading(false)
      })

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error("Error setting up event listener:", err)
      setError("Failed to load events. Please try again later.")
      setLoading(false)
    }
  }

  // Force a complete resync of all events from all users when refresh is clicked
  const fetchEvents = async () => {
    try {
      setRefreshing(true)
      setError(null)
      setLastRefreshTime(Date.now())
      setLocalEvents([]) 

      // Get the current user ID
      const userId = await getUserId()

      if (!userId) {
        setError("User not logged in.")
        setRefreshing(false)
        return
      }

      // Clean up existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      try {
        await SyncAllEventsFromDatabase(userId, (syncedEvents: Event[]) => {
          if (!syncedEvents || syncedEvents.length === 0) {
            setLocalEvents([])
          } else {

            const uniqueEventsMap = new Map()

            syncedEvents.forEach((event: Event) => {
              const uniqueKey = `${event.id}-${event.createdBy}`
              uniqueEventsMap.set(uniqueKey, event)
            })

            // Convert back to array
            const deduplicatedEvents = Array.from(uniqueEventsMap.values())

            setLocalEvents(deduplicatedEvents)
          }
        })
      } catch (syncError) {
        console.error("Error during sync:", syncError)
        Alert.alert("Sync Error", "There was an error syncing events. Please try again.")
      }

      // Set up a new listener to keep getting real-time updates
      setupEventListener()

      setRefreshing(false)
    } catch (err) {
      console.error("Error refreshing events:", err)
      setError("Failed to refresh events. Please try again.")
      setRefreshing(false)
    }
  }

  // Allows the toggle button to function and add other user events to calendar
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

    } catch (error) {
      console.error("Error updating event: ", error)

      setLocalEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, isadded: event.isadded } : e)))
      setError("Failed to update event. Please try again.")
    }
  }

  // Formatting for page consistency
  const renderEventItem = ({ item }: { item: Event }) => {
    const creatorName = item.createdBy === currentUserId ? "You" : creatorNames[item.createdBy] || "Loading..."

    return (
      <View style={styles.eventItem}>
        <Text style={[styles.eventTitle, { color: theme.colors.onBackground }]}>{item.title}</Text>
        <Text style={[styles.eventText, { color: theme.colors.onBackground }]}>
          {item.date.toDate().toLocaleDateString()}{" "}
          {item.date.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={[styles.eventText, { color: theme.colors.onBackground }]}>{item.description}</Text>
        <Text style={[styles.creatorText, { color: theme.colors.onBackground }]}>Created by: {creatorName}</Text>

        <TouchableOpacity
          style={[
            styles.addToCalendarButton,
            item.isadded 
            ? { backgroundColor: theme.colors.error }
            : { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => handleToggleEvent(item)}
        >
          <Text style={[styles.addToCalendarButtonText, { color: theme.colors.onPrimary }]}>
            {item.isadded ? "Remove from Calendar" : "Add to Calendar"}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
      </TouchableOpacity>
      <View style={styles.headerTextContainer}>
        <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>All Events</Text>
      </View>
      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchEvents} disabled={refreshing}>
        <Ionicons
          name={refreshing ? "sync" : "refresh"}
          size={24}
          color={theme.colors.onPrimary}
          style={refreshing ? styles.spinningIcon : undefined}
        />
      </TouchableOpacity>
    </View>
  )

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading events...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error || "#FF4C4C" }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchEvents}>
            <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (localEvents.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.noEventsText, { color: theme.colors.onBackground }]}>Loading events...</Text>
          {refreshing ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchEvents}>
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return (
      <>
        <Text style={[styles.postedEventsTitle, { color: theme.colors.onBackground }]}>
          Available Events: 
          {refreshing && <Text style={styles.refreshingText}> (Refreshing...)</Text>}
        </Text>
        {refreshing && (
          <View style={styles.refreshingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        <FlatList
          style={styles.eventsContainer}
          data={localEvents}
          renderItem={renderEventItem}
          keyExtractor={(item, index) => `event-${item.id}-${item.createdBy}-${index}-${lastRefreshTime}`}
          extraData={[localEvents, lastRefreshTime]} 
        />
      </>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
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
  creatorText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
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
    paddingTop: 20,
  },
  refreshingText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  refreshingIndicator: {
    alignItems: "center",
    paddingBottom: 10,
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
    marginBottom: 20,
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
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
})

export default AllEvents

