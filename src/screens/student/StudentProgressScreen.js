import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator
} from 'react-native';
import { getStudentProgress } from '../../services/analytics';
import { getGrade } from '../../services/grading';

export default function StudentProgressScreen({ onBack }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    const result = await getStudentProgress('student-id');
    if (result.success) setProgress(result.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.backBtn} onPress={onBack}>← వెనక్కి</Text>
          <Text style={styles.headerTitle}>📊 నా పురోగతి</Text>
        </View>
        <ActivityIndicator color="#00838f" size="large" style={{ marginTop: 50 }} />
      </View>
    );
  }

  const grade = getGrade(progress?.avgScore || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={onBack}>← వెనక్కి</Text>
        <Text style={styles.headerTitle}>📊 నా పురోగతి</Text>
        <Text style={styles.headerSub}>Progress Report</Text>
      </View>

      <ScrollView style={styles.content}>

        {/* Overall Grade Card */}
        <View style={[styles.gradeCard, { borderColor: grade.color }]}>
          <View style={styles.gradeLeft}>
            <Text style={styles.gradeCardTitle}>మొత్తం Grade</Text>
            <Text style={[styles.gradeLetter, { color: grade.color }]}>
              {grade.letter}
            </Text>
            <Text style={[styles.gradeLabel, { color: grade.color }]}>
              {grade.label}
            </Text>
          </View>
          <View style={styles.gradeRight}>
            <Text style={styles.trendIcon}>
              {progress?.trend === 'up' ? '📈' : '📉'}
            </Text>
            <Text style={styles.trendText}>
              {progress?.trend === 'up' ? 'మెరుగవుతుంది!' : 'మరింత చదవండి!'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statNumber}>{progress?.total || 0}</Text>
            <Text style={styles.statLabel}>మొత్తం</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statNumber}>{progress?.avgScore || 0}</Text>
            <Text style={styles.statLabel}>సగటు స్కోర్</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❓</Text>
            <Text style={styles.statNumber}>{progress?.quizCount || 0}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statNumber}>{progress?.testCount || 0}</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
        </View>

        {/* Score Bar Chart */}
        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>📈 స్కోర్ చరిత్ర:</Text>
          {progress?.submissions?.length === 0
            ? <Text style={styles.emptyText}>ఇంకా submissions లేవు</Text>
            : progress?.submissions?.map((sub, index) => {
                const pct = Math.min(sub.score || 0, 100);
                const g = getGrade(pct);
                return (
                  <View key={sub.$id} style={styles.barRow}>
                    <Text style={styles.barLabel}>#{index + 1}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.barFill,
                        { width: `${pct}%`, backgroundColor: g.color }]} />
                    </View>
                    <Text style={[styles.barScore, { color: g.color }]}>
                      {sub.score}
                    </Text>
                  </View>
                );
              })
          }
        </View>

        {/* Recent Submissions */}
        <Text style={styles.sectionTitle}>ఇటీవలి ఫలితాలు:</Text>
        {progress?.submissions?.length === 0
          ? <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>ఇంకా Quiz/Test చేయలేదు</Text>
              <Text style={styles.emptySub}>Quiz చేసి మీ progress చూడండి!</Text>
            </View>
          : progress?.submissions?.map((sub, index) => {
              const g = getGrade(sub.score || 0);
              return (
                <View key={sub.$id} style={styles.subCard}>
                  <View style={[styles.subGradeBadge,
                    { backgroundColor: g.color }]}>
                    <Text style={styles.subGradeLetter}>{g.letter}</Text>
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={styles.subType}>
                      {sub.quizId ? '❓ Quiz' : '📝 Test'} #{index + 1}
                    </Text>
                    <Text style={styles.subScore}>స్కోర్: {sub.score || 0}</Text>
                    <Text style={styles.subDate}>
                      {new Date(sub.submittedAt).toLocaleDateString('te-IN')}
                    </Text>
                  </View>
                  <Text style={[styles.subGradeText, { color: g.color }]}>
                    {g.label}
                  </Text>
                </View>
              );
            })
        }

        {/* Motivation Message */}
        <View style={[styles.motivationBox, { backgroundColor: grade.color }]}>
          <Text style={styles.motivationText}>
            {grade.letter === 'A+' || grade.letter === 'A'
              ? '🏆 అద్భుతంగా చేస్తున్నావు! ఇలానే కొనసాగించు!'
              : grade.letter === 'B'
              ? '🌟 బాగా చేస్తున్నావు! మరింత కష్టపడు!'
              : grade.letter === 'C' || grade.letter === 'D'
              ? '💪 మరింత చదివితే మెరుగవుతావు!'
              : '📚 రోజూ చదివితే తప్పకుండా pass అవుతావు!'}
          </Text>
        </View>

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
  gradeCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    borderWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLeft: { alignItems: 'center' },
  gradeCardTitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 5,
  },
  gradeLetter: {
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  gradeRight: { alignItems: 'center' },
  trendIcon: { fontSize: 40, marginBottom: 8 },
  trendText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '23%',
    elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 5 },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00838f',
    fontFamily: 'BalooTammudu2',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  chartBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'SreeKrushnadevaraya',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 30,
    fontSize: 12,
    color: '#666',
    fontFamily: 'BalooTammudu2',
  },
  barContainer: {
    flex: 1,
    height: 18,
    backgroundColor: '#f5f5f5',
    borderRadius: 9,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: 18,
    borderRadius: 9,
  },
  barScore: {
    width: 30,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
    textAlign: 'right',
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
    padding: 30,
    alignItems: 'center',
    elevation: 1,
    marginBottom: 15,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 5,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'SreeKrushnadevaraya',
  },
  subCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  subGradeBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subGradeLetter: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  subInfo: { flex: 1 },
  subType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  subScore: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'BalooTammudu2',
  },
  subDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'BalooTammudu2',
  },
  subGradeText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  motivationBox: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  motivationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
});