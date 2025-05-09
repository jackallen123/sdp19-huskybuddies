import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AddCourseScreen from "./addCourse";
import { COLORS } from "@/constants/Colors";
import { Course } from "@/utils/types/course";
import {
  getAllCourses,
  deleteCourse,
} from "@/backend/firebase/firestoreService";
import { auth } from "@/backend/firebase/firebaseConfig";
import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "react-native-paper";

const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const theme = useTheme();
  return (
    <View style={[styles.courseCard, { backgroundColor: course.color }]}>
      <Text style={[styles.courseTime, { color: theme.colors.onBackground }]}>{course.startTime}</Text>
      <View style={styles.courseInfo}>
        <Text numberOfLines={1} style={[styles.courseName, { color: theme.colors.onBackground }]}>
          {course.name}
        </Text>
        {/* <Text style={styles.courseInstructor}>{course.instructor}</Text> */}
        {/* <Text style={styles.courseLocation}>{course.location}</Text> */}
        <Text style={[styles.courseSection, { color: theme.colors.onBackground }]}>{course.section}</Text>
      </View>
      <Text style={[styles.courseTime, { color: theme.colors.onBackground }]}>{course.endTime}</Text>
    </View>
  );
};

const DeleteCourseModal = ({
  visible,
  courses,
  onClose,
  onDelete,
}: {
  visible: boolean;
  courses: Course[];
  onClose: () => void;
  onDelete: (courseId: string) => Promise<void>;
}) => {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.onBackground }]}>
            Select Course to Delete
          </Text>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseDeleteItem}
              onPress={async () => {
                await onDelete(course.id);
                onClose();
              }}
            >
              <Text style={[styles.courseDeleteText, { color: theme.colors.onBackground }]}>
                {course.name} - Section {course.section}
              </Text>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error || "red"} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function Schedule({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // load courses when component mounts
  const loadCourses = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }
      const storedCourses = await getAllCourses(userId);
      setCourses(storedCourses);
    } catch (error) {
      Alert.alert("Error", "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      await deleteCourse(userId, courseId);
      await loadCourses();
      Alert.alert("Success", "Course deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete course");
    }
  };

  const sortedCoursesByDay = useMemo(() => {
    return weekdays.map((day) => ({
      day,
      courses: courses
        .filter((course) => course.days.includes(day))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [courses]);

  if (isAddingCourse) {
    return (
      <AddCourseScreen
        onBack={() => { 
          loadCourses();
          setIsAddingCourse(false);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={["left", "right"]} style={[styles.safeArea, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
            <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {showOptions && (
        <View style={[styles.optionsContainer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setShowOptions(false);
              setIsAddingCourse(true);
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.onBackground} />
            <Text style={[styles.optionText, { color: theme.colors.onBackground }]}>Add Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setShowOptions(false);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash" size={24} color={theme.colors.onBackground} />
            <Text style={[styles.optionText, { color: theme.colors.onBackground }]}>Delete Course</Text>
          </TouchableOpacity>
        </View>
      )}

      <DeleteCourseModal
        visible={showDeleteModal}
        courses={courses}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteCourse}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.scheduleWrapper}>
          <View style={[styles.weekdaysHeader, { backgroundColor: theme.colors.primary }]}>
            {weekdays.map((day) => (
              <View key={day} style={styles.dayHeaderColumn}>
                <Text style={[styles.weekday, { color: theme.colors.onPrimary }]}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.scheduleContainer}>
            {sortedCoursesByDay.map(({ day, courses }) => (
              <View key={day} style={styles.dayColumn}>
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </View>
            ))}
          </View>
        </View>)}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    backgroundColor: COLORS.UCONN_NAVY,
  },
  header: {
    padding: 10,
    paddingTop: 60,
    borderRadius: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.UCONN_WHITE,
  },
  optionsContainer: {
    position: "absolute",
    top: 60,
    right: 16,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
  },
  scheduleWrapper: {
    flex: 1,
  },
  weekdaysHeader: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  dayHeaderColumn: {
    flex: 1,
    alignItems: "center",
  },
  weekday: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scheduleContainer: {
    flexDirection: "row",
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 1,
  },
  courseCard: {
    padding: 1,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  courseTime: {
    fontSize: 10,
    fontWeight: "bold",
    marginVertical: 4,
  },
  courseInfo: {
    width: "100%",
    alignItems: "center",
    marginVertical: 4,
  },
  courseName: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  courseInstructor: {
    fontSize: 9,
    textAlign: "center",
  },
  courseSection: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  courseDeleteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  courseDeleteText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.UCONN_NAVY,
    fontWeight: "bold",
  },
});
