import React, {useState, useEffect} from 'react';
import uuid from 'react-native-uuid';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { 
  View,
  Text, 
  StyleSheet, 
  Dimensions, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard,
  Platform, 
  Image} from 'react-native';
import { sendMessage, getMessages, deleteMessage } from '@/backend/firebase/firestoreService';


interface SingleChatViewProps {
    onBack: () => void;
    firstName: string;
    lastName: string;
    lastMessage: string;
    profilePicture: string;
    userId: string;
}

export default function SingleChatView({ onBack, firstName, lastName, lastMessage, profilePicture, userId}: SingleChatViewProps) {

{/* SEND MESSAGE */}

  //Fetch message when the component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      const messages = await getMessages(userId); // Replace with actual user ID

      const formattedMessages = messages.map((msg) => ({
        sender: msg.sentBy, // Ensure consistency
        receiver: msg.sentTo,
        message: msg.messageText, // Match field names correctly
        time: msg.sentAt ? new Date(msg.sentAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown",
      }));

      setChatMessages(formattedMessages);
    };

    fetchMessages();
  }, []);

const [messageInput, setMessageInput] = useState('');
const [chatMessages, setChatMessages] = useState<Array<{ sender: string; receiver: string; message: string; time: string }>>([]); //assert expected object types for variables in array and initiliaze empty array

  const handleSendMessage = async () => {
    if (messageInput.trim() === '') return; //prevents whitespace message input

    const newMessage = {
      sender: userId,  // hardcoded to TD uuid
      receiver: "lC70tqsJANTANCXPFGztavOekRE2", //AB uuid
      message: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    await sendMessage(newMessage.sender, newMessage.receiver, newMessage.message);
    setChatMessages([...chatMessages, newMessage]);
    setMessageInput('');

    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.pageContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

    {/* Banner, full name, messages... */}
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.chatContainer}>
        <Banner onBack={onBack} />
        <Text style={styles.sendButtonText}>Send</Text>
        <UserBanner firstName={firstName} lastName={lastName} profilePicture={profilePicture}/>
        <HorizontalLine />
        {chatMessages.map((msg, index) => (
        <Message key={index} sender={msg.sender} message={msg.message} time={msg.time}/>
        ))}
    </View>
    </TouchableWithoutFeedback>
      
    {/* Input area with keyboard handling */}
    <View style={styles.inputContainer}>
    <TextInput
        style={styles.input}
        value={messageInput}
        onChangeText={setMessageInput}
        placeholder="Message..."
        placeholderTextColor={COLORS.UCONN_GREY}
    />
    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
        <Text style={styles.sendButtonText}>Send</Text>
    </TouchableOpacity>
    </View>
    </KeyboardAvoidingView>
  );
}


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
  
  const Message: React.FC<MessageProps> = ({ sender, message, time}) => {
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
    },
    userBannerIcon: {
        marginBottom: 10,
        marginLeft: 10,
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

