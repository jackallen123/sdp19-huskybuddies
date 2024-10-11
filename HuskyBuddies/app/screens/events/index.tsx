import { COLORS } from '@/constants/Colors'; 
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import CustomCalendar from '@/components/CustomCalendar';
import AddEvent from '@/components/AddEvent';
import AllEvents from '@/components/AllEvents';

export default function MainPage() {
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [showAllEvents, setShowAllEvents] = React.useState(false);
  const [showAddEvent, setShowAddEvent] = React.useState(false);
  if (showCalendar) {
    return <CustomCalendar onBack={() => setShowCalendar(false)} />;
  }
  if (showAllEvents){
    return <AllEvents onBack={() => setShowAllEvents(false)} />;
  }
  if (showAddEvent){
    return <AddEvent onBack={() => setShowAddEvent(false)} />;
  }

   
  return (
    
    <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerText}>Husky Buddies</Text>
    </View>

    <View style={styles.viewAllButtonWrapper}>
      <Text style={{ color: 'black', fontSize: 16 }}>
        Your Upcoming Events:
      </Text>
    </View>

    <View style={styles.viewAllButtonWrapper}>
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => setShowAllEvents(true)}
      >
        <Text style={styles.viewAllButtonText}>View Student Added Events</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.viewAllButtonWrapper}>
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => setShowAddEvent(true)}
      >
        <Text style={styles.viewAllButtonText}>Add An Event</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.viewAllButtonWrapper}>
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => setShowCalendar(true)}
      >
        <Text style={styles.viewAllButtonText}>View Calendar</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
); }

// StyleSheet remains the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllButtonWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  viewAllButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
});

