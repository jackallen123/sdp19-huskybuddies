import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EventsPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Events Page</Text>
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
