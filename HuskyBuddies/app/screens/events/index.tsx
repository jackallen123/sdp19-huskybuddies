import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For persistent storage
import { COLORS } from '@/constants/Colors'; // Custom color constants
import CustomCalendar from '@/components/CustomCalendar'; // Custom calendar component
import AddEvent from '@/components/AddEvent'; // Component for adding events
import AllEvents from '@/components/AllEvents'; // Component for viewing all events
import StudyScheduler from '@/components/StudyScheduler'; // Component for scheduling study sessions

// Interface for event objects
interface Event {
  id: number; // Unique identifier for each event
  title: string; // Event title
  date: string; // Event date (ISO string)
  description: string; // Event description
  isadded?: boolean; // Optional boolean indicating if the event is added to the calendar
}

// Interface for study session objects
interface StudySession {
  id: number; // Unique identifier for each study session
  title: string; // Study session title
  date: string; // Session date (ISO string)
  friends: string[]; // Array of friends attending the session
}

export default function MainPage() {
  // States for controlling component visibility
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);

  // State to manage events and study sessions
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Load events and study sessions from AsyncStorage when the component mounts
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEvents = await AsyncStorage.getItem('events'); // Retrieve saved events
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents)); // Parse and update state
        }
      } catch (error) {
        console.error('Failed to load events', error); // Log error if data fails to load
      }
    };

    const loadSessions = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('studySessions'); // Retrieve saved sessions
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions)); // Parse and update state
        }
      } catch (error) {
        console.error('Failed to load study sessions', error); // Log error if data fails to load
      }
    };

    loadEvents();
    loadSessions();
  }, []); // Empty dependency array ensures this runs only once

  // Save events to AsyncStorage
  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents)); // Store events as a JSON string
    } catch (error) {
      console.error('Failed to save events', error); // Log error if saving fails
    }
  };

  // Save study sessions to AsyncStorage
  const saveSessions = async (updatedSessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem('studySessions', JSON.stringify(updatedSessions)); // Store sessions as a JSON string
    } catch (error) {
      console.error('Failed to save study sessions', error); // Log error if saving fails
    }
  };

  // Add a new event to the events state and save it
  const handleAddEvent = (event: Event) => {
    const eventExists = events.some(e => e.id === event.id); // Check if event already exists
    if (!eventExists) {
      const updatedEvents = [...events, event]; // Add the new event to the array
      setEvents(updatedEvents); // Update state
      saveEvents(updatedEvents); // Persist updated events
    } else {
      console.log('Event already exists, not adding duplicate'); // Log duplicate event message
    }
  };

  // Delete an event by ID
  const handleDeleteEvent = (id: number) => {
    const updatedEvents = events.filter((event) => event.id !== id); // Remove the event from the array
    setEvents(updatedEvents); // Update state
    saveEvents(updatedEvents); // Persist updated events
  };

  // Schedule a new study session
  const onScheduleSession = (session: { date: Date; friends: string[] }) => {
    const newStudySession: StudySession = {
      id: Date.now(), // Use current timestamp as a unique ID
      title: `Study Session with ${session.friends.join(', ')}`, // Construct title with friends' names
      date: session.date.toISOString(), // Convert date to ISO string
      friends: session.friends, // Add friends to session
    };
    const updatedSessions = [...sessions, newStudySession]; // Add the new session to the array
    setSessions(updatedSessions); // Update state
    saveSessions(updatedSessions); // Persist updated sessions
  };

  // Format event time for display
  const formatEventTime = (eventDate: string) => {
    const event = new Date(eventDate);
    return event.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true, // Use 12-hour format
    });
  };

  // Conditional rendering for different views
  if (showCalendar) {
    return <CustomCalendar onBack={() => setShowCalendar(false)} />;
  }

  if (showStudyScheduler) {
    return (
      <StudyScheduler
        onBack={() => setShowStudyScheduler(false)} // Close scheduler
        onSchedule={(session) =>
          onScheduleSession({
            date: new Date(session.date),
            friends: session.friends,
          })
        }
      />
    );
  }

  if (showAllEvents) {
    return (
      <AllEvents
        onBack={() => setShowAllEvents(false)} // Close events view
        events={events}
        onAddToCalendar={handleAddEvent} // Add event to calendar
      />
    );
  }

  if (showAddEvent) {
    return (
      <AddEvent
        onBack={() => setShowAddEvent(false)} // Close add event view
        onAddEvent={handleAddEvent} // Handle adding an event
        events={events}
        onDeleteEvent={handleDeleteEvent} // Handle deleting an event
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Events</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Events List */}
        <View style={styles.eventsWrapper}>
          <Text style={styles.sectionTitle}>Your Upcoming Events:</Text>
          <ScrollView style={styles.eventsList}>
            {events.length > 0 ? (
              events.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventItemText}>
                    {event.title} on {new Date(event.date).toLocaleDateString()} at {formatEventTime(event.date)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEventsText}>No upcoming events</Text>
            )}
          </ScrollView>
        </View>

        {/* Buttons */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowAllEvents(true)}
          >
            <Text style={styles.buttonText}>View All Events</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowAddEvent(true)}
          >
            <Text style={styles.buttonText}>Add An Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowStudyScheduler(true)}
          >
            <Text style={styles.buttonText}>Schedule a Study Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.buttonText}>View Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for the main page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
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
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
    fontStyle: 'italic',
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
});
