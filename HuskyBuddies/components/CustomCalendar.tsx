import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  HIGHLIGHT: '#FFD700', // Gold color for highlighting
};

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventTime, setNewEventTime] = useState<string>('');

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: (Date | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null); // Empty slots for the days before the first of the month
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i)); // Actual days
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
    if (selectedDate && newEventTitle && newEventTime) {
      const newEvent: Event = {
        id: Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        title: newEventTitle,
        time: newEventTime,
      };
      setEvents([...events, newEvent]);
      setNewEventTitle('');
      setNewEventTime('');
      setSelectedDate(null);
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
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        {/* Centered Title */}
        <View style={styles.headerTextContainer}>
        </View>
      </View>

      {/* Month and Calendar Container */}
      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.button}>
            <Text style={styles.buttonText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth} style={styles.button}>
            <Text style={styles.buttonText}>{">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Days of the Week */}
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.day}>
              {day}
            </Text>
          ))}
          {/* Days in the Month */}
          {getDaysInMonth(currentDate).map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateContainer,
                date && isToday(date) ? styles.highlightedDate : null, // Apply highlight if it's today
              ]}
              onPress={() => date && handleDateClick(date)}
            >
              {date ? (
                <>
                  <Text style={styles.dateText}>{date.getDate()}</Text>
                  {getEventsForDate(date).map(event => (
                    <View key={event.id} style={styles.eventContainer}>
                      <Text style={styles.eventText}>
                        {event.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEvent(event.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.dateText}></Text> // Render empty cell for padding
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Event Form */}
      {selectedDate ? (
        <View style={styles.addEventContainer}>
          <Text>Add Event for {selectedDate.toDateString()}</Text>
          <TextInput
            placeholder="Event Title"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Event Time"
            value={newEventTime}
            onChangeText={setNewEventTime}
            style={styles.input}
            keyboardType="numeric" // Use appropriate input for time
          />
          <Button onPress={handleAddEvent} title="Add Event" />
        </View>
      ) : null}

      {/* Event List */}
      <View style={styles.eventListContainer}>
        <Text>My Events:</Text>
        {events.length === 0 ? (
          <Text>No events scheduled.</Text>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.eventItem}>
              <Text>
                {event.title} on {event.date.toDateString()} at {event.time}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteEvent(event.id)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 3,
  },
  calendarContainer: {
    marginTop: 20, // Add space between header and calendar
    padding: 16,
  },
  monthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    padding: 10,
  },
  buttonText: {
    color: COLORS.UCONN_NAVY,
    fontSize: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  day: {
    width: '14.28%', // For 7 days in a week
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateContainer: {
    width: '14.28%', // For 7 days in a week
    padding: 5,
    alignItems: 'center',
  },
  dateText: {
    textAlign: 'center',
  },
  highlightedDate: {
    backgroundColor: COLORS.HIGHLIGHT, // Highlight the current day
    borderRadius: 5,
  },
  eventContainer: {
    backgroundColor: 'blue',
    borderRadius: 5,
    padding: 2,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  eventText: {
    color: 'white',
  },
  deleteButton: {
    padding: 2,
  },
  deleteButtonText: {
    color: 'white',
  },
  addEventContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'gray',
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 8,
    padding: 8,
  },
  eventListContainer: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
});
