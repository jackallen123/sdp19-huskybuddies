import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '@/constants/Colors';
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent';
import AllEvents from '@/components/AllEvents';
import StudyScheduler from '@/components/StudyScheduler';
import { Timestamp } from 'firebase/firestore';
import { 
  AddStudySessionToDatabase, 
  DeleteStudySessionFromDatabase, 
  AddEventToDatabase, 
  DeleteEventFromDatabase, 
  FetchEventsFromDatabase,
  FetchStudySessionsFromDatabase
} from '@/backend/firebase/firestoreService';

// Interface setup for database 
interface Event {
  id: string;  
  title: string; 
  date: Timestamp; 
  description: string; 
  isadded?: boolean; 
}

interface StudySession {
  id: string;
  title: string;
  date: Timestamp;
  friends: string[];
};

// Allows navigation between pages
export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);

  // Manage events and study sessions
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true); 

  // Load events and study sessions from Firestore
  useEffect(() => {
    const unsubscribeEvents = FetchEventsFromDatabase(setEvents);
    const unsubscribeSessions = FetchStudySessionsFromDatabase(setSessions);

    // Loading is complete when data fetching is done
    setLoading(false);

    return () => {
      unsubscribeEvents();
      unsubscribeSessions();
    };
  }, []); 

  // Add a new event to Firestore
  const handleAddEvent = async (event: Event) => {
    if (!event.date) {
      console.error('Event date is missing for event:', event);
      return;
    }
  };

  // Delete event from Firestore
  const handleDeleteEvent = async (id: string) => {  
    await DeleteEventFromDatabase(id); 
  };

  // Add a new study session to Firestore
  const onScheduleSession = async (session: { date: Date; friends: string[] }) => {
    if (!(session.date instanceof Date) || isNaN(session.date.getTime())) {
      console.error('Invalid session date:', session.date);
      return;
    }

    const newStudySession: StudySession = {
      id: Date.now().toString(),
      title: `Study Session with ${session.friends.join(', ')}`,
      date: Timestamp.fromDate(session.date), 
      friends: session.friends,
    };
    
    await AddStudySessionToDatabase(newStudySession.id, newStudySession.title, newStudySession.date, newStudySession.friends);
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
    const startOfWeek = getStartOfWeek(date);
    startOfWeek.setDate(startOfWeek.getDate() + 6); 
    return startOfWeek;
  };

  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());

  // Filter events to only include those within the current week
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
  

  // Multipage event/study session handling
  if (showCalendar) {
    return <CustomCalendar onBack={() => setShowCalendar(false)} />;
  }

  if (showStudyScheduler) {
    return (
      <StudyScheduler
        onBack={() => setShowStudyScheduler(false)} 
        onSchedule={(session) =>
          onScheduleSession({
            date: new Date(session.date.toDate()), 
            friends: session.friends,
          })
        }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scheduler</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.eventsWrapper}>
          <Text style={styles.sectionTitle}>Your Upcoming Items:</Text>
          <ScrollView style={styles.eventsList}>
            {filteredEvents.length > 0 ? (
              filteredEvents
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
                })
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
            <Text style={styles.buttonText}>Add An Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowStudyScheduler(true)}>
            <Text style={styles.buttonText}>Schedule a Study Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => setShowCalendar(true)}>
            <Text style={styles.buttonText}>View Calendar</Text>
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventItemText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  buttonWrapper: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
    textAlign: 'center',
    marginTop: 10,
  },
});
