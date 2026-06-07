import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal
} from 'react-native';
import { getNotesByChapter } from '../../services/notes';
import { saveNoteOffline, getOfflineNotes } from '../../services/offlineDB';
import Watermark from '../../components/Watermark';

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
    backgroundColor: '#388e3c', paddingVertical: 11,
    paddingHorizontal: 40, borderRadius: 9, marginTop: 4,
  },
  btnText: {
    color: 'white', fontSize: 15, fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});

// ✅ Main StudentNotesScreen
export default function StudentNotesScreen({ chapter, onBack }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [savingOffline, setSavingOffline] = useState(null);

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (type, title, message = '') => {
    setAlert({ visible: true, type, title, message });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    setLoading(true);
    const onlineResult = await getNotesByChapter(chapter.$id);
    if (onlineResult.success) {
      setNotes(onlineResult.data);
      setIsOffline(false);
    } else {
      const offlineResult = await getOfflineNotes(chapter.$id);
      if (offlineResult.success) {
        setNotes(offlineResult.data);
        setIsOffline(true);
      }
    }
    setLoading(false);
  };

  const handleSaveOffline = async (note) => {
    setSavingOffline(note.$id || note.id);
    const result = await saveNoteOffline(note);
    setSavingOffline(null);
    if (result.success) {
      showAlert('success', '✅ నోట్ సేవ్ అయింది!', 'Offline కోసం సేవ్ చేయబడింది!');
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  // Note చదివే screen
  if (selectedNote) {
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
          <TouchableOpacity onPress={() => setSelectedNote(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← వెనక్కి</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedNote.title}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.noteContent}>
            <Text style={styles.noteText}>{selectedNote.content}</Text>
          </ScrollView>
          <Watermark userName="Student" userId="student-id" />
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>📖 {chapter.name}</Text>
        <Text style={styles.headerSub}>
          {isOffline ? '📴 Offline Mode' : '🌐 Online'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#388e3c" size="large" style={{ marginTop: 30 }} />
          : notes.length === 0
            ? <Text style={styles.emptyText}>ఇంకా నోట్స్ లేవు</Text>
            : notes.map((note) => (
                <View key={note.$id || note.id} style={styles.noteCard}>
                  <TouchableOpacity style={styles.noteMain} onPress={() => setSelectedNote(note)}>
                    <Text style={styles.noteIcon}>📄</Text>
                    <View style={styles.noteInfo}>
                      <Text style={styles.noteTitle}>{note.title}</Text>
                      <Text style={styles.notePreview} numberOfLines={2}>
                        {note.content}
                      </Text>
                    </View>
                    <Text style={styles.noteArrow}>›</Text>
                  </TouchableOpacity>

                  {!isOffline && (
                    <TouchableOpacity
                      style={styles.offlineBtn}
                      onPress={() => handleSaveOffline(note)}>
                      {savingOffline === note.$id
                        ? <ActivityIndicator color="#388e3c" size="small" />
                        : <Text style={styles.offlineBtnText}>💾 Offline సేవ్</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              ))
        }

        {!isOffline && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 "Offline సేవ్" నొక్కితే — internet లేకున్నా చదవగలరు!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#388e3c', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#c8e6c9', fontFamily: 'SreeKrushnadevaraya' },
  offlineBadge: { color: '#ffeb3b', fontSize: 14, fontFamily: 'SreeKrushnadevaraya' },
  content: { flex: 1, padding: 15 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 30, fontFamily: 'SreeKrushnadevaraya' },
  noteCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  noteMain: { padding: 15, flexDirection: 'row', alignItems: 'center' },
  noteIcon: { fontSize: 28, marginRight: 12 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  notePreview: { fontSize: 14, color: '#666', marginTop: 4, fontFamily: 'SreeKrushnadevaraya' },
  noteArrow: { fontSize: 24, color: '#388e3c', fontWeight: 'bold' },
  offlineBtn: { backgroundColor: '#e8f5e9', padding: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#c8e6c9' },
  offlineBtnText: { color: '#388e3c', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  noteContent: { flex: 1, padding: 20 },
  noteText: { fontSize: 18, color: '#333', lineHeight: 28, fontFamily: 'SreeKrushnadevaraya' },
  infoBox: { backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 20 },
  infoText: { fontSize: 14, color: '#1565c0', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
});