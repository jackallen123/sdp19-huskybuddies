import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';

const Banner = () => {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Let's Chat!</Text>
    </View>
  );
};

const MessagingPage = () => {
  return (
    // Separate containers for banner to be full-width
    <View style={styles.pageContainer}>
      <Banner />
      <View style={styles.container}>
        <ChatList />
      </View>
    </View>
  );
};

const chatData = [
  { id: '1', firstName: 'Always', lastName: 'Sunny', lastMessage: 'Thanks for the chili powder.', time: '2:15 PM' },
  { id: '2', firstName: 'Walking', lastName: 'Dead', lastMessage: 'Coral!', time: '2:15 PM' },
  { id: '3', firstName: 'Spongebob', lastName: 'Squarepants', lastMessage: 'Is this Squidward?', time: '2:15 PM' },
];

const ChatItem = ({ firstName, lastName, lastMessage, time }) => {
  return (
    <TouchableOpacity style={styles.chatItem}>
      <Ionicons name="person-circle-outline" size={40} color="gray" style={styles.icon} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{`${firstName} ${lastName}`}</Text>
        <Text style={styles.chatMessage}>{lastMessage}</Text>
      </View>
      <Text style={styles.chatTime}>{time}</Text>
    </TouchableOpacity>
  );
};

const ChatList = () => {
  return (
    <FlatList
      data={chatData}
      renderItem={({ item }) => (
        <ChatItem firstName={item.firstName} lastName={item.lastName} lastMessage={item.lastMessage} time={item.time} />
      )}
      keyExtractor={item => item.id}
    />
  );
};

const styles = StyleSheet.create({
  pageContainer:{
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingLeft: 20, 
  },
  banner: {
    width: Dimensions.get('window').width, //full width according to window
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius:1, 
    backgroundColor: '#4caf50',
  },
  bannerText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chatItem: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#ccc', 
    borderRadius: 1,
    marginBottom: 10,
    padding: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatMessage: {
    color: 'gray',
    fontSize: 14,
  },
  chatTime: {
    color: 'gray',
    fontSize: 12,
  },
});

export default MessagingPage;