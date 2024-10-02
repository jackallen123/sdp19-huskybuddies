import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import axios from 'axios';

export default function SettingsPage() {
  // function to call the /courses endpoint
  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://192.168.1.27:3000/courses');
      console.log('Courses data:', response.data); // log the received data
      Alert.alert('Courses Fetched', 'Check console for data'); // Alert user
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings Page</Text>
      {/* Button to trigger the API call */}
      <Button title="Fetch Courses" onPress={fetchCourses} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
