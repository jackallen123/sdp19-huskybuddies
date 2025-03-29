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
  const [localEvents, setLocalEvents] = useState<Event[]>(initialEvents || [])
  const [loading, setLoading] = useState(!initialEvents || initialEvents.length === 0)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [creatorNames, setCreatorNames] = useState<{ [key: string]: string }>({})

  // Fetch the current user ID once when component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      const uid = await getUserId()
      setCurrentUserId(uid)
    }

    fetchUserId()
  }, [])

  // Add this useEffect to fetch creator names when events change
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

    if (localEvents.length > 0 && currentUserId) {
      fetchCreatorNames()
    }
  }, [localEvents, currentUserId])

  // Set up the real-time listener when the component mounts
  useEffect(() => {
    setupEventListener()

    // Clean up the listener when the component unmounts
    return () => {
      if (unsubscribeRef.current) {
        console.log("Cleaning up event listener")
        unsubscribeRef.current()
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  // Update local state when initialEvents changes (from parent)
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      console.log(`Received ${initialEvents.length} events from parent`)

      // Merge with existing events, preserving isadded status
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

      console.log("Setting up real-time event listener")
      setLoading(true)

      // Clean up existing listener if it exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Store the unsubscribe function in the ref so we can clean it up later
      const unsubscribe = FetchAllEventsFromDatabase(userId, (fetchedEvents: Event[]) => {
        console.log(`Real-time update: received ${fetchedEvents.length} events`)

        if (!fetchedEvents || fetchedEvents.length === 0) {
          setLocalEvents([])
          setLoading(false)
          return
        }

        // Deduplicate events using a Map with composite key
        const uniqueEventsMap = new Map()

        fetchedEvents.forEach((event) => {
          const uniqueKey = `${event.id}-${event.createdBy}`
          uniqueEventsMap.set(uniqueKey, event)
        })

        const deduplicatedEvents = Array.from(uniqueEventsMap.values())
        console.log(`After deduplication: ${deduplicatedEvents.length} events`)

        // Replace local events with fetched events
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

  // Force a complete resync of all events from all users
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

      console.log("Manually refreshing events...")

      // Clean up existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      try {
        // Force a complete resync with all users' events
        await SyncAllEventsFromDatabase(userId, (syncedEvents: Event[]) => {
          if (!syncedEvents || syncedEvents.length === 0) {
            setLocalEvents([])
            console.log("No events found during sync")
          } else {
            console.log(`Synced ${syncedEvents.length} events from all users`)

            const uniqueEventsMap = new Map()

            syncedEvents.forEach((event: Event) => {
              const uniqueKey = `${event.id}-${event.createdBy}`
              uniqueEventsMap.set(uniqueKey, event)
            })

            // Convert back to array
            const deduplicatedEvents = Array.from(uniqueEventsMap.values())
            console.log(`After deduplication: ${deduplicatedEvents.length} events`)

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

      // Optimistically update UI
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

      // Revert UI on error
      setLocalEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, isadded: event.isadded } : e)))
      setError("Failed to update event. Please try again.")
    }
  }

  // Formatting for page consistency
  const renderEventItem = ({ item }: { item: Event }) => {
    const creatorName = item.createdBy === currentUserId ? "You" : creatorNames[item.createdBy] || "Loading..."

    return (
      <View style={styles.eventItem}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventText}>
          {item.date.toDate().toLocaleDateString()}{" "}
          {item.date.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.eventText}>{item.description}</Text>
        <Text style={styles.creatorText}>Created by: {creatorName}</Text>

        <TouchableOpacity
          style={[styles.addToCalendarButton, item.isadded ? styles.removeButton : styles.addButton]}
          onPress={() => handleToggleEvent(item)}
        >
          <Text style={styles.addToCalendarButtonText}>
            {item.isadded ? "Remove from Calendar" : "Add to Calendar"}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
      </TouchableOpacity>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerText}>All Events</Text>
      </View>
      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchEvents} disabled={refreshing}>
        <Ionicons
          name={refreshing ? "sync" : "refresh"}
          size={24}
          color={COLORS.UCONN_WHITE}
          style={refreshing ? styles.spinningIcon : undefined}
        />
      </TouchableOpacity>
    </View>
  )

  const renderContent = () => {
    if (loading && !refreshing) {
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
          <Text style={styles.noEventsText}>Loading events...</Text>
          {refreshing ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.UCONN_NAVY} />
          ) : (
            <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return (
      <>
        <Text style={styles.postedEventsTitle}>
          Available Events: 
          {refreshing && <Text style={styles.refreshingText}> (Refreshing...)</Text>}
        </Text>
        {refreshing && (
          <View style={styles.refreshingIndicator}>
            <ActivityIndicator size="small" color={COLORS.UCONN_NAVY} />
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
    paddingTop: 10,
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

