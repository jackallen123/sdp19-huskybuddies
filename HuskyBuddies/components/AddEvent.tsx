// File: EventPage.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  UCONN_WHITE: '#FFFFFF',
  UCONN_NAVY: '#0E1E45',
};

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
}

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

const EventPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [addedToCalendar, setAddedToCalendar] = useState<number[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });

  const handleSubmit = () => {
    if (!title || !date || !description) {
      showToastMessage('Please fill out all fields!');
      return;
    }

    const newEvent: Event = {
      id: Date.now(),
      title,
      date,
      description,
    };
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setTitle('');
    setDate('');
    setDescription('');
    showToastMessage('Event posted successfully!');
  };

  const addToCalendar = (eventId: number) => {
    setAddedToCalendar((prev) => [...prev, eventId]);
    showToastMessage('Event added to calendar successfully!');
  };

  const deleteEvent = (eventId: number) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    setAddedToCalendar((prev) => prev.filter((id) => id !== eventId));
    showToastMessage('Event deleted successfully from both list and calendar!');
  };

  const showToastMessage = (message: string) => {
    setToast({ message, isVisible: true });
  };

  useEffect(() => {
    if (toast.isVisible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, isVisible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.isVisible]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Event Poster</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Post a New Event</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          style={styles.input}
        />
        <Input
          value={date}
          onChangeText={setDate}
          placeholder="Enter event date"
          style={styles.input}
        />
        <Textarea
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          style={styles.textarea}
        />
        <Button onPress={handleSubmit}>Post Event</Button>
      </View>

      <View style={styles.eventsList}>
        <Text style={styles.subtitle}>Posted Events</Text>
        {events.length === 0 ? (
          <Text>No events posted yet. Use the form above to post an event.</Text>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
              <View style={styles.cardFooter}>
                <Button onPress={() => addToCalendar(event.id)}>Add to Calendar</Button>
                <Button onPress={() => deleteEvent(event.id)} style={styles.deleteButton}>
                  Delete Event
                </Button>
              </View>
            </View>
          ))
        )}
      </View>

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </SafeAreaView>
  );
};

const Input: React.FC<{ value: string; onChangeText: (text: string) => void; placeholder?: string; style?: any; }> = ({ value, onChangeText, placeholder, style }) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="gray" 
      style={[styles.input, style]} 
    />
  );
};

const Textarea: React.FC<{ value: string; onChangeText: (text: string) => void; placeholder?: string; style?: any; }> = ({ value, onChangeText, placeholder, style }) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="gray" 
      multiline
      numberOfLines={4}
      style={[styles.textarea, style]}
    />
  );
};

const Button: React.FC<{ onPress: () => void; children: React.ReactNode; style?: any }> = ({ onPress, children, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
};

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
    padding: 8,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  textarea: {
    height: 80, 
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  eventsList: {
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    color: 'gray',
  },
  eventDescription: {
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: 'red',
  },
  toast: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 5,
  },
  toastText: {
    color: 'white',
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
  },
});

export default EventPage;
