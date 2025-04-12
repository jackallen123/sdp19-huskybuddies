import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { COLORS } from "@/constants/Colors"
import CustomCalendar from "@/components/CustomCalendar"
import AddEvent from "@/components/AddEvent"
import AllEvents from "@/components/AllEvents"
import StudyScheduler from "@/components/StudyScheduler"
import { Timestamp, doc, collection, getDocs, writeBatch } from "firebase/firestore"
import {
  DeleteStudySessionFromDatabase,
  DeleteEventFromDatabase,
  FetchAllEventsFromDatabase,
  FetchStudySessionsFromDatabase,
  AddEventToDatabase,
} from "@/backend/firebase/firestoreService"
import { auth, db } from "@/backend/firebase/firebaseConfig"

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

// Study session setup for database
interface StudySession {
  id: string
  title: string
  date: Timestamp
  friends: string[]
}

// Get allEvents for current user from database
const SyncAllEventsFromDatabase = async (
  currentUserId: string,
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
) => {
  try {
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const allEvents: Event[] = []

    for (const userDoc of usersSnapshot.docs) {
      const creatorId = userDoc.id

      const userEventsRef = collection(db, "users", creatorId, "events")
      const eventsSnapshot = await getDocs(userEventsRef)

      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data()
        const eventId = eventDoc.id

        if (!data.title || !data.date || !data.description) {
          continue
        }

        const event: Event = {
          id: eventId,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: data.isadded === true, 
          createdBy: data.createdBy,
        }

        // Skip the current user - we already have their events from the listener
        if (creatorId === currentUserId) {
          continue
        }

        allEvents.push(event)
      }
    }

    // Copy all events to the current user's allEvents subcollection
    const currentUserAllEventsRef = collection(db, "users", currentUserId, "allEvents")
    const currentUserAllEventsSnapshot = await getDocs(currentUserAllEventsRef)

    // Create a map of existing events with their isadded status
    const existingEvents: Record<string, boolean> = {}
    currentUserAllEventsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      existingEvents[doc.id] = data.isadded === true 
    })

    const batch = writeBatch(db)

    // Update or add each event to the current user's allEvents
    for (const event of allEvents) {
      const isAdded = event.createdBy === currentUserId ? event.isadded : existingEvents[event.id] || false

      const allEventsRef = doc(db, "users", currentUserId, "allEvents", event.id)
      batch.set(allEventsRef, {
        title: event.title,
        date: event.date,
        description: event.description,
        isadded: isAdded,
        createdBy: event.createdBy, 
      })
    }

    await batch.commit()

    // Update state with all events isadded status
    if (setEvents) {
      const eventsWithStatus = allEvents.map((event) => ({
        ...event,
        isadded: event.createdBy === currentUserId ? event.isadded : existingEvents[event.id] || false,
      }))
      setEvents(eventsWithStatus)
    }

    return allEvents
  } catch (error) {
    console.error("Error syncing all events:", error)
    throw error
  }
}

