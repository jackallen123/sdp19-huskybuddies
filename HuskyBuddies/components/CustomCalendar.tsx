//Imports
import React, { useState, useEffect } from 'react';
import { COLORS } from '@/constants/Colors'; 
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Interface setup for database 
type Event = {
  id: string;
  date: Date;
  title: string;
  time: string;
  isadded?: boolean; 
};

type StudySession = {
  id: string;
  date: Date;
  title: string;
  time: string;
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  //Allows managment of current date, events, study sessions, and selected date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  //Load saved events and study sessions from AsyncStorage
  useEffect(() => {
    const loadItems = async () => {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        const parsedEvents: Event[] = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          date: new Date(event.date),
        }));
        setEvents(parsedEvents);
      }
      const storedSessions = await AsyncStorage.getItem('studySessions');
      if (storedSessions) {
        const parsedSessions: StudySession[] = JSON.parse(storedSessions).map((session: any) => ({
          ...session,
          date: new Date(session.date),
        }));
        setStudySessions(parsedSessions);
      }
    };

    loadItems();
  }, []);

  //Update events and study sessions to AsyncStorage 
  useEffect(() => {
    const saveItems = async () => {
      const eventsToSave = events.map(event => ({
        ...event,
        date: event.date.toISOString(),
      }));
      await AsyncStorage.setItem('events', JSON.stringify(eventsToSave));
      const sessionsToSave = studySessions.map(session => ({
        ...session,
        date: session.date.toISOString(),
      }));
      await AsyncStorage.setItem('studySessions', JSON.stringify(sessionsToSave));
    };

    saveItems();
  }, [events, studySessions]);

  //Function to calculate the days of the month to display on the calendar
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: (Date | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    //Fill in the empty slots before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    //Add the days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    //Fill in the empty slots after the last day of the month to complete the week
    const remainingSlots = 7 - (days.length % 7);
    for (let i = 0; i < remainingSlots && remainingSlots < 7; i++) {
      days.push(null);
    }

    return days;
  };

  //Functions to navigate to the previous and next month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  //Handle date selection 
  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  //Function to get all events and study sessions in calendar
  const getItemsForDate = (date: Date): (Event | StudySession)[] => {
    const eventsOnDate = events.filter(event => event.date.toDateString() === date.toDateString());
    const sessionsOnDate = studySessions.filter(session => session.date.toDateString() === date.toDateString());
    return [...eventsOnDate, ...sessionsOnDate];
  };

  //Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  //Function to format the time for an event or study session 
  const formatItemTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  //Function to format the full date and weekday for display
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
          <TouchableOpacity onPress={handlePrevMonth}>
            <Ionicons name="chevron-back-outline" size={24} color={COLORS.UCONN_NAVY} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Ionicons name="chevron-forward-outline" size={24} color={COLORS.UCONN_NAVY} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysContainer}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.day}>
              {day}
            </Text>
          ))}
        </View>

        {/* Days of the month */}
        <View style={styles.datesContainer}>
          {getDaysInMonth(currentDate).map((date, index) => (
            date ? (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateContainer,
                  isToday(date) ? styles.highlightedDate : styles.date,
                  getItemsForDate(date).length > 0 ? styles.eventDay : {},
                ]}
                onPress={() => handleDateClick(date)}
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

      {/* Today's Date */}
      <View style={styles.todayContainer}>
        <Text style={styles.todayText}>Today's Date: {formatDate(new Date())}</Text>
      </View>

      {/* Event List */}
      <View style={styles.eventListContainer}>
        <Text style={styles.eventListTitle}>Your Items:</Text>
        {selectedDate ? (
          getItemsForDate(selectedDate).map((item) => (
            <View key={item.id} style={styles.eventItem}>
              <Text style={styles.eventItemText}>
                {item.title} on {new Date(item.date).toLocaleDateString()} at {formatItemTime(item.date)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEventsText}>Select a date to view items.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

//Styles to keep pages consistent 
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
  eventDay: {
    backgroundColor: COLORS.EVENT_COLOR,
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
  todayContainer: {
    padding: 16,
    backgroundColor: COLORS.UCONN_GREY,
  },
  todayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventListContainer: {
    padding: 16,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  eventItemText: {
    fontSize: 16,
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
  },
  errorText: {
    color: COLORS.ERROR_COLOR,
  },
});
