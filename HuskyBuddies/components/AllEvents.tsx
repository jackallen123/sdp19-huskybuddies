import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Defining the structure of an Event
interface Event {
  id: number; // Unique identifier for the event
  title: string; // Event title
  date: string; // Event date
  description: string; // Event description
  isadded?: boolean; // Optional boolean to indicate if the event is marked as added
}

// Props for AllEvents component
interface AllEventsProps {
  onBack: () => void; // Callback to handle going back
  events: Event[]; // List of events to display
  onAddToCalendar: (event: Event) => void; // Callback to handle adding an event to the calendar
}

// AllEvents component displaying a list of events and handling "add to calendar" functionality
const AllEvents: React.FC<AllEventsProps> = ({ onBack, events, onAddToCalendar }) => {
  // State to keep track of events
  const [localEvents, setLocalEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Initialize the events with isadded as false unless explicitly set in the passed prop
    const updatedEvents = events.map((event) => ({
      ...event,
      isadded: event.isadded ?? false, // Ensure isadded is false by default if not passed in props
    }));
    setLocalEvents(updatedEvents); // Update local events with corrected state
  }, [events]);

  // Handles adding an event to the calendar
  const handleAddToCalendar = (event: Event) => {
    // If the event is already added, do nothing
    if (event.isadded) {
      console.log(`Event "${event.title}" is already added to the calendar.`);
      return; // Don't add if already added
    }

    // Update local state to reflect event addition (mark as added)
    const updatedEvents = localEvents.map((e) =>
      e.id === event.id ? { ...e, isadded: true } : e
    );
    setLocalEvents(updatedEvents); // Update the state
    onAddToCalendar(event); // Call the parent function to actually add to the calendar
  };

  // Renders each event item in the list
  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{item.date}</Text>
      <Text>{item.description}</Text>

      {/* Button to add event to calendar */}
      <TouchableOpacity
        style={styles.addToCalendarButton}
        onPress={() => handleAddToCalendar(item)} // Trigger the add to calendar functionality
        disabled={item.isadded} // Disable button if isadded is true
      >
        <Text style={styles.addToCalendarButtonText}>
          {item.isadded ? 'Added to Calendar' : 'Add to Calendar'}
        </Text>
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
          <Text style={styles.headerText}>All Events</Text>
        </View>
      </View>

      {/* Events listing section */}
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Posted Events:</Text>
        <FlatList
          data={localEvents} // Use local state for events
          renderItem={renderEventItem} // Function to render each event item
          keyExtractor={(item) => item.id.toString()} // Unique key for each item
          contentContainerStyle={styles.listContainer} // Style for the FlatList container
        />
      </View>
    </SafeAreaView>
  );
};

// Styles for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE, // White background color
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY, // Navy background color for the header
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center', // Align items horizontally
  },
  headerTextContainer: {
    flex: 1, // Takes up the remaining space
    alignItems: 'center', // Center the text
  },
  headerText: {
    color: COLORS.UCONN_WHITE, // White text color
    fontSize: 20, // Font size for the header text
    fontWeight: 'bold', // Bold text
  },
  backButton: {
    padding: 8, // Padding for the back button
  },
  eventsContainer: {
    padding: 16, // Padding for the events container
  },
  eventsTitle: {
    fontSize: 20, // Font size for the events section title
    marginBottom: 10, // Bottom margin for spacing
  },
  eventItem: {
    marginBottom: 12, // Margin between event items
    padding: 10, // Padding inside each event item
    borderColor: '#ccc', // Light gray border color
    borderWidth: 1, // Border width
    borderRadius: 5, // Rounded corners
  },
  eventTitle: {
    fontSize: 18, // Font size for event title
    fontWeight: 'bold', // Bold title
  },
  listContainer: {
    marginTop: 40, // Margin for the FlatList container
  },
  addToCalendarButton: {
    marginTop: 10, // Margin at the top of the button
    backgroundColor: COLORS.UCONN_NAVY, // Navy background color for the button
    paddingVertical: 8, // Vertical padding for the button
    paddingHorizontal: 16, // Horizontal padding for the button
    borderRadius: 5, // Rounded corners for the button
  },
  addToCalendarButtonText: {
    color: COLORS.UCONN_WHITE, // White text color for the button
    fontSize: 14, // Font size for the button text
  },
});

export default AllEvents;
