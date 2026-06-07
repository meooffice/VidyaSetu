import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native';
import { getNotesByChapter } from '../../services/notes';

export default function StudyModeScreen({ chapter, onBack }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [studyTime, setStudyTime] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [completed, setCompleted] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    loadNotes();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    const result = await getNotesByChapter(chapter.$id);
    if (result.success) setNotes(result.data);
    setLoading(false);
  };

  const startStudy = () => {
    setIsStudying(true);
    timerRef.current = setInterval(() => {
      setStudyTime(prev => prev + 1);
    }, 1000);
  };

  const stopStudy = () => {
    setIsStudying(false);
    clearInterval(timerRef.current);
  };

  const markComplete = (noteId) => {
    if (!completed.includes(noteId)) {
      setCompleted(prev => [...prev, noteId]);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = notes.length > 0
    ? Math.round((completed.length / notes.length) * 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>← వెనక్కి</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📖 Study Mode</Text>
        </View>
        <ActivityIndicator color="#1a73e8" size="large" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stopStudy(); onBack(); }}>
          <Text style={styles.backBtn}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📖 Study Mode</Text>
        <Text style={styles.headerSub}>{chapter.name}</Text>
      </View>

      {/* Study Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>⏱️ {formatTime(studyTime)}</Text>
          <Text style={styles.statLabel}>Study Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>📖 {completed.length}/{notes.length}</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>📊 {progress}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Start/Stop Button */}
      <TouchableOpacity
        style={[styles.studyBtn, isStudying && styles.studyBtnActive]}
        onPress={isStudying ? stopStudy : startStudy}>
        <Text style={styles.studyBtnText}>
          {isStudying ? '⏸ Study Pause చేయి' : '▶ Study మొదలుపెట్టు'}
        </Text>
      </TouchableOpacity>

      {/* Notes List */}
      <ScrollView style={styles.content}>
        {notes.length === 0
          ? <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyText}>ఈ పాఠానికి నోట్స్ లేవు</Text>
            </View>
          : notes.map((note, index) => {
              const isDone = completed.includes(note.$id);
              return (
                <View key={note.$id} style={[styles.noteCard,
                  isDone && styles.noteCardDone]}>
                  <View style={styles.noteCardHeader}>
                    <View style={styles.noteNumber}>
                      <Text style={styles.noteNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.noteTitle, isDone && styles.noteTitleDone]}>
                      {note.title}
                    </Text>
                    {isDone && <Text style={styles.doneIcon}>✅</Text>}
                  </View>

                  <Text style={styles.noteContent} numberOfLines={3}>
                    {note.content}
                  </Text>

                  {!isDone && (
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => markComplete(note.$id)}>
                      <Text style={styles.doneBtnText}>✓ చదివాను</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
        }

        {/* Completion Message */}
        {progress === 100 && (
          <View style={styles.completionBox}>
            <Text style={styles.completionIcon}>🏆</Text>
            <Text style={styles.completionTitle}>అద్భుతం!</Text>
            <Text style={styles.completionText}>
              అన్ని నోట్స్ చదివారు!\nStudy Time: {formatTime(studyTime)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#1a237e',
    padding: 20,
    paddingTop: 50,
  },
  backBtn: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 14,
    color: '#9fa8da',
    fontFamily: 'SreeKrushnadevaraya',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    justifyContent: 'space-around',
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'BalooTammudu2',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1a73e8',
  },
  studyBtn: {
    backgroundColor: '#1a73e8',
    margin: 15,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  studyBtnActive: { backgroundColor: '#f57c00' },
  studyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  content: { flex: 1, padding: 15 },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  noteCardDone: {
    borderLeftColor: '#388e3c',
    opacity: 0.8,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noteNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    fontFamily: 'SreeKrushnadevaraya',
  },
  noteTitleDone: {
    color: '#388e3c',
    textDecorationLine: 'line-through',
  },
  doneIcon: { fontSize: 20 },
  noteContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 10,
  },
  doneBtn: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#388e3c',
  },
  doneBtnText: {
    color: '#388e3c',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  completionBox: {
    backgroundColor: '#1a237e',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  completionIcon: { fontSize: 50, marginBottom: 10 },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#9fa8da',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
});