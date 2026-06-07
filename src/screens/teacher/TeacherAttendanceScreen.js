import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native';
import { markAttendance, getClassAttendance } from '../../services/attendance';
import { getClasses, getSchools } from '../../services/database';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { getParentIdByStudent } from '../../services/users';
import { createNotification } from '../../services/notifications';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ✅ Section ఉంటే "Class - Section" చూపించు, లేకపోతే class name మాత్రమే
const getClassDisplay = (cls) =>
  cls.section ? `${cls.name} - ${cls.section}` : cls.name;

export default function TeacherAttendanceScreen({ onBack }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass.$id);
      loadExistingAttendance();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const schoolResult = await getSchools();
      if (schoolResult.success && schoolResult.data.length > 0) {
        const classResult = await getClasses(schoolResult.data[0].$id);
        if (classResult.success) {
          setClasses(classResult.data);
          if (classResult.data.length > 0) {
            setSelectedClass(classResult.data[0]);
          }
        }
      }
    } catch (e) {
      console.log('loadClasses error:', e.message);
    }
    setLoading(false);
  };

  const loadStudents = async (classId) => {
    setStudentsLoading(true);
    try {
      const result = await databases.listDocuments(
        DB, C.users,
        [Query.equal('classId', classId),
         Query.equal('role', 'student')]
      );
      setStudents(result.documents);
      console.log('Students loaded:', result.documents.length);
    } catch (e) {
      console.log('loadStudents error:', e.message);
      setStudents([]);
    }
    setStudentsLoading(false);
  };

  const loadExistingAttendance = async () => {
    try {
      const result = await getClassAttendance(selectedClass.$id, today);
      if (result.success) {
        const existing = {};
        result.data.forEach(a => {
          existing[a.studentId] = a.status;
        });
        setAttendance(existing);
      }
    } catch (e) {
      console.log('loadExistingAttendance error:', e.message);
    }
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const allAttendance = {};
    students.forEach(s => { allAttendance[s.$id] = status; });
    setAttendance(allAttendance);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      alert('ఈ తరగతిలో విద్యార్థులు లేరు!');
      return;
    }
    if (Object.keys(attendance).length === 0) {
      alert('ముందు attendance mark చేయండి!');
      return;
    }
    setSaving(true);
    let saved = 0;

    for (const [studentId, status] of Object.entries(attendance)) {
      // Attendance save చేయి
      const result = await markAttendance(
        studentId, selectedClass.$id, today, status, 'teacher-id'
      );
      if (result.success) {
        saved++;

        // Student info తీసుకో
        const student = students.find(s => s.$id === studentId);
        const studentName = student?.name || 'విద్యార్థి';
        const parentId = student?.parentId || '';

        if (parentId && parentId !== '') {
          if (status === 'absent') {
            // Absent అయితే మాత్రమే ఆ student parent కి notification
            await createNotification(
              parentId,
              '⚠️ హాజరు హెచ్చరిక!',
              `${studentName} ఈరోజు (${today}) school కి రాలేదు`,
              'attendance'
            );
          } else if (status === 'present') {
            // Present అయితే కూడా parent కి confirm notification
            await createNotification(
              parentId,
              '✅ హాజరు నిర్ధారణ',
              `${studentName} ఈరోజు (${today}) school కి వచ్చారు`,
              'attendance'
            );
          } else if (status === 'late') {
            // Late అయితే
            await createNotification(
              parentId,
              '⏰ ఆలస్యంగా వచ్చారు',
              `${studentName} ఈరోజు (${today}) ఆలస్యంగా school కి వచ్చారు`,
              'attendance'
            );
          }
        }
      }
    }

    setSaving(false);
    alert(`✅ ${saved} విద్యార్థుల attendance సేవ్ అయింది!\nParents కి notifications పంపబడ్డాయి!`);
    loadExistingAttendance();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#388e3c';
      case 'absent': return '#e53935';
      case 'late': return '#f57c00';
      default: return '#bdbdbd';
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✅ హాజరు నిర్వహణ</Text>
        {/* ✅ selectedClass display కూడా getClassDisplay తో */}
        <Text style={styles.headerSub}>
          📅 {today} · {selectedClass ? getClassDisplay(selectedClass) : ''}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Class Select */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.classRow}>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.$id}
              style={[styles.classBtn,
                selectedClass?.$id === cls.$id && styles.classBtnActive]}
              onPress={() => setSelectedClass(cls)}>
              <Text style={[styles.classBtnText,
                selectedClass?.$id === cls.$id && styles.classBtnTextActive]}>
                {getClassDisplay(cls)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mark All Buttons */}
        {students.length > 0 && (
          <View style={styles.markAllRow}>
            <Text style={styles.markAllLabel}>అందరికీ:</Text>
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: '#388e3c' }]}
              onPress={() => handleMarkAll('present')}>
              <Text style={styles.markAllBtnText}>✅ Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: '#e53935' }]}
              onPress={() => handleMarkAll('absent')}>
              <Text style={styles.markAllBtnText}>❌ Absent</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.summaryNum, { color: '#388e3c' }]}>{presentCount}</Text>
            <Text style={styles.summaryLabel}>✅ Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
            <Text style={[styles.summaryNum, { color: '#e53935' }]}>{absentCount}</Text>
            <Text style={styles.summaryLabel}>❌ Absent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.summaryNum, { color: '#f57c00' }]}>{lateCount}</Text>
            <Text style={styles.summaryLabel}>⏰ Late</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#f5f5f5' }]}>
            <Text style={[styles.summaryNum, { color: '#999' }]}>
              {students.length - Object.keys(attendance).length}
            </Text>
            <Text style={styles.summaryLabel}>⏳ Unmarked</Text>
          </View>
        </View>

        {/* Students List */}
        {loading || studentsLoading
          ? <ActivityIndicator color="#388e3c" size="large" style={{ marginTop: 20 }} />
          : students.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👨‍🎓</Text>
                <Text style={styles.emptyText}>
                  ఈ తరగతిలో విద్యార్థులు లేరు
                </Text>
                <Text style={styles.emptySub}>
                  Admin → విద్యార్థులు screen లో students add చేయండి
                </Text>
              </View>
            : students.map((student) => (
                <View key={student.$id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <View style={[styles.avatar,
                      { backgroundColor: getStatusColor(attendance[student.$id]) }]}>
                      <Text style={styles.avatarText}>
                        {student.name?.charAt(0) || 'S'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                  </View>

                  <View style={styles.statusBtns}>
                    {['present', 'absent', 'late'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusBtn,
                          attendance[student.$id] === status &&
                          { backgroundColor: getStatusColor(status) }]}
                        onPress={() => setStatus(student.$id, status)}>
                        <Text style={[styles.statusBtnText,
                          attendance[student.$id] === status &&
                          { color: 'white' }]}>
                          {status === 'present' ? '✅'
                           : status === 'absent' ? '❌' : '⏰'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
        }

        {/* Save Button */}
        {students.length > 0 && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveAttendance}>
            {saving
              ? <ActivityIndicator color="white" />
              : <Text style={styles.saveBtnText}>
                  ✅ Attendance సేవ్ చేయి ({Object.keys(attendance).length}/{students.length})
                </Text>
            }
          </TouchableOpacity>
        )}
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
    color: '#c8e6c9',
    fontFamily: 'BalooTammudu2',
  },
  content: { flex: 1, padding: 15 },
  classRow: { marginBottom: 15 },
  classBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  classBtnActive: {
    backgroundColor: '#388e3c',
    borderColor: '#388e3c',
  },
  classBtnText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  classBtnTextActive: { color: 'white' },
  markAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  markAllLabel: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'SreeKrushnadevaraya',
    marginRight: 8,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  markAllBtnText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'SreeKrushnadevaraya',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    width: '23%',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 1,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 1,
  },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
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
    textAlign: 'center',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  studentName: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  studentEmail: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'BalooTammudu2',
  },
  statusBtns: { flexDirection: 'row' },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusBtnText: { fontSize: 16 },
  saveBtn: {
    backgroundColor: '#388e3c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});