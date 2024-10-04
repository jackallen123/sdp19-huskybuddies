import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors';

interface Section {
  id: string;
  term: string;
  section: string;
  location: string;
  instructor: string;
  schedule: string;
}

const mockSections: Section[] = [
  { id: '1', term: 'Fall 2024', section: '001', location: 'ITE C28', instructor: 'Jack Allen', schedule: 'MoWeFr 3:35 - 4:25pm' },
  { id: '2', term: 'Fall 2024', section: '002L', location: 'ITE 231', instructor: 'Jane Smith', schedule: 'TuTh 2:00 - 3:15pm' },
  { id: '3', term: 'Fall 2024', section: '003D', location: 'PHYS 101', instructor: 'Bob Johnson', schedule: 'MoWe 10:00 - 10:50am' },
  { id: '4', term: 'Fall 2024', section: '004', location: 'MATH 220', instructor: 'Alice Brown', schedule: 'TuTh 11:30am - 12:45pm' },
];

export default function AddSection({ onBack }: { onBack: () => void }) {

  const sortedSections = [...mockSections].sort((a, b) => {
    const sectionA = parseInt(a.section.replace(/\D/g, ''));
    const sectionB = parseInt(b.section.replace(/\D/g, ''));
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
      <FlatList
        data={sortedSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionText}>{item.term} - Section {item.section}</Text>
              <Text style={styles.sectionDetails}>{item.location}</Text>
              <Text style={styles.sectionDetails}>{item.instructor}</Text>
              <Text style={styles.sectionDetails}>{item.schedule}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                //TODO: this will add courses to the schedule and redirect users to schedule
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
      />
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
});