import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const Banner = () => {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Let's Chat!</Text>
      </View>
    );
  };

const UserBanner = ({ firstName, lastName}) => {
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

const Message = ({ sender, message, time }) => {
  return (
    <View style={styles.messageContainer}>
      <Text style={styles.sender}>{sender}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.time}>{time}</Text>
     </View>
  );
};

const SingleChatView = () => {
  const { userid, firstName, lastName, lastMessage } = useLocalSearchParams(); // extract parameters
  const chatMessages = [
    { id: '1', message: "Hey, how are you?", sender: `${firstName} ${lastName}`, time: '2:00 PM' },
    { id: '2', message: `${lastMessage}`, sender: 'You', time: '2:05 PM' },
  ];

  return (
    <View style={styles.pageContainer}>
    <Banner />
    <UserBanner firstName={firstName} lastName={lastName} />
    <HorizontalLine />
    {chatMessages.map((msg) => (
      <Message key={msg.id} sender={msg.sender} message={msg.message} time={msg.time} />
    ))}
  </View>
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
    height: 1,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: COLORS.UCONN_GREY,
    marginBottom: 10,
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
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
});

export default SingleChatView;
