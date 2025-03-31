import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MessageCircle, Users, Home, Calendar, Settings } from 'lucide-react-native';
import { COLORS } from '../../constants/Colors';
import { useTheme } from 'react-native-paper';
import { useThemeSettings } from '@/context/ThemeContext';

export default function ScreenLayout() {

  // grab the current theme and darkMode from context 
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.navbar,
        {
          // dynamically styling nav bar
          backgroundColor: theme.colors.onPrimary,
          borderTopColor: COLORS.UCONN_GREY,
        },
      ],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Home color={focused ? theme.colors.primary : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <MessageCircle color={focused ? theme.colors.primary : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="student-matching/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.homeIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Users color={focused ? theme.colors.onPrimary : COLORS.UCONN_GREY} size={28} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Calendar color={focused ? theme.colors.primary : COLORS.UCONN_GREY} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Settings color={focused ? theme.colors.primary : COLORS.UCONN_GREY} size={24} />
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
    borderTopWidth: 1,
    height: 75,
  },
  homeIconContainer: {
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  }
});