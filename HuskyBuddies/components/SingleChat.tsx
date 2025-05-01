import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '@/constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, Image, ScrollView, Modal } from 'react-native';
import { sendMessage, getMessages, getUserId, getFullName, deleteMessage } from '@/backend/firebase/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
// TYPES & INTERFACES -----------------------------------------

interface SingleChatViewProps {
    onBack: () => void;
    firstName: string;
    lastName: string;
    lastMessage: string;
    profilePicture: string;
    userId: string;
    otherUserId: string;
}

interface MessageProps {
    message: string;
    sender: string;
    time: string;
    onLongPress?: () => void;
}

interface UserBannerProps {
    firstName: string;
    lastName: string;
    profilePicture: string;
}


{/* CHAT LOG PAGE */}
export default function SingleChatView({
    onBack,
    firstName,
    lastName,
    profilePicture,
    otherUserId
}: SingleChatViewProps) {


    // STATES & REFERENCES -----------------------------------------
    const [userId, setUserId] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>(""); //store first  last name
    const [selectedMessage, setSelectedMessage] = useState<{ index: number; message: string; timestamp: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // prevents bug where modal re-renders and causes dup pop-up after deleting message
    const [messageInput, setMessageInput] = useState('');
    const [chatMessages, setChatMessages] = useState<Array<{ sender: string; receiver: string; message: string; time: string }>>([]); //assert expected object types for variables in array and initiliaze empty array


    const scrollViewRef = useRef<ScrollView>(null);
    const senderNameCache = useRef<{ [key: string]: string }>({});

const theme = useTheme();


    // Retrieve logged in user's info...
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

    //Fetch full name of sender using cache if stored in cache. Else, add to cache...
    const fetchSenderName = async (senderId: string) => {
        if (senderNameCache.current[senderId]) {
            return senderNameCache.current[senderId];
        }
        const name = await getFullName(senderId);
        if (name) {
            senderNameCache.current[senderId] = name;
            return name;
        }
        return senderId;
    };

    // EFFECTS & HELPER FUNCTIONS -----------------------------------------

    //Fetch messages between logged-in user and other user (of the selected chat) upon press/when component mounts...
    useEffect(() => {
        console.log("\n \n Chat Messages:", chatMessages)
        console.log("Checking userId and otherUserId before fetching messages...");
        console.log("userId:", userId);
        console.log("otherUserId:", otherUserId);

        if (!userId || !otherUserId) {
            console.warn("[!] userId or otherUserId missing. Skipping message fetch...");
            return; // exit effect if a uid is missing
        }

        console.log("Fetching messages between:", userId, "and", otherUserId); // called whenever messages are updated in Firestore

        const unsubscribe = getMessages(userId, otherUserId, async (messages: any[]) => {
            console.log("Messages from Firestore:", messages);

            // Handles conditional rendering of placeholder message in chat log if no messages exist between users...
            if (messages.length === 0) {
                setChatMessages([{
                    sender: "System",
                    receiver: userId,
                    message: "Send a message to begin chatting.",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }]);
                return;
            }

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
                            : messageDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                    }
                    const senderName = await fetchSenderName(msg.senderId);
                    return {
                        sender: senderName || "",
                        receiver: msg.receiverId || "",
                        message: msg.messageContent || "",
                        time: displayTime || "",
                    };
                })
            );
            setChatMessages(formattedMessages);
        });

        return () => {
            unsubscribe(); //stop message listener when unmounting
        };

    }, [userId, otherUserId]);


    // Defines scroll view in chat log...
    useEffect(() => {
        console.log("\n \n Chat Messages:", chatMessages)
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [chatMessages]);



    //HANDLERS -----------------------------------------
    const handleSendMessage = async () => {
        if (!userId || messageInput.trim() === '') return; //prevent empty messages, check for userId

        const senderName = await fetchSenderName(userId);

        const newMessage = {
            senderName: senderName,
            sender: userId,
            receiver: otherUserId,
            message: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        await sendMessage(newMessage.sender, newMessage.receiver, newMessage.message); //send message to Firestore

        const displayNewMessage = { //format to be displayed. NOTE: accounts for uid being sent with new message bug
            sender: senderName,
            receiver: otherUserId,
            message: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedMessages = [...chatMessages, displayNewMessage];
        setChatMessages(updatedMessages); //update chat with new messages
        setMessageInput(''); //reset message input

        try {
            await AsyncStorage.setItem(`chat_${userId}_${otherUserId}`, JSON.stringify(updatedMessages)); //store new messages in AsyncStorage
        } catch (error) {
            console.error("Error storing messages:", error);
        }
    };

    const handleDeleteMessage = async () => {
        if (selectedMessage === null || !userId || isDeleting) return;

        setShowDeleteModal(false); // close immediately
        setIsDeleting(true);

        try {
            // delete from Firebase
            const result = await deleteMessage(
                userId,
                otherUserId,
                selectedMessage.index
            );

            if (!result.success) {
                console.error(result.error);
                return;
            }

            // update local state
            const updatedMessages = chatMessages.filter(
                (_, index) => index !== selectedMessage.index
            );

            setChatMessages(updatedMessages);
            setShowDeleteModal(false);

            // update AsyncStorage
            await AsyncStorage.setItem(
                `chat_${userId}_${otherUserId}`,
                JSON.stringify(updatedMessages)
            );

        } catch (error) {
            console.error("Error deleting message:", error);
        } finally {
            setIsDeleting(false); 
            setSelectedMessage(null);
        }
    };

    // RENDER COMPONENTS -----------------------------------------
    const DeleteMessageModal = () => (
        <Modal
            visible={showDeleteModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
                setShowDeleteModal(false);
                setSelectedMessage(null);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Delete message?</Text>

                    <Text style={styles.modalText} numberOfLines={3}>
                        {selectedMessage?.message}
                        {selectedMessage?.timestamp && (
                            <Text style={styles.modalTimeText}>
                                {"\n\n"}{selectedMessage.timestamp}
                            </Text>
                        )}
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => {
                                setShowDeleteModal(false);
                                setSelectedMessage(null);
                            }}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButton]}
                            onPress={handleDeleteMessage}
                        >
                            <Text style={styles.modalButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <KeyboardAvoidingView
            style={styles.pageContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Structure banner, full name, message log... */}
            <View style={styles.chatContainer}>
                <Banner onBack={onBack} />
                <Text style={styles.sendButtonText}>Send</Text>
                <UserBanner firstName={firstName || ""} lastName={lastName || ""} profilePicture={profilePicture || ""} />
                <HorizontalLine
                />
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={{ flexGrow: 1 }}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        keyboardShouldPersistTaps="never"
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="black"
                        scrollIndicatorInsets={{ right: 1 }}>
                        {chatMessages.map((msg, index) => (
                            <Message
                                key={index}
                                sender={msg.sender}
                                message={msg.message}
                                time={msg.time}
                                onLongPress={() => {
                                    if (msg.sender !== "System") {
                                        setSelectedMessage({ index, message: msg.message, timestamp: msg.time });
                                        setShowDeleteModal(true);
                                    }
                                }}
                            />
                        ))}
                    </ScrollView>
                </TouchableWithoutFeedback>

                {/* Message input area with keyboard handling */}
                <View style={styles.inputContainer}>
                    <TextInput
                        key={Platform.OS}
                        autoCapitalize={Platform.OS === 'ios' ? 'sentences' : 'words'}
                        style={styles.input}
                        value={messageInput}
                        onChangeText={setMessageInput}
                        placeholder="Message..."
                        placeholderTextColor={COLORS.UCONN_GREY}
                        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)} //handles keyboard view below last message in chat log
                        autoCorrect={true}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <DeleteMessageModal />
        </KeyboardAvoidingView>
    );
};

