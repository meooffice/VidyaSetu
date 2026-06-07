import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../config/translations";
import LanguageToggle from "../../components/LanguageToggle";
import ClassStructureScreen from "./ClassStructureScreen";
import StudentNotesScreen from "./StudentNotesScreen";
import StudentReferencesScreen from "./StudentReferencesScreen";
import StudentQuizScreen from "./StudentQuizScreen";
import StudentTestScreen from "./StudentTestScreen";
import GradeReportScreen from "./GradeReportScreen";
import StudentProgressScreen from "./StudentProgressScreen";
import StudentDoubtScreen from "./StudentDoubtScreen";
import StudentHomeworkScreen from "./StudentHomeworkScreen";
import StudentAttendanceScreen from "./StudentAttendanceScreen";
import StudyModeScreen from "./StudyModeScreen";
import SecurityScreen from './SecurityScreen';

// ✅ userId prop add చేశాం
export default function StudentDashboard({ onLogout, userId }) {
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterTarget, setChapterTarget] = useState("notes");
  const [showChapterOptions, setShowChapterOptions] = useState(false);
  const [pendingChapter, setPendingChapter] = useState(null);
  const { language } = useLanguage();
  const T = translations[language];

  const menuItems = [
    { icon: "📖", label: T.readNotes,     color: "#388e3c", target: "notes" },
    { icon: "📎", label: T.references,    color: "#1565c0", target: "references" },
    { icon: "🎯", label: "క్విజ్ చేయి",   color: "#f57c00", target: "quiz" },
    { icon: "📝", label: "పరీక్ష ఇవ్వు",  color: "#e53935", target: "test" },
    { icon: "🤔", label: "సందేహం అడుగు", color: "#6a1b9a", target: "doubts" },
    { icon: "📊", label: "నా పురోగతి",    color: "#00838f", target: "grades" },
    { icon: "📋", label: "హోంవర్క్",      color: "#f57c00", target: "homework" },
    { icon: "🔒", label: "Security",      color: "#1a237e", target: "security" },
  ];

  // ── Class Structure Screen ──────────────────────────────────────────────────
  if (currentScreen === "classStructure") {
    return (
      <>
        <ClassStructureScreen
          onBack={() => setCurrentScreen("dashboard")}
          onChapterSelect={(chapter) => {
            if (chapterTarget === 'notes') {
              setPendingChapter(chapter);
              setShowChapterOptions(true);
            } else {
              setSelectedChapter(chapter);
              setCurrentScreen(chapterTarget);
            }
          }}
        />

        {/* Chapter Options Modal */}
        {showChapterOptions && pendingChapter && (
          <Modal
            transparent
            animationType="fade"
            visible={showChapterOptions}
            onRequestClose={() => setShowChapterOptions(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>📖 {pendingChapter.name}</Text>
                <Text style={styles.modalSubtitle}>ఏమి చేయాలి?</Text>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#388e3c' }]}
                  onPress={() => {
                    setSelectedChapter(pendingChapter);
                    setShowChapterOptions(false);
                    setCurrentScreen('notes');
                  }}>
                  <Text style={styles.modalBtnText}>📖 నోట్స్ చదువు</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#1a237e' }]}
                  onPress={() => {
                    setSelectedChapter(pendingChapter);
                    setShowChapterOptions(false);
                    setCurrentScreen('studyMode');
                  }}>
                  <Text style={styles.modalBtnText}>🎯 Study Mode లో చదువు</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowChapterOptions(false)}>
                  <Text style={styles.modalCancelText}>రద్దు చేయి</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </>
    );
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  if (currentScreen === "notes" && selectedChapter) {
    return (
      <StudentNotesScreen
        chapter={selectedChapter}
        onBack={() => setCurrentScreen("classStructure")}
      />
    );
  }

  // ── References ──────────────────────────────────────────────────────────────
  if (currentScreen === "references" && selectedChapter) {
    return (
      <StudentReferencesScreen
        chapter={selectedChapter}
        onBack={() => setCurrentScreen("classStructure")}
      />
    );
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────
  if (currentScreen === "quiz" && selectedChapter) {
    return (
      <StudentQuizScreen
        chapter={selectedChapter}
        onBack={() => setCurrentScreen("classStructure")}
      />
    );
  }

  // ── Test ────────────────────────────────────────────────────────────────────
  if (currentScreen === "test") {
    return (
      <StudentTestScreen
        onBack={() => setCurrentScreen("dashboard")}
        userId={userId}
      />
    );
  }

  // ── Grades / Progress ───────────────────────────────────────────────────────
  if (currentScreen === "grades") {
    return (
      <StudentProgressScreen
        onBack={() => setCurrentScreen("dashboard")}
        userId={userId}
      />
    );
  }

  // ── Doubts ──────────────────────────────────────────────────────────────────
  if (currentScreen === "doubts" && selectedChapter) {
    return (
      <StudentDoubtScreen
        chapter={selectedChapter}
        onBack={() => setCurrentScreen("classStructure")}
        userId={userId}
      />
    );
  }

  // ── Homework ────────────────────────────────────────────────────────────────
  if (currentScreen === "homework") {
    return (
      <StudentHomeworkScreen
        onBack={() => setCurrentScreen("dashboard")}
        userId={userId}  // ✅ real userId pass చేస్తున్నాం
      />
    );
  }

  // ── Attendance ──────────────────────────────────────────────────────────────
  if (currentScreen === "attendance") {
    return (
      <StudentAttendanceScreen
        onBack={() => setCurrentScreen("dashboard")}
        userId={userId}
      />
    );
  }

  // ── Study Mode ──────────────────────────────────────────────────────────────
  if (currentScreen === "studyMode" && selectedChapter) {
    return (
      <StudyModeScreen
        chapter={selectedChapter}
        onBack={() => setCurrentScreen("classStructure")}
      />
    );
  }

  // ── Security ────────────────────────────────────────────────────────────────
  if (currentScreen === "security") {
    return (
      <SecurityScreen
        onBack={() => setCurrentScreen("dashboard")}
      />
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <LanguageToggle />
        <Text style={styles.headerTitle}>🟢 {T.studentDashboard}</Text>
        <Text style={styles.headerSub}>నా చదువు</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => {
              if (!item.target) return;
              // Chapter select అవసరమైన screens
              if (['notes', 'references', 'quiz', 'doubts'].includes(item.target)) {
                setChapterTarget(item.target);
                setCurrentScreen("classStructure");
              } else {
                // Direct navigate
                setCurrentScreen(item.target);
              }
            }}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>{T.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#388e3c",
    padding: 30, paddingTop: 60, alignItems: "center",
  },
  headerTitle: {
    fontSize: 26, fontWeight: "bold", color: "white",
    fontFamily: "SreeKrushnadevaraya",
  },
  headerSub: {
    fontSize: 16, color: "#c8e6c9", marginTop: 5,
    fontFamily: "SreeKrushnadevaraya",
  },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    padding: 15, justifyContent: "space-between",
  },
  card: {
    width: "47%", padding: 20, borderRadius: 15,
    alignItems: "center", marginBottom: 15, elevation: 3,
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardLabel: {
    fontSize: 16, fontWeight: "bold", color: "white",
    textAlign: "center", fontFamily: "SreeKrushnadevaraya",
  },
  logoutBtn: {
    margin: 20, backgroundColor: "#1b5e20",
    padding: 15, borderRadius: 10, alignItems: "center",
  },
  logoutText: {
    color: "white", fontSize: 18, fontWeight: "bold",
    fontFamily: "SreeKrushnadevaraya",
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 30,
  },
  modalBox: {
    backgroundColor: 'white', borderRadius: 15,
    padding: 20, elevation: 5,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#333',
    fontFamily: 'SreeKrushnadevaraya', marginBottom: 5, textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 20, textAlign: 'center',
  },
  modalBtn: {
    padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10,
  },
  modalBtnText: {
    color: 'white', fontSize: 16, fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  modalCancelBtn: { padding: 12, alignItems: 'center' },
  modalCancelText: {
    color: '#666', fontSize: 15, fontFamily: 'SreeKrushnadevaraya',
  },
});