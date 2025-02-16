//Imports
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/Colors';
import { AddStudySessionToDatabase, DeleteStudySessionFromDatabase} from '@/backend/firebase/firestoreService';

//Dummy data for friends list until database is set up
const friendsList = ['Alice', 'Bob', 'Charlie', 'Diana'];

//Iinterface setup for database 
interface StudySession {
  id: number; 
  title: string;
  date: string; 
  friends: string[]; 
}

export default function StudyScheduler({ onBack, onSchedule }: { onBack: () => void; onSchedule: (session: StudySession) => void }) {
  //Allows selection of friends, date, and time
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<StudySession[]>([]);

  //Load previously scheduled sessions from AsyncStorage
  useEffect(() => {
    const loadScheduledSessions = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('scheduledSessions');
        if (savedSessions) {
          setScheduledSessions(JSON.parse(savedSessions)); 
        }
      } catch (error) {
        console.error('Failed to load scheduled sessions', error);
      }
    };
    loadScheduledSessions();
  }, []);

  //Save updates to sessions to AsyncStorage
  const saveScheduledSessions = async (sessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem('scheduledSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save scheduled sessions', error);
    }
  };

  //Allows toggle feature for friend selection 
  const toggleFriendSelection = (friend: string) => {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friend));
    } else {
      setSelectedFriends([...selectedFriends, friend]); 
    }
  };

  //Schedule a new study session with error handling
  const scheduleSession = () => {
    if (date && selectedFriends.length > 0) {
      const newSession: StudySession = {
        id: scheduledSessions.length + 1, 
        title: `Study session with ${selectedFriends.join(', ')}`, 
        date: date.toISOString(), 
        friends: selectedFriends, 
      };
      const updatedSessions = [...scheduledSessions, newSession]; 
      setScheduledSessions(updatedSessions); 
      saveScheduledSessions(updatedSessions); 
      onSchedule(newSession); 
      setSelectedFriends([]); 
      setDate(null); 
      alert('Study session scheduled!');
      // Store study session in database
      AddStudySessionToDatabase(newSession.id,newSession.title, newSession.date, newSession.friends);


    } else {
      alert('Please select at least one friend and set a date and time.');
    }
  };

  //Delete a study session
  const deleteSession = (id: number) => {
    const updatedSessions = scheduledSessions.filter((session) => session.id !== id); 
    setScheduledSessions(updatedSessions); 
    saveScheduledSessions(updatedSessions); 
    DeleteStudySessionFromDatabase(id.toString())
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
            onPress={() => toggleFriendSelection(friend)} 
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

        {/* Date */}
        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate); 
                setShowTimePicker(true); 
              }
            }}
          />
        )}

        {/* Time */}
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
            <Text> No sessions scheduled yet.</Text> // Intial message
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

//Styles to keep pages consistent 
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