import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
}

interface AllEventsProps {
  onBack: () => void;
  events: Event[];
  onAddToCalendar: (event: Event) => void;
}

const AllEvents: React.FC<AllEventsProps> = ({ onBack, events, onAddToCalendar }) => {
  const [addedToCalendar, setAddedToCalendar] = useState<number[]>([]);

  useEffect(() => {
    const loadCalendarEvents = async () => {
      try {
        const savedCalendarEvents = await AsyncStorage.getItem('calendarEvents');
        if (savedCalendarEvents) {
          setAddedToCalendar(JSON.parse(savedCalendarEvents));
        }
      } catch (error) {
        console.error('Failed to load calendar events', error);
      }
    };

    loadCalendarEvents();
  }, []);

  const handleAddToCalendar = async (event: Event) => {
    try {
      await onAddToCalendar(event);
      setAddedToCalendar(prev => [...prev, event.id]);
    } catch (error) {
      console.error('Error adding to calendar:', error);
    }
  };

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{formatEventDate(item.date)}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      
      {addedToCalendar.includes(item.id) ? (
        <View style={[styles.addToCalendarButton, styles.addedToCalendarButton]}>
          <Text style={styles.addToCalendarButtonText}>Added to Calendar</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addToCalendarButton}
          onPress={() => handleAddToCalendar(item)}
        >
          <Text style={styles.addToCalendarButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>All Events</Text>
        </View>
      </View>
      
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Posted Events:</Text>
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
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
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginVertical: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  addToCalendarButton: {
    marginTop: 10,
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  addedToCalendarButton: {
    backgroundColor: '#666',
  },
  addToCalendarButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 14,
  },
});

export default AllEvents;