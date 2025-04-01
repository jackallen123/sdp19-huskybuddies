import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '@/constants/Colors';
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent';
import AllEvents from '@/components/AllEvents';
import StudyScheduler from '@/components/StudyScheduler';
import { Timestamp, doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import {  
  DeleteStudySessionFromDatabase,  
  DeleteEventFromDatabase, 
  FetchAllEventsFromDatabase,
  FetchStudySessionsFromDatabase,
  AddEventToDatabase,
} from '@/backend/firebase/firestoreService';
import { auth, db } from '@/backend/firebase/firebaseConfig';

// Event setup for database 
interface Event {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  isadded?: boolean;
  createdBy: string;
}

// Study session setup for database 
interface StudySession {
  id: string;
  title: string;
  date: Timestamp;
  friends: string[];
}

// Get allEvents for current user from database
const SyncAllEventsFromDatabase = async (currentUserId: string, setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const allEvents: Event[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const creatorId = userDoc.id;

      const userEventsRef = collection(db, "users", creatorId, "events");
      const eventsSnapshot = await getDocs(userEventsRef);

      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data();
        const eventId = eventDoc.id;

        if (!data.title || !data.date || !data.description) {
          continue;
        }

        const event: Event = {
          id: eventId,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: false, 
          createdBy: creatorId,
        };

        // Skip the current user - we already have their events from the listener
      if (creatorId === currentUserId) {
        continue;
        };

        allEvents.push(event);
      }
    }

    // Copy all events to the current user's allEvents subcollection
    const currentUserAllEventsRef = collection(db, "users", currentUserId, "allEvents");
    const currentUserAllEventsSnapshot = await getDocs(currentUserAllEventsRef);
    
    // Create a map of existing events with their isadded status
    const existingEvents: Record<string, boolean> = {};
    currentUserAllEventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      existingEvents[doc.id] = data.isadded || false;
    });

    const batch = writeBatch(db);

    // Update or add each event to the current user's allEvents
    for (const event of allEvents) {
      const isAdded = event.createdBy === currentUserId 
        ? (event.isadded || false)
        : (existingEvents[event.id] || false);
      
      const allEventsRef = doc(db, "users", currentUserId, "allEvents", event.id);
      batch.set(allEventsRef, {
        title: event.title,
        date: event.date,
        description: event.description,
        isadded: isAdded,
        createdBy: event.createdBy,
      });
    }

    await batch.commit();
    
    // Update state with all events isadded status
    if (setEvents) {
      const eventsWithStatus = allEvents.map(event => ({
        ...event,
        isadded: event.createdBy === currentUserId 
          ? (event.isadded || false)
          : (existingEvents[event.id] || false),
      }));
      setEvents(eventsWithStatus);
    }

    return allEvents;
  } catch (error) {
    console.error("Error syncing all events:", error);
    throw error;
  }
};

