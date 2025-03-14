import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from "@/backend/firebase/firebaseConfig";

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
      isadded: event.isadded ?? false, 
    }));
    setLocalEvents(updatedEvents);
  }, [events]);

  const handleAddToCalendar = async (event: Event) => {
    const updatedEvents = localEvents.map((e) =>
      e.id === event.id ? { ...e, isadded: !e.isadded } : e 
    );
    setLocalEvents(updatedEvents);
    try {
      const eventRef = doc(db, "Events", event.id); 
      await updateDoc(eventRef, {
        isadded: !event.isadded, 
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventText}>
        {item.date.toDate().toLocaleDateString()} {item.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.eventText}>{item.description}</Text>
  
      <TouchableOpacity
        style={styles.addToCalendarButton}
        onPress={() => handleAddToCalendar(item)}
      >
        <Text style={styles.addToCalendarButtonText}>
          {item.isadded ? 'Remove from Calendar' : 'Add to Calendar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
      </TouchableOpacity>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerText}>All Events</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={localEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader} // Using FlatList's ListHeaderComponent
      />
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
    flex: 1,
    padding: 16,
  },
  eventItem: {
    marginBottom: 12,
    padding: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
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
  listContainer: {
    marginTop: 40,
  },
});

export default AllEvents;
