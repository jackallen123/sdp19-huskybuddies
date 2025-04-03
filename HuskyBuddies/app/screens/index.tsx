/* Home Screen */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Linking, StatusBar } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getAllUsers, getUserCourses, getUserProfile, FetchStudySessionsFromDatabase } from '../../backend/firebase/firestoreService';

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
}

interface ProfileData {
  profilePicture?: string;
}

interface Match {
  id: string;
  name: string;
  profilePicture: string;
  sharedClasses: number;
}


type StudySessionCardProps = {
  title: string;
  date: string;
  creatorName: string;
}

// helper to convert Firestore timestamp to Date
const getDateFromTimestamp = (date: any): Date => {
  return (date as { toDate?: () => Date }).toDate ? (date as { toDate: () => Date }).toDate() : new Date(date);
};

// helper to format the date and time
const formatDate = (date: Date): string => {
  const datePart = date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric'}); 
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart} at ${timePart}`;
};

// helper to format the session title
const formatSessionTitle = (title: string): string => {
  const prefix = "Study session with ";
  if (title.startsWith(prefix)) {
    let trimmed = title.substring(prefix.length).trim();
    if (trimmed.startsWith("You,")) {
      trimmed = trimmed.substring(4).trim();
    } else if (trimmed.startsWith("You &")) {
      trimmed = trimmed.substring(5).trim();
    } else if (trimmed.startsWith("You")) {
      trimmed = trimmed.substring(3).trim();
    }
    return "Session with " + trimmed;
  }
  return title;
};

// card for study sessions
const StudySessionCard: React.FC<StudySessionCardProps> = ({ title, date, creatorName }) => {
  const theme = useTheme();

  // convert timestamp using helper and format date & title
  const dateObj = getDateFromTimestamp(date);
  const formattedDate = formatDate(dateObj);
  const formattedTitle = formatSessionTitle(title);

  return (
    <View style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.eventName, { color: theme.colors.onBackground }]}>{formattedTitle}</Text>
      <Text style={[styles.eventDetails, { color: theme.colors.onSurface }]}>{formattedDate}</Text>
      <Text style={[styles.eventDetails, { color: theme.colors.onSurface }]}>{`Session created by ${creatorName}`}</Text>
    </View>
  );
};

type StudyBuddyCardProps = {
  name: string;
  sharedClasses: number;
  profilePicture: string;
}

// Card for study buddies
const StudyBuddyCard: React.FC<StudyBuddyCardProps> = ({ name, sharedClasses, profilePicture }) => {
  const theme = useTheme();
  return (
    <View style={[styles.studyBuddyCard, { backgroundColor: theme.colors.surface }]}>
      <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
      <Text style={[styles.buddyName, { color: theme.colors.onBackground }]}>{name}</Text>
      <Text style={[styles.buddyDetails, { color: theme.colors.onSurface }]}>{sharedClasses} Shared Classes</Text>
    </View>
  );
};

// Interface to store resource items
interface ResourceItem {
  name: string;
  url: string;
}

export default function HomePage() {
  const theme = useTheme();

  const [academicModalVisible, setAcademicModalVisible] = useState(false);
  const [campusServicesModalVisible, setCampusServicesModalVisible] = useState(false);

  // states for top matching study buddies & loading icon
  const [topMatches, setTopMatches] = useState<Array<{ id: string; name: string; profilePicture: string; sharedClasses: number }>>([]);
  const [loading, setLoading] = useState(false);

  // state for study sessions
  const [studySessions, setStudySessions] = useState<Array<{ id: string; title: string; date: string; friends: string; createdBy: string; creatorName: string }>>([]);

  // function to find shared courses between two users
  const findSharedCourses = (userCourses: Array<any>, otherCourses: Array<any>): string[] => {
    const shared: string[] = [];
    for (const userCourse of userCourses) {
      for (const otherCourse of otherCourses) {
        if (userCourse.name === otherCourse.name) {
          shared.push(userCourse.name);
          break;
        }
      }
    }
    return shared;
  };

  // useEffect to fetch top matching study buddies based on shared courses
  useEffect(() => {
    setLoading(true);
    const fetchTopMatches = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // fetch all users and the current user's courses
        const users: UserData[] = await getAllUsers();
        const currentUserCourses = await getUserCourses(currentUser.uid);

        // build an array for all matches with the number of shared courses
        const matches: Match[] = [];

        for (const student of users) {
          // skip the current user
          if (student.id === currentUser.uid) continue;

          // fetch courses for the student
          const studentCourses = await getUserCourses(student.id);
          const shared = findSharedCourses(currentUserCourses, studentCourses);

          if (shared.length > 0) {
            // fetch additional profile details from the "userProfile/profile" document
            const profileData: ProfileData | null = await getUserProfile(student.id);
            const profilePicture: string = profileData?.profilePicture || 'https://via.placeholder.com/100';

            // combine firstName and lastName from the student document
            const displayName: string = `${student.firstName || ''} ${student.lastName || ''}`.trim();

            matches.push({
              id: student.id,
              name: displayName,
              profilePicture,
              sharedClasses: shared.length,
            });
          }
        }

        // sort descending by the number of shared classes
        matches.sort((a, b) => b.sharedClasses - a.sharedClasses);

        // select the top 3 matches and set
        const top3 = matches.slice(0, 3);
        setTopMatches(top3);
      } catch (error) {
        console.error("Error fetching top matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopMatches();
  }, []);

  // useEffect to fetch study sessions for the current user
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // fetch study sessions
    const unsubscribe = FetchStudySessionsFromDatabase(currentUser.uid, setStudySessions);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // process study sessions to get 3 upcoming sessions & filter out past sessions
  const upcomingSessions = studySessions
    .filter(session => {
      const sessionDate = getDateFromTimestamp(session.date);
      return sessionDate >= new Date();
    })
    .sort((a, b) => {
      const dateA = getDateFromTimestamp(a.date);
      const dateB = getDateFromTimestamp(b.date);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

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
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.onBackground }]}>{title}</Text>
          <ScrollView contentContainerStyle={styles.scrollViewResources}>
            {data.map((item: ResourceItem, index: number) => (
              <TouchableOpacity 
                key={index}
                style={[styles.resourceLink, { borderBottomColor: theme.colors.outline }]}
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={[styles.resourceLinkText, { color: theme.colors.onBackground }]}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setIsVisible(false)} style={[styles.closeButton, { backgroundColor: theme.colors.onPrimaryContainer}]}>
            <Text style={[styles.closeButtonText, { color: theme.colors.onPrimary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => setCampusServicesModalVisible(true)} style={styles.iconContainer}>
          <Ionicons name="business-outline" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Husky Buddies</Text>
        </View>
        <TouchableOpacity onPress={() => setAcademicModalVisible(true)} style={styles.iconContainer}>
          <Ionicons name="book-outline" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
      </View>

      {/* Campus Services Modal */}
      {renderModal("Campus Services", campusServices, campusServicesModalVisible, setCampusServicesModalVisible)}
      {/* Academic Resources Modal */}
      {renderModal("Academic Resources", academicResources, academicModalVisible, setAcademicModalVisible)}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Find a Study Buddy Section */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Find a Study Buddy</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buddyScroll}>
              {topMatches.length > 0 ? (
                topMatches.map((buddy) => (
                  <StudyBuddyCard
                    key={buddy.id}
                    name={buddy.name}
                    sharedClasses={buddy.sharedClasses}
                    profilePicture={buddy.profilePicture}
                  />
                ))
              ) : (
                <Text style={{ color: theme.colors.onBackground }}>No matches found.</Text>
              )}
            </ScrollView>

            <View style={styles.viewAllButtonWrapper}>
              <Link href="/screens/student-matching" style={styles.fullWidthLink} asChild>
                <TouchableOpacity style={StyleSheet.flatten([styles.viewAllButton, { backgroundColor: theme.colors.primary }])}>
                  <Text style={styles.viewAllButtonText}>View All Matches</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Upcoming Study Sessions Section */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Upcoming Study Sessions</Text>
            {upcomingSessions.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
                {upcomingSessions.map((session) => (
                  <StudySessionCard
                    key={session.id}
                    title={session.title}
                    date={session.date}
                    creatorName={session.creatorName}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: theme.colors.onBackground, marginBottom: 16 }}>
                No study sessions scheduled. Schedule a study session with a buddy using the button below.
              </Text>
            )}

            <View style={styles.viewAllButtonWrapper}>
              <Link href="/screens/events" style={styles.fullWidthLink} asChild>
                <TouchableOpacity style={StyleSheet.flatten([styles.viewAllButton, { backgroundColor: theme.colors.primary }])}>
                  <Text style={styles.viewAllButtonText}>View All Study Sessions</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 500 ,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 8,
    padding: 20,
    width: '80%',
    height: '43%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fullWidthLink: {
    width: '100%',
  },
  eventScroll: {
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    shadowColor: COLORS.UCONN_NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
  },
  buddyScroll: {
    marginBottom: 16,
  },
  studyBuddyCard: {
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
    marginBottom: 4,
  },
  buddyDetails: {
    fontSize: 14,
  },
});