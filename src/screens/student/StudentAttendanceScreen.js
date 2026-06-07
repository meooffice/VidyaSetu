import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { getStudentAttendance, calculateAttendanceStats } from '../../services/attendance';

export default function StudentAttendanceScreen({ onBack }) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    const result = await getStudentAttendance('student-id');
    if (result.success) {
      setAttendance(result.data);
      setStats(calculateAttendanceStats(result.data));
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#388e3c';
      case 'absent': return '#e53935';
      case 'late': return '#f57c00';
      default: return '#bdbdbd';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return '✅ Present';
      case 'absent': return '❌ Absent';
      case 'late': return '⏰ Late';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={onBack}>← వెనక్కి</Text>
        <Text style={styles.headerTitle}>✅ నా హాజరు</Text>
        <Text style={styles.headerSub}>Attendance Report</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#388e3c" size="large" style={{ marginTop: 30 }} />
          : <>
              {/* Stats */}
              {stats && (
                <>
                  {/* Percentage Circle */}
                  <View style={styles.percentageBox}>
                    <View style={[styles.circle, {
                      borderColor: stats.percentage >= 75 ? '#388e3c'
                                 : stats.percentage >= 50 ? '#f57c00'
                                 : '#e53935'
                    }]}>
                      <Text style={[styles.percentageNum, {
                        color: stats.percentage >= 75 ? '#388e3c'
                             : stats.percentage >= 50 ? '#f57c00'
                             : '#e53935'
                      }]}>
                        {stats.percentage}%
                      </Text>
                      <Text style={styles.percentageLabel}>హాజరు</Text>
                    </View>
                    <Text style={[styles.percentageMsg, {
                      color: stats.percentage >= 75 ? '#388e3c'
                           : stats.percentage >= 50 ? '#f57c00'
                           : '#e53935'
                    }]}>
                      {stats.percentage >= 75 ? '✅ మంచి హాజరు!'
                       : stats.percentage >= 50 ? '⚠️ హాజరు తక్కువగా ఉంది'
                       : '❌ హాజరు చాలా తక్కువ!'}
                    </Text>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                      <Text style={[styles.statNum, { color: '#388e3c' }]}>
                        {stats.present}
                      </Text>
                      <Text style={styles.statLabel}>✅ Present</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
                      <Text style={[styles.statNum, { color: '#e53935' }]}>
                        {stats.absent}
                      </Text>
                      <Text style={styles.statLabel}>❌ Absent</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                      <Text style={[styles.statNum, { color: '#f57c00' }]}>
                        {stats.late}
                      </Text>
                      <Text style={styles.statLabel}>⏰ Late</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                      <Text style={[styles.statNum, { color: '#1565c0' }]}>
                        {stats.total}
                      </Text>
                      <Text style={styles.statLabel}>📅 మొత్తం</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Attendance List */}
              <Text style={styles.sectionTitle}>📅 హాజరు వివరాలు:</Text>
              {attendance.length === 0
                ? <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyText}>హాజరు వివరాలు లేవు</Text>
                  </View>
                : attendance.map((a) => (
                    <View key={a.$id} style={styles.attendanceCard}>
                      <View style={[styles.statusDot,
                        { backgroundColor: getStatusColor(a.status) }]} />
                      <Text style={styles.dateText}>{a.date}</Text>
                      <Text style={[styles.statusText,
                        { color: getStatusColor(a.status) }]}>
                        {getStatusLabel(a.status)}
                      </Text>
                    </View>
                  ))
              }
            </>
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#388e3c',
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
    color: '#c8e6c9',
    fontFamily: 'BalooTammudu2',
  },
  content: { flex: 1, padding: 15 },
  percentageBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  percentageNum: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  percentageMsg: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  statNum: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'SreeKrushnadevaraya',
  },
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
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontFamily: 'BalooTammudu2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});