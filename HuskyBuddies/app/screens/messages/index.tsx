import React, {useState, useEffect} from 'react';
import { COLORS } from '@/constants/Colors'; 
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Modal } from 'react-native';
import SingleChatView from '@/components/SingleChat';
import { getAuth } from "firebase/auth";
import { getUsersWithMessages, getAlluidWithNames, getFriends, hasMessagesWithFriend } from "@/backend/firebase/firestoreService";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type MaterialIconName = "add";

{/* MAIN PAGE */}
export default function MessagingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<chatDataProps[]>([]);
  const [showSingleChat, setShowSingleChat] = React.useState(false);
  const [selectedChat, setSelectedChat] = React.useState<chatDataProps | null>(null); //specifies chat data to use when a chat item is pressed. Data type is initialized to null
  const [showAddChatModal, setShowAddChatModal] = React.useState(false); // State for the add chat modal
  const [allUsers, setAllUsers] = React.useState<Array<{ id: string; fullName: string; }>>([]); // State for all users

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

  {/* Fetch users with messages */}
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

{/* Handle add chat press */}
const handleAddChatPress = async () => {
  try {
    if (!userId) {
      console.warn("No user is logged in.");
      return;
    }

    const friendIds = await getFriends(userId); //fetch list of friends
    console.log("Friend uids:", friendIds);

    const alluidWithNames = await getAlluidWithNames(); //fetch all users with their names
    console.log("All users full names + uid:", alluidWithNames);

    //Filter the list of all users to only friends...
    const friendsWithNames = alluidWithNames.filter((user) =>
      friendIds.includes(user.id)
    );

    //Check if any friends have no existing messages...
    const friendsWithNoMessages = await Promise.all( 
      friendsWithNames.map(async (friend) => {
        const hasMessages = await hasMessagesWithFriend(userId, friend.id);
        return { ...friend, hasMessages };
      })
    ).then((friends) => friends.filter((friend) => !friend.hasMessages));

    console.log("Friends with no messages:", friendsWithNoMessages);

    setAllUsers(friendsWithNoMessages); //update state w/ list of friends
    setShowAddChatModal(true); // display modal
  } catch (error) {
    console.error("Error fetching friends or users:", error);
  }
};

return (
  <View style={styles.pageContainer}>
    <Banner onAddChatPress={handleAddChatPress} />
    <View style={styles.container}>
      <ChatList onChatPress={handleChatPress} chatData={users} />
    </View>

    {/* Display modal for all existing users in database */}
    <Modal
      visible={showAddChatModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddChatModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create a new chat</Text>
          {allUsers.length === 0 ? (
            <Text style={styles.placeholderText}>Add new friends to chat.</Text>
          ) : (
            <FlatList
              data={allUsers}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => {
                    setShowAddChatModal(false); //close modal after selecting user
                    setSelectedChat({
                      id: item.id, // otherUserId
                      firstName: item.fullName.split(' ')[0] || "",
                      lastName: item.fullName.split(' ')[1] || "",
                      lastMessage: "", //default
                      time: "", //default
                      profilePicture: "https://robohash.org/ISG.png?set=set1", // HARDCODED! TODO: profile pictures in Firestore
                    });
                    setShowSingleChat(true);
                  }}
                >
                  <Text style={styles.userName}>{item.fullName}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAddChatModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
);
}

{/* U/I COMPONENTS */}
interface BannerProps {
  onAddChatPress: () => void;
}

const Banner = ({ onAddChatPress }: BannerProps) => {
  const iconName: MaterialIconName = "add"; //type safety NOTE: accounts for <Text> component error

  return (
  <View style={styles.banner}>
    <TouchableOpacity style={styles.addButton} onPress={onAddChatPress}>
      <MaterialIcons name={iconName} size={28} color={COLORS.UCONN_WHITE} />
    </TouchableOpacity>
    <Text style={styles.bannerText}>Let's Chat!</Text>
  </View>
);
};

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bannerText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    paddingTop: 40,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 110, 110, 0.5)',
    borderRadius: 25,
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.UCONN_NAVY,
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userName: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.UCONN_WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
    textAlign: 'center',
    paddingTop: 15,
    paddingBottom: 20,
  },
});
