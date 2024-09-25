import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MessageCircle, Users, Home, Calendar, Settings } from 'lucide-react-native';
import { COLORS } from '../constants/Colors';

export default function RootLayout() {
  return (
    /*
      TODO: Make navbar icons "easier" to hit on mobile
    */
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.navbar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="messages/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <MessageCircle color={focused ? COLORS.UCONN_NAVY : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="student-matching/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Users color={focused ? COLORS.UCONN_NAVY : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.homeIconContainer}>
              <Home color={COLORS.UCONN_WHITE} size={28} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Calendar color={focused ? COLORS.UCONN_NAVY : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Settings color={focused ? COLORS.UCONN_NAVY : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.UCONN_WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.UCONN_GREY,
    height: 75,
    paddingBottom: 4,
  },
  homeIconContainer: {
    backgroundColor: COLORS.UCONN_NAVY,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
});