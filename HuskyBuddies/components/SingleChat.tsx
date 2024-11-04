import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define colors based on your style guide
const COLORS = {
  UCONN_NAVY: '#0E1E45',
  UCONN_WHITE: '#FFFFFF',
  INPUT_BG: '#F5F5F5',
  BUTTON_BG: '#0E1E45',
  BORDER_COLOR: '#DDDDDD',
};

// Type definition for a chat message
type Message = {
  id: string;
  text: string;
  timestamp: Date;
};

export default function SingleChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: newMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setNewMessage('');
      setErrorMessage(null);
    } else {
      setErrorMessage('Message cannot be empty.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chat</Text>
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        {messages.map((message) => (
          <View key={message.id} style={styles.messageItem}>
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestampText}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </View>

      {/* Message Input Section */}
      <View style={styles.inputContainer}>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={20} color={COLORS.UCONN_WHITE} />
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    padding: 10,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 5,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.BORDER_COLOR,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.INPUT_BG,
    borderColor: COLORS.BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.BUTTON_BG,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
});
