import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/Colors';
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent';
import AllEvents from '@/components/AllEvents';
import StudyScheduler from '@/components/StudyScheduler';

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  isStudySession?: boolean;
}

interface CustomCalendarProps {
  onBack: () => void;
}

interface AllEventsProps {
  onBack: () => void;
  events: Event[];
  onAddToCalendar: (event: Event) => void;
}

interface AddEventProps {
  onBack: () => void;
  onAddEvent: (event: Event) => void;
  events: Event[];
  onDeleteEvent: (id: number) => void;
}

export default function MainPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showStudyScheduler, setShowStudyScheduler] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

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
    loadEvents();
  }, []);

  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Failed to save events', error);
    }
  };

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

  const handleDeleteEvent = (id: number) => {
    const updatedEvents = events.filter((event) => event.id !== id);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  const onScheduleSession = (session: { date: Date; friends: string[] }) => {
    const newEvent: Event = {
      id: Date.now(),
      title: `Study Session with ${session.friends.join(', ')}`,
      date: session.date.toISOString(),
      description: '',
      isStudySession: true,
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Events</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
