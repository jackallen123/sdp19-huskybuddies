import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/Colors';

const friendsList = ['Alice', 'Bob', 'Charlie', 'Diana']; // Dummy data for friends

export default function StudyScheduler({ onBack, onSchedule }: { onBack: () => void; onSchedule: (session: any) => void }) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([]); // Store scheduled sessions

  const toggleFriendSelection = (friend: string) => {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(selectedFriends.filter(f => f !== friend));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const scheduleSession = () => {
    if (date && selectedFriends.length > 0) {
      const newSession = { friends: selectedFriends, date };
      setScheduledSessions([...scheduledSessions, newSession]);
      onSchedule(newSession); 
      setSelectedFriends([]);
      setDate(null);
      alert('Study session scheduled!');
    } else {
      alert('Please select at least one friend and set a date and time.');
    }
  };

  const deleteSession = (index: number) => {
    setScheduledSessions(scheduledSessions.filter((_, i) => i !== index));
  };

  const renderSession = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.sessionItem}>
      <Text style={styles.sessionText}>
        {item.friends.join(', ')} - {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <TouchableOpacity onPress={() => deleteSession(index)} style={styles.deleteButton}>
        <Ionicons name="trash" size={20} color={COLORS.UCONN_WHITE} />
      </TouchableOpacity>
    </View>
  );

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

      {/* Friends List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Friends</Text>
        <FlatList
          data={friendsList}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.friendItem, selectedFriends.includes(item) && styles.selectedFriend]}
              onPress={() => toggleFriendSelection(item)}
            >
              <Text style={styles.friendText}>{item}</Text>
              {selectedFriends.includes(item) && <Ionicons name="checkmark" size={20} color={COLORS.UCONN_WHITE} />}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Date & Time Picker */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{date ? date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Date & Time'}</Text>
        </TouchableOpacity>

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

        {showTimePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setDate(new Date(date!.setHours(selectedTime.getHours(), selectedTime.getMinutes())));
              }
            }}
          />
        )}
      </View>

      {/* Schedule Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.scheduleButton} onPress={scheduleSession}>
          <Text style={styles.scheduleButtonText}>Schedule Study Session</Text>
        </TouchableOpacity>
      </View>

      {/* Display Scheduled Study Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Study Sessions:</Text>
        
        <FlatList
          data={scheduledSessions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderSession}
        />
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
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.UCONN_NAVY,
    marginBottom: 10,
  },
  sessionText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  deleteButton: {
    backgroundColor: '#FF4C4C',
    padding: 8,
    borderRadius: 5,
  }
});
