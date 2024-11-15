import { COLORS } from '@/constants/Colors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent';
import AllEvents from '@/components/AllEvents';
import StudyScheduler from '@/components/StudyScheduler';

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
}

export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<number[]>([]);
  const [studyScheduleEvents, setStudyScheduleEvents] = useState<Event[]>([]); // New state for study sessions

  // Load events and calendar events from AsyncStorage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEvents = await AsyncStorage.getItem('events');
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents));
          console.log('Loaded events from AsyncStorage:', savedEvents);
        } else {
          console.log('No saved events found');
        }
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    const loadCalendarEvents = async () => {
      try {
        const savedCalendarEvents = await AsyncStorage.getItem('calendarEvents');
        if (savedCalendarEvents) {
          setCalendarEvents(JSON.parse(savedCalendarEvents));
          console.log('Loaded calendar events from AsyncStorage:', savedCalendarEvents);
        } else {
          console.log('No saved calendar events found');
        }
      } catch (error) {
        console.error('Failed to load calendar events', error);
      }
    };

    const loadStudyScheduleEvents = async () => {
      try {
        const savedStudyScheduleEvents = await AsyncStorage.getItem('studyScheduleEvents');
        if (savedStudyScheduleEvents) {
          setStudyScheduleEvents(JSON.parse(savedStudyScheduleEvents));
          console.log('Loaded study schedule events from AsyncStorage:', savedStudyScheduleEvents);
        } else {
          console.log('No saved study schedule events found');
        }
      } catch (error) {
        console.error('Failed to load study schedule events', error);
      }
    };

    loadEvents();
    loadCalendarEvents();
    loadStudyScheduleEvents(); // Load study schedule events
  }, []);

  // Save events, calendar events, and study schedule events to AsyncStorage
  useEffect(() => {
    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem('events', JSON.stringify(events));
        console.log('Saved events to AsyncStorage:', events);
      } catch (error) {
        console.error('Failed to save events', error);
      }
    };

    if (events.length > 0) {
      saveEvents();
    }
  }, [events]);

  useEffect(() => {
    const saveCalendarEvents = async () => {
      try {
        await AsyncStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        console.log('Saved calendar events to AsyncStorage:', calendarEvents);
      } catch (error) {
        console.error('Failed to save calendar events', error);
      }
    };

    if (calendarEvents.length > 0) {
      saveCalendarEvents();
    }
  }, [calendarEvents]);

  // New useEffect for saving study schedule events
  useEffect(() => {
    const saveStudyScheduleEvents = async () => {
      try {
        await AsyncStorage.setItem('studyScheduleEvents', JSON.stringify(studyScheduleEvents));
        console.log('Saved study schedule events to AsyncStorage:', studyScheduleEvents);
      } catch (error) {
        console.error('Failed to save study schedule events', error);
      }
    };

    if (studyScheduleEvents.length > 0) {
      saveStudyScheduleEvents();
    }
  }, [studyScheduleEvents]);

  // Handlers for adding and deleting events
  const handleAddEvent = (event: Event) => {
    setEvents((prevEvents) => [...prevEvents, event]);
  };

  const handleDeleteEvent = (id: number) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
  };

  const handleAddToCalendar = (event: Event) => {
    if (!calendarEvents.includes(event.id)) {
      setCalendarEvents((prevCalendarEvents) => [...prevCalendarEvents, event.id]);
    }
  };

  const onScheduleSession = (session: { date: string; friends: string[] }) => {
    const newEvent: Event = {
      id: Date.now(),
      title: `Study Session with ${session.friends.join(', ')}`,
      date: session.date,
      description: ``,
    };
    setStudyScheduleEvents((prevStudyScheduleEvents) => [...prevStudyScheduleEvents, newEvent]);
    setCalendarEvents((prevCalendarEvents) => [...prevCalendarEvents, newEvent.id]);
    setEvents((prevEvents) => [...prevEvents, newEvent]); // Optional: Add to main events if you want
  };

  const formatEventTime = (eventDate: string) => {
    const event = new Date(eventDate);
    return event.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  if (showCalendar) {
    return <CustomCalendar onBack={() => setShowCalendar(false)} />;
  }

  if (showStudyScheduler) {
    return <StudyScheduler onBack={() => setShowStudyScheduler(false)} onSchedule={onScheduleSession} />;
  }

  if (showAllEvents) {
    return (
      <AllEvents
        onBack={() => setShowAllEvents(false)}
        events={events}
        onAddToCalendar={handleAddToCalendar}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Events</Text>
      </View>

      <View style={styles.viewAllButtonWrapper}>
        <Text style={{ color: 'black', fontSize: 16 }}>
          Your Upcoming Events:
        </Text>
        {events.length > 0 ? (
          events.map((event) => (
            <Text key={event.id} style={styles.eventItemText}>
              {event.title} on {new Date(event.date).toLocaleDateString()} at {formatEventTime(event.date)}
            </Text>
          ))
        ) : (
          <Text>No events this week</Text>
        )}
      </View>

      <View style={styles.viewAllButtonWrapper}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowAllEvents(true)}
        >
          <Text style={styles.viewAllButtonText}>View Student Added Events</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewAllButtonWrapper}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowAddEvent(true)}
        >
          <Text style={styles.viewAllButtonText}>Add An Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewAllButtonWrapper}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowStudyScheduler(true)}
        >
          <Text style={styles.viewAllButtonText}>Schedule a Study Session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewAllButtonWrapper}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.viewAllButtonText}>View Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  viewAllButtonWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  viewAllButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
  eventItemText: {
    color: 'black',
    fontSize: 16,
  },
});