// BANNER COMPONENTS -----------------------------------------

const Banner = ({ onBack }: { onBack: () => void }) => {
    return (
        <View style={styles.banner}>
            <TouchableOpacity style={styles.BackButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
            </TouchableOpacity>
            <Text style={styles.bannerText}>Let's Chat!</Text>
        </View>
    );
};


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

// MESSAGE COMPONENT -----------------------------------------
const Message: React.FC<MessageProps> = ({ message, sender, time, onLongPress }) => {
    // console.log("➤ Loading message from:", sender); // DEBUGGING
    // console.log("➤ Rendering message:", { message, sender, time }); // DEBUGGING

    return ( //Conditional rendering of placeholder message in chat log where sender is "System"
        <TouchableOpacity
            onLongPress={onLongPress}
            delayLongPress={500} // 500ms delay for long press
            activeOpacity={0.5}
        >
            <View style={styles.messageContainer}>
                {sender === "System" ? (
                    <Text style={styles.systemMessage}>{message}</Text>
                ) : (
                    <>
                        <Text style={styles.sender}>{sender}</Text>
                        <Text style={styles.message}>{message}</Text>
                        <Text style={styles.time}>{time}</Text>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
    },
    banner: {
        width: Dimensions.get('window').width,
        padding: 20,
        paddingTop: 60,
        borderRadius: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    bannerText: {
        color: COLORS.UCONN_WHITE,
        fontSize: 19.9,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    BackButton: {
        position: 'absolute',
        left: 30,
        top: 60,
        padding: 5,
    },
    userBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        padding: 5,
    },
    userBannerText: {
        color: COLORS.UCONN_NAVY,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    horizontalLine: {
        height: 1.5,
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
        color: COLORS.UCONN_NAVY,
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
    },
    input: {
        fontSize: 16,
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        marginRight: 10,
    },
    sendButton: {
        borderRadius: 20,
        padding: 10,
    },
    sendButtonText: {
        color: COLORS.UCONN_WHITE,
        fontWeight: 'bold',
    },
    BackButton: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        top: 53,
        padding: 7,
        zIndex: 200,
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
    },
    systemMessage: {
        fontStyle: 'italic',
        color: COLORS.UCONN_GREY,
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(112, 110, 110, 0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.UCONN_WHITE,
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 15,
        color: COLORS.UCONN_NAVY,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
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
    modalButtonText: {
        color: COLORS.UCONN_WHITE,
        fontSize: 16,
    },
    modalTimeText: {
        fontSize: 14,
        color: COLORS.UCONN_GREY,
    }
});