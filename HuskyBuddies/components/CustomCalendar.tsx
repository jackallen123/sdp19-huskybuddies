import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
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
  INPUT_BG: '#F5F5F5',
  BORDER_COLOR: '#DDDDDD',
  ERROR_COLOR: '#FF3B30',
};

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventHour, setNewEventHour] = useState<string>('');
  const [newEventMinute, setNewEventMinute] = useState<string>('');
  const [isAM, setIsAM] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
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

  const handleAddEvent = () => {
    if (selectedDate && newEventTitle && newEventHour && newEventMinute) {
      const formattedTime = `${newEventHour}:${newEventMinute} ${isAM ? 'AM' : 'PM'}`;
      const newEvent: Event = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date(selectedDate),
        title: newEventTitle,
        time: formattedTime,
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);
      setNewEventTitle('');
      setNewEventHour('');
      setNewEventMinute('');
      setIsAM(true);
      setSelectedDate(null);
      setErrorMessage(null);
    } else {
      setErrorMessage('Please fill in all fields.');
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
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
            <TouchableOpacity
              key={index}
              style={[
                styles.dateContainer,
                date && isToday(date) ? styles.highlightedDate : styles.date,
              ]}
              onPress={() => handleDateClick(date)}
            >
              {date && <Text style={styles.dateText}>{date.getDate()}</Text>}
              {date && getEventsForDate(date).map(event => (
                <View key={event.id} style={styles.eventContainer}>
                  <Text style={styles.eventText}>{event.title}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Event Form */}
      {selectedDate && (
        <View style={styles.addEventContainer}>
          <Text style={styles.addEventTitle}>Add Event for {selectedDate.toDateString()}</Text>
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <TextInput
            placeholder="Event Title"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            style={styles.input}
          />
          <View style={styles.timeContainer}>
            <TextInput
              placeholder="HH"
              value={newEventHour}
              onChangeText={setNewEventHour}
              style={styles.timeInput}
              keyboardType="numeric"
              maxLength={2} // Limit to 2 digits
            />
            <Text>:</Text>
            <TextInput
              placeholder="MM"
              value={newEventMinute}
              onChangeText={setNewEventMinute}
              style={styles.timeInput}
              keyboardType="numeric"
              maxLength={2} // Limit to 2 digits
            />
            {/* AM/PM Button Container */}
            <View style={styles.amPmContainer}>
              <TouchableOpacity onPress={() => setIsAM(true)}>
                <Text style={[styles.amPmButton, isAM && styles.amPmSelected]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsAM(false)}>
                <Text style={[styles.amPmButton, !isAM && styles.amPmSelected]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={handleAddEvent} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Event List */}
      <View style={styles.eventListContainer}>
        <Text style={styles.eventListTitle}>Your Events:</Text>
        {events.length === 0 ? (
          <Text style={styles.noEventsText}>No events yet.</Text>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventItemText}>{event.title} - {event.time}</Text>
              <TouchableOpacity onPress={() => handleDeleteEvent(event.id)}>
                <Text style={styles.deleteEventText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
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
    fontSize: 24,
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
    color: COLORS.UCONN_NAVY,
  },
  eventContainer: {
    marginTop: 4,
    backgroundColor: COLORS.EVENT_COLOR,
    padding: 4,
    borderRadius: 4,
  },
  eventText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 12,
  },
  addEventContainer: {
    padding: 16,
    backgroundColor: COLORS.UCONN_GREY,
  },
  addEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.INPUT_BG,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: COLORS.INPUT_BG,
    padding: 8,
    width: 50,
    textAlign: 'center',
    borderRadius: 4,
  },
  amPmContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  amPmButton: {
    fontSize: 18,
    padding: 8,
    marginHorizontal: 4,
  },
  amPmSelected: {
    fontWeight: 'bold',
    color: COLORS.HIGHLIGHT,
  },
  addButton: {
    backgroundColor: COLORS.BUTTON_BG,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.ERROR_COLOR,
    fontSize: 14,
    marginBottom: 8,
  },
  eventListContainer: {
    padding: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 8,
    backgroundColor: COLORS.UCONN_GREY,
    borderRadius: 4,
  },
  eventItemText: {
    fontSize: 14,
  },
  deleteEventText: {
    color: COLORS.ERROR_COLOR,
    fontWeight: 'bold',
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
  },
});
