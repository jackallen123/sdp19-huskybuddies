import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors';
import { transformSectionToCourse } from '@/utils/transform/courseTransform';
import { storeCourse } from '@/utils/services/courseStorage';
import { Alert } from 'react-native';
import axios from 'axios';

interface Section {
  sectionNumber: string;
  meets: string;
  instructor: string;
}

export default function AddSection({ onBack, courseCode }: { onBack: () => void, courseCode: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPopup, setLocationPopup] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const ip_address = '10.194.235.123' // set your IP address here

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://${ip_address}:3000/sections/${courseCode}`);
      setSections(response.data[0]?.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchLocation = async (sectionNumber: string) => {
  //   try {
  //     const response = await axios.get(`http://${ip_address}:3000/section-location/${courseCode}/${sectionNumber}`);
  //     return response.data.location;
  //   } catch (error) {
  //     console.error('Error fetching location:', error);
  //     return 'Location not found';
  //   }
  // };

  const handleAddSection = async (section: Section) => {
    // check if the section does not meet
    if (section.meets === "Does Not Meet") {
      Alert.alert("Course does not meet", "This course does not have a meeting time and cannot be added to your schedule.");
      return;
    }

    try {
      setLocationPopup({ visible: true, message: 'Adding course...' });
      // const location = await fetchLocation(section.sectionNumber);
      
      const course = transformSectionToCourse(courseCode, section);
      await storeCourse(course);
      
      // success message
      setLocationPopup({ visible: true, message: 'Course added successfully!' });
      setTimeout(() => {
        setLocationPopup({ visible: false, message: '' });
        onBack(); // return to addCourse
      }, 1500);
    } catch (error:any) {
      Alert.alert('Error', error.message || 'Failed to add course');
    }
  };

  const sortedSections = [...sections].sort((a, b) => {
    const sectionA = parseInt(a.sectionNumber.replace(/\D/g, ''));
    const sectionB = parseInt(b.sectionNumber.replace(/\D/g, ''));
    return sectionA - sectionB;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Add Section</Text>
        </View>
      </SafeAreaView>
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.UCONN_NAVY} />
        </View>
      ) : (
        <FlatList
          data={sortedSections}
          keyExtractor={(item) => item.sectionNumber}
          renderItem={({ item }) => (
            <View style={styles.sectionCard}>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionText}>Section {item.sectionNumber}</Text>
                <Text style={styles.sectionDetails}>{item.instructor}</Text>
                <Text style={styles.sectionDetails}>{item.meets}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddSection(item)}
              >
                <Ionicons name="add-circle-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.centerContent}>
              <Text>No sections found</Text>
            </View>
          )}
        />
      )}
      {locationPopup.visible && (
        <View style={styles.popupContainer}>
          <Text style={styles.popupText}>{locationPopup.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    },
  safeArea: {
    backgroundColor: COLORS.UCONN_NAVY,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute', 
    left: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
    textAlign: 'center',
  },
  courseNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDetails: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    padding: 8,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  popupText: {
    color: 'white',
    fontSize: 16,
  },
});