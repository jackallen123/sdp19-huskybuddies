import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/Colors';

// Dummy data for friends list
const friendsList = ['Alice', 'Bob', 'Charlie', 'Diana'];

interface StudySession {
  id: number; 
  title: string;
  date: string; 
  friends: string[]; 
}

export default function StudyScheduler({ onBack, onSchedule }: { onBack: () => void; onSchedule: (session: StudySession) => void }) {
  // State hooks for tracking the selected friends, date, and scheduled sessions
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<StudySession[]>([]);

  // Load previously scheduled sessions from AsyncStorage when the component mounts
  useEffect(() => {
    const loadScheduledSessions = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('scheduledSessions');
        if (savedSessions) {
          setScheduledSessions(JSON.parse(savedSessions)); // Parse and load sessions
        }
      } catch (error) {
        console.error('Failed to load scheduled sessions', error);
      }
    };
    loadScheduledSessions();
  }, []);

  // Save updated sessions to AsyncStorage
  const saveScheduledSessions = async (sessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem('scheduledSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save scheduled sessions', error);
    }
  };

  // Toggle the selection of a friend (add or remove from the selected list)
  const toggleFriendSelection = (friend: string) => {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friend)); // Deselect
    } else {
      setSelectedFriends([...selectedFriends, friend]); // Select
    }
  };

  // Schedule a new study session if there is a valid date and at least one friend selected
  const scheduleSession = () => {
    if (date && selectedFriends.length > 0) {
      const newSession: StudySession = {
        id: scheduledSessions.length + 1, // Generate a unique id for the session
        title: `Study session with ${selectedFriends.join(', ')}`, // Create a title from selected friends
        date: date.toISOString(), // Convert date to ISO string for storage
        friends: selectedFriends, // List of selected friends for the session
      };
      const updatedSessions = [...scheduledSessions, newSession]; // Add the new session to the list
      setScheduledSessions(updatedSessions); // Update state
      saveScheduledSessions(updatedSessions); // Save the updated sessions to AsyncStorage
      onSchedule(newSession); // Notify parent component of the new session
      setSelectedFriends([]); // Clear the selected friends
      setDate(null); // Clear the date
      alert('Study session scheduled!');
    } else {
      alert('Please select at least one friend and set a date and time.');
    }
  };

  // Delete a scheduled session by its index
  const deleteSession = (id: number) => {
    const updatedSessions = scheduledSessions.filter((session) => session.id !== id); // Filter out the session with the given id
    setScheduledSessions(updatedSessions); // Update state
    saveScheduledSessions(updatedSessions); // Save the updated list of sessions
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Study Scheduler</Text>
        </View>
      </View>

      {/* Section to select friends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Friends</Text>
        {friendsList.map((friend) => (
          <TouchableOpacity
            key={friend}
            style={[styles.friendItem, selectedFriends.includes(friend) && styles.selectedFriend]}
            onPress={() => toggleFriendSelection(friend)} // Toggle friend selection on press
          >
            <Text style={styles.friendText}>{friend}</Text>
            {selectedFriends.includes(friend) && <Ionicons name="checkmark" size={20} color={COLORS.UCONN_WHITE} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Date and Time Selection */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{date ? date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Date & Time'}</Text>
        </TouchableOpacity>

        {/* Date picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate); // Set the selected date
                setShowTimePicker(true); // Show time picker after selecting the date
              }
            }}
          />
        )}

        {/* Time picker */}
        {showTimePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setDate(new Date(date!.setHours(selectedTime.getHours(), selectedTime.getMinutes()))); // Set the time for the selected date
              }
            }}
          />
        )}
      </View>

      {/* Schedule button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.scheduleButton} onPress={scheduleSession}>
          <Text style={styles.scheduleButtonText}>Schedule Study Session</Text>
        </TouchableOpacity>
      </View>

      {/* Section to display scheduled sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Study Sessions:</Text>

        <ScrollView style={styles.scrollContainer}>
          {scheduledSessions.length > 0 ? (
            scheduledSessions.map((session) => (
              <View key={session.id} style={styles.sessionBox}>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionText}>
                    {session.title} {/* Display session title */}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString()}, {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Delete button for each session */}
                <TouchableOpacity onPress={() => deleteSession(session.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text>No sessions scheduled yet.</Text> // Message if there are no sessions
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
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
  backButton: {
    padding: 8,
  },
  section: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.UCONN_NAVY,
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderColor: COLORS.UCONN_NAVY,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedFriend: {
    backgroundColor: COLORS.UCONN_GREY,
  },
  friendText: {
    color: COLORS.UCONN_NAVY,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  scheduleButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 100,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    paddingBottom: 10,
  },
  scrollContainer: {
    maxHeight: 300
  },
  sessionBox: {
    backgroundColor: COLORS.UCONN_WHITE,
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
  },
  sessionDate: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
  },
});
