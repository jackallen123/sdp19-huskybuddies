import React, { useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

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
  const [addedEvents, setAddedEvents] = useState<Set<number>>(new Set());

  const handleAddToCalendar = (event: Event) => {
    if (addedEvents.has(event.id)) {
      setAddedEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.id);
        return newSet;
      });
    } else {
      onAddToCalendar(event);
      setAddedEvents(prev => new Set(prev.add(event.id)));
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{item.date}</Text>
      <Text>{item.description}</Text>

      <TouchableOpacity
        style={styles.addToCalendarButton}
        onPress={() => handleAddToCalendar(item)}
      >
        <Text style={styles.addToCalendarButtonText}>
          {addedEvents.has(item.id) ? 'Added to Calendar' : 'Add to Calendar'}
        </Text>
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
