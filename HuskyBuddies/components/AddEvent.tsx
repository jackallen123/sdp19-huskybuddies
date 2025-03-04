import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import { AddEventToDatabase, FetchEventsFromDatabase, DeleteEventFromDatabase } from '@/backend/firebase/firestoreService'; 
import { Timestamp } from 'firebase/firestore';

interface Event {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  isadded?: boolean;
}

const AddEvent: React.FC<{ 
  onBack: () => void; 
  onAddEvent: (event: Event) => void; 
  onDeleteEvent: (id: string) => void;
  events?: Event[];
}> = ({ onBack, onAddEvent }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribe = FetchEventsFromDatabase(setEvents);
    return () => unsubscribe();
  }, []);

  const handleSubmit = () => {
    console.log('Selected Date:', date);  
    if (!title || !description || !date) {
      alert('Please fill out all fields!');
      return;
    }

    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      date: Timestamp.fromDate(date),  
      description,
      isadded: false,  
    };

    // Add event to the database
    AddEventToDatabase(newEvent.id, newEvent.title, newEvent.date, newEvent.description, false);

    // Add event to local state
    onAddEvent(newEvent);

    // Clear form inputs
    setTitle('');
    setDate(null);
    setDescription('');

    alert('Event posted successfully!');
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(new Date(selectedDate));  
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (selectedTime && date) {
      const updatedDate = new Date(date);
      updatedDate.setHours(selectedTime.getHours());
      updatedDate.setMinutes(selectedTime.getMinutes());
      setDate(updatedDate);
    }
    setShowTimePicker(false);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await DeleteEventFromDatabase(id);
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>
        {item.date ? new Date(item.date.toDate()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No date available'}
      </Text>
      <Text>{item.description}</Text>
      <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

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

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
        />

        <View style={styles.section}>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputText}>
              {date ? date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Date & Time'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date ? date : new Date()}  
              mode="date"
              display="default"
              onChange={handleDateChange}
              style={styles.datePicker}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date ? date : new Date()}  
              mode="time"
              display="default"
              onChange={handleTimeChange}
              style={styles.datePicker}
            />
          )}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          placeholderTextColor="#B0B0B0"
          style={styles.textarea}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Post Event</Text>
        </TouchableOpacity>
      </View>

      <FlatList style={styles.eventsContainer} data={events} renderItem={renderEventItem} keyExtractor={(item) => item.id} />
    </SafeAreaView>
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
    fontSize: 20,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  section: {
    padding: 10,
  },
  datePicker: {
    position: 'absolute',
    top: 50,
    marginBottom: 20,
    left: 0,
    right: 0,
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 20,
    borderColor: '#ccc',
  },
  textarea: {
    height: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 150,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  eventItem: {
    marginBottom: 12,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#FF4C4C',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});

export default AddEvent;
