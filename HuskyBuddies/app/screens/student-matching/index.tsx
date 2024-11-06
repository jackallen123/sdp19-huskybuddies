import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import MatchingClasses from '@/components/matchClasses';
import MatchingInterests from '@/components/matchInterests';
import MatchingLocation from '@/components/matchLocation';
import { COLORS } from '@/constants/Colors'; 


const IndexScreen = () => {
    const [showMatchingClasses, setShowMatchingClasses] = React.useState(false);
    const [showMatchingInterests, setShowMatchingInterests] = React.useState(false);
    const [showMatchingLocation, setShowMatchingLocation] = React.useState(false);

    if (showMatchingClasses) {
        return <MatchingClasses onBack={() => setShowMatchingClasses(false)} />;
        }
    if (showMatchingInterests){
        return <MatchingInterests onBack={() => setShowMatchingInterests(false)} />;
    }
    if (showMatchingLocation){
        return <MatchingInterests onBack={() => setShowMatchingLocation(false)} />;
    }
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.header}>Student Matching Page</Text>
            </View>
            
            <View style={styles.viewAllButtonWrapper}>
            <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowMatchingClasses(true)}
            >
                <Text style={styles.viewAllButtonText}>Match By Classes</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.viewAllButtonWrapper}>
            <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowMatchingInterests(true)}
            >
                <Text style={styles.viewAllButtonText}>Match By Interests</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.viewAllButtonWrapper}>
            <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowMatchingLocation(true)}
            >
                <Text style={styles.viewAllButtonText}>Match by Location</Text>
            </TouchableOpacity>
            </View>

        </SafeAreaView>
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
    viewAllButtonWrapper: {
    marginTop: 20,
    alignItems: 'center',
    },
    viewAllButton: {
    backgroundColor: COLORS.UCONN_NAVY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    },
    viewAllButtonText: {
    color: COLORS.UCONN_WHITE,
    fontSize: 16,
    },
});

export default IndexScreen;
