import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AddCourseScreen from './addCourse';
import { COLORS } from '@/constants/Colors';

interface Course {
  id: string;
  name: string;
  location: string;
  section: string;
  days: string[];
  startTime: string;
  endTime: string;
  color: string;
}

const mockCourses: Course[] = [
  {
    id: '1',
    name: 'PP 1001',
    location: 'MONT 104',
    section: '001',
    days: ['TUE', 'THU'],
    startTime: '09:30',
    endTime: '10:45',
    color: '#FFB3BA',
  },
  {
    id: '2',
    name: 'MATH 2002W',
    location: 'SCNC 201',
    section: '002',
    days: ['MON', 'WED', 'FRI'],
    startTime: '11:00',
    endTime: '11:50',
    color: '#BAFFC9',
  },
  {
    id: '3',
    name: 'CHEM 3003',
    location: 'LAB 305',
    section: '003',
    days: ['MON', 'WED'],
    startTime: '13:30',
    endTime: '14:45',
    color: '#BAE1FF',
  },
  {
    id: '4',
    name: 'HIST 4004',
    location: 'HUMN 102',
    section: '004',
    days: ['TUE', 'THU'],
    startTime: '15:00',
    endTime: '16:15',
    color: '#FFFFBA',
  },
];

const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
  <View style={[styles.courseCard, { backgroundColor: course.color }]}>
    <Text style={styles.courseTime}>{course.startTime}</Text>
    <View style={styles.courseInfo}>
      <Text numberOfLines={1} style={styles.courseName}>{course.name}</Text>
      <Text style={styles.courseLocation}>{course.location}</Text>
      <Text style={styles.courseSection}>{course.section}</Text>
    </View>
    <Text style={styles.courseTime}>{course.endTime}</Text>
  </View>
);

export default function Schedule({ onBack }: { onBack: () => void }) {
  const [showOptions, setShowOptions] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  const sortedCoursesByDay = useMemo(() => {
    const sorted = weekdays.map(day => ({
      day,
      courses: mockCourses
        .filter(course => course.days.includes(day))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
    return sorted;
  }, []);

  if (isAddingCourse) {
    return (
      <AddCourseScreen onBack={() => setIsAddingCourse(false)} />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.UCONN_WHITE} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setShowOptions(false);
              setIsAddingCourse(true);
            }}
          >
            <Ionicons name="add" size={24} color="black" />
            <Text style={styles.optionText}>Add Course</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option}>
            <Ionicons name="trash" size={24} color="black" />
            <Text style={styles.optionText}>Delete Course</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.scheduleWrapper}>
        <View style={styles.weekdaysHeader}>
          {weekdays.map((day) => (
            <View key={day} style={styles.dayHeaderColumn}>
              <Text style={styles.weekday}>{day}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.scheduleContainer}>
          {sortedCoursesByDay.map(({ day, courses }) => (
            <View key={day} style={styles.dayColumn}>
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </View>
          ))}
        </View>
      </View>
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
    padding: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
  },
  optionsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
  },
  scheduleWrapper: {
    flex: 1,
  },
  weekdaysHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 16,
  },
  dayHeaderColumn: {
    flex: 1,
    alignItems: 'center',
  },
  weekday: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
  },
  scheduleContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 1,
  },
  courseCard: {
    padding: 1,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  courseTime: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseInfo: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  courseName: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  courseLocation: {
    fontSize: 9,
    textAlign: 'center',
  },
  courseSection: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 8,
  },
});