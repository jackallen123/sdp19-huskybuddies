import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/Colors";
import { transformSectionToCourse } from "@/utils/transform/courseTransform";
import { Alert } from "react-native";
import { storeCourse } from "@/backend/firebase/firestoreService";
import { auth } from "@/backend/firebase/firebaseConfig";
import axios from "axios";
import Constants from "expo-constants";
import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "react-native-paper";

interface Section {
  sectionNumber: string;
  meets: string;
  // instructor: string;
}

interface SectionData {
  sections: Section[];
}

interface SectionResponse {
  source: 'cache' | 'live';
  data: SectionData[];
}

export default function AddSection({
  onBack,
  courseCode,
}: {
  onBack: () => void;
  courseCode: string;
}) {
  const theme = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPopup, setLocationPopup] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: "",
  });

  // get base url from env
  const base_url = Constants?.expoConfig?.extra?.VERCEL_BASE_URL;

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await axios.get<SectionResponse>(
        `${base_url}/sections`, {
          params: { courseCode }
        }
      );
      const { data, source } = response.data;
      console.log(`Section data source: ${source}`);
      setSections(data[0]?.sections || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
      Alert.alert("Error", "Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  };

  // const fetchLocation = async (sectionNumber: string) => {
  //   try {
  //     const response = await axios.get(`http://${ip_address}:3000/section-location/${courseCode}/${sectionNumber}`);
  //     return response.data.location;
  //   } catch (error) {
  //     console.error('Error fetching location:', error);
  //     return 'Location not found';
  //   }
  // };

  const handleAddSection = async (section: Section) => {
    // check if the section does not meet
    if (section.meets === "Does Not Meet") {
      Alert.alert(
        "Course does not meet",
        "This course does not have a meeting time and cannot be added to your schedule."
      );
      return;
    }

    try {
      setLocationPopup({ visible: true, message: "Adding course..." });
      // const location = await fetchLocation(section.sectionNumber);

      // get current user
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const course = transformSectionToCourse(courseCode, section);
      await storeCourse(userId, course);

      // success message
      setLocationPopup({
        visible: true,
        message: "Course added successfully!",
      });
      setTimeout(() => {
        setLocationPopup({ visible: false, message: "" });
        onBack(); // return to addCourse
      }, 1500);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add course");
    }
  };

  const sortedSections = [...sections].sort((a, b) => {
    const sectionA = parseInt(a.sectionNumber.replace(/\D/g, ""));
    const sectionB = parseInt(b.sectionNumber.replace(/\D/g, ""));
    return sectionA - sectionB;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={["left", "right"]} style={[styles.safeArea, { backgroundColor: theme.colors.primary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Add Section</Text>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={theme.colors.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedSections}
          keyExtractor={(item) => item.sectionNumber}
          renderItem={({ item }) => (
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionText, { color: theme.colors.onBackground }]}>
                  Section {item.sectionNumber}
                </Text>
                {/* <Text style={styles.sectionDetails}>{courseCode}</Text> */}
                <Text style={[styles.sectionDetails, { color: theme.colors.onSurface }]}>{item.meets}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddSection(item)}
              >
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.onBackground} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.centerContent}>
              <Text style={{ color: theme.colors.onBackground }}>No sections found</Text>
            </View>
          )}
        />
      )}
      {locationPopup.visible && (
        <View style={styles.popupContainer}>
          <Text style={styles.popupText}>{locationPopup.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  safeArea: {
    backgroundColor: COLORS.UCONN_NAVY,
  },
  header: {
    backgroundColor: COLORS.UCONN_NAVY,
    padding: 10,
    paddingTop: 60,
    paddingBottom: 20,
    borderRadius: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_WHITE,
    textAlign: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionDetails: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    padding: 8,
  },
  popupContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  popupText: {
    color: "white",
    fontSize: 16,
  },
});