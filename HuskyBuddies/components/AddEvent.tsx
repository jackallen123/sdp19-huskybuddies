import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors'; // Custom color constants
import DateTimePicker from '@react-native-community/datetimepicker';

// Define the Event interface for type safety
interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  isadded?: boolean; 
}

// Main AddEvent component with props for navigation, event handling, and event management
const AddEvent: React.FC<{ 
  onBack: () => void; // Function to navigate back
  onAddEvent: (event: Event) => void; // Function to add a new event
  events: Event[]; // List of events to display
  onDeleteEvent: (id: number) => void; // Function to delete an event
}> = ({ onBack, onAddEvent, events, onDeleteEvent }) => {
  // State variables for form inputs and visibility controls
  const [title, setTitle] = useState(''); // Event title input
  const [date, setDate] = useState<Date | null>(null); // Event date and time
  const [description, setDescription] = useState(''); // Event description input
  const [showDatePicker, setShowDatePicker] = useState(false); // Date picker visibility
  const [showTimePicker, setShowTimePicker] = useState(false); // Time picker visibility

  // Function to handle form submission
  const handleSubmit = () => {
    if (!title || !description || !date) {
      alert('Please fill out all fields!'); // Validate all fields
      return;
    }

    // Check if an event with the same title and date already exists
    const duplicateEvent = events.find((event) => event.title === title && event.date === date.toISOString());

    if (duplicateEvent) {
      alert('Event already exists, not adding duplicate!');
      return;
    }

    // Create a new event object
    const newEvent: Event = {
      id: Date.now(), // Generate a unique ID using the current timestamp
      title,
      date: date.toISOString(), // Convert date to ISO string format
      description,
      isadded: false, // Initialize the 'isadded' boolean to false
    };

    // Add the new event via the provided function
    onAddEvent(newEvent);

    // Reset form inputs
    setTitle('');
    setDate(null);
    setDescription('');

    alert('Event posted successfully!'); // Provide feedback to the user
  };

  // Handle date selection from the DateTimePicker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false); // Hide the date picker
    if (selectedDate) {
      setDate(selectedDate); // Update the selected date
      setShowTimePicker(true); // Show the time picker next
    }
  };

  // Handle time selection from the DateTimePicker
  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (selectedTime) {
      // Update the date with the selected time
      setDate(new Date(date!.setHours(selectedTime.getHours(), selectedTime.getMinutes())));
    }
    setShowTimePicker(false); // Hide the time picker
  };

  // Render a single event item in the event list
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

          {/* Date picker for selecting a date */}
          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              style={styles.datePicker}
            />
          )}

          {/* Time picker for selecting a time */}
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
