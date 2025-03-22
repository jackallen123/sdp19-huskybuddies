import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/Colors';
import { Timestamp } from 'firebase/firestore';
import { 
  FetchStudySessionsFromDatabase,  
  AddStudySessionToDatabase,   
  DeleteStudySessionFromDatabase 
} from '@/backend/firebase/firestoreService';

interface StudySession {
  id: string;
  title: string;
  date: Timestamp;
  friends: string[];
}

const friendsList = ['Alice', 'Bob', 'Charlie', 'Diana'];

type StudySchedulerProps = {
  onBack: () => void;
  onSchedule: (session: StudySession) => void;
  onDeleteSession: (id: string) => void;
};

export default function StudyScheduler({ onBack, onDeleteSession, onSchedule }: StudySchedulerProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    const unsubscribe = FetchStudySessionsFromDatabase((sessions: StudySession[]) => {
      const formattedSessions = sessions.map((session: StudySession) => ({
        id: session.id,
        title: session.title,
        date: session.date,
        friends: session.friends,
      }));
      setScheduledSessions(formattedSessions);
    });
  
    return () => unsubscribe();
  }, []); 
  
  const toggleFriendSelection = (friend: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friend) ? prev.filter(f => f !== friend) : [...prev, friend]
    );
  };

  const scheduleSession = async () => {
    if (date && selectedFriends.length > 0) {
      const newSession: StudySession = {
        id: new Date().toISOString(),
        title: `Study session with ${selectedFriends.join(', ')}`,
        date: Timestamp.fromDate(date),
        friends: selectedFriends,
      };
      await AddStudySessionToDatabase(newSession.id, newSession.title, newSession.date, newSession.friends);
      onSchedule(newSession);
      setSelectedFriends([]);
      setDate(null);
      alert('Study session scheduled!');
    } else {
      alert('Please select at least one friend and set a date and time.');
    }
  };

  const handleDeleteStudySession = async (id: string) => {
    try {
      await DeleteStudySessionFromDatabase(id);
      alert('Study session deleted!');
    } catch (error) {
      alert('Error deleting study session');
    }
  };
  

  const formatDate = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    return 'Invalid Date';
  };
  
  
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Study Scheduler</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Friends</Text>
        {friendsList.map((friend) => (
          <TouchableOpacity key={friend} style={[styles.friendItem, selectedFriends.includes(friend) && styles.selectedFriend]} onPress={() => toggleFriendSelection(friend)}>
            <Text style={styles.friendText}>{friend}</Text>
            {selectedFriends.includes(friend) && <Ionicons name="checkmark" size={20} color={COLORS.UCONN_WHITE} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{date ? date.toLocaleString() : 'Select Date & Time'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date || new Date()} mode="date" display="default" onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              setShowTimePicker(true);
            }
          }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date || new Date()} mode="time" display="default" onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime && date) {
              setDate(new Date(date.setHours(selectedTime.getHours(), selectedTime.getMinutes())));
            }
          }} />
        )}
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.scheduleButton} onPress={scheduleSession}>
          <Text style={styles.scheduleButtonText}>Schedule Study Session</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Scheduled Study Sessions:</Text>
        <ScrollView style={styles.scrollContainer}>
          {scheduledSessions.length > 0 ? (
            scheduledSessions.map((session) => (
              <View key={session.id} style={styles.sessionBox}>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionText}>{session.title}</Text>
                  <Text style={styles.sessionDate}>
                    {session.date ? formatDate(session.date) : 'Invalid Date'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteStudySession(session.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text>No sessions scheduled yet.</Text>
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
    paddingBottom: 20
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
  },
  sessionDate: {
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#FF4C4C',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF'
  },
});
