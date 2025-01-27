//Imports
import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors'; 
import DateTimePicker from '@react-native-community/datetimepicker';

//Interface setup for database 
interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  isadded?: boolean; 
}
const AddEvent: React.FC<{ 
  onBack: () => void; 
  onAddEvent: (event: Event) => void; 
  events: Event[]; 
  onDeleteEvent: (id: number) => void; 
}> = ({ onBack, onAddEvent, events, onDeleteEvent }) => {
  const [title, setTitle] = useState(''); 
  const [date, setDate] = useState<Date | null>(null); 
  const [description, setDescription] = useState(''); 
  const [showDatePicker, setShowDatePicker] = useState(false); 
  const [showTimePicker, setShowTimePicker] = useState(false); 

  //Error handling for empty friends
  const handleSubmit = () => {
    if (!title || !description || !date) {
      alert('Please fill out all fields!'); 
      return;
    }

    //Error handling for duplicate events
    const duplicateEvent = events.find((event) => event.title === title && event.date === date.toISOString());

    if (duplicateEvent) {
      alert('Event already exists, not adding duplicate!');
      return;
    }

    //Creating a new event
    const newEvent: Event = {
      id: Date.now(), 
      title,
      date: date.toISOString(), 
      description,
      isadded: false, 
    };

    onAddEvent(newEvent);
    setTitle('');
    setDate(null);
    setDescription('');
    alert('Event posted successfully!'); 
  };

  //Handle date selection from the DateTimePicker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false); 
    if (selectedDate) {
      setDate(selectedDate); 
      setShowTimePicker(true); 
    }
  };

  //Handle time selection from the DateTimePicker
  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (selectedTime) {
      setDate(new Date(date!.setHours(selectedTime.getHours(), selectedTime.getMinutes())));
    }
    setShowTimePicker(false);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{new Date(item.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
      <Text>{item.description}</Text>
      <TouchableOpacity onPress={() => onDeleteEvent(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header section with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Event Poster</Text>
        </View>
      </View>

      {/* Form section for adding a new event */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Post a New Event</Text>

        {/* Input for event title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
        />

        {/* Date and time selection */}
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text style={styles.inputText}>
              {date ? date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Select Date & Time'}
            </Text>
          </TouchableOpacity>

          {/* Date */}
          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              style={styles.datePicker}
            />
          )}

          {/* Time */}
          {showTimePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              style={styles.datePicker}
            />
          )}
        </View>

        {/* Input for event description */}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          placeholderTextColor="#B0B0B0"
          style={styles.textarea}
          multiline
          numberOfLines={4}
        />

        {/* Submit button */}
        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Post Event</Text>
        </TouchableOpacity>
      </View>

      {/* List of posted events */}
      <FlatList
        style={styles.eventsContainer}
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </SafeAreaView>
  );
};

//Styles to keep pages consistent 
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
  dateContainer: {
    position: 'relative',
    marginBottom: 12,
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
