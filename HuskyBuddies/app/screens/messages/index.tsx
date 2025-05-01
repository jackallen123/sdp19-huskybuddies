import React, { useState, useEffect } from 'react';
import { COLORS } from '@/constants/Colors';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Modal } from 'react-native';
import SingleChatView from '@/components/SingleChat';
import { getAuth } from "firebase/auth";
import { getUsersWithMessages, getAlluidWithNames, getFriends, hasMessagesWithFriend, deleteChat, getUserProfilePictureUniversal } from "@/backend/firebase/firestoreService";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

// TYPES & INTERFACES -----------------------------------------

interface BannerProps {
  onAddChatPress?: () => void;
  theme: any;
}

interface User {
  id: string;
  fullName: string;
  profilePicture?: string;
  hasMessages?: boolean;
}

interface chatDataProps {
  id: string;
  firstName: string;
  lastName: string;
  lastMessage: string;
  timestamp: any;
  time: string;
  profilePicture: string;
  theme: any;
}

interface ChatListProps {
  onChatPress: (chat: chatDataProps) => void;
  onLongPress: (chat: chatDataProps) => void;
  chatData: chatDataProps[];
  theme: any;
}

interface ChatItemProps {
  id: string;
  firstName: string;
  lastName: string;
  lastMessage: string;
  timestamp: any;
  time: string;
  profilePicture: string;
  onPress: (chat: chatDataProps) => void;
  chat: chatDataProps;
  theme: any;
}


