import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal,   // ✅ Alert, Modal add చేశాను
} from 'react-native';
import {
  getAllDoubts, approveAndAnswerDoubt,
  rejectDoubt, deleteDoubt
} from '../../services/doubts';

export default function TeacherDoubtScreen({ onBack }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [answeringId, setAnsweringId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  // ✅ Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    message: '',
    onConfirm: null,
  });

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ visible: true, message, onConfirm });
  };

  const handleConfirmYes = () => {
    const fn = confirmModal.onConfirm;
    setConfirmModal({ visible: false, message: '', onConfirm: null });
    if (fn) fn();
  };

  const handleConfirmNo = () => {
    setConfirmModal({ visible: false, message: '', onConfirm: null });
  };

  useEffect(() => {
    loadDoubts();
  }, []);

  const loadDoubts = async () => {
    setLoading(true);
    const result = await getAllDoubts();
    if (result.success) setDoubts(result.data);
    setLoading(false);
  };

  const filteredDoubts = doubts.filter(d => {
    if (activeTab === 'pending') return d.status === 'pending';
    if (activeTab === 'answered') return d.status === 'answered';
    return true;
  });

  const handleAnswer = async (doubtId) => {
    if (!answer.trim()) {
      Alert.alert('సందేశం', 'సమాధానం రాయండి!'); // ✅ fixed
      return;
    }
    setSaving(true);
    const result = await approveAndAnswerDoubt(doubtId, answer, 'teacher-id');
    setSaving(false);
    if (result.success) {
      Alert.alert('✅ పంపబడింది!', 'సమాధానం విద్యార్థికి పంపబడింది.'); // ✅ fixed
      setAnswer('');
      setAnsweringId(null);
      // ✅ direct state update — వెంటనే UI లో కనిపిస్తుంది
      setDoubts(prev =>
        prev.map(d =>
          d.$id === doubtId
            ? { ...d, status: 'answered', answer }
            : d
        )
      );
    } else {
      Alert.alert('Error', result.error); // ✅ fixed
    }
  };

  const handleReject = (doubtId) => {
    // ✅ window.confirm() తొలగించి showConfirm() వాడాం
    showConfirm('ఈ సందేహం తిరస్కరించాలా?', async () => {
      const result = await rejectDoubt(doubtId);
      if (result.success) {
        // ✅ direct state update
        setDoubts(prev =>
          prev.map(d =>
            d.$id === doubtId ? { ...d, status: 'rejected' } : d
          )
        );
      } else {
        Alert.alert('Error', result.error); // ✅ fixed
      }
    });
  };

  const handleDelete = (doubtId) => {
    // ✅ window.confirm() తొలగించి showConfirm() వాడాం
    showConfirm('ఈ సందేహం డిలీట్ చేయాలా?', async () => {
      const result = await deleteDoubt(doubtId);
      if (result.success) {
        // ✅ direct state update
        setDoubts(prev => prev.filter(d => d.$id !== doubtId));
      } else {
        Alert.alert('Error', result.error); // ✅ fixed
      }
    });
  };

  const pendingCount = doubts.filter(d => d.status === 'pending').length;

  return (
    <View style={styles.container}>

      {/* ✅ Custom Confirm Modal */}
      <Modal
        transparent
        visible={confirmModal.visible}
        animationType="fade"
        onRequestClose={handleConfirmNo}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmMessage}>{confirmModal.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmBtnNo} onPress={handleConfirmNo}>
                <Text style={styles.confirmBtnNoText}>వద్దు</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtnYes} onPress={handleConfirmYes}>
                <Text style={styles.confirmBtnYesText}>అవును</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🤔 సందేహాల నిర్వహణ</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>Doubt Management</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['pending', 'answered', 'all'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'pending' ? `⏳ Pending (${pendingCount})`
               : tab === 'answered' ? '✅ Answered'
               : '📋 అన్నీ'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : filteredDoubts.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>సందేహాలు లేవు</Text>
              </View>
            : filteredDoubts.map((doubt) => (
                <View key={doubt.$id} style={styles.doubtCard}>
                  {/* Question */}
                  <View style={styles.questionBox}>
                    <Text style={styles.questionIcon}>🤔</Text>
                    <View style={styles.questionContent}>
                      <Text style={styles.questionText}>{doubt.question}</Text>
                      <Text style={styles.dateText}>
                        {new Date(doubt.$createdAt).toLocaleDateString('te-IN')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(doubt.$id)}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Existing Answer */}
                  {doubt.answer && doubt.answer !== '' && (
                    <View style={styles.existingAnswer}>
                      <Text style={styles.existingAnswerIcon}>💡</Text>
                      <Text style={styles.existingAnswerText}>{doubt.answer}</Text>
                    </View>
                  )}

                  {/* Answer Form */}
                  {answeringId === doubt.$id && (
                    <View style={styles.answerForm}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="సమాధానం రాయండి..."
                        placeholderTextColor="#999"
                        value={answer}
                        onChangeText={setAnswer}
                        multiline
                        numberOfLines={3}
                        autoFocus
                      />
                      <View style={styles.answerBtns}>
                        {saving
                          ? <ActivityIndicator color="#1565c0" />
                          : <>
                              <TouchableOpacity
                                style={styles.sendBtn}
                                onPress={() => handleAnswer(doubt.$id)}>
                                <Text style={styles.sendBtnText}>✅ పంపు</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { setAnsweringId(null); setAnswer(''); }}>
                                <Text style={styles.cancelBtnText}>రద్దు</Text>
                              </TouchableOpacity>
                            </>
                        }
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  {doubt.status === 'pending' && answeringId !== doubt.$id && (
                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        style={styles.answerBtn}
                        onPress={() => {
                          setAnsweringId(doubt.$id);
                          setAnswer('');
                        }}>
                        <Text style={styles.answerBtnText}>💡 సమాధానం ఇవ్వు</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(doubt.$id)}>
                        <Text style={styles.rejectBtnText}>❌ తిరస్కరించు</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Status Badge */}
                  <Text style={[styles.statusBadge, {
                    color: doubt.status === 'answered' ? '#388e3c'
                         : doubt.status === 'pending' ? '#f57c00'
                         : '#e53935'
                  }]}>
                    {doubt.status === 'answered' ? '✅ సమాధానం ఇవ్వబడింది'
                     : doubt.status === 'pending' ? '⏳ సమాధానం కోసం వేచి ఉంది'
                     : '❌ తిరస్కరించబడింది'}
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  badge: { backgroundColor: '#e53935', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 8, paddingHorizontal: 6 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  headerSub: { fontSize: 14, color: '#bbdefb', fontFamily: 'BalooTammudu2' },

  // ✅ Confirm Modal Styles
  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  confirmBox: {
    backgroundColor: 'white', borderRadius: 16,
    padding: 24, width: '100%', alignItems: 'center', elevation: 10,
  },
  confirmIcon: { fontSize: 36, marginBottom: 10 },
  confirmMessage: {
    fontSize: 17, color: '#333', textAlign: 'center',
    marginBottom: 20, fontFamily: 'SreeKrushnadevaraya',
  },
  confirmButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBtnNo: {
    flex: 1, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  confirmBtnNoText: { fontSize: 15, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  confirmBtnYes: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: '#e53935', alignItems: 'center',
  },
  confirmBtnYesText: { fontSize: 15, color: 'white', fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  tabs: { flexDirection: 'row', backgroundColor: 'white', elevation: 2 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1565c0' },
  tabText: { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  tabTextActive: { color: '#1565c0', fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  emptyBox: { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  doubtCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  questionBox: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  questionIcon: { fontSize: 20, marginRight: 8 },
  questionContent: { flex: 1 },
  questionText: { fontSize: 16, color: '#333', lineHeight: 22, fontFamily: 'SreeKrushnadevaraya' },
  dateText: { fontSize: 12, color: '#999', marginTop: 4, fontFamily: 'BalooTammudu2' },
  deleteIcon: { fontSize: 18 },
  existingAnswer: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 10, flexDirection: 'row', marginBottom: 10 },
  existingAnswerIcon: { fontSize: 16, marginRight: 6 },
  existingAnswerText: { fontSize: 14, color: '#1b5e20', flex: 1, fontFamily: 'SreeKrushnadevaraya' },
  answerForm: { marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea: { height: 80, textAlignVertical: 'top', marginBottom: 8 },
  answerBtns: { flexDirection: 'row' },
  sendBtn: { backgroundColor: '#388e3c', padding: 10, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  sendBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  actionBtns: { flexDirection: 'row', marginBottom: 8 },
  answerBtn: { backgroundColor: '#1565c0', padding: 10, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  answerBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  rejectBtn: { backgroundColor: '#ffebee', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#e53935' },
  rejectBtnText: { color: '#e53935', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  statusBadge: { fontSize: 13, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});