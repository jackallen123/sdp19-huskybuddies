//Imports
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { COLORS } from '@/constants/Colors'; 
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent'; 
import AllEvents from '@/components/AllEvents'; 
import StudyScheduler from '@/components/StudyScheduler'; 

//Interface setup for database 
interface Event {
  id: number; 
  title: string; 
  date: string; 
  description: string; 
  isadded?: boolean; 
}

interface StudySession {
  id: number; 
  title: string; 
  date: string; 
  friends: string[]; 
}

//Allows navigation between pages
export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);

  //Manage events and study sessions
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  //Load events and study sessions from AsyncStorage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEvents = await AsyncStorage.getItem('events'); 
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents)); 
        }
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    const loadSessions = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('studySessions'); 
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions)); 
        }
      } catch (error) {
        console.error('Failed to load study sessions', error);
      }
    };

    loadEvents();
    loadSessions();
  }, []); 

  //Save events to AsyncStorage
  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents)); 
    } catch (error) {
      console.error('Failed to save events', error); 
    }
  };

  // Save study sessions to AsyncStorage
  const saveSessions = async (updatedSessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem('studySessions', JSON.stringify(updatedSessions)); 
    } catch (error) {
      console.error('Failed to save study sessions', error); 
    }
  };

  //Add a new event 
  const handleAddEvent = (event: Event) => {
    const eventExists = events.some(e => e.id === event.id); 
    if (!eventExists) {
      const updatedEvents = [...events, event];
      setEvents(updatedEvents); 
      saveEvents(updatedEvents); 
    } else {
      console.log('Event already exists, not adding duplicate'); 
    }
  };

  //Delete event
  const handleDeleteEvent = (id: number) => {
    const updatedEvents = events.filter((event) => event.id !== id); 
    saveEvents(updatedEvents); 
  };

  //Delete study session

  //Add a new study session
  const onScheduleSession = (session: { date: Date; friends: string[] }) => {
    const newStudySession: StudySession = {
      id: Date.now(), 
      title: `Study Session with ${session.friends.join(', ')}`,
      date: session.date.toISOString(), 
      friends: session.friends, 
    };
    const updatedSessions = [...sessions, newStudySession]; 
    setSessions(updatedSessions); 
    saveSessions(updatedSessions); 
  };

  // Format event time for display
  const formatEventTime = (eventDate: string) => {
    const event = new Date(eventDate);
    return event.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true, 
    });
  };

  //Multipage event/study session handling
  if (showCalendar) {
    return <CustomCalendar onBack={() => setShowCalendar(false)} />;
  }

  if (showStudyScheduler) {
    return (
      <StudyScheduler
        onBack={() => setShowStudyScheduler(false)} 
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
        onBack={() => setShowAllEvents(false)} 
        events={events}
        onAddToCalendar={handleAddEvent} 
      />
    );
  }

  if (showAddEvent) {
    return (
      <AddEvent
        onBack={() => setShowAddEvent(false)} // 
        onAddEvent={handleAddEvent} 
        events={events}
        onDeleteEvent={handleDeleteEvent} 
      />
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
}

//Styles to keep pages consistent 
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
    borderRadius: 1,
    justifyContent: 'space-between',
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