import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Linking } from 'react-native';
import { COLORS } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

type EventCardProps = {
  name: string;
  date: string;
  location: string;
}

// Card for featured events
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

// Card for study buddies
const StudyBuddyCard: React.FC<StudyBuddyCardProps> = ({ name, sharedClasses, profilePicture }) => (
  <View style={styles.studyBuddyCard}>
    <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
    <Text style={styles.buddyName}>{name}</Text>
    <Text style={styles.buddyDetails}>{sharedClasses} Shared Classes</Text>
  </View>
);

// Interface to store resource items
interface ResourceItem {
  name: string;
  url: string;
}

export default function HomePage() {
  const [academicModalVisible, setAcademicModalVisible] = useState(false);
  const [campusServicesModalVisible, setCampusServicesModalVisible] = useState(false);

  // Mock data for featured events
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

  // Mock data for study buddies
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

  // Links for campus services
  const campusServices: ResourceItem[] = [
    { name: "Residential Life", url: "https://reslife.uconn.edu/" },
    { name: "Dining Services", url: "https://dining.uconn.edu/" },
    { name: "Campus Map", url: "https://maps.uconn.edu/" },
    { name: "Transportation", url: "https://transpo.uconn.edu/" },
    { name: "One Card Office", url: "https://onecard.uconn.edu/" },
  ];

  // Links for academic resources
  const academicResources: ResourceItem[] = [
    { name: "Writing Center", url: "https://writingcenter.uconn.edu/" },
    { name: "Quantitative Learning Center", url: "https://qcenter.uconn.edu/" },
    { name: "Undergraduate Advising", url: "http://advising.uconn.edu/" },
    { name: "International Student Services", url: "https://isss.uconn.edu/" },
    { name: "Center for Academic Programs", url: "http://cap.uconn.edu/" },
    { name: "Institute for Student Success", url: "http://ece.uconn.edu/" },
    { name: "Early College Experience", url: "https://iss.uconn.edu/" },
    { name: "Summer/Winter Sessions", url: "http://summerwinter.uconn.edu/" },
    { name: "UConn Library", url: "https://lib.uconn.edu/" },
    { name: "Office of the Registrar", url: "http://registrar.uconn.edu/" },
    { name: "UConn Bookstore", url: "https://uconn.bncollege.com/shop/uconn/home" },
    { name: "Academic Calendar", url: "http://registrar.uconn.edu/academic-calendar/" },
    { name: "Undergraduate Course Catalog", url: "http://catalog.uconn.edu/" },
    { name: "Graduate Course Catalog", url: "http://graduatecatalog.uconn.edu/" },
  ];

  // To render modal for academic resources and campus services
  const renderModal = (
    title: string,
    data: ResourceItem[],
    isVisible: boolean,
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
  ): JSX.Element => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView contentContainerStyle={styles.scrollViewResources}>
            {data.map((item: ResourceItem, index: number) => (
              <TouchableOpacity 
                key={index}
                style={styles.resourceLink} 
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={styles.resourceLinkText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Campus Services icon */}
        <TouchableOpacity onPress={() => setCampusServicesModalVisible(true)} style={styles.iconContainer}>
          <Ionicons name="business-outline" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Husky Buddies</Text>
        </View>
        {/* Academic Resources icon */}
        <TouchableOpacity onPress={() => setAcademicModalVisible(true)} style={styles.iconContainer}>
          <Ionicons name="book-outline" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
      </View>

      {/* Campus Services Modal */}
      {renderModal("Campus Services", campusServices, campusServicesModalVisible, setCampusServicesModalVisible)}

      {/* Academic Resources Modal */}
      {renderModal("Academic Resources", academicResources, academicModalVisible, setAcademicModalVisible)}

      <ScrollView contentContainerStyle={styles.content}>

        {/* Find a Study Buddy Section */}
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
        
        {/* Featured events section */}
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

// Styles
const styles = StyleSheet.create({
  // Container and general layout
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  content: {
    padding: 16,
  },

  // Header styling
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftPlaceholder: {
    width: 40,
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
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },

  // Modal styling
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 8,
    padding: 20,
    width: '80%',
    height: '43%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollViewResources: {
    paddingVertical: 10,
  },
  resourceLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.UCONN_GREY,
    width: '100%',
  },
  resourceLinkText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
    textAlign: 'center',
  },

  // Button styling
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
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

  // Section styling
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 12,
  },
  fullWidthLink: {
    width: '100%',
  },

  // Event styling
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

  // Study Buddy styling
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