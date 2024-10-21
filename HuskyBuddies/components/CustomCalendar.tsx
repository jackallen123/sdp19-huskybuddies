import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
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
  HIGHLIGHT: '#FFD700',
  EVENT_COLOR: '#4A90E2',
  BUTTON_BG: '#0E1E45', 
  INPUT_BG: '#F5F5F5',
  BORDER_COLOR: '#DDDDDD',
  ERROR_COLOR: '#FF3B30', // Red color for validation errors
};

export default function CustomCalendar({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventHour, setNewEventHour] = useState<string>(''); // Hours input
  const [newEventMinute, setNewEventMinute] = useState<string>(''); // Minutes input
  const [isAM, setIsAM] = useState<boolean>(true); // AM/PM state
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error message state

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
        date: selectedDate,
        title: newEventTitle,
        time: formattedTime,
      };
      setEvents([...events, newEvent]);
      setNewEventTitle('');
      setNewEventHour('');
      setNewEventMinute('');
      setIsAM(true);
      setSelectedDate(null);
      setErrorMessage(null); // Clear error message on success
    } else {
      setErrorMessage('Please fill in all fields.'); // Set error message
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
          <Text style={styles.headerText}>Calendar</Text>
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
                <Text style={[styles.amPmButton, isAM && styles.amPmSelected]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsAM(false)}>
                <Text style={[styles.amPmButton, !isAM && styles.amPmSelected]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
            <Text style={styles.addButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Event List */}
      <View style={styles.eventListContainer}>
        <Text style={styles.eventListTitle}>My Events</Text>
        {events.length === 0 ? (
          <Text style={styles.noEventsText}>No events scheduled.</Text>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventItemText}>
                {event.title} on {event.date.toDateString()} at {event.time}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteEvent(event.id)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.UCONN_NAVY} />
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
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarContainer: {
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
    color: COLORS.UCONN_NAVY,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  day: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dateContainer: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 10,
  },
  date: {
    padding: 10,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 5,
    borderColor: COLORS.BORDER_COLOR,
    borderWidth: 1,
  },
  highlightedDate: {
    backgroundColor: COLORS.HIGHLIGHT,
    padding: 10,
    borderRadius: 5,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  eventContainer: {
    backgroundColor: COLORS.EVENT_COLOR,
    borderRadius: 3,
    padding: 3,
    marginVertical: 2,
  },
  eventText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 12,
  },
  addEventContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  addEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.INPUT_BG,
    borderColor: COLORS.BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInput: {
    width: 50,
    backgroundColor: COLORS.INPUT_BG,
    borderColor: COLORS.BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginRight: 5,
  },
  amPmContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  amPmButton: {
    marginHorizontal: 5,
    fontSize: 16,
  },
  amPmSelected: {
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
  },
  addButton: {
    backgroundColor: COLORS.BUTTON_BG,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
  },
  eventListContainer: {
    padding: 16,
  },
  eventListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 5,
    marginBottom: 10,
  },
  eventItemText: {
    color: COLORS.UCONN_NAVY,
  },
  noEventsText: {
    color: COLORS.UCONN_GREY,
  },
  errorText: {
    color: COLORS.ERROR_COLOR, // Red color for error messages
    marginBottom: 10,
  },
});
