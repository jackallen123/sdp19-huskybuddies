import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from "@/backend/firebase/firebaseConfig"; 
import { collection, getDocs, doc, updateDoc, query, Timestamp } from 'firebase/firestore';
import { COLORS } from '@/constants/Colors';
import { FetchStudySessionsFromDatabase } from '@/backend/firebase/firestoreService';

// Event interface 
interface Event {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  isadded?: boolean;
}

// Study session interface
interface StudySession {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch events and study sessions from Firestore
  useEffect(() => {
    const loadItems = async () => {
      try {
        // Fetch events
        const eventsQuery = query(collection(db, "Events"));
        const eventSnapshot = await getDocs(eventsQuery);
        const fetchedEvents: Event[] = [];
        
        eventSnapshot.forEach((docSnapshot) => {
          const eventData = docSnapshot.data();
          const event: Event = {
            id: docSnapshot.id,
            title: eventData.title,
            description: eventData.description,
            date: eventData.date, // Keep it as a Timestamp
            isadded: eventData.isadded ?? false,
          };
          fetchedEvents.push(event);
        });

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    loadItems();

    // Fetch study sessions in real-time
    const unsubscribe = FetchStudySessionsFromDatabase(setStudySessions);

    // Cleanup the listener when the component is unmounted
    return () => unsubscribe();
  }, []);

  // Update event to Firestore
  const handleToggleEvent = async (event: Event) => {
    try {
      const eventRef = doc(db, "Events", event.id);
      await updateDoc(eventRef, {
        isadded: !event.isadded, // Toggle the isadded field
      });

      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id ? { ...e, isadded: !e.isadded } : e
        )
      );
    } catch (error) {
      console.error("Error updating event: ", error);
    }
  };

  // Function to get events and study sessions for the selected date
  const getItemsForDate = (date: Date): (Event | StudySession)[] => {
    const filteredEvents = events.filter(
      (event) => event.date.toDate().toDateString() === date.toDateString()
    );
    const filteredStudySessions = studySessions.filter(
      (studySession) => studySession.date.toDate().toDateString() === date.toDateString()
    );
    return [...filteredEvents, ...filteredStudySessions];
  };

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Function to get days in a month
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
    const daysArray: (Date | null)[] = Array(firstDay).fill(null);
  
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    while (daysArray.length % 7 !== 0) {
      daysArray.push(null);
    }
  
    return daysArray;
  };

  // Function to format the date
  const formatDate = (date: Date) => {
    return `${date.toLocaleString('default', { weekday: 'long' })}, ${date.toLocaleDateString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>My Calendar</Text>
        </View>
      </View>

      {/* Calendar Navigation */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthContainer}>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back-outline" size={24} color={COLORS.UCONN_NAVY} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward-outline" size={24} color={COLORS.UCONN_NAVY} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysContainer}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.day}>{day}</Text>
          ))}
        </View>

        {/* Dates */}
        <View style={styles.datesContainer}>
          {getDaysInMonth(currentDate).map((date: Date | null, index: number) => (
            date ? (
              <TouchableOpacity
                key={index}
                style={[styles.dateContainer, isToday(date) ? styles.highlightedDate : styles.date]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={styles.dateText}>{date.getDate()}</Text>
                {getItemsForDate(date).length > 0 && (
                  <View style={styles.eventIndicator} />
                )}
              </TouchableOpacity>
            ) : (
              <View key={index} style={styles.dateContainer} />
            )
          ))}
        </View>
      </View>

      {/* Event and Study Session List */}
      <View style={styles.eventListContainer}>
        <Text style={styles.eventListTitle}>Your Items:</Text>
        {selectedDate ? (
          <ScrollView contentContainerStyle={styles.eventListContent}>
            {getItemsForDate(selectedDate).map((item) => (
              <View key={item.id} style={styles.eventItem}>
                <Text style={styles.eventItemText}>
                  {item.title} on {new Date(item.date.toDate()).toLocaleDateString()} at{" "}
                  {new Date(item.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEventsText}>Select a date to view items.</Text>
        )}
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
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.UCONN_NAVY,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  monthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  day: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateContainer: {
    width: '13%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    backgroundColor: COLORS.UCONN_WHITE,
  },
  highlightedDate: {
    backgroundColor: COLORS.HIGHLIGHT,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.EVENT_COLOR,
    marginTop: 4,
  },
  eventListContainer: {
    padding: 16,
    backgroundColor: COLORS.UCONN_WHITE,
    flex: 1,
  },
  eventListContent: {
    paddingBottom: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventItemText: {
    fontSize: 16,
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
  },
});
