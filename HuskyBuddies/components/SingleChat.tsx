import React, {useState} from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';


interface SingleChatViewProps {
    onBack: () => void;
    firstName: string;
    lastName: string;
    lastMessage: string;
}

export default function SingleChatView({ onBack, firstName, lastName, lastMessage }: SingleChatViewProps) {

{/* SEND MESSAGE */}
  const [messageInput, setMessageInput] = useState('');

  const [chatMessages, setChatMessages] = useState([
    { id: '1', message: "Hey, how are you?", sender: `${firstName} ${lastName}`, time: '2:00 PM' },
    { id: '2', message: lastMessage, sender: 'You', time: '2:05 PM' },
]);

  const handleSendMessage = () => {
    if (messageInput.trim() === '') return; //prevents whitespace message input

  const newMessage = {
    id: uuid.v4(),  //generate unique id for message
    message: messageInput,
    sender: 'You',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), //
    };

    setChatMessages([...chatMessages, newMessage]); //chatMessages array is updated to add message input
    setMessageInput('');  //reset input field
  };

  return (
    <View style={styles.pageContainer}>
        {/* Banner, full name, messages... */}
        <View style={styles.chatContainer}>
            <Banner onBack={onBack}/>
            <Text style={styles.sendButtonText}>Send</Text>
            <UserBanner firstName={firstName} lastName={lastName} />
            <HorizontalLine />
            {chatMessages.map((msg) => (
                <Message key={msg.id} sender={msg.sender} message={msg.message} time={msg.time} />
            ))}
        </View>
        {/* Message input area... */}
        <View style = {styles.inputContainer}>
            <TextInput 
                style={styles.input}
                value={messageInput}
                onChangeText ={setMessageInput}  //update messageInput state as user types
                placeholder= "Message..."
                placeholderTextColor = {COLORS.UCONN_GREY}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
        </View>
    </View>
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
  }
  
  const UserBanner: React.FC < UserBannerProps> = ({ firstName, lastName }) => {
    return (
      <View style={styles.userBanner}>
        <Ionicons name="person-circle-outline" size={40} color="gray" style={styles.userBannerIcon} />
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
        alignItems: 'center',
    },
    bannerText: {
        width: Dimensions.get('window').width,
        color: COLORS.UCONN_WHITE,
        fontSize: 18,
        fontWeight: 'bold',
        left: 525,
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
        left: 20,
        top: 60,
    },
    BackButtonText: {
        color: COLORS.UCONN_WHITE,
        fontWeight: 'bold',
    },
});

