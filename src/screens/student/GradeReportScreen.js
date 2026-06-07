import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { getStudentSubmissions } from '../../services/grading';
import { getGrade } from '../../services/grading';

export default function GradeReportScreen({ onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const result = await getStudentSubmissions('student-id');
    if (result.success) {
      setSubmissions(result.data);
    }
    setLoading(false);
  };

  const getAvgScore = () => {
    if (submissions.length === 0) return 0;
    const total = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round(total / submissions.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={styles.backBtn}
          onPress={onBack}>← వెనక్కి
        </Text>
        <Text style={styles.headerTitle}>📊 నా పురోగతి</Text>
        <Text style={styles.headerSub}>Grade Report</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{submissions.length}</Text>
            <Text style={styles.summaryLabel}>మొత్తం Submissions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{getAvgScore()}</Text>
            <Text style={styles.summaryLabel}>సగటు స్కోర్</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber,
              { color: getGrade(getAvgScore()).color }]}>
              {getGrade(getAvgScore()).letter}
            </Text>
            <Text style={styles.summaryLabel}>Grade</Text>
          </View>
        </View>

        {/* Submissions List */}
        <Text style={styles.sectionTitle}>Quiz/Test చరిత్ర:</Text>

        {loading
          ? <ActivityIndicator color="#6a1b9a" size="large" />
          : submissions.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>ఇంకా Quiz/Test చేయలేదు</Text>
                <Text style={styles.emptySub}>Quiz చేస్తే ఇక్కడ కనిపిస్తుంది!</Text>
              </View>
            : submissions.map((sub, index) => {
                const grade = getGrade(sub.score);
                return (
                  <View key={sub.$id} style={styles.submissionCard}>
                    <View style={styles.submissionHeader}>
                      <Text style={styles.submissionIndex}>#{index + 1}</Text>
                      <View style={[styles.gradeBadge,
                        { backgroundColor: grade.color }]}>
                        <Text style={styles.gradeLetter}>{grade.letter}</Text>
                      </View>
                    </View>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionScore}>
                        స్కోర్: {sub.score} పాయింట్లు
                      </Text>
                      <Text style={styles.submissionDate}>
                        📅 {new Date(sub.submittedAt).toLocaleDateString('te-IN')}
                      </Text>
                      <Text style={[styles.submissionGrade,
                        { color: grade.color }]}>
                        {grade.label}
                      </Text>
                    </View>
                  </View>
                );
              })
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00838f',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 14,
    color: '#b2ebf2',
    fontFamily: 'BalooTammudu2',
  },
  content: { flex: 1, padding: 15 },
  summaryBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  summaryItem: { alignItems: 'center' },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00838f',
    fontFamily: 'BalooTammudu2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'SreeKrushnadevaraya',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    elevation: 1,
  },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'SreeKrushnadevaraya',
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionHeader: {
    alignItems: 'center',
    marginRight: 15,
  },
  submissionIndex: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'BalooTammudu2',
    marginBottom: 5,
  },
  gradeBadge: {
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLetter: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  submissionInfo: { flex: 1 },
  submissionScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  submissionDate: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'BalooTammudu2',
    marginTop: 3,
  },
  submissionGrade: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
    marginTop: 3,
  },
});