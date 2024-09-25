import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/Colors';

type EventCardProps = {
  name: string;
  date: string;
  location: string;
}

const EventCard: React.FC<EventCardProps> = ({ name, date, location }) => (
  <View style={styles.eventCard}>
    <Text style={styles.eventName}>{name}</Text>
    <Text style={styles.eventDetails}>{date}</Text>
    <Text style={styles.eventDetails}>{location}</Text>
  </View>
);

export default function HomePage() {
  const featuredEvents = [
    { id: 1, name: 'UConn MBB Game', date: 'Mar 15, 2024', location: 'Gampel Pavilion' },
    { id: 2, name: 'Spring Concert', date: 'Apr 20, 2024', location: 'Jorgensen Center' },
    { id: 3, name: 'Career Fair', date: 'May 5, 2024', location: 'Student Union' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Husky Buddies</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Events</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 12,
  },
  eventScroll: {
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    shadowColor: COLORS.UCONN_NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: COLORS.UCONN_GREY,
  },
  viewAllButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});