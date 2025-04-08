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
import Constants from "expo-constants";
import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "react-native-paper";

interface Course {
  code: string;
  name: string;
}

interface CourseResponse {
  source: 'cache' | 'live';
  data: Course[];
}

export default function AddCourseScreen({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // get base url from env
  const base_url = Constants.expoConfig?.extra?.VERCEL_BASE_URL;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get<CourseResponse>(`${base_url}/courses`);
      const { data , source } = response.data;
      console.log(`Course data source: ${source}`);
      setCourses(data);
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={["left", "right"]} style={[styles.safeArea, { backgroundColor: theme.colors.primary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Add Course</Text>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={theme.colors.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons
            name="search"
            size={24}
            color={theme.colors.onSurface}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onBackground }]}
            placeholder="Search for a course"
            placeholderTextColor={theme.colors.onSurface}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <FlatList
              data={filteredCourses}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.courseItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => {
                    setSelectedCourse(item);
                    setIsAddingSection(true);
                  }}
                >
                  <View>
                    <Text style={[styles.courseName, { color: theme.colors.onBackground }]}>{item.code}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={theme.colors.onBackground} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.centerContent}>
                  <Text style={{ color: theme.colors.onBackground }}>No courses found</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.UCONN_WHITE,
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