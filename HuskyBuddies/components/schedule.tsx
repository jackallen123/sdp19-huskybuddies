import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AddCourseScreen from './addCourse';

export default function Schedule() {
  const [showOptions, setShowOptions] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  // If the user is adding a course, render the AddCourseScreen
  if (isAddingCourse) {
    return (
      <AddCourseScreen />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Schedule</Text>
        <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
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
      <View style={styles.weekdaysContainer}>
        {weekdays.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      {/* Placeholder for course cards */}
      <View style={styles.coursesContainer}>
        <View style={[styles.courseCard, { backgroundColor: '#FFB3BA' }]}>
          <Text>Math 101</Text>
        </View>
        <View style={[styles.courseCard, { backgroundColor: '#BAFFC9' }]}>
          <Text>Physics 201</Text>
        </View>
        <View style={[styles.courseCard, { backgroundColor: '#BAE1FF' }]}>
          <Text>Chemistry 301</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
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
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekday: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  coursesContainer: {
    flex: 1,
  },
  courseCard: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
});