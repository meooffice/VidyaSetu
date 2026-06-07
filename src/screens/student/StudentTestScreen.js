import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native';
import { getTestsByClass } from '../../services/tests';
import { getQuizzesByChapter } from '../../services/quiz';
import { createSubmission } from '../../services/tests';
import { getClasses } from '../../services/database';

export default function StudentTestScreen({ onBack }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [mode, setMode] = useState('list'); // list, test, result
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTests();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { getSchools } = require('../../services/database');
    const schoolResult = await getSchools();
    if (schoolResult.success && schoolResult.data.length > 0) {
      const classResult = await getClasses(schoolResult.data[0].$id);
      if (classResult.success && classResult.data.length > 0) {
        const testResult = await getTestsByClass(classResult.data[0].$id);
        if (testResult.success) setTests(testResult.data);
      }
    }
    setLoading(false);
  };

  const startTest = async (test) => {
    setSelectedTest(test);
    setTimeLeft(test.duration * 60);
    setAnswers({});
    setCurrentIndex(0);
    setMode('test');

    // Timer start చేయి
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    // Simple score calculate
    const totalScore = Math.floor(Math.random() * 40) + 60; // Demo score
    setScore(totalScore);
    await createSubmission('student-id', selectedTest.$id, answers, totalScore);
    setMode('result');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 300) return '#388e3c';
    if (timeLeft > 60) return '#f57c00';
    return '#e53935';
  };

  // RESULT Screen
  if (mode === 'result') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 పరీక్ష ఫలితం</Text>
        </View>
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>🎓</Text>
          <Text style={styles.resultTitle}>{selectedTest?.title}</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreTotal}>/ {selectedTest?.totalMarks}</Text>
          </View>
          <Text style={styles.scorePercent}>
            {Math.round((score / selectedTest?.totalMarks) * 100)}%
          </Text>
          <Text style={styles.scoreMessage}>
            {score >= 80 ? '🌟 చాలా బాగుంది!' :
             score >= 50 ? '👍 బాగుంది!' : '📚 మరింత చదవండి!'}
          </Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => {
            setMode('list');
            setSelectedTest(null);
          }}>
            <Text style={styles.exitBtnText}>← వెనక్కి వెళ్ళు</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // TEST Screen
  if (mode === 'test' && selectedTest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📝 {selectedTest.title}</Text>
          <View style={[styles.timer, { backgroundColor: getTimerColor() }]}>
            <Text style={styles.timerText}>⏱️ {formatTime(timeLeft)}</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.testInfo}>
            <Text style={styles.testInfoText}>
              📊 మొత్తం మార్కులు: {selectedTest.totalMarks}
            </Text>
            <Text style={styles.testInfoText}>
              ⏱️ సమయం: {selectedTest.duration} నిమిషాలు
            </Text>
          </View>

          <View style={styles.questionPlaceholder}>
            <Text style={styles.placeholderText}>
              📝 Teacher quiz questions ఇక్కడ కనిపిస్తాయి
            </Text>
            <Text style={styles.placeholderSub}>
              Step 14 లో Quiz + Test integrate చేస్తాం!
            </Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>✅ పరీక్ష Submit చేయి</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // LIST Screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 పరీక్షలు</Text>
        <Text style={styles.headerSub}>నా Class పరీక్షలు</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#6a1b9a" size="large" style={{ marginTop: 30 }} />
          : tests.length === 0
            ? <Text style={styles.emptyText}>ఇంకా పరీక్షలు లేవు</Text>
            : tests.map((test) => (
                <View key={test.$id} style={styles.testCard}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <View style={styles.testMeta}>
                    <Text style={styles.testMetaItem}>⏱️ {test.duration} నిమిషాలు</Text>
                    <Text style={styles.testMetaItem}>📊 {test.totalMarks} మార్కులు</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => startTest(test)}>
                    <Text style={styles.startBtnText}>పరీక్ష మొదలుపెట్టు →</Text>
                  </TouchableOpacity>
                </View>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#6a1b9a',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'column',
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 14,
    color: '#ce93d8',
    fontFamily: 'SreeKrushnadevaraya',
  },
  timer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  content: { flex: 1, padding: 15 },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    fontFamily: 'SreeKrushnadevaraya',
  },
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'SreeKrushnadevaraya',
  },
  testMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  testMetaItem: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
    fontFamily: 'BalooTammudu2',
  },
  startBtn: {
    backgroundColor: '#6a1b9a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  testInfo: {
    backgroundColor: '#ede7f6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  testInfoText: {
    fontSize: 15,
    color: '#6a1b9a',
    marginBottom: 5,
    fontFamily: 'SreeKrushnadevaraya',
  },
  questionPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
  submitBtn: {
    backgroundColor: '#6a1b9a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  resultIcon: { fontSize: 60, marginBottom: 15 },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 20,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#6a1b9a',
    fontFamily: 'BalooTammudu2',
  },
  scoreTotal: {
    fontSize: 28,
    color: '#999',
    fontFamily: 'BalooTammudu2',
  },
  scorePercent: {
    fontSize: 24,
    color: '#666',
    fontFamily: 'BalooTammudu2',
    marginBottom: 10,
  },
  scoreMessage: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 30,
  },
  exitBtn: {
    backgroundColor: '#6a1b9a',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});