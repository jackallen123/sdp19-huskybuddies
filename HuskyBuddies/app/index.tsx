/* Login Screen */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/Colors';

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    router.replace('/screens');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Husky Buddies</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Go to Home Page</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.UCONN_WHITE,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.UCONN_NAVY,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
});