{/* MAIN PAGE */ }
export default function MessagingPage() {
  const theme = useTheme();


  // STATES & REFERENCES -----------------------------------------
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<chatDataProps[]>([]);
  const [showSingleChat, setShowSingleChat] = React.useState(false);
  const [selectedChat, setSelectedChat] = React.useState<chatDataProps | null>(null); //specifies chat data to use when a chat item is pressed
  const [showAddChatModal, setShowAddChatModal] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<chatDataProps | null>(null);
  const [hiddenChats, setHiddenChats] = useState<string[]>([]); //array of chat IDs
  const [isFetching, setIsFetching] = useState(false); //buffering state for animation


// EFFECTS -----------------------------------------

  //Authenticate logged in user...
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

 // Retrieve users with messages...
  useEffect(() => {
    if (!userId) return;
    const fetchUsers = async () => {
      const usersData = await getUsersWithMessages(userId);
      setUsers(usersData);
      //console.log("Fetched users with messages:", usersData);   // DEBUGGING
    };
    fetchUsers();
  }, [userId]);

// SUB-COMPONENTS -----------------------------------
  const Banner = ({ onAddChatPress, theme }: BannerProps) => {
    return (
      <View style={[styles.banner, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={[styles.addButton]} onPress={onAddChatPress}>
          <MaterialIcons name={"add"} size={28} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <Text style={[styles.bannerText, { color: theme.colors.onPrimary }]}>Let's Chat!</Text>
      </View>
    );
  };

  function ischatDataProps(chat: any): chat is chatDataProps {
    return (
      chat &&
      typeof chat.id === 'string' &&
      typeof chat.firstName === 'string' &&
      typeof chat.lastName === 'string' &&
      typeof chat.lastMessage === 'string' &&
      chat.timestamp &&
      typeof chat.time === 'string' &&
      typeof chat.profilePicture === 'string'
    );
  }

  const ChatList = ({
    onChatPress,
    onLongPress,
    chatData,
    theme
  }: ChatListProps) => {
    return (
      <FlatList
        data={chatData}
        renderItem={({ item }) => (
          <ChatItem
            id={item.id}
            firstName={item.firstName}
            lastName={item.lastName}
            lastMessage={item.lastMessage}
            timestamp={item.timestamp}
            time={item.time}
            profilePicture={item.profilePicture}
            onPress={onChatPress}
            onLongPress={onLongPress}
            chat={item}
            theme={theme}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    );
  };

  const formatTimestampDisplay = (timeString: string, firestoreTimestamp: any) => {
    if (firestoreTimestamp) {
      try {
        const messageDate = firestoreTimestamp.toDate();
        const today = new Date();

        //define current date and yesterday's date
        const isToday = messageDate.toDateString() === today.toDateString();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = messageDate.toDateString() === yesterday.toDateString();

        if (isToday) {
          return timeString;
        } else if (isYesterday) {
          return "Yesterday";
        } else {
          return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      } catch (e) {
        console.error("Error formatting timestamp:", Error);
      }
    }
    return timeString;
  };


  const ChatItem: React.FC<ChatItemProps & { onLongPress: (chat: chatDataProps) => void }> = ({
    id,
    firstName,
    lastName,
    lastMessage,
    timestamp,
    time,
    profilePicture,
    onPress,
    onLongPress,
    chat,
    theme
  }) => {
    const displayTime = formatTimestampDisplay(time, timestamp);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => onPress(chat)}
        onLongPress={() => onLongPress(chat)}
        delayLongPress={500}>
        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, { color: theme.colors.onBackground }]}>{firstName} {lastName}</Text>
          <Text style={[styles.chatMessage, { color: theme.colors.onBackground }]}>{lastMessage}</Text>
        </View>
        <Text style={styles.chatTime}>{displayTime}</Text>
      </TouchableOpacity>
    );
  };

// HANDLERS -----------------------------------------

  // Switches to single chat view and with data from chat item selected...
  const handleChatPress = async (chat: chatDataProps) => {
    setSelectedChat(chat);
    setShowSingleChat(true);

    // Refresh the chat list when opening a chat
    if (userId) {
      const updatedUsers = await getUsersWithMessages(userId);
      setUsers(updatedUsers);
    }
  };

  if (showSingleChat && selectedChat && ischatDataProps(selectedChat)) {
    return (
      <SingleChatView
        onBack={async () => {
          // Refresh the chat list before navigating back...
          if (userId) {
            const updatedUsers = await getUsersWithMessages(userId);
            setUsers(updatedUsers);
          }
          setShowSingleChat(false);
        }}
        firstName={selectedChat.firstName}
        lastName={selectedChat.lastName}
        lastMessage={selectedChat.lastMessage}
        profilePicture={selectedChat.profilePicture}
        userId={userId!}
        otherUserId={selectedChat.id}
      />
    );
  }

  const handleAddChatPress = async () => {
    try {
      if (!userId) {
        console.warn("No user is logged in.");
        return;
      }

      setIsFetching(true); //buffering animation
      //const start = Date.now();  // DEBUGGING: timing fetch

      const friendIds = await getFriends(userId); //fetch list of friends
      console.log("Friend uids:", friendIds);

      const alluidWithNames = await getAlluidWithNames(); //fetch all users with their names
      console.log("All users full names + uid:", alluidWithNames);

      //Filter the list of all users to only friends...
      const friendsNames = alluidWithNames.filter((user) =>
        friendIds.includes(user.id)
      );

      //Check if any friends have no existing messages...
      const friendsWithNoMessages = await Promise.all(
        friendsNames.map(async (friend) => {
          const hasMessages = await hasMessagesWithFriend(userId, friend.id);
          const profilePicture = await getUserProfilePictureUniversal(friend.id);
          return {
            ...friend,
            hasMessages,
            profilePicture: profilePicture || "https://www.solidbackgrounds.com/images/950x350/950x350-light-gray-solid-color-background.jpg",
          };
        })
      ).then((friends) => friends.filter((friend) => !friend.hasMessages));

      //const duration = Date.now() - start;     // DEBUGGING: timing fetch
      //console.log(`[PERF] fetchFriends took ${duration}ms`);     // DEBUGGING: timing fetch

      //console.log("Friends with no messages:", friendsWithNoMessages); //DEBUGGING

      setAllUsers(friendsWithNoMessages);
      setShowAddChatModal(true);
    } catch (error) {
      console.error("Error fetching friends or users:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleLongPress = (chat: chatDataProps) => {
    setChatToDelete(chat);
    setShowDeleteChatModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete?.id || !userId) {
      console.error("Invalid chat data or invalid userID");
      setShowDeleteChatModal(false);
      return;
    }

    setShowDeleteChatModal(false);
    setIsFetching(true);

    try {
      const result = await deleteChat(userId, chatToDelete.id, hiddenChats);

      const updatedHiddenChats = [...hiddenChats, chatToDelete.id];
      setHiddenChats(updatedHiddenChats);

      if (result.success) {
        setHiddenChats(updatedHiddenChats);
        await AsyncStorage.setItem(
          `hiddenChats_${userId}`,
          JSON.stringify(updatedHiddenChats)
        );

        const updatedUsers = await getUsersWithMessages(userId);
        setUsers(updatedUsers);
      } else {
        console.error("Chat deletion failed:", result.error);
      }
    } catch (error) {
      console.error("Chat deletion error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteChatModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteChatModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]
        }>
          <Text style={[styles.deleteModalTitle, {color: theme.colors.onSurface}
          ]}>
            Delete chat with {chatToDelete?.firstName} {chatToDelete?.lastName}?
          </Text>
          <Text style={[styles.deleteModalText, {color: theme.colors.onSurface}]}>
            This will permanently erase the chat from your inbox.
          </Text>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.cancelButton]}
              onPress={() => setShowDeleteChatModal(false)}
            >
              <Text style={[styles.deleteModalButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteButton]}
              onPress={handleConfirmDelete}
            >
              <Text style={styles.deleteModalButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

// STYLES -----------------------------------------
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
    position: 'relative',
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
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 10,
    padding: 15,
    paddingHorizontal: 10,
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
    color: COLORS.UCONN_NAVY
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
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModalContent: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.UCONN_NAVY,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.UCONN_GREY,
  },
  deleteButton: {
    backgroundColor: COLORS.UCONN_RED,
  },
  deleteModalButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
  loadingOverlay: {
    borderWidth: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(112, 110, 110, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.UCONN_NAVY,
  },
  backButton: {
    position: 'absolute',
    left: 30,
    top: 60,
    padding: 7,
    zIndex: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

// RENDER -----------------------------------------
  return (
    <View style={{ flex: 1 }}>
    {isFetching && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.dark ? 'rgba(33, 33, 33, 0.7)' : 'rgba(255,255,255,0.7)',
        zIndex: 1000
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )}

    <View style={[styles.pageContainer, { backgroundColor: theme.colors.background }]}>
      {/* Single Banner controlled by MessagingPage */}
      {/* Main content area - switches between ChatList and SingleChatView */}
      {showSingleChat && selectedChat ? (
        <SingleChatView
          onBack={async () => {
            console.log('[DEBUG] Navigating back from SingleChatView');
            setShowSingleChat(false);

            //Refresh chat list when returning from chat log...
            if (userId) {
              const updatedUsers = await getUsersWithMessages(userId);
              setUsers(updatedUsers);
            }
          }}
          firstName={selectedChat.firstName}
          lastName={selectedChat.lastName}
          lastMessage={selectedChat.lastMessage}
          profilePicture={selectedChat.profilePicture}
          userId={userId!}
          otherUserId={selectedChat.id}
        />
      ) : (
        <>
          {/* Chat list view */}
          <Banner onAddChatPress={handleAddChatPress} theme={theme} />
          <View style={styles.container}>
            <ChatList
              onChatPress={(chat) => {
                console.log('[DEBUG] Existing chat selected:', chat.id);
                handleChatPress(chat);
              }}
              onLongPress={handleLongPress}
              chatData={[...users]
                .filter(chat => !hiddenChats.includes(chat.id))
                .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
              }
              theme={theme}
            />
          </View>

          {/* Add chat modal */}
          <Modal
            visible={showAddChatModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              console.log('[DEBUG] Add chat modal closed');
              setShowAddChatModal(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}> Create a new chat</Text>
                {allUsers.length === 0 ? (
                  <Text style={styles.placeholderText}>Add new friends to chat.</Text>
                ) : (
                  <FlatList
                    data={allUsers}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.userItem,
                          {borderBottomColor: theme.colors.onSurface + '50'}]}
                        onPress={() => {
                          //console.log('Selected user for new chat:', item.id);    //DEBUGGING
                          setShowAddChatModal(false);

                          const newChat = {
                            id: item.id,
                            firstName: item.fullName.split(' ')[0] || "",
                            lastName: item.fullName.split(' ')[1] || "",
                            lastMessage: "Send a message to begin chatting.",
                            timestamp: "",
                            time: "",
                            profilePicture: item.profilePicture || "https://www.solidbackgrounds.com/images/950x350/950x350-light-gray-solid-color-background.jpg",
                            theme
                          };

                          //console.log('Created new chat:', newChat);     //DEBUGGING
                          setUsers(prev => [...prev, newChat]);
                          setSelectedChat(newChat);
                          setShowSingleChat(true);

                          // Short delay ensures state updates fully before rendering...
                          setSelectedChat(newChat);
                          setTimeout(() => {
                            setShowSingleChat(true);
                          }, 2); //delay
                        }}
                      >
                        <Text style={[styles.userName, { color: theme.colors.onSurface }]}>{item.fullName}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={true} 
                    indicatorStyle="black"
                    scrollIndicatorInsets={{ right: 1 }}
                  />
                )}
                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: theme.colors.onPrimaryContainer }]}
                  onPress={() => setShowAddChatModal(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
      <DeleteConfirmationModal />
    </View>
    </View>
  );
}