import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal
} from 'react-native';
import {
  getHomeworkForStudent,
  markStudentDone
} from '../../services/homework';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

function CustomAlert({ visible, type, title, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={alertStyles.overlay}>
        <View style={alertStyles.box}>
          <Text style={alertStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
          </Text>
          <Text style={alertStyles.title}>{title}</Text>
          {message ? <Text style={alertStyles.message}>{message}</Text> : null}
          <TouchableOpacity style={alertStyles.btn} onPress={onClose}>
            <Text style={alertStyles.btnText}>సరే</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function StudentHomeworkScreen({ onBack, userId }) {
  const [homeworks,    setHomeworks]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [marking,      setMarking]      = useState(null);
  const [studentInfo,  setStudentInfo]  = useState(null);
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: ''
  });

  const showAlert = (type, title, message = '') =>
    setAlert({ visible: true, type, title, message });
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadData(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ userId prop లేకపోతే account నుండి తీసుకో
      let studentId = userId;

      if (!studentId) {
        console.log('No userId prop — getting from account...');
        try {
          const currentUser = await account.get();
          studentId = currentUser.$id;
          console.log('Got from account:', studentId);
        } catch (e) {
          console.log('account.get() failed:', e.message);
          setLoading(false);
          return;
        }
      }

      console.log('Loading homework for studentId:', studentId);

      // Student info DB నుండి తీసుకో
      const userResult = await databases.listDocuments(
        DB, C.users,
        [Query.equal('$id', studentId)]
      );

      if (userResult.documents.length === 0) {
        console.log('Student not found in DB:', studentId);
        showAlert('error', 'Error',
          'Student info కనపడలేదు! Admin మీ account set up చేశారా?'
        );
        setLoading(false);
        return;
      }

      const student = userResult.documents[0];
      setStudentInfo(student);
      console.log('Student:', student.name, '| classId:', student.classId);

      if (!student.classId) {
        console.log('No classId assigned to student');
        setLoading(false);
        return;
      }

      // Homework + status తీసుకో
      const hwResult = await getHomeworkForStudent(
        student.classId, student.$id
      );

      if (hwResult.success) {
        console.log('Homeworks loaded:', hwResult.data.length);
        setHomeworks(hwResult.data);
      } else {
        console.log('Homework fetch error:', hwResult.error);
      }
    } catch (e) {
      console.log('loadData error:', e.message);
    }
    setLoading(false);
  };

  const handleMarkDone = async (hw) => {
    if (!studentInfo) return;
    setMarking(hw.$id);

    const result = await markStudentDone(
      hw.$id,
      studentInfo.$id,
      studentInfo.name,
      studentInfo.parentId || '',
      hw.teacherId || ''
    );

    setMarking(null);

    if (result.success) {
      setHomeworks(prev => prev.map(h =>
        h.$id === hw.$id
          ? { ...h, myStudentStatus: 'done', myParentStatus: 'pending' }
          : h
      ));
      showAlert('success', 'Homework Done!',
        'Parent కి notification పంపబడింది!'
      );
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  const getStatusInfo = (hw) => {
    const s = hw.myStudentStatus || 'pending';
    const p = hw.myParentStatus  || 'pending';
    if (p === 'confirmed') return {
      label: '✅ Parent Confirmed!',
      color: '#388e3c', bg: '#e8f5e9'
    };
    if (p === 'rejected') return {
      label: '❌ Parent Rejected',
      color: '#e53935', bg: '#ffebee'
    };
    if (s === 'done') return {
      label: '⏳ Parent Confirm కోసం వేచి ఉంది',
      color: '#f57c00', bg: '#fff3e0'
    };
    return {
      label: '📋 చేయాల్సి ఉంది',
      color: '#1565c0', bg: '#e3f2fd'
    };
  };

  const isOverdue = (d) => d && new Date(d) < new Date();
  const isDueSoon = (d) => {
    if (!d) return false;
    const diff = (new Date(d) - new Date()) / 86400000;
    return diff <= 2 && diff >= 0;
  };

  const pending = homeworks.filter(h =>
    (h.myStudentStatus || 'pending') === 'pending'
  );
  const done = homeworks.filter(h =>
    (h.myStudentStatus || 'pending') === 'done'
  );

  return (
    <View style={styles.container}>
      <CustomAlert {...alert} onClose={closeAlert} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 నా Homework</Text>
        <Text style={styles.headerSub}>
          {pending.length} pending · {done.length} done
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={styles.summaryNum}>{pending.length}</Text>
            <Text style={styles.summaryLabel}>⏳ Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.summaryNum}>
              {homeworks.filter(h => h.myParentStatus === 'confirmed').length}
            </Text>
            <Text style={styles.summaryLabel}>✅ Confirmed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.summaryNum}>{homeworks.length}</Text>
            <Text style={styles.summaryLabel}>📋 మొత్తం</Text>
          </View>
        </View>

        {loading
          ? <ActivityIndicator
              color="#00838f" size="large" style={{ marginTop: 30 }} />
          : homeworks.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>
                  {studentInfo
                    ? studentInfo.classId
                      ? 'ఇంకా Homework లేదు!'
                      : 'Admin మీకు class assign చేయలేదు'
                    : 'Student info load కాలేదు'
                  }
                </Text>
                {studentInfo && !studentInfo.classId && (
                  <Text style={styles.emptyNote}>
                    ⚠️ Admin → విద్యార్థి screen లో class assign చేయమని అడగండి
                  </Text>
                )}
              </View>
            : <>
                {/* Pending */}
                {pending.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      ⏳ చేయాల్సిన Homework:
                    </Text>
                    {pending.map(hw => {
                      const status  = getStatusInfo(hw);
                      const overdue = isOverdue(hw.dueDate);
                      const soon    = isDueSoon(hw.dueDate);
                      return (
                        <View key={hw.$id} style={[
                          styles.hwCard,
                          overdue && styles.hwCardOverdue,
                          soon    && styles.hwCardSoon,
                        ]}>
                          <Text style={styles.hwTitle}>{hw.title}</Text>

                          {hw.description ? (
                            <Text style={styles.hwDesc}>
                              {hw.description}
                            </Text>
                          ) : null}

                          <View style={[styles.statusBadge,
                            { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText,
                              { color: status.color }]}>
                              {status.label}
                            </Text>
                          </View>

                          {hw.dueDate && (
                            <Text style={[styles.hwDue, {
                              color: overdue ? '#e53935'
                                   : soon    ? '#f57c00'
                                   : '#388e3c'
                            }]}>
                              📅 గడువు: {hw.dueDate}
                            </Text>
                          )}

                          <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => handleMarkDone(hw)}>
                            {marking === hw.$id
                              ? <ActivityIndicator
                                  color="white" size="small" />
                              : <Text style={styles.doneBtnText}>
                                  ✓ Homework Done చేశాను
                                </Text>
                            }
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </>
                )}

                {/* Done */}
                {done.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      ✅ పూర్తయిన Homework:
                    </Text>
                    {done.map(hw => {
                      const status = getStatusInfo(hw);
                      return (
                        <View key={hw.$id}
                          style={[styles.hwCard, styles.hwCardDone]}>
                          <Text style={[styles.hwTitle, { color: '#666' }]}>
                            {hw.title}
                          </Text>
                          <View style={[styles.statusBadge,
                            { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText,
                              { color: status.color }]}>
                              {status.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </>
        }
      </ScrollView>
    </View>
  );
}

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white', borderRadius: 16, padding: 24,
    width: '80%', maxWidth: 320, alignItems: 'center', elevation: 10,
  },
  icon:    { fontSize: 36, marginBottom: 10 },
  title:   { fontSize: 17, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya' },
  message: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 18, fontFamily: 'SreeKrushnadevaraya' },
  btn:     { backgroundColor: '#00838f', paddingVertical: 11, paddingHorizontal: 40, borderRadius: 9 },
  btnText: { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: '#00838f', padding: 20, paddingTop: 50 },
  backBtn:      { marginBottom: 5 },
  backBtnText:  { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle:  { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub:    { fontSize: 14, color: '#b2ebf2', fontFamily: 'BalooTammudu2' },
  content:      { flex: 1, padding: 15 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryCard:  { width: '31%', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  summaryNum:   { fontSize: 28, fontWeight: 'bold', color: '#333', fontFamily: 'BalooTammudu2' },
  summaryLabel: { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  emptyBox:     { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center', elevation: 1 },
  emptyIcon:    { fontSize: 40, marginBottom: 10 },
  emptyText:    { fontSize: 16, color: '#333', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  emptyNote:    { fontSize: 13, color: '#f57c00', fontFamily: 'SreeKrushnadevaraya', marginTop: 8, textAlign: 'center' },
  hwCard:       { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#388e3c' },
  hwCardSoon:   { borderLeftColor: '#f57c00' },
  hwCardOverdue:{ borderLeftColor: '#e53935' },
  hwCardDone:   { borderLeftColor: '#bdbdbd', opacity: 0.85 },
  hwTitle:      { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 6 },
  hwDesc:       { fontSize: 14, color: '#666', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  statusBadge:  { borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  statusText:   { fontSize: 13, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  hwDue:        { fontSize: 13, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya', marginBottom: 10 },
  doneBtn:      { backgroundColor: '#00838f', padding: 12, borderRadius: 8, alignItems: 'center' },
  doneBtnText:  { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});