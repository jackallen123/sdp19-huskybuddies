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
import { type Timestamp, doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
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

  // Get the current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const uid = await getUserId()
      setCurrentUserId(uid)
    }

    fetchUserId()
  }, [])

  // Fetch creator names for all events
  useEffect(() => {
    const fetchCreatorNames = async () => {
      const newCreatorNames: { [key: string]: string } = { ...creatorNames }
      let hasNewNames = false

      for (const event of localEvents) {
        // Skip if we already have the name or if createdBy is not an ID
        if (
          creatorNames[event.createdBy] ||
          !event.createdBy ||
          event.createdBy.includes(" ") ||
          event.createdBy === "Unknown User"
        ) {
          continue
        }

        try {
          // Try to get the full name if it looks like a user ID
          const name = await getFullName(event.createdBy)
          if (name) {
            newCreatorNames[event.createdBy] = name
            hasNewNames = true
          }
        } catch (error) {
          console.error(`Error fetching name for ${event.createdBy}:`, error)
        }
      }

      if (hasNewNames) {
        setCreatorNames(newCreatorNames)
      }
    }

    if (localEvents.length > 0) {
      fetchCreatorNames()
    }
  }, [localEvents])

  // Set up the real-time listener that keeps the list of events active and current
  useEffect(() => {
    setupEventListener()

    // Clean up the listener
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, []) 

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

      // Keep the current state to preserve isadded status
      const currentEvents = [...localEvents]
      const currentEventMap = new Map(currentEvents.map((event) => [event.id, event]))

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
        // Get the current isadded status for all events in the user's allEvents collection
        const allEventsStatus = new Map()

        for (const event of currentEvents) {
          try {
            const allEventsRef = doc(db, "users", userId, "allEvents", event.id)
            const eventDoc = await getDoc(allEventsRef)

            if (eventDoc.exists()) {
              const data = eventDoc.data()
              allEventsStatus.set(event.id, data.isadded === true)
            }
          } catch (error) {
            console.error(`Error getting status for event ${event.id}:`, error)
          }
        }

        await SyncAllEventsFromDatabase(userId, (syncedEvents: Event[]) => {

          if (!syncedEvents || syncedEvents.length === 0) {
            // Even if no events from sync, we still want to preserve our current events
            setLocalEvents(currentEvents)
          } else {
            const uniqueEventsMap = new Map()

            syncedEvents.forEach((event: Event) => {
              const uniqueKey = `${event.id}-${event.createdBy}`

              // Preserve the isadded status from our current events or from the database
              const existingEvent = currentEventMap.get(event.id)
              // Use the status from allEventsStatus if available, otherwise use the existing event status
              const isAdded = allEventsStatus.has(event.id)
                ? allEventsStatus.get(event.id)
                : existingEvent
                  ? existingEvent.isadded
                  : false

              // Preserve the original creator name/ID
              const creatorName = existingEvent?.creatorName || event.creatorName
              const createdBy = existingEvent?.createdBy || event.createdBy

              uniqueEventsMap.set(uniqueKey, {
                ...event,
                isadded: isAdded,
                createdBy: createdBy,
                creatorName: creatorName,
              })
            })

            // Convert back to array
            const deduplicatedEvents = Array.from(uniqueEventsMap.values())
            setLocalEvents(deduplicatedEvents)
          }

          // Set up a new listener to keep getting real-time updates
          setupEventListener()
          setRefreshing(false)
        })
      } catch (syncError) {
        console.error("Error during sync:", syncError)
        Alert.alert("Sync Error", "There was an error syncing events. Please try again.")
        setLocalEvents(currentEvents)
        setRefreshing(false)
      }
    } catch (err) {
      console.error("Error refreshing events:", err)
      setError("Failed to refresh events. Please try again.")
      setRefreshing(false)
    }
  }

  const handleToggleEvent = async (event: Event) => {
    try {
      // Get the current user ID
      const currentUserId = await getUserId()

      if (!currentUserId) {
        console.error("Current user ID not available. Cannot update event.")
        return
      }

      const updatedIsAdded = !event.isadded
      // Update local state first - preserve all original event properties
      setLocalEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? {
                ...e,
                isadded: updatedIsAdded,
                createdBy: e.createdBy,
                creatorName: e.creatorName,
              }
            : e,
        ),
      )

      // Update the isadded field in the current users allEvents collection
      const currentUserAllEventsRef = doc(db, "users", currentUserId, "allEvents", event.id)

      // Check if the event exists in the current user's allEvents collection
      const eventDoc = await getDoc(currentUserAllEventsRef)

      if (eventDoc.exists()) {
    
        // Only update the isadded field, preserve all other fields
        await updateDoc(currentUserAllEventsRef, {
          isadded: updatedIsAdded,
        })

       
      } else {
    
        // If the event doesn't exist in allEvents, create it with all necessary fields
        await setDoc(currentUserAllEventsRef, {
          title: event.title,
          date: event.date,
          description: event.description,
          isadded: updatedIsAdded,
          createdBy: event.createdBy,
          creatorName: event.creatorName,
        })
      }

      // If the update was successful, call onAddToCalendar to sync with parent component
      if (onAddToCalendar) {
        // Make sure we're passing the complete event object with all original properties
        await onAddToCalendar({
          ...event,
          isadded: updatedIsAdded,
          createdBy: event.createdBy,
          creatorName: event.creatorName,
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
    let displayName = item.creatorName || item.createdBy
    if (!displayName || displayName === "Unknown User") {
      displayName = "Unknown User"
    } else if (!item.creatorName && creatorNames[item.createdBy]) {
      displayName = creatorNames[item.createdBy]
    } else if (
      !item.creatorName &&
      item.createdBy &&
      !item.createdBy.includes(" ") &&
      item.createdBy !== "Unknown User"
    ) {
      displayName = "Loading..."
    }

    return (
      <View style={styles.eventItem}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventText}>
          {item.date.toDate().toLocaleDateString()}{" "}
          {item.date.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.eventText}>{item.description}</Text>
        <Text style={styles.creatorText}>Created by: {displayName}</Text>

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
      <TouchableOpacity style={styles.refreshButton} onPress={fetchEvents} disabled={refreshing} activeOpacity={0.7}>
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
          <Text style={styles.noEventsText}>No events found</Text>
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
          Available Events
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
          extraData={[localEvents, lastRefreshTime, creatorNames, refreshing]}
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
    opacity: 0.8,
  },
})

export default AllEvents
