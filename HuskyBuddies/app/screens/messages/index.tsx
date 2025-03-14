import React from 'react';
import { COLORS } from '@/constants/Colors'; 
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SingleChatView from '@/components/SingleChat';

{/* MAIN PAGE */}
export default function MessagingPage() {
    const [showSingleChat, setShowSingleChat] = React.useState(false);
    const [selectedChat, setSelectedChat] = React.useState<chatDataProps | null>(null); //specifies chat data to use when a chat item is pressed. Data type is initialized to null
  
    //switches to single chat view and with data from chat item selected...
    const handleChatPress = (chat: chatDataProps) => {
      setSelectedChat(chat);
      setShowSingleChat(true);
    };
  
    if (showSingleChat && selectedChat && ischatDataProps(selectedChat)) {
      return (
        <SingleChatView
          //passing params...
          onBack={() => setShowSingleChat(false)} 
          firstName={selectedChat.firstName} 
          lastName={selectedChat.lastName} 
          lastMessage={selectedChat.lastMessage} 
          profilePicture={selectedChat.profilePicture}
        />
      );
    }

    return (
      <View style={styles.pageContainer}>
        <Banner />
        <View style={styles.container}>
          <ChatList onChatPress={handleChatPress} />
        </View>
      </View>
    );
}

{/* COMPONENTS */}
const Banner = () => (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Let's Chat!</Text>
    </View>
);

//define types for chat data...
interface chatDataProps {
  id: string;
  firstName: string;
  lastName: string;
  lastMessage: string;
  time: string;
  profilePicture: string;
}

//type guard to check chat data type...
function ischatDataProps(chat: any): chat is chatDataProps {
  return (
    chat &&
    typeof chat.id === 'string' &&
    typeof chat.firstName === 'string' &&
    typeof chat.lastName === 'string' &&
    typeof chat.lastMessage === 'string' &&
    typeof chat.time === 'string' &&
    typeof chat.profilePicture === 'string'
  );
}

const chatData: chatDataProps[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', lastMessage: 'Thanks for the chili powder.', time: '2:15 PM', profilePicture: 'https://robohash.org/stefan-one' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', lastMessage: 'Coral!', time: '2:15 PM', profilePicture: 'https://robohash.org/stefan-two'},
  { id: '3', firstName: 'Alex', lastName: 'Johnson', lastMessage: 'Is this Squidward?', time: '2:15 PM', profilePicture: 'https://robohash.org/stefan-three' },
];

const ChatList = ({ onChatPress }: { onChatPress: (chat: chatDataProps) => void }) => {
  return (
    <FlatList
      data={chatData}
      renderItem={({ item }) => (
        <ChatItem 
          id  = {item.id} 
          firstName={item.firstName} 
          lastName={item.lastName} 
          lastMessage={item.lastMessage} 
          time={item.time} 
          profilePicture={item.profilePicture}
          onPress={onChatPress} 
          chat={item}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};

const ChatItem: React.FC<chatDataProps & { onPress: (chat: chatDataProps) => void; chat: chatDataProps }> = ({ firstName, lastName, lastMessage, time, profilePicture, onPress, chat }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(chat)}>
      {/* Passes the data from a selected chat item to onPress function */}
      <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{firstName} {lastName}</Text>
        <Text style={styles.chatMessage}>{lastMessage}</Text>
      </View>
      <Text style={styles.chatTime}>{time}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
  },
  container: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  banner: {
    width: Dimensions.get('window').width,
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius: 1,
    backgroundColor: COLORS.UCONN_NAVY,
  },
  bannerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
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
  profilePicture: {
    width: 50, 
    height: 50,
    borderRadius: 25,
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
