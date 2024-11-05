import React from 'react';
import { useRouter, Link } from 'expo-router';
import { View, Text, Button, StyleSheet } from 'react-native';



const IndexScreen = () => {
    const router = useRouter();

    return (
        /*
        <View style={styles.container}>
            <Text style={styles.header}>Student Matching</Text>
            <Link href="./match_classes">
            </Link>
                <Button title="Classes" onPress={() => {}} />
        </View>
        */
        

        <View style={styles.container}>
            <Text style={styles.header}>Student Matching</Text>
            
            <Button
                title="Match by Classes"
                onPress={() => router.replace('/screens/student-matching/classes')}
            />
            <Button
                title="Match by Interests"
                onPress={() => router.replace('/screens/student-matching/interests')}
            />
            <Button
                title="Match by Location"
                onPress={() => router.replace('/screens/student-matching/location')}
            />
            
        </View>
        
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default IndexScreen;
