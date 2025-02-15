import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { COLORS } from "@/constants/Colors";
import AddSection from "./addSection";

interface Course {
  code: string;
  name: string;
}

export default function AddCourseScreen({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const ip_address = "192.168.1.35"; // set your IP address here

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://${ip_address}:3000/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      Alert.alert("Error", "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAddingSection) {
    return (
      <AddSection
        onBack={() => setIsAddingSection(false)}
        courseCode={selectedCourse?.code || ""}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.UCONN_WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Add Course</Text>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={COLORS.UCONN_NAVY}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={24}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a course"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <Text>Loading courses...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.courseItem}
                onPress={() => {
                  setSelectedCourse(item);
                  setIsAddingSection(true);
                }}
              >
                <View>
                  <Text style={styles.courseName}>{item.code}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="black" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.centerContent}>
                <Text>No courses found</Text>
              </View>
            )}
          />
        )}
      </View>
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
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_WHITE,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  courseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  catalogName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
