import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { getAllSubmissions, getGrade } from '../../services/grading';

export default function TeacherGradeReport({ onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const result = await getAllSubmissions();
    if (result.success) setSubmissions(result.data);
    setLoading(false);
  };

  const getClassAvg = () => {
    if (submissions.length === 0) return 0;
    const total = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round(total / submissions.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={onBack}>← వెనక్కి</Text>
        <Text style={styles.headerTitle}>📊 విద్యార్థి పురోగతి</Text>
        <Text style={styles.headerSub}>Class Grade Report</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Class Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>తరగతి సారాంశం</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{submissions.length}</Text>
              <Text style={styles.summaryLabel}>Submissions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getClassAvg()}</Text>
              <Text style={styles.summaryLabel}>సగటు స్కోర్</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber,
                { color: getGrade(getClassAvg()).color }]}>
                {getGrade(getClassAvg()).letter}
              </Text>
              <Text style={styles.summaryLabel}>Class Grade</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>విద్యార్థుల ఫలితాలు:</Text>

        {loading
          ? <ActivityIndicator color="#00838f" size="large" />
          : submissions.length === 0
            ? <Text style={styles.emptyText}>ఇంకా submissions లేవు</Text>
            : submissions.map((sub, index) => {
                const grade = getGrade(sub.score);
                return (
                  <View key={sub.$id} style={styles.reportCard}>
                    <View style={[styles.gradeCircle,
                      { backgroundColor: grade.color }]}>
                      <Text style={styles.gradeLetter}>{grade.letter}</Text>
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportStudent}>
                        విద్యార్థి #{index + 1}
                      </Text>
                      <Text style={styles.reportScore}>
                        స్కోర్: {sub.score} పాయింట్లు
                      </Text>
                      <Text style={styles.reportDate}>
                        {new Date(sub.submittedAt).toLocaleDateString('te-IN')}
                      </Text>
                    </View>
                    <Text style={[styles.reportGradeLabel,
                      { color: grade.color }]}>
                      {grade.label}
                    </Text>
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
    marginBottom: 20,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00838f',
    fontFamily: 'BalooTammudu2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'SreeKrushnadevaraya',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    fontFamily: 'SreeKrushnadevaraya',
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  gradeLetter: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  reportInfo: { flex: 1 },
  reportStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  reportScore: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'BalooTammudu2',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'BalooTammudu2',
    marginTop: 2,
  },
  reportGradeLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});