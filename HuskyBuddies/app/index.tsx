/* Login/Signup Screen */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { addUserToDatabase } from "../backend/firebase/firestoreService";

// mock credentials
const MOCK_EMAIL = 'admin@uconn.edu';
const MOCK_PASSWORD = 'admin';

// types for props for login and signup components
type LoginProps = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: () => void;
};

type SignupProps = {
  firstName: string;
  setFirstName: React.Dispatch<React.SetStateAction<string>>;
  lastName: string;
  setLastName: React.Dispatch<React.SetStateAction<string>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleSignUp: () => void;
};

// login Component
const Login: React.FC<LoginProps> = ({ email, setEmail, password, setPassword, handleLogin }) => {
  return (
    <>
      <Input
        placeholder="UConn Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Button
        title="Log In"
        onPress={handleLogin}
        buttonStyle={styles.submitButton}
        titleStyle={styles.buttonTitle}
      />
    </>
  );
};

// signup Component
const Signup: React.FC<SignupProps> = ({ firstName, setFirstName, lastName, setLastName, email, setEmail, password, setPassword, handleSignUp }) => {
  return (
    <>
      <Input
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Input
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Input
        placeholder="UConn Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        inputStyle={styles.input}
        placeholderTextColor={COLORS.UCONN_GREY}
      />
      <Button
        title="Sign Up"
        onPress={handleSignUp}
        buttonStyle={styles.submitButton}
        titleStyle={styles.buttonTitle}
      />
    </>
  );
};

export default function LoginSignup() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // login and signup handlers
  const handleLogin = () => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      // Successful login
      router.replace('/screens');
    } else {
      // Incorrect credentials
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleSignUp = async () => {
    if (firstName && lastName && email && password) {
      try {
        // call the function to add the user to Firestore
        await addUserToDatabase(firstName, lastName, email, password);

        // after successful signup, show alert
        Alert.alert('Success', 'Your account has been created.');

        // clear input fields after successful signup
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');

      } catch (error) {
        Alert.alert('Error', 'There was a problem creating the account.');
      }
    } else {
      Alert.alert('Validation Error', 'Please fill in all the fields.');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // resets forms when toggling between pages
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join Husky Buddies!'}</Text>
          
          {isLogin ? (
            <Login 
              email={email} 
              setEmail={setEmail} 
              password={password} 
              setPassword={setPassword} 
              handleLogin={handleLogin} 
            />
          ) : (
            <Signup 
              firstName={firstName} 
              setFirstName={setFirstName} 
              lastName={lastName} 
              setLastName={setLastName} 
              email={email} 
              setEmail={setEmail} 
              password={password} 
              setPassword={setPassword} 
              handleSignUp={handleSignUp} 
            />
          )}
          
          <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_NAVY,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.UCONN_WHITE,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    color: COLORS.UCONN_WHITE,
  },
  submitButton: {
    backgroundColor: COLORS.UCONN_WHITE,
    borderRadius: 25,
    height: 50,
    marginTop: 20,
  },
  buttonTitle: {
    color: COLORS.UCONN_NAVY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
});