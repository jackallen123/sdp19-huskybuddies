import { COLORS } from '@/constants/Colors'; 
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Banner = () => {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Let's Chat!</Text>
    </View>
  );
};

const chatData = [
  { id: '1', firstName: 'John', lastName: 'Doe', lastMessage: 'Thanks for the chili powder.', time: '2:15 PM' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', lastMessage: 'Coral!', time: '2:15 PM' },
  { id: '3', firstName: 'Alex', lastName: 'Johnson', lastMessage: 'Is this Squidward?', time: '2:15 PM' },
];

const ChatItem = ({ firstName, lastName, lastMessage, time, onPress }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <Ionicons name="person-circle-outline" size={40} color="gray" style={styles.icon} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{`${firstName} ${lastName}`}</Text>
        <Text style={styles.chatMessage}>{lastMessage}</Text>
      </View>
      <Text style={styles.chatTime}>{time}</Text>
    </TouchableOpacity>
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
const ChatList = () => {
  const router = useRouter();  // Use useRouter from expo-router

  return (
    <FlatList
      data={chatData}
      renderItem={({ item }) => (
        <ChatItem firstName={item.firstName} lastName={item.lastName} lastMessage={item.lastMessage} time={item.time}
          onPress={() => router.push({
            pathname: './singleChatView',
            params: { userId: item.id, firstName: item.firstName, lastName: item.lastName, lastMessage: item.lastMessage},
          })}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};

const styles = StyleSheet.create({
  pageContainer:{
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  container: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  banner: {
    width: Dimensions.get('window').width, //full width according to window
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius:1,
    backgroundColor: COLORS.UCONN_NAVY,
  },
  bannerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chatItem: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#ccc', 
    borderRadius: 25,
    marginBottom: 10,
    padding: 15,
    paddingHorizontal: 10,
    backgroundColor: COLORS.UCONN_WHITE,
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
    color: COLORS.UCONN_NAVY,
  },
  chatMessage: {
    color: 'black',
    fontSize: 14,
  },
  chatTime: {
    color: COLORS.UCONN_GREY,
    fontSize: 14,
  },
});

export default MessagingPage;