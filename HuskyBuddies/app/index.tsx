import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/Colors';
import { Link } from 'expo-router';

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

type StudyBuddyCardProps = {
  name: string;
  sharedClasses: number;
  profilePicture: string;
}

const StudyBuddyCard: React.FC<StudyBuddyCardProps> = ({ name, sharedClasses, profilePicture }) => (
  <View style={styles.studyBuddyCard}>
    <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
    <Text style={styles.buddyName}>{name}</Text>
    <Text style={styles.buddyDetails}>{sharedClasses} Shared Classes</Text>
  </View>
);

export default function HomePage() {
  const featuredEvents = [
    {
      id: 1,
      name: "UConn MBB Game",
      date: "Mar 15, 2024",
      location: "Gampel Pavilion",
    },
    {
      id: 2,
      name: "Spring Concert",
      date: "Apr 20, 2024",
      location: "Jorgensen Center",
    },
    {
      id: 3,
      name: "Career Fair",
      date: "May 5, 2024",
      location: "Student Union",
    },
  ];

  const studyBuddies = [
    {
      id: 1,
      name: "John Doe",
      sharedClasses: 3,
      profilePicture: "https://robohash.org/stefan-one",
    },
    {
      id: 2,
      name: "Jane Smith",
      sharedClasses: 2,
      profilePicture: "https://robohash.org/stefan-two",
    },
    {
      id: 3,
      name: "Alex Johnson",
      sharedClasses: 4,
      profilePicture: "https://robohash.org/stefan-three",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Husky Buddies</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        { /* Find a Study Buddy Section */ }
        <Text style={styles.sectionTitle}>Find a Study Buddy</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.buddyScroll}
        >
          {studyBuddies.map((buddy) => (
            <StudyBuddyCard key={buddy.id} {...buddy} />
          ))}
        </ScrollView>

        <View style={styles.viewAllButtonWrapper}>
          <Link href="/student-matching" style={styles.fullWidthLink} asChild>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All Matches</Text>
            </TouchableOpacity>
          </Link>
        </View>
        
        { /* Featured events section */ }
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.eventScroll}
        >
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </ScrollView>

        <View style={styles.viewAllButtonWrapper}>
          <Link href="/events" style={styles.fullWidthLink} asChild>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All Events</Text>
            </TouchableOpacity>
          </Link>
        </View>

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
  fullWidthLink: {
    width: '100%',
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
  viewAllButtonWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  viewAllButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  viewAllButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buddyScroll: {
    marginBottom: 16,
  },
  studyBuddyCard: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    shadowColor: COLORS.UCONN_NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: 150,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  buddyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 4,
  },
  buddyDetails: {
    fontSize: 14,
    color: COLORS.UCONN_GREY,
  },
});