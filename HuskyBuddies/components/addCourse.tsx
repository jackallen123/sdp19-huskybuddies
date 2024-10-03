import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS } from '@/constants/Colors';

interface Course {
  name: string;
  catalogName: string;
}

export default function AddCourseScreen({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://192.168.1.29:3000/courses');
      const courseNames = response.data.map((course: any) => ({
        name: course.name
      }));
      setCourses(courseNames);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const formatCourseName = (name: string) => {
    // adds a space between letters and numbers
    return name.replace(/([A-Za-z]+)(\d+)/, '$1 $2');
  };

  const filteredCourses = courses
    .filter((course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(course => ({
      ...course,
      name: formatCourseName(course.name)
    }));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Add Course</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a course"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {loading ? (
          <View style={styles.centerContent}>
            <Text>Loading courses...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.courseItem}>
                <Text style={styles.courseName}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={24} color="black" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.centerContent}>
                <Text>No courses found</Text>
              </View>
            )}
          />
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  catalogName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});