// Multipage functionality 
export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);
  const currentUserId = auth.currentUser?.uid || '';

  // Manage events and study sessions
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true); 

  // Sync all events
  const syncAllEvents = async () => {
    try {
      setLoading(true);
      await SyncAllEventsFromDatabase(currentUserId, setEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error syncing events:", error);
      setLoading(false);
    }
  };

  // Fetch events and study sessions
  useEffect(() => {
    const unsubscribeEvents = FetchAllEventsFromDatabase(currentUserId, setEvents);
    const unsubscribeSessions = FetchStudySessionsFromDatabase(currentUserId, setSessions);
    
    // Sync all events when the component mounts
    syncAllEvents();
    
    setLoading(false);
    
    return () => {
      unsubscribeEvents();
      unsubscribeSessions();
    };
  }, [currentUserId]); 
  
  // Add a new event to database
  const handleAddEvent = async (event: Event) => {
    if (!event.date) {
      console.error('Event date is missing for event:', event);
      return;
    }
    
    // Ensure createdBy is set
    const eventWithCreator = {
      ...event,
      createdBy: event.createdBy || currentUserId
    };
    
    await AddEventToDatabase(
      currentUserId, 
      eventWithCreator.id, 
      eventWithCreator.title, 
      eventWithCreator.date, 
      eventWithCreator.description, 
      eventWithCreator.isadded || false
    );
  };

  // Delete event from database
  const handleDeleteEvent = async (id: string) => {  
    await DeleteEventFromDatabase(currentUserId, id);  
  };
  
  // Delete study session from database
  const handleDeleteStudySession = async (sessionId: string) => {  
    try {
      await DeleteStudySessionFromDatabase(currentUserId, sessionId); 
    } catch (error) {
      console.error('Error deleting study session:', error);
    }
  };

  // Add a new study session to database
  const ScheduleSession = async (session: { date: Date; friends: string[] }) => {
    if (!(session.date instanceof Date) || isNaN(session.date.getTime())) {
      console.error('Invalid session date:', session.date);
      return;
    }

    const newStudySession: StudySession = {
      id: '',
      title: `Study Session with ${session.friends.join(', ')}`,
      date: Timestamp.fromDate(session.date), 
      friends: session.friends,
    };
  };

  // Format event time for display
  const formatEventTime = (eventDate: Date) => {
    if (isNaN(eventDate.getTime())) {
      console.error('Invalid event date:', eventDate); 
      return 'Invalid date'; 
    }

    return eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  // Get the start and end of the current week
  const getStartOfWeek = (date: Date) => {
    const day = date.getDay(),
          diff = date.getDate() - day + (day == 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const startOfWeek = getStartOfWeek(new Date(date));
    startOfWeek.setDate(startOfWeek.getDate() + 6); 
    return startOfWeek;
  };

  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());

  // Filter events to only include those within the current week including today
  const filteredEvents = events.filter((event) => {
    const eventDate = event.date?.toDate();
    if (!eventDate) {
      console.error('Invalid event date:', event);
      return false;
    }
    const today = new Date();
    return (
      (eventDate >= startOfWeek && eventDate <= endOfWeek) ||
      eventDate.toDateString() === today.toDateString()
    );
  });

  // Filter study sessions to only include those within the current week including today
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = session.date?.toDate();
    if (!sessionDate) {
      console.error('Invalid session date:', session);
      return false;
    }
    const today = new Date();
    return (
      sessionDate >= startOfWeek && sessionDate <= endOfWeek) ||
      sessionDate.toDateString() === today.toDateString()
  });

  // Multipage event/study/calendar session handling
  if (showCalendar) {
    return <CustomCalendar userId={currentUserId} onBack={() => setShowCalendar(false)} />;
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
    );
  }

  if (showAllEvents) {
    return (
      <AllEvents
        onBack={() => setShowAllEvents(false)} 
        events={events}
        onAddToCalendar={handleAddEvent} 
      />
    );
  }

  if (showAddEvent) {
    return (
      <AddEvent
        onBack={() => setShowAddEvent(false)} 
        onAddEvent={handleAddEvent} 
        events={events}  
        onDeleteEvent={handleDeleteEvent} 
      />
    );
  }

  // Check if loading and if there are no events
  if (loading) {
    return <Text>Loading...</Text>;
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
          {(filteredEvents.some(event => event.isadded) || filteredSessions.length > 0) ? (
              <>
                {filteredEvents
                  .filter((event) => event.isadded)  
                  .map((event) => {
                    const eventDate = event.date?.toDate();
                    if (!eventDate) {
                      console.error('Invalid event date:', event);
                      return null; 
                    }

                    return (
                      <View key={event.id} style={styles.eventItem}>
                        <Text style={styles.eventItemText}>
                          {event.title} on {eventDate.toLocaleDateString()} at {formatEventTime(eventDate)}
                        </Text>
                      </View>
                    );
                  })}
                {filteredSessions.map((session) => {
                  const sessionDate = session.date?.toDate();
                  if (!sessionDate) {
                    console.error('Invalid session date:', session);
                    return null; 
                  }

                  return (
                    <View key={session.id} style={styles.eventItem}>
                      <Text style={styles.eventItemText}>
                        {session.title} on {sessionDate.toLocaleDateString()} at {formatEventTime(sessionDate)}
                      </Text>
                    </View>
                  );
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
  );
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});