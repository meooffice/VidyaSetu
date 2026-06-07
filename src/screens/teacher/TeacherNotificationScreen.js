import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { createNotification } from '../../services/notifications';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ✅ Custom Alert Modal — alert() కి replacement
function CustomAlert({ visible, type, title, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
          </Text>
          <Text style={modalStyles.title}>{title}</Text>
          {message ? <Text style={modalStyles.message}>{message}</Text> : null}
          <TouchableOpacity style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>సరే</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'SreeKrushnadevaraya',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: 'SreeKrushnadevaraya',
  },
  btn: {
    backgroundColor: '#6a1b9a',
    paddingVertical: 11,
    paddingHorizontal: 40,
    borderRadius: 9,
    marginTop: 4,
  },
  btnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});

// ✅ Main TeacherNotificationScreen
export default function TeacherNotificationScreen({ onBack }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedParents, setSelectedParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [sendMode, setSendMode] = useState('all');

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (type, title, message = '') => {
    setAlert({ visible: true, type, title, message });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  const notifTypes = [
    { key: 'attendance', label: '📅 హాజరు', color: '#388e3c' },
    { key: 'grade',      label: '📊 Grade',  color: '#f57c00' },
    { key: 'homework',   label: '📋 Homework', color: '#1565c0' },
    { key: 'general',    label: '🔔 General', color: '#6a1b9a' },
  ];

  const quickMessages = [
    { title: 'హాజరు హెచ్చరిక',    body: 'మీ పిల్లవాడు ఈరోజు school కి రాలేదు',     type: 'attendance' },
    { title: 'Homework గుర్తుచేయడం', body: 'రేపటి లోపు homework submit చేయండి',       type: 'homework' },
    { title: 'పరీక్ష ఫలితం',       body: 'మీ పిల్లవాడి పరీక్ష ఫలితం వచ్చింది',       type: 'grade' },
    { title: 'Parent Meeting',      body: 'రేపు తల్లిదండ్రుల సమావేశం ఉంది',           type: 'general' },
  ];

  useEffect(() => { loadParents(); }, []);

  const loadParents = async () => {
    setLoadingParents(true);
    try {
      const result = await databases.listDocuments(DB, C.users, [Query.equal('role', 'parent')]);
      setParents(result.documents);
    } catch (e) {
      console.log('loadParents error:', e.message);
    }
    setLoadingParents(false);
  };

  const toggleParent = (parentId) => {
    setSelectedParents(prev =>
      prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    );
  };

  const handleSend = async () => {
    if (!title || !body) {
      showAlert('error', 'లోపం', 'శీర్షిక మరియు సందేశం రాయండి!');
      return;
    }
    if (parents.length === 0) {
      showAlert('warning', 'తల్లిదండ్రులు లేరు!', 'Admin parents add చేయండి.');
      return;
    }

    const recipients = sendMode === 'all'
      ? parents
      : parents.filter(p => selectedParents.includes(p.$id));

    if (recipients.length === 0) {
      showAlert('warning', 'ఎవరూ Select కాలేదు', 'తల్లిదండ్రులను select చేయండి!');
      return;
    }

    setSaving(true);
    let sentCount = 0;

    for (const parent of recipients) {
      const result = await createNotification(parent.$id, title, body, type);
      if (result.success) sentCount++;
      await new Promise(r => setTimeout(r, 200));
    }

    setSaving(false);
    showAlert('success', '✅ పంపబడింది!', `${sentCount} తల్లిదండ్రులకు Notification పంపబడింది!`);
    setSent(prev => [{ title, body, type, count: sentCount, time: new Date() }, ...prev]);
    setTitle('');
    setBody('');
    setSelectedParents([]);
  };

  const handleQuickMessage = (msg) => {
    setTitle(msg.title);
    setBody(msg.body);
    setType(msg.type);
  };

  return (
    <View style={styles.container}>
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notification పంపు</Text>
        <Text style={styles.headerSub}>{parents.length} తల్లిదండ్రులు</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Messages */}
        <Text style={styles.sectionTitle}>⚡ Quick Messages:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
          {quickMessages.map((msg, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} onPress={() => handleQuickMessage(msg)}>
              <Text style={styles.quickTitle}>{msg.title}</Text>
              <Text style={styles.quickBody} numberOfLines={2}>{msg.body}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Send Mode */}
        <View style={styles.sendModeRow}>
          <TouchableOpacity
            style={[styles.sendModeBtn, sendMode === 'all' && styles.sendModeBtnActive]}
            onPress={() => setSendMode('all')}>
            <Text style={[styles.sendModeBtnText, sendMode === 'all' && { color: 'white' }]}>
              👥 అందరికీ ({parents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendModeBtn, sendMode === 'selected' && styles.sendModeBtnActive]}
            onPress={() => setSendMode('selected')}>
            <Text style={[styles.sendModeBtnText, sendMode === 'selected' && { color: 'white' }]}>
              ✓ ఎంచుకున్నవారికి
            </Text>
          </TouchableOpacity>
        </View>

        {/* Parent Selection */}
        {sendMode === 'selected' && (
          <View style={styles.parentsBox}>
            <Text style={styles.parentsTitle}>తల్లిదండ్రులను select చేయండి:</Text>
            {loadingParents
              ? <ActivityIndicator color="#6a1b9a" />
              : parents.length === 0
                ? <Text style={styles.noParentsText}>తల్లిదండ్రులు లేరు</Text>
                : parents.map((parent) => (
                    <TouchableOpacity
                      key={parent.$id}
                      style={[styles.parentItem,
                        selectedParents.includes(parent.$id) && styles.parentItemSelected]}
                      onPress={() => toggleParent(parent.$id)}>
                      <View style={styles.parentAvatar}>
                        <Text style={styles.parentAvatarText}>
                          {parent.name?.charAt(0) || 'P'}
                        </Text>
                      </View>
                      <View style={styles.parentInfo}>
                        <Text style={styles.parentName}>{parent.name}</Text>
                        <Text style={styles.parentEmail}>{parent.email}</Text>
                      </View>
                      <Text style={styles.checkIcon}>
                        {selectedParents.includes(parent.$id) ? '✅' : '⬜'}
                      </Text>
                    </TouchableOpacity>
                  ))
            }
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>రకం ఎంచుకోండి:</Text>
          <View style={styles.typeRow}>
            {notifTypes.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, type === t.key && { backgroundColor: t.color }]}
                onPress={() => setType(t.key)}>
                <Text style={[styles.typeBtnText, type === t.key && { color: 'white' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>శీర్షిక:</Text>
          <TextInput
            style={styles.input}
            placeholder="Notification శీర్షిక"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>సందేశం:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="సందేశం రాయండి..."
            placeholderTextColor="#999"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            {saving
              ? <ActivityIndicator color="white" />
              : <Text style={styles.sendBtnText}>
                  📤 {sendMode === 'all'
                    ? `అందరికీ పంపు (${parents.length})`
                    : `${selectedParents.length} మందికి పంపు`}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Sent History */}
        {sent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📬 పంపిన సందేశాలు:</Text>
            {sent.map((s, i) => (
              <View key={i} style={styles.sentCard}>
                <View style={styles.sentHeader}>
                  <Text style={styles.sentTitle}>{s.title}</Text>
                  <Text style={styles.sentCount}>{s.count} మందికి</Text>
                </View>
                <Text style={styles.sentBody}>{s.body}</Text>
                <Text style={styles.sentTime}>{s.time.toLocaleTimeString('te-IN')}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6a1b9a', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#ce93d8', fontFamily: 'SreeKrushnadevaraya' },
  content: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  quickRow: { marginBottom: 15 },
  quickCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, marginRight: 10, width: 160, elevation: 2 },
  quickTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4, fontFamily: 'SreeKrushnadevaraya' },
  quickBody: { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  sendModeRow: { flexDirection: 'row', marginBottom: 15 },
  sendModeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 8, backgroundColor: 'white' },
  sendModeBtnActive: { backgroundColor: '#6a1b9a', borderColor: '#6a1b9a' },
  sendModeBtnText: { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  parentsBox: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 15, elevation: 1 },
  parentsTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  noParentsText: { fontSize: 14, color: '#999', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center', padding: 10 },
  parentItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 6, backgroundColor: '#f5f5f5' },
  parentItemSelected: { backgroundColor: '#ede7f6', borderWidth: 1, borderColor: '#6a1b9a' },
  parentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1565c0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  parentAvatarText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 15, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  parentEmail: { fontSize: 12, color: '#888', fontFamily: 'BalooTammudu2' },
  checkIcon: { fontSize: 20 },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, marginTop: 8, fontFamily: 'SreeKrushnadevaraya' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 6, marginBottom: 6 },
  typeBtnText: { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea: { height: 80, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#6a1b9a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  sendBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  sentCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#6a1b9a' },
  sentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sentTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', flex: 1 },
  sentCount: { fontSize: 12, color: '#6a1b9a', fontFamily: 'BalooTammudu2', fontWeight: 'bold' },
  sentBody: { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginTop: 3 },
  sentTime: { fontSize: 11, color: '#999', fontFamily: 'BalooTammudu2', marginTop: 4 },
});