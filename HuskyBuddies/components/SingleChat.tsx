import React, {useState, useEffect, useRef} from 'react';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard,Platform, Image, ScrollView} from 'react-native';
import { sendMessage, getMessages, getUserId, getFullName } from '@/backend/firebase/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SingleChatViewProps {
    onBack: () => void;
    firstName: string;
    lastName: string;
    lastMessage: string;
    profilePicture: string;
    userId: string;
    otherUserId: string;
}

export default function SingleChatView({ onBack, firstName, lastName, profilePicture, otherUserId}: SingleChatViewProps) {

{/* Retrieve logged in user's ID */}

const [userId, setUserId] = useState<string | null>(null);
const [userFullName, setUserFullName] = useState<string>(""); //store first + last name
const scrollViewRef = useRef<ScrollView>(null);
const senderNameCache = useRef<{ [key: string]: string }>({});

//Fetch full name of logged in user...
useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const uid = await getUserId();
      if (uid) {
        setUserId(uid);
        console.log("Logged-in user ID:", uid);

        const fullName = await getFullName(uid); 
        if (fullName) {
          setUserFullName(fullName);
          console.log("Logged-in user full name:", fullName);
        }
      } else {
        console.warn("[!] No user logged in."); 
      }
    } catch (error) {
      console.error("Error fetching logged-user info:", error);
    }
  };

  fetchUserInfo();
}, []);

//Fetch full name of sender using cache...
const fetchSenderName = async (senderId: string) => {
  if (senderNameCache.current[senderId]) { //if senderId is already stored in cache, return it
    return senderNameCache.current[senderId]; 
  }
  const name = await getFullName(senderId);
  if (name) {
    senderNameCache.current[senderId] = name;
    return name;
  }
  return senderId;
};

//Fetch messages between logged-in user and other user (of the selected chat) upon press/when component mounts...
useEffect(() => {
  console.log("Checking userId and otherUserId before fetching messages...");
  console.log("userId:", userId);
  console.log("otherUserId:", otherUserId);

  if (!userId || !otherUserId) {
    console.warn("[!] userId or otherUserId missing. Skipping message fetch...");
    return;
  }

  console.log("Fetching messages between:", userId, "and", otherUserId);

  const unsubscribe = getMessages(userId, otherUserId, async (messages: any[]) => {
    console.log("Messages from Firestore:", messages);

    const formattedMessages = await Promise.all( //promise handles asynch fetchSenderName calls
      messages.map(async (msg) => {
        const messageDate = msg.timestamp ? new Date(msg.timestamp.toDate()) : null;
        const today = new Date();
        
        let displayTime = "Unknown"; //default time
  
        if (messageDate) {
          const isToday = //store current date
            messageDate.getDate() === today.getDate() &&
            messageDate.getMonth() === today.getMonth() &&
            messageDate.getFullYear() === today.getFullYear();
  
          //if the message was sent/received on current date, show timestamp as HH:MM. Otherwise, show date and time
          displayTime = isToday
            ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            : messageDate.toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        }

      const senderName = await fetchSenderName(msg.senderId);

      return {
        sender: senderName,
        receiver: msg.receiverId,
        message: msg.messageContent,
        time: displayTime,
      };
    })
  );

    setChatMessages(formattedMessages);
  });

  return () => { //stop message listener when unmounting
    unsubscribe();
  };

}, [userId, otherUserId]);

const [messageInput, setMessageInput] = useState('');
const [chatMessages, setChatMessages] = useState<Array<{ sender: string; receiver: string; message: string; time: string }>>([]); //assert expected object types for variables in array and initiliaze empty array

useEffect(() => {
  scrollViewRef.current?.scrollToEnd({ animated: true }); //handle scroll view in chat log
}, [chatMessages]);

