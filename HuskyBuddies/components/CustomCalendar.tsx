import { useState, useEffect } from "react"
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Timestamp } from "firebase/firestore"
import { COLORS } from "@/constants/Colors"
import { FetchAllEventsFromDatabase, FetchStudySessionsFromDatabase } from "@/backend/firebase/firestoreService"
import { useTheme } from 'react-native-paper';

// event setup for database 
interface Event {
  id: string
  title: string
  date: Timestamp
  description: string
  isadded?: boolean
  createdBy?: string
}

// study session setup for database 
interface StudySession {
  id: string
  title: string
  date: Timestamp
  description: string
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CustomCalendar({ userId, onBack }: { userId: string; onBack: () => void }) {
  const theme = useTheme()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Fetch all events and study sessions
  useEffect(() => {
    const unsubscribeEvents = FetchAllEventsFromDatabase(userId, setEvents)
    const unsubscribeSessions = FetchStudySessionsFromDatabase(userId, setStudySessions)

    return () => {
      unsubscribeEvents()
      unsubscribeSessions()
    }
  }, [userId])

  // Only show items where isadded is true
  const getItemsForDate = (date: Date): (Event | StudySession)[] => {
    const filteredEvents = events
      .filter((event) => event.isadded) 
      .filter((event) => event.date.toDate().toDateString() === date.toDateString())
  
    const filteredStudySessions = studySessions.filter(
      (studySession) => studySession.date.toDate().toDateString() === date.toDateString(),
    )
  
    return [...filteredEvents, ...filteredStudySessions]
  }
  
  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Function to get days in a month
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const daysArray: (Date | null)[] = Array(firstDay).fill(null)

    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(date.getFullYear(), date.getMonth(), i))
    }

    while (daysArray.length % 7 !== 0) {
      daysArray.push(null)
    }

    return daysArray
  }

 // Formatting for page consistency 
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerText, { color: theme.colors.onPrimary }]}>My Calendar</Text>
        </View>
      </View>

      {/* Calendar Navigation */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthContainer}>
          <TouchableOpacity
            onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            <Ionicons name="chevron-back-outline" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.colors.onBackground }]}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            <Ionicons name="chevron-forward-outline" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysContainer}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={[styles.day, { color: theme.colors.onBackground }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Dates */}
        <View style={styles.datesContainer}>
          {getDaysInMonth(currentDate).map((date: Date | null, index: number) =>
            date ? (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateContainer,
                  isToday(date)
                    ? { ...styles.highlightedDate }
                    : { ...styles.date, backgroundColor: theme.colors.surface }
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateText, { color: theme.colors.onBackground }]}>{date.getDate()}</Text>
                {getItemsForDate(date).length > 0 && <View style={[styles.eventIndicator, { backgroundColor: theme.colors.primary }]} />}
              </TouchableOpacity>
            ) : (
              <View key={index} style={styles.dateContainer} />
            ),
          )}
        </View>
      </View>

      {/* Event and Study Session List */}
      <View style={[styles.eventListContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.eventListTitle, { color: theme.colors.onBackground }]}>Your Items:</Text>
        {selectedDate ? (
          <ScrollView contentContainerStyle={styles.eventListContent}>
            {getItemsForDate(selectedDate).length > 0 ? (
              getItemsForDate(selectedDate).map((item) => (
                <View key={item.id} style={styles.eventItem}>
                  <Text style={[styles.eventItemText, { color: theme.colors.onBackground }]}>
                    {item.title} on {new Date(item.date.toDate()).toLocaleDateString()} at{" "}
                    {new Date(item.date.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noEventsText, { color: theme.colors.onSurface }]}>No items for this date.</Text>
            )}
          </ScrollView>
        ) : (
          <Text style={[styles.noEventsText, { color: theme.colors.onSurface }]}>Select a date to view items.</Text>
        )}
      </View>
    </View>
  )
}

// Styles to keep pages consistent 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginBottom: 20,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
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
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  monthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  day: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dateContainer: {
    width: "13%",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  date: {
    backgroundColor: COLORS.UCONN_WHITE,
  },
  highlightedDate: {
    backgroundColor: COLORS.HIGHLIGHT,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  eventListContainer: {
    padding: 16,
    backgroundColor: COLORS.UCONN_WHITE,
    flex: 1,
  },
  eventListContent: {
    paddingBottom: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  eventItemText: {
    fontSize: 16,
  },
  noEventsText: {
    fontSize: 16,
    color: COLORS.UCONN_GREY,
  },
})