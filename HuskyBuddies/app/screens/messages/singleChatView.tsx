// app/screens/messages/singlechatview.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const Message = ({ sender, message, time }) => {
  return (
    <View style={styles.messageContainer}>
      <Text style={styles.sender}>{sender}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
};

const SingleChatView = () => {
  const { userid, firstName, lastName, lastMessage } = useLocalSearchParams(); // extract parameters
  const chatMessages = [
    { id: '1', message: "Hey, how are you?", sender: `${firstName} ${lastName}`, time: '2:00 PM' },
    { id: '2', message: `${lastMessage}`, sender: 'You', time: '2:05 PM' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with {firstName} {lastName}</Text>
      {chatMessages.map((msg) => (
        <Message key={msg.id} sender={msg.sender} message={msg.message} time={msg.time} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageContainer: {
    marginBottom: 10,
  },
  sender: {
    fontWeight: 'bold',
  },
  message: {
    marginVertical: 2,
  },
  time: {
    fontSize: 12,
    color: 'gray',
  },
});

export default SingleChatView;
