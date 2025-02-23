// Imports
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';

// Interface setup for the database
interface Event {
  id: string; 
  title: string; 
  date: Timestamp;
  description: string; 
  isadded?: boolean; 
}

interface AllEventsProps {
  onBack: () => void;
  events: Event[]; 
  onAddToCalendar: (event: Event) => void; 
}

// Handling "add to calendar" functionality with error handling
const AllEvents: React.FC<AllEventsProps> = ({ onBack, events, onAddToCalendar }) => {
  const [localEvents, setLocalEvents] = useState<Event[]>([]);

  useEffect(() => {
    const updatedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      description: event.description,
      isadded: event.isadded,
    }));
    setLocalEvents(updatedEvents);
  }, [events]);

  const handleAddToCalendar = (event: Event) => {
    if (event.isadded) {
      console.log(`Event "${event.title}" is already added to the calendar.`);
      return; 
    }

    const updatedEvents = localEvents.map((e) =>
      e.id === event.id ? { ...e, isadded: true } : e
    );
    setLocalEvents(updatedEvents); 
    onAddToCalendar(event);
  };

  // Displays each event from all add event pages
  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      
      
      <Text>{item.date.toDate().toLocaleString()}</Text>
      
      <Text>{item.description}</Text>

      {/* Button to add event to calendar */}
      <TouchableOpacity
        style={styles.addToCalendarButton}
        onPress={() => handleAddToCalendar(item)} 
        disabled={item.isadded} 
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
          data={localEvents} 
          renderItem={renderEventItem} 
          keyExtractor={(item) => item.id.toString()} 
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

// Styles to keep pages consistent 
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
  eventsContainer: {
    padding: 16, 
  },
  eventsTitle: {
    fontSize: 20, 
    marginBottom: 10, 
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
  listContainer: {
    marginTop: 40, 
  },
  addToCalendarButton: {
    marginTop: 10, 
    backgroundColor: COLORS.UCONN_NAVY, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 5, 
  },
  addToCalendarButtonText: {
    color: COLORS.UCONN_WHITE, 
    fontSize: 14, 
  },
});

export default AllEvents;
