import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import {
  postDoubt, getStudentDoubts, getDoubtsByChapter
} from '../../services/doubts';

// ✅ Custom Alert Modal — alert() కి replacement
function CustomAlert({ visible, type, title, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white', borderRadius: 16, padding: 24,
    width: '80%', maxWidth: 320, alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 17, fontWeight: 'bold', color: '#333',
    textAlign: 'center', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya',
  },
  message: {
    fontSize: 14, color: '#666', textAlign: 'center',
    lineHeight: 22, marginBottom: 18, fontFamily: 'SreeKrushnadevaraya',
  },
  btn: {
    backgroundColor: '#1565c0', paddingVertical: 11,
    paddingHorizontal: 40, borderRadius: 9, marginTop: 4,
  },
  btnText: {
    color: 'white', fontSize: 15, fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});

// ✅ Main StudentDoubtScreen
export default function StudentDoubtScreen({ chapter, onBack }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('my');

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (type, title, message = '') => {
    setAlert({ visible: true, type, title, message });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadDoubts(); }, [activeTab]);

  const loadDoubts = async () => {
    setLoading(true);
    const result = activeTab === 'my'
      ? await getStudentDoubts('student-id')
      : await getDoubtsByChapter(chapter.$id);
    if (result.success) setDoubts(result.data);
    setLoading(false);
  };

  const handlePostDoubt = async () => {
    if (!question.trim()) {
      showAlert('error', 'లోపం', 'సందేహం రాయండి!');
      return;
    }
    setSaving(true);
    const result = await postDoubt(question, 'student-id', chapter.$id);
    setSaving(false);
    if (result.success) {
      showAlert('success', '✅ సందేహం పంపబడింది!', 'Teacher approve చేసిన తర్వాత కనిపిస్తుంది.');
      setQuestion('');
      setShowForm(false);
      loadDoubts();
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return '#388e3c';
      case 'pending':  return '#f57c00';
      case 'rejected': return '#e53935';
      default:         return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'answered': return '✅ సమాధానం వచ్చింది';
      case 'pending':  return '⏳ Pending';
      case 'rejected': return '❌ తిరస్కరించబడింది';
      default:         return status;
    }
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
        <Text style={styles.headerTitle}>🤔 సందేహాలు</Text>
        <Text style={styles.headerSub}>{chapter.name}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}>
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            నా సందేహాలు
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]}
          onPress={() => setActiveTab('approved')}>
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>
            అందరి సందేహాలు
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>🤔 కొత్త సందేహం అడుగు</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>నీ సందేహం:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="నీ సందేహం ఇక్కడ రాయి..."
              placeholderTextColor="#999"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
            />
            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#1565c0" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handlePostDoubt}>
                      <Text style={styles.saveBtnText}>పంపు</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                      <Text style={styles.cancelBtnText}>రద్దు చేయి</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        )}

        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : doubts.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🤔</Text>
                <Text style={styles.emptyText}>ఇంకా సందేహాలు లేవు</Text>
                <Text style={styles.emptySub}>పై బటన్ నొక్కి సందేహం అడుగు!</Text>
              </View>
            : doubts.map((doubt) => (
                <View key={doubt.$id} style={styles.doubtCard}>
                  <View style={styles.questionBox}>
                    <Text style={styles.questionIcon}>🤔</Text>
                    <Text style={styles.questionText}>{doubt.question}</Text>
                  </View>
                  <Text style={[styles.statusText, { color: getStatusColor(doubt.status) }]}>
                    {getStatusLabel(doubt.status)}
                  </Text>
                  {doubt.answer && doubt.answer !== '' && (
                    <View style={styles.answerBox}>
                      <Text style={styles.answerIcon}>💡</Text>
                      <Text style={styles.answerText}>{doubt.answer}</Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>
                    {new Date(doubt.$createdAt).toLocaleDateString('te-IN')}
                  </Text>
                </View>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1565c0', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#bbdefb', fontFamily: 'SreeKrushnadevaraya' },
  tabs: { flexDirection: 'row', backgroundColor: 'white', elevation: 2 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1565c0' },
  tabText: { fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  tabTextActive: { color: '#1565c0', fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  addBtn: { backgroundColor: '#1565c0', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea: { height: 100, textAlignVertical: 'top', marginBottom: 10 },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#1565c0', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  emptyBox: { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center', elevation: 1 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginBottom: 5 },
  emptySub: { fontSize: 13, color: '#999', fontFamily: 'SreeKrushnadevaraya' },
  doubtCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  questionBox: { flexDirection: 'row', marginBottom: 8 },
  questionIcon: { fontSize: 20, marginRight: 8 },
  questionText: { fontSize: 16, color: '#333', flex: 1, lineHeight: 22, fontFamily: 'SreeKrushnadevaraya' },
  statusText: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, fontFamily: 'SreeKrushnadevaraya' },
  answerBox: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 12, flexDirection: 'row', marginBottom: 8 },
  answerIcon: { fontSize: 18, marginRight: 8 },
  answerText: { fontSize: 15, color: '#1b5e20', flex: 1, lineHeight: 22, fontFamily: 'SreeKrushnadevaraya' },
  dateText: { fontSize: 12, color: '#999', fontFamily: 'BalooTammudu2' },
});