import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function AdminReportsScreen({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const schools = await databases.listDocuments(DB, C.schools);
      await new Promise(r => setTimeout(r, 1000));

      const teachers = await databases.listDocuments(
        DB, C.users, [Query.equal('role', 'teacher')]
      );
      await new Promise(r => setTimeout(r, 1000));

      const students = await databases.listDocuments(
        DB, C.users, [Query.equal('role', 'student')]
      );
      await new Promise(r => setTimeout(r, 1000));

      const parents = await databases.listDocuments(
        DB, C.users, [Query.equal('role', 'parent')]
      );
      await new Promise(r => setTimeout(r, 1000));

      const notes = await databases.listDocuments(DB, C.notes);
      await new Promise(r => setTimeout(r, 1000));

      const submissions = await databases.listDocuments(DB, C.submissions);

      setStats({
        schools: schools.total,
        teachers: teachers.total,
        students: students.total,
        parents: parents.total,
        notes: notes.total,
        submissions: submissions.total,
        avgScore: submissions.documents.length > 0
          ? Math.round(
              submissions.documents.reduce((sum, s) => sum + (s.score || 0), 0) /
              submissions.documents.length
            )
          : 0,
      });
    } catch (e) {
      console.log('Stats error:', e.message);
    }
    setLoading(false);
  };

  const statItems = stats ? [
    { icon: '🏫', label: 'పాఠశాలలు', value: stats.schools, color: '#e53935' },
    { icon: '👨‍🏫', label: 'టీచర్లు', value: stats.teachers, color: '#f57c00' },
    { icon: '👨‍🎓', label: 'విద్యార్థులు', value: stats.students, color: '#388e3c' },
    { icon: '👨‍👩‍👧', label: 'తల్లిదండ్రులు', value: stats.parents, color: '#1565c0' },
    { icon: '📚', label: 'నోట్స్', value: stats.notes, color: '#6a1b9a' },
    { icon: '📝', label: 'Submissions', value: stats.submissions, color: '#00838f' },
    { icon: '⭐', label: 'సగటు స్కోర్', value: stats.avgScore, color: '#e53935' },
  ] : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 నివేదికలు</Text>
        <Text style={styles.headerSub}>School Analytics</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <>
              <ActivityIndicator color="#e53935" size="large" style={{ marginTop: 30 }} />
              <Text style={styles.loadingText}>డేటా లోడ్ అవుతుంది...</Text>
            </>
          : <>
              <Text style={styles.sectionTitle}>📊 మొత్తం సారాంశం:</Text>
              <View style={styles.grid}>
                {statItems.map((item, i) => (
                  <View key={i} style={[styles.statCard,
                    { borderTopColor: item.color }]}>
                    <Text style={styles.statIcon}>{item.icon}</Text>
                    <Text style={[styles.statValue, { color: item.color }]}>
                      {item.value}
                    </Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
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
    fontFamily: 'BalooTammudu2',
  },
  content: { flex: 1, padding: 15 },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    fontFamily: 'SreeKrushnadevaraya',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'SreeKrushnadevaraya',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    borderTopWidth: 4,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
    marginTop: 4,
  },
});