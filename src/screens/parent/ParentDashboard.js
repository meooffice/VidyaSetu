import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal
} from 'react-native';
import { getStudentAttendance, calculateAttendanceStats } from '../../services/attendance';
import { getStudentSubmissions, getGrade } from '../../services/grading';
import { getUserNotifications, markAllRead } from '../../services/notifications';
import { parentConfirmHomework } from '../../services/homework';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';
import ParentMessagingScreen from './ParentMessagingScreen';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

function AlertModal({ visible, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.message}>{message}</Text>
          <TouchableOpacity style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>సరే</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ParentDashboard({ onLogout, userId }) {
  const [loading,        setLoading]        = useState(true);
  const [attendance,     setAttendance]     = useState(null);
  const [submissions,    setSubmissions]    = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [currentScreen,  setCurrentScreen]  = useState('dashboard');
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [homeworkPending,setHomeworkPending]= useState([]);
  const [linkedStudent,  setLinkedStudent]  = useState(null);
  const [confirmingHw,   setConfirmingHw]   = useState(null);
  const [alertMsg,       setAlertMsg]       = useState('');
  const [alertVisible,   setAlertVisible]   = useState(false);

  const showAlert = (msg) => { setAlertMsg(msg); setAlertVisible(true); };

  useEffect(() => {
    if (userId) {
      console.log('Parent userId:', userId);
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Notifications
      const notifResult = await getUserNotifications(userId);
      if (notifResult.success) {
        setNotifications(notifResult.data);
        setUnreadCount(notifResult.data.filter(n => !n.isRead).length);
      }

      // 2. Linked Student
      const studentResult = await databases.listDocuments(
        DB, C.users,
        [Query.equal('parentId', userId)]
      );

      if (studentResult.documents.length === 0) {
        console.log('No student linked to parent');
        setLoading(false);
        return;
      }

      const student = studentResult.documents[0];
      setLinkedStudent(student);
      console.log('Linked student:', student.name, '| classId:', student.classId);

      await new Promise(r => setTimeout(r, 300));

      // 3. Attendance
      const attResult = await getStudentAttendance(student.$id);
      if (attResult.success) {
        setAttendance(calculateAttendanceStats(attResult.data));
      }

      await new Promise(r => setTimeout(r, 300));

      // 4. Submissions
      const subResult = await getStudentSubmissions(student.$id);
      if (subResult.success) setSubmissions(subResult.data);

      await new Promise(r => setTimeout(r, 300));

      // 5. Homework pending — homework_status table నుండి
      if (student.classId) {
        const statusResult = await databases.listDocuments(
          DB, C.homeworkStatus,
          [Query.equal('studentId', student.$id),
           Query.equal('status', 'done'),
           Query.limit(50)]
        );

        console.log('Pending status docs:', statusResult.documents.length);

        const pendingItems = [];
        for (const statusDoc of statusResult.documents) {
          try {
            const hw = await databases.getDocument(
              DB, C.homework, statusDoc.homeworkId
            );
            pendingItems.push({
              ...hw,
              statusDocId: statusDoc.$id,
              linkedStudentId: student.$id,
            });
            await new Promise(r => setTimeout(r, 200));
          } catch (e) {
            console.log('hw fetch error:', e.message);
          }
        }

        console.log('Homework pending confirmation:', pendingItems.length);
        setHomeworkPending(pendingItems);
      }
    } catch (e) {
      console.log('loadData error:', e.message);
    }
    setLoading(false);
  };

  const avgScore = submissions.length > 0
    ? Math.round(
        submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      )
    : 0;
  const grade = getGrade(avgScore);

  // Screens
  if (currentScreen === 'notifications') {
    return (
      <ParentNotificationsScreen
        notifications={notifications}
        onBack={() => {
          setCurrentScreen('dashboard');
          markAllRead(userId);
          setUnreadCount(0);
        }}
      />
    );
  }

  if (currentScreen === 'messaging') {
    return (
      <ParentMessagingScreen
        onBack={() => setCurrentScreen('dashboard')}
        userId={userId}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <AlertModal
        visible={alertVisible}
        message={alertMsg}
        onClose={() => setAlertVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔵 తల్లిదండ్రుల డాష్‌బోర్డ్</Text>
        {linkedStudent && (
          <Text style={styles.headerSub}>👨‍🎓 {linkedStudent.name}</Text>
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setCurrentScreen('notifications')}>
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabel}>నోటిఫికేషన్లు</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setCurrentScreen('messaging')}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>టీచర్ తో మాట్లాడు</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onLogout}>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionLabel}>లాగ్ అవుట్</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading
        ? <ActivityIndicator
            color="#1565c0" size="large" style={{ marginTop: 50 }} />
        : !linkedStudent
          ? <View style={styles.noStudentBox}>
              <Text style={styles.noStudentIcon}>⚠️</Text>
              <Text style={styles.noStudentText}>Student link కాలేదు!</Text>
              <Text style={styles.noStudentNote}>
                Admin → విద్యార్థి screen లో మీ account student తో
                link చేయమని అడగండి
              </Text>
            </View>
          : <>
              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>👨‍🎓 పిల్లవాడి సారాంశం</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, {
                      color: (attendance?.percentage || 0) >= 75
                        ? '#388e3c' : '#e53935'
                    }]}>
                      {attendance?.percentage || 0}%
                    </Text>
                    <Text style={styles.summaryLabel}>📅 హాజరు</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: grade.color }]}>
                      {grade.letter}
                    </Text>
                    <Text style={styles.summaryLabel}>📊 Grade</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: '#1565c0' }]}>
                      {avgScore}
                    </Text>
                    <Text style={styles.summaryLabel}>⭐ సగటు</Text>
                  </View>
                </View>
              </View>

              {/* Attendance Warning */}
              {(attendance?.percentage || 0) < 75 && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>హాజరు హెచ్చరిక!</Text>
                    <Text style={styles.alertText}>
                      హాజరు {attendance?.percentage}% మాత్రమే!
                    </Text>
                  </View>
                </View>
              )}

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={[styles.quickCard, { backgroundColor: '#e8f5e9' }]}>
                  <Text style={styles.quickIcon}>✅</Text>
                  <Text style={[styles.quickNum, { color: '#388e3c' }]}>
                    {attendance?.present || 0}
                  </Text>
                  <Text style={styles.quickLabel}>Present</Text>
                </View>
                <View style={[styles.quickCard, { backgroundColor: '#ffebee' }]}>
                  <Text style={styles.quickIcon}>❌</Text>
                  <Text style={[styles.quickNum, { color: '#e53935' }]}>
                    {attendance?.absent || 0}
                  </Text>
                  <Text style={styles.quickLabel}>Absent</Text>
                </View>
                <View style={[styles.quickCard, { backgroundColor: '#e3f2fd' }]}>
                  <Text style={styles.quickIcon}>📝</Text>
                  <Text style={[styles.quickNum, { color: '#1565c0' }]}>
                    {submissions.length}
                  </Text>
                  <Text style={styles.quickLabel}>Tests</Text>
                </View>
              </View>

              {/* Recent Results */}
              {submissions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📊 ఇటీవలి పరీక్ష ఫలితాలు:</Text>
                  {submissions.slice(0, 3).map((sub, i) => {
                    const g = getGrade(sub.score || 0);
                    return (
                      <View key={sub.$id} style={styles.scoreCard}>
                        <View style={[styles.gradeCircle,
                          { backgroundColor: g.color }]}>
                          <Text style={styles.gradeLetter}>{g.letter}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scoreName}>
                            {sub.quizId ? 'Quiz' : 'Test'} #{i + 1}
                          </Text>
                          <Text style={styles.scoreDate}>
                            {new Date(sub.submittedAt).toLocaleDateString('te-IN')}
                          </Text>
                        </View>
                        <Text style={[styles.scoreNum, { color: g.color }]}>
                          {sub.score}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Homework Confirmation */}
              {homeworkPending.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📋 Homework Confirm చేయండి ({homeworkPending.length}):
                  </Text>
                  {homeworkPending.map(hw => (
                    <View key={hw.$id} style={hwStyles.card}>
                      <Text style={hwStyles.title}>{hw.title}</Text>
                      {hw.description ? (
                        <Text style={hwStyles.desc}>{hw.description}</Text>
                      ) : null}
                      <Text style={hwStyles.note}>
                        🎓 పిల్లవాడు homework పూర్తి చేశారు — confirm చేయండి!
                      </Text>
                      <View style={hwStyles.btnRow}>
                        {confirmingHw === hw.$id
                          ? <ActivityIndicator color="#388e3c" />
                          : <>
                              <TouchableOpacity
                                style={hwStyles.confirmBtn}
                                onPress={async () => {
                                  setConfirmingHw(hw.$id);
                                  const result = await parentConfirmHomework(
                                    hw.statusDocId,
                                    true,
                                    hw.teacherId || ''
                                  );
                                  setConfirmingHw(null);
                                  if (result.success) {
                                    setHomeworkPending(prev =>
                                      prev.filter(h => h.$id !== hw.$id)
                                    );
                                    showAlert('✅ Homework Confirmed!');
                                  } else {
                                    showAlert('Error: ' + result.error);
                                  }
                                }}>
                                <Text style={hwStyles.confirmBtnText}>
                                  ✅ Confirm చేయి
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={hwStyles.rejectBtn}
                                onPress={async () => {
                                  setConfirmingHw(hw.$id);
                                  const result = await parentConfirmHomework(
                                    hw.statusDocId,
                                    false,
                                    hw.teacherId || ''
                                  );
                                  setConfirmingHw(null);
                                  if (result.success) {
                                    setHomeworkPending(prev =>
                                      prev.filter(h => h.$id !== hw.$id)
                                    );
                                    showAlert('❌ Rejected — పిల్లవాడికి చెప్పండి!');
                                  } else {
                                    showAlert('Error: ' + result.error);
                                  }
                                }}>
                                <Text style={hwStyles.rejectBtnText}>
                                  ❌ Done కాలేదు
                                </Text>
                              </TouchableOpacity>
                            </>
                        }
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
      }
    </ScrollView>
  );
}

// Notifications Screen
function ParentNotificationsScreen({ notifications, onBack }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'attendance': return '📅';
      case 'grade':      return '📊';
      case 'homework':   return '📋';
      default:           return '🔔';
    }
  };
  return (
    <View style={notifStyles.container}>
      <View style={notifStyles.header}>
        <TouchableOpacity onPress={onBack} style={notifStyles.backBtn}>
          <Text style={notifStyles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={notifStyles.headerTitle}>🔔 నోటిఫికేషన్లు</Text>
      </View>
      <ScrollView style={notifStyles.content}>
        {notifications.length === 0
          ? <View style={notifStyles.emptyBox}>
              <Text style={notifStyles.emptyIcon}>🔔</Text>
              <Text style={notifStyles.emptyText}>నోటిఫికేషన్లు లేవు</Text>
            </View>
          : notifications.map(n => (
              <View key={n.$id} style={[
                notifStyles.card,
                !n.isRead && notifStyles.cardUnread
              ]}>
                <Text style={notifStyles.icon}>{getTypeIcon(n.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={notifStyles.title}>{n.title}</Text>
                  <Text style={notifStyles.body}>{n.body}</Text>
                  <Text style={notifStyles.date}>
                    {new Date(n.createdAt).toLocaleDateString('te-IN')}
                  </Text>
                </View>
                {!n.isRead && <View style={notifStyles.dot} />}
              </View>
            ))
        }
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { backgroundColor: '#1565c0', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub:      { fontSize: 13, color: '#bbdefb', fontFamily: 'SreeKrushnadevaraya', marginBottom: 10 },
  headerActions:  { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
  actionBtn:      { alignItems: 'center', flex: 1, position: 'relative' },
  actionIcon:     { fontSize: 24 },
  actionLabel:    { fontSize: 10, color: '#bbdefb', fontFamily: 'SreeKrushnadevaraya', marginTop: 3, textAlign: 'center' },
  badge:          { position: 'absolute', top: -4, right: 10, backgroundColor: '#e53935', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:      { color: 'white', fontSize: 10, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  noStudentBox:   { backgroundColor: 'white', margin: 20, borderRadius: 15, padding: 30, alignItems: 'center', elevation: 2 },
  noStudentIcon:  { fontSize: 40, marginBottom: 10 },
  noStudentText:  { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  noStudentNote:  { fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center', lineHeight: 22 },
  summaryCard:    { backgroundColor: 'white', margin: 15, borderRadius: 15, padding: 20, elevation: 3 },
  summaryTitle:   { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem:    { alignItems: 'center' },
  summaryNum:     { fontSize: 32, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  summaryLabel:   { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  divider:        { width: 1, height: 50, backgroundColor: '#e0e0e0' },
  alertBox:       { backgroundColor: '#fff3e0', marginHorizontal: 15, marginBottom: 15, borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#f57c00' },
  alertIcon:      { fontSize: 24, marginRight: 12 },
  alertTitle:     { fontSize: 16, fontWeight: 'bold', color: '#e65100', fontFamily: 'SreeKrushnadevaraya' },
  alertText:      { fontSize: 14, color: '#bf360c', fontFamily: 'SreeKrushnadevaraya', marginTop: 3 },
  quickStats:     { flexDirection: 'row', paddingHorizontal: 15, justifyContent: 'space-between', marginBottom: 15 },
  quickCard:      { width: '31%', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  quickIcon:      { fontSize: 20, marginBottom: 5 },
  quickNum:       { fontSize: 24, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  quickLabel:     { fontSize: 11, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  section:        { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  sectionTitle:   { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'SreeKrushnadevaraya' },
  scoreCard:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  gradeCircle:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gradeLetter:    { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  scoreName:      { fontSize: 15, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  scoreDate:      { fontSize: 12, color: '#999', fontFamily: 'BalooTammudu2' },
  scoreNum:       { fontSize: 20, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
});

const hwStyles = StyleSheet.create({
  card:           { backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#f57c00' },
  title:          { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 4 },
  desc:           { fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginBottom: 6 },
  note:           { fontSize: 13, color: '#f57c00', fontFamily: 'SreeKrushnadevaraya', marginBottom: 10 },
  btnRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn:     { backgroundColor: '#388e3c', padding: 10, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  rejectBtn:      { backgroundColor: '#ffebee', padding: 10, borderRadius: 8, flex: 1, borderWidth: 1, borderColor: '#e53935', alignItems: 'center' },
  rejectBtnText:  { color: '#e53935', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});

const notifStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { backgroundColor: '#1565c0', padding: 20, paddingTop: 50 },
  backBtn:     { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  content:     { flex: 1, padding: 15 },
  emptyBox:    { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center' },
  emptyIcon:   { fontSize: 40, marginBottom: 10 },
  emptyText:   { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  card:        { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  cardUnread:  { backgroundColor: '#e3f2fd', borderLeftWidth: 3, borderLeftColor: '#1565c0' },
  icon:        { fontSize: 24, marginRight: 12 },
  title:       { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 4 },
  body:        { fontSize: 14, color: '#555', fontFamily: 'SreeKrushnadevaraya', lineHeight: 20 },
  date:        { fontSize: 12, color: '#999', fontFamily: 'BalooTammudu2', marginTop: 4 },
  dot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1565c0', marginLeft: 8, marginTop: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  box:     { backgroundColor: 'white', borderRadius: 16, padding: 28, marginHorizontal: 40, alignItems: 'center', elevation: 10, minWidth: 260 },
  message: { fontSize: 17, color: '#333', textAlign: 'center', fontFamily: 'SreeKrushnadevaraya', lineHeight: 26, marginBottom: 20 },
  btn:     { backgroundColor: '#1565c0', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});