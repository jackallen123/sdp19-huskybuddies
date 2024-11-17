import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Event = {
  id: string;
  date: Date;
  title: string;
  time: string;
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COLORS = {
  UCONN_NAVY: '#0E1E45',
  UCONN_WHITE: '#FFFFFF',
  UCONN_GREY: '#A7A9AC',
  HIGHLIGHT: '#FFD700',
  EVENT_COLOR: '#4A90E2',
  BUTTON_BG: '#0E1E45',
  BORDER_COLOR: '#DDDDDD',
  ERROR_COLOR: '#FF3B30',
};

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        const parsedEvents: Event[] = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          date: new Date(event.date),
        }));
        setEvents(parsedEvents);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const saveEvents = async () => {
      const eventsToSave = events.map(event => ({
        ...event,
        date: event.date.toISOString(),
      }));
      await AsyncStorage.setItem('events', JSON.stringify(eventsToSave));
    };

    saveEvents();
  }, [events]);

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: (Date | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Fill in the empty slots before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const remainingSlots = 7 - (days.length % 7);
    for (let i = 0; i < remainingSlots && remainingSlots < 7; i++) {
      days.push(null);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => event.date.toDateString() === date.toDateString());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatEventTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

      {/* Calendar */}
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

        {/* Days */}
        <View style={styles.datesContainer}>
          {getDaysInMonth(currentDate).map((date, index) => (
            date ? (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateContainer,
                  isToday(date) ? styles.highlightedDate : styles.date,
                  getEventsForDate(date).length > 0 ? styles.eventDay : {},
                ]}
                onPress={() => handleDateClick(date)}
              >
                <Text style={styles.dateText}>{date.getDate()}</Text>
                {getEventsForDate(date).length > 0 && (
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
        <Text style={styles.eventListTitle}>Your Events:</Text>
        {selectedDate ? (
          getEventsForDate(selectedDate).map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventItemText}>
                {event.title} on {new Date(event.date).toLocaleDateString()} at {formatEventTime(event.date)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEventsText}>Select a date to view events.</Text>
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
  eventDay: {
    backgroundColor: COLORS.EVENT_COLOR,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  eventIndicator: {
    backgroundColor: COLORS.EVENT_COLOR,
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  todayContainer: {
    padding: 16,
    alignItems: 'center',
  },
  todayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  eventListContainer: {
    padding: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  eventItemText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
  },
});