const handleSendMessage = async () => {
  if (!userId || messageInput.trim() === '') return; //prevent empty messages, check for userId

  const newMessage = {
    sender: userId,
    receiver: otherUserId, 
    message: messageInput,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  await sendMessage(newMessage.sender, newMessage.receiver, newMessage.message);
  
  const updatedMessages = [...chatMessages, newMessage];
  setChatMessages(updatedMessages); //update chat with new messages
  setMessageInput(''); //reset message input

  Keyboard.dismiss();

  try { 
    await AsyncStorage.setItem(`chat_${userId}_${otherUserId}`, JSON.stringify(updatedMessages)); //store new messages in AsyncStorage
  } catch (error) {
    console.error("Error storing messages:", error);
  }
};


  return (
    <KeyboardAvoidingView 
      style={styles.pageContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

    {/* Structure banner, full name, message log... */}
    <View style={styles.chatContainer}>
        <Banner onBack={onBack} />
        <Text style={styles.sendButtonText}>Send</Text>
        <UserBanner firstName={firstName} lastName={lastName} profilePicture={profilePicture}/>
        <HorizontalLine 
      />
  
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
        {chatMessages.map((msg, index) => (
          <Message key={index} sender={msg.sender} message={msg.message} time={msg.time}/>
        ))}
        </ScrollView>
    </TouchableWithoutFeedback>

  {/* Message input area with keyboard handling */}
    <View style={styles.inputContainer}>
    <TextInput
        style={styles.input}
        value={messageInput}
        onChangeText={setMessageInput}
        placeholder="Message..."
        placeholderTextColor={COLORS.UCONN_GREY}
        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)} //handles keyboard view below last message in chat log
    />
    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
        <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View> 
    </View>
  </KeyboardAvoidingView>
  );
};

  const Banner = ({ onBack }: { onBack: () => void }) => {
      return (
          <View style={styles.banner}>
              {/* Back button */}
              <TouchableOpacity style={styles.BackButton} onPress={onBack}>
                  <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
              </TouchableOpacity>
              <Text style={styles.bannerText}>Let's Chat!</Text>
          </View>
      );
  };

  interface UserBannerProps {
      firstName: string;
      lastName: string;
      profilePicture: string;
    }
    
  const UserBanner: React.FC<UserBannerProps> = ({ firstName, lastName, profilePicture }) => {
    return (
      <View style={styles.userBanner}>
        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        <Text style={styles.userBannerText}>{`${firstName} ${lastName}`}</Text>
      </View>
    );
  };

  const HorizontalLine = () => {
      return <View style={styles.horizontalLine} />;
  };

  interface MessageProps {
      sender: string;
      message: string;
      time: string;
    }
  
  const Message: React.FC<MessageProps> = ({ sender, message, time }) => {
    console.log("➤ Loading message from:", sender);
  
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.sender}>{sender}</Text> 
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    );
  };
  
const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: COLORS.UCONN_WHITE,
    },
    chatContainer: {
        flex: 1,
    },
    banner: {
        width: Dimensions.get('window').width,
        padding: 20,
        paddingTop: 60,
        marginBottom: 20,
        borderRadius: 1,
        backgroundColor: COLORS.UCONN_NAVY,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    bannerText: {
        color: COLORS.UCONN_WHITE,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    userBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userBannerText: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    userBannerIcon: {
        marginLeft: 20,
        marginRight: 5,
    },
    horizontalLine: {
        height: 2,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: COLORS.UCONN_GREY,
        marginBottom: 10,
    },
    messageContainer: {
        marginBottom: 10,
        flexDirection: 'column',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 10,
        fontSize: 18,
    },
    sender: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    message: {
        marginVertical: 5,
        fontSize: 15,
    },
    time: {
        fontSize: 14,
        color: COLORS.UCONN_GREY,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderColor: COLORS.UCONN_GREY,
        backgroundColor: COLORS.UCONN_WHITE,
    },
    input: {
        flex: 1,
        borderColor: COLORS.UCONN_GREY,
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        marginRight: 10,
        color: 'black',
    },
    sendButton: {
        backgroundColor: COLORS.UCONN_NAVY,
        borderRadius: 20,
        padding: 10,
    },
    sendButtonText: {
        color: COLORS.UCONN_WHITE,
        fontWeight: 'bold',
    },
    BackButton: {
        position: 'absolute',
        left: 30,
        top: 60,
        padding: 5,
    },
    BackButtonText: {
        color: COLORS.UCONN_WHITE,
        fontWeight: 'bold',
    },
    profilePicture: {
      width: 50, 
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    }
});

