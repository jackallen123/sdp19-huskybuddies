import React, {useState, useEffect} from 'react';
import { COLORS } from '@/constants/Colors'; 
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import SingleChatView from '@/components/SingleChat';
import { getAuth } from "firebase/auth";
import { getUsersWithMessages } from "@/backend/firebase/firestoreService";

{/* MAIN PAGE */}
export default function MessagingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<chatDataProps[]>([]);
  const [showSingleChat, setShowSingleChat] = React.useState(false);
  const [selectedChat, setSelectedChat] = React.useState<chatDataProps | null>(null); //specifies chat data to use when a chat item is pressed. Data type is initialized to null

  {/* Retrieve logged in user's ID */}
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
  
    if (currentUser) {
      setUserId(currentUser.uid); // store user's ID
      console.log("Logged-in User ID:", currentUser.uid);
    } else {
      console.log("No user is logged in.");
    }
  }, []);
  
  useEffect(() => {
    if (!userId) return;
    const fetchUsers = async () => {
      const usersData = await getUsersWithMessages(userId);
      setUsers(usersData);
      console.log("Fetched users with messages:", usersData);
    };
    fetchUsers();
  }, [userId]);
  
  //switches to single chat view and with data from chat item selected...
  const handleChatPress = (chat: chatDataProps) => {
    setSelectedChat(chat);
    setShowSingleChat(true);
  };
  
    if (showSingleChat && selectedChat && ischatDataProps(selectedChat)) {
      return (
        <SingleChatView
          onBack={() => setShowSingleChat(false)} 
          firstName={selectedChat.firstName} 
          lastName={selectedChat.lastName} 
          lastMessage={selectedChat.lastMessage} 
          profilePicture={selectedChat.profilePicture}
          userId={userId!} //use userId iff user id exists
          otherUserId={selectedChat.id}
        />
      );
    }

    return (
      <View style={styles.pageContainer}>
        <Banner />
        <View style={styles.container}>
          <ChatList onChatPress={handleChatPress} chatData={users} />
        </View>
      </View>
    );
}

{/* U/I COMPONENTS */}
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

//type guard to check data type...
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

const ChatList = ({ onChatPress, chatData }: { onChatPress: (chat: chatDataProps) => void, chatData: chatDataProps[] }) => {
  return (
    <FlatList
      data={chatData}
      renderItem={({ item }) => (
        <ChatItem 
          id = {item.id} 
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

//pass the data from a selected chat item to onPress function...
const ChatItem: React.FC<chatDataProps & { onPress: (chat: chatDataProps) => void; chat: chatDataProps }> = ({ firstName, lastName, lastMessage, time, profilePicture, onPress, chat }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(chat)}>
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