// Multipage functionality
export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showStudyScheduler, setShowStudyScheduler] = useState(false)
  const currentUserId = auth.currentUser?.uid || ""

  // Manage events and study sessions
  const [events, setEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [validationComplete, setValidationComplete] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Sync all events
  const syncAllEvents = async () => {
    try {
      setLoading(true)
      await SyncAllEventsFromDatabase(currentUserId, setEvents)
      setLoading(false)
    } catch (error) {
      console.error("Error syncing events:", error)
      setLoading(false)
    }
  }

  // Fetch events and study sessions
  useEffect(() => {
    const unsubscribeEvents = FetchAllEventsFromDatabase(currentUserId, setEvents)
    const unsubscribeSessions = FetchStudySessionsFromDatabase(currentUserId, setSessions)

    // Sync all events when the component mounts
    syncAllEvents()

    setLoading(false)

    return () => {
      unsubscribeEvents()
      unsubscribeSessions()
    }
  }, [currentUserId])

  // Validate events and study sessions when they change
  useEffect(() => {
    const validateItems = async () => {
      if (!events.length && !sessions.length) return
      setValidationComplete(false)

      try {
        // Validate events - check if they should still be in the user's calendar
        const validatedEvents = events.map((event) => {
          const isAdded = event.isadded === true

          // Check if the event date is valid for events
          let isValidDate = false
          try {
            const eventDate = event.date?.toDate()
            isValidDate = eventDate instanceof Date && !isNaN(eventDate.getTime())
          } catch (error) {
            console.error(`Invalid date for event ${event.id}:`, error)
          }

          return {
            ...event,
            isadded: isAdded && isValidDate,
          }
        })

       // Check if the event date is valid for events
        const validatedSessions = sessions.filter((session) => {
          try {
            const sessionDate = session.date?.toDate()
            return sessionDate instanceof Date && !isNaN(sessionDate.getTime())
          } catch (error) {
            console.error(`Invalid date for session ${session.id}:`, error)
            return false
          }
        })

        // Update state with validated items
        setEvents(validatedEvents)
        setSessions(validatedSessions)
      } catch (error) {
        console.error("Error validating items:", error)
      } finally {
        setValidationComplete(true)
      }
    }

    validateItems()
  }, [events.length, sessions.length])

  // Add a new event to database
  const handleAddEvent = async (event: Event) => {
    if (!event.date) {
      console.error("Event date is missing for event:", event)
      return
    }

    // Preserve the original creator information
    const creatorName = event.creatorName
    const creatorId = event.createdBy

    // Ensure all creator information is preserved
    const eventWithCreator = {
      ...event,
      createdBy: creatorId, 
      creatorName: creatorName,
      isadded: event.isadded === true,
    }

    await AddEventToDatabase(
      currentUserId,
      eventWithCreator.id,
      eventWithCreator.title,
      eventWithCreator.date,
      eventWithCreator.description,
      eventWithCreator.isadded,
      eventWithCreator.createdBy, 
      eventWithCreator.creatorName,
    )
  }

  // Delete event from database
  const handleDeleteEvent = async (id: string) => {
    await DeleteEventFromDatabase(currentUserId, id)
  }

  // Delete study session from database
  const handleDeleteStudySession = async (sessionId: string) => {
    try {
      await DeleteStudySessionFromDatabase(currentUserId, sessionId)
    } catch (error) {
      console.error("Error deleting study session:", error)
    }
  }

  // Add a new study session to database
  const ScheduleSession = async (session: { date: Date; friends: string[] }) => {
    if (!(session.date instanceof Date) || isNaN(session.date.getTime())) {
      console.error("Invalid session date:", session.date)
      return
    }

    const newStudySession: StudySession = {
      id: "",
      title: `Study Session with ${session.friends.join(", ")}`,
      date: Timestamp.fromDate(session.date),
      friends: session.friends,
    }
  }

  // Format event time for display
  const formatEventTime = (eventDate: Date) => {
    if (isNaN(eventDate.getTime())) {
      console.error("Invalid event date:", eventDate)
      return "Invalid date"
    }

    return eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  // Check if date is today
  const isDateTodayOrFuture = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Make the date be valid until midnight
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    // Check if date is not before today
    return compareDate >= today
  }

  // Check if a date is within the next 7 days (including today)
  const isWithinNextWeek = (date: Date): boolean => {
    // Create today's date with time set to midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create a date 7 days from today (inclusive of today)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7) // Today + 7 days
    nextWeek.setHours(23, 59, 59, 999) // End of the 7th day

    // Create a date object from the input date
    const compareDate = new Date(date)

    // Check if the date is between today and next week (inclusive)
    const isInRange = compareDate >= today && compareDate <= nextWeek

    return isInRange
  }

  // Filter events to only include today and the next 7 days
  const filteredEvents = events.filter((event) => {
    try {
      // First check if the event isadded
      if (event.isadded !== true) {
        return false
      }

      const eventDate = event.date?.toDate()
      if (!eventDate || isNaN(eventDate.getTime())) {
        return false
      }

      // Check if the event is today or in the future (not in the past) within the next 7 days (including today)
      const inTimeFrame = isWithinNextWeek(eventDate)
      return inTimeFrame
    } catch (error) {
      console.error(`Error filtering event ${event?.id}:`, error)
      return false
    }
  })

  // Filter study sessions from today and the next 7 days
  const filteredSessions = sessions.filter((session) => {
    try {
      const sessionDate = session.date?.toDate()
      if (!sessionDate || isNaN(sessionDate.getTime())) {
        return false
      }

      // Check if the session is today or in the future (not in the past)within the next 7 days (including today)
      const inTimeFrame = isWithinNextWeek(sessionDate)

      return inTimeFrame
    } catch (error) {
      console.error(`Error filtering session ${session?.id}:`, error)
      return false
    }
  })

  // Multipage event/study/calendar session handling
  if (showCalendar) {
    return <CustomCalendar userId={currentUserId} onBack={() => setShowCalendar(false)} />
  }

  if (showStudyScheduler) {
    return (
      <StudyScheduler
        onBack={() => setShowStudyScheduler(false)}
        onDeleteSession={handleDeleteStudySession}
        onSchedule={(session) =>
          ScheduleSession({
            date: new Date(session.date.toDate()),
            friends: session.friends,
          })
        }
        currentUserId={currentUserId}
      />
    )
  }

  if (showAllEvents) {
    return <AllEvents onBack={() => setShowAllEvents(false)} events={events} onAddToCalendar={handleAddEvent} />
  }

  if (showAddEvent) {
    return (
      <AddEvent
        onBack={() => setShowAddEvent(false)}
        onAddEvent={handleAddEvent}
        events={events}
        onDeleteEvent={handleDeleteEvent}
      />
    )
  }

  // Check if loading and if there are no events
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  // Formatting for page consistency
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scheduler</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.eventsWrapper}>
          <Text style={styles.sectionTitle}>Your Upcoming Items:</Text>
          <ScrollView style={styles.eventsList}>
            {filteredEvents.length > 0 || filteredSessions.length > 0 ? (
              <>
                {filteredEvents.map((event, index) => {
                  const eventDate = event.date?.toDate()
                  if (!eventDate) {
                    console.error("Invalid event date:", event)
                    return null
                  }

                  return (
                    <View key={`event-${event.id}-${index}`} style={styles.eventItem}>
                      <Text style={styles.eventItemText}>
                        {event.title} on {eventDate.toLocaleDateString()} at {formatEventTime(eventDate)}
                      </Text>
                    </View>
                  )
                })}
                {filteredSessions.map((session, index) => {
                  const sessionDate = session.date?.toDate()
                  if (!sessionDate) {
                    console.error("Invalid session date:", session)
                    return null
                  }

                  return (
                    <View key={`session-${session.id}-${index}`} style={styles.eventItem}>
                      <Text style={styles.eventItemText}>
                        {session.title} on {sessionDate.toLocaleDateString()} at {formatEventTime(sessionDate)}
                      </Text>
                    </View>
                  )
                })}
              </>
            ) : (
              <Text style={styles.noEventsText}>No upcoming items this week</Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowAllEvents(true)}>
            <Text style={styles.buttonText}>View All Events</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowAddEvent(true)}>
            <Text style={styles.buttonText}>Post An Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowStudyScheduler(true)}>
            <Text style={styles.buttonText}>Schedule a Study Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowCalendar(true)}>
            <Text style={styles.buttonText}>View Your Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  eventsWrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.UCONN_NAVY,
    marginBottom: 10,
  },
  eventsList: {
    maxHeight: 250,
  },
  eventItem: {
    backgroundColor: COLORS.UCONN_GREY,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  eventItemText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
    textAlign: "center",
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.UCONN_WHITE,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
})
