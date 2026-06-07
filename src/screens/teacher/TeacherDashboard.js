import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import ClassStructureScreen from '../student/ClassStructureScreen';
import NotesScreen from './NotesScreen';
import ReferencesScreen from './ReferencesScreen';
import QuizBuilderScreen from './QuizBuilderScreen';
import TestBuilderScreen from './TestBuilderScreen';
import TeacherDoubtScreen from './TeacherDoubtScreen';
import TeacherHomeworkScreen from './TeacherHomeworkScreen';
import TeacherAttendanceScreen from './TeacherAttendanceScreen';
import TeacherNotificationScreen from './TeacherNotificationScreen';
import TeacherMessagingScreen from './TeacherMessagingScreen';
import TeacherGradeReport from './TeacherGradeReport';

export default function TeacherDashboard({ onLogout, userId }) {  // ← userId prop add చేశాం
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterTarget, setChapterTarget] = useState('notes');

  const menuItems = [
    { icon: '📚', label: 'నోట్స్ అప్‌లోడ్', color: '#f57c00', target: 'notes' },
    { icon: '📎', label: 'రిఫరెన్స్ మెటీరియల్', color: '#1565c0', target: 'references' },
    { icon: '❓', label: 'క్విజ్ తయారు చేయి', color: '#e53935', target: 'quiz' },
    { icon: '📝', label: 'పరీక్ష నిర్వహించు', color: '#6a1b9a', target: 'test' },
    { icon: '✅', label: 'హాజరు', color: '#388e3c', target: 'attendance' },
    { icon: '📊', label: 'విద్యార్థి పురోగతి', color: '#00838f', target: 'grades' },
    { icon: '🤔', label: 'సందేహాలు', color: '#1565c0', target: 'doubts' },
    { icon: '📋', label: 'హోమ్ వర్క్ ఇవ్వు', color: '#00838f', target: 'homework' },
    { icon: '🔔', label: 'Notification పంపు', color: '#6a1b9a', target: 'notifications' },
    { icon: '💬', label: 'తల్లిదండ్రులతో మాట్లాడు', color: '#1565c0', target: 'messaging' },
  ];

  if (currentScreen === 'classStructure') {
    return (
      <ClassStructureScreen
        onBack={() => setCurrentScreen('dashboard')}
        onChapterSelect={(chapter) => {
          setSelectedChapter(chapter);
          setCurrentScreen(chapterTarget);
        }}
      />
    );
  }

  if (currentScreen === 'notes' && selectedChapter) {
    return <NotesScreen chapter={selectedChapter} onBack={() => setCurrentScreen('classStructure')} />;
  }

  if (currentScreen === 'references' && selectedChapter) {
    return <ReferencesScreen chapter={selectedChapter} onBack={() => setCurrentScreen('classStructure')} />;
  }

  if (currentScreen === 'quiz' && selectedChapter) {
    return <QuizBuilderScreen chapter={selectedChapter} onBack={() => setCurrentScreen('classStructure')} />;
  }

  if (currentScreen === 'test') {
    return <TestBuilderScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'doubts') {
    return <TeacherDoubtScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'homework') {
  return (
    <TeacherHomeworkScreen
      onBack={() => setCurrentScreen('dashboard')}
      userId={userId} // ← add చేయి
    />
  );
}
  if (currentScreen === 'attendance') {
    return <TeacherAttendanceScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'notifications') {
    return <TeacherNotificationScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  if (currentScreen === 'messaging') {
    return (
      <TeacherMessagingScreen
        onBack={() => setCurrentScreen('dashboard')}
        userId={userId}  // ← real userId pass చేస్తున్నాం
      />
    );
  }
  if (currentScreen === 'grades') {
  return <TeacherGradeReport onBack={() => setCurrentScreen('dashboard')} />;
}

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🟡 టీచర్ డాష్‌బోర్డ్</Text>
        <Text style={styles.headerSub}>నా తరగతి నిర్వహణ</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => {
              if (!item.target) return;
              // notes, references, quiz → chapter select చేయాలి
              if (['notes', 'references', 'quiz'].includes(item.target)) {
                setChapterTarget(item.target);
                setCurrentScreen('classStructure');
              } else {
                // మిగతావి → direct navigate
                setCurrentScreen(item.target);
              }
            }}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>లాగ్ అవుట్</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#f57c00',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 16,
    color: '#ffe0b2',
    marginTop: 5,
    fontFamily: 'SreeKrushnadevaraya',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
  logoutBtn: {
    margin: 20,
    backgroundColor: '#e65100',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});