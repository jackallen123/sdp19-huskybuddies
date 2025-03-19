/* Login/Signup Screen */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Input, Button } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { signUp, signIn } from "../api-service/backend/firebase/authService";

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
const Login: React.FC<LoginProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
}) => {
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
const Signup: React.FC<SignupProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  handleSignUp,
}) => {
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // handles user login
  const handleLogin = async () => {
    try {
      // call signIn() from authService.js with inputted email password
      const user = await signIn(email, password);
      Alert.alert("Success", "Logged in successfully!");
      // navigate to home page after login
      router.replace("/screens");
    } catch (error) {
      const errorMessage = (error as Error).message;
      Alert.alert("Login failed", errorMessage);
    }
  };

  // handles user signup
  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    try {
      // call signUp() from authService.js with inputted fields
      const user = await signUp(email, password, firstName, lastName);
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      const errorMessage = (error as Error).message;
      Alert.alert("Sign up failed", errorMessage);
    }
  };

  // toggles between login and signup components
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // resets forms when toggling between pages
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isSignUp ? "Join Husky Buddies!" : "Welcome Back"}
          </Text>

          {isSignUp ? (
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
          ) : (
            <Login
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
            />
          )}

          <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
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
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.UCONN_WHITE,
    marginBottom: 30,
    textAlign: "center",
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
    fontWeight: "bold",
  },
  toggleContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
  },
});
