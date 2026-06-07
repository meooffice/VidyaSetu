import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { createTextNote, getNotesByChapter, deleteNote } from '../../services/notes';

// ✅ Custom Alert Modal — Alert.alert() కి replacement (Web లో కూడా పని చేస్తుంది)
function CustomAlert({ visible, type, title, message, buttons, onClose }) {
  if (!visible) return null;

  const isConfirm = buttons && buttons.length > 1;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'confirm' ? '⚠️' : 'ℹ️'}
          </Text>
          <Text style={modalStyles.title}>{title}</Text>
          {message ? <Text style={modalStyles.message}>{message}</Text> : null}
          <View style={[modalStyles.btnRow, isConfirm && { justifyContent: 'space-between' }]}>
            {buttons ? buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  modalStyles.btn,
                  btn.style === 'destructive' && modalStyles.btnDestructive,
                  btn.style === 'cancel' && modalStyles.btnCancel,
                  !btn.style && modalStyles.btnPrimary,
                ]}
                onPress={() => { onClose(); btn.onPress && btn.onPress(); }}
              >
                <Text style={[
                  modalStyles.btnText,
                  btn.style === 'cancel' && modalStyles.btnCancelText,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnPrimary]} onPress={onClose}>
                <Text style={modalStyles.btnText}>సరే</Text>
              </TouchableOpacity>
            )}
          </View>
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
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 18,
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
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#f57c00' },
  btnDestructive: { backgroundColor: '#e53935' },
  btnCancel: { backgroundColor: '#f0f0f0' },
  btnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  btnCancelText: { color: '#555' },
});

// ✅ Main NotesScreen
export default function NotesScreen({ chapter, onBack }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '', buttons: null,
  });

  const showAlert = (type, title, message, buttons = null) => {
    setAlert({ visible: true, type, title, message, buttons });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    setLoading(true);
    const result = await getNotesByChapter(chapter.$id);
    if (result.success) {
      setNotes(result.data);
    } else {
      showAlert('error', 'Error', result.error);
    }
    setLoading(false);
  };

  const handleSaveNote = async () => {
    if (!title || !content) {
      showAlert('error', 'Error', 'శీర్షిక మరియు విషయం రాయండి');
      return;
    }
    setSaving(true);
    const result = await createTextNote(title, content, chapter.$id, 'teacher-id');
    setSaving(false);
    if (result.success) {
      showAlert('success', '✅ సేవ్ అయింది!', 'నోట్ విజయవంతంగా సేవ్ అయింది');
      setTitle('');
      setContent('');
      setShowForm(false);
      loadNotes();
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  const handleDeleteNote = (noteId) => {
    showAlert('confirm', 'నోట్ డిలీట్ చేయాలా?', 'ఈ నోట్ శాశ్వతంగా తొలగించబడుతుంది!', [
      { text: 'రద్దు చేయి', style: 'cancel' },
      {
        text: 'డిలీట్ చేయి',
        style: 'destructive',
        onPress: async () => {
          setDeleting(noteId);
          const result = await deleteNote(noteId);
          setDeleting(null);
          if (result.success) {
            setNotes(prev => prev.filter(n => n.$id !== noteId));
            showAlert('success', '✅ డిలీట్ అయింది!', '');
          } else {
            showAlert('error', 'Error', result.error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={closeAlert}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 {chapter.name}</Text>
        <Text style={styles.headerSub}>నోట్స్ నిర్వహణ</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త నోట్ రాయి</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త నోట్:</Text>
            <TextInput
              style={styles.input}
              placeholder="శీర్షిక రాయండి"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="విషయం రాయండి..."
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
            />
            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#1a73e8" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                      <Text style={styles.saveBtnText}>సేవ్ చేయి</Text>
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
          ? <ActivityIndicator color="#f57c00" size="large" style={{ marginTop: 30 }} />
          : notes.length === 0
            ? <Text style={styles.emptyText}>ఇంకా నోట్స్ లేవు</Text>
            : notes.map((note) => (
                <View key={note.$id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    {deleting === note.$id
                      ? <ActivityIndicator color="#e53935" size="small" />
                      : <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteNote(note.$id)}>
                          <Text style={styles.deleteBtnText}>🗑️ డిలీట్</Text>
                        </TouchableOpacity>
                    }
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteType}>📄 Text Note</Text>
                </View>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#f57c00', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#ffe0b2', fontFamily: 'SreeKrushnadevaraya' },
  content: { flex: 1, padding: 15 },
  addBtn: { backgroundColor: '#f57c00', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea: { height: 120, textAlignVertical: 'top' },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#388e3c', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 30, fontFamily: 'SreeKrushnadevaraya' },
  noteCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, fontFamily: 'SreeKrushnadevaraya' },
  noteContent: { fontSize: 15, color: '#555', lineHeight: 22, fontFamily: 'SreeKrushnadevaraya' },
  noteType: { fontSize: 12, color: '#999', marginTop: 8, fontFamily: 'SreeKrushnadevaraya' },
  deleteBtn: { backgroundColor: '#ffebee', padding: 6, borderRadius: 6, marginLeft: 8 },
  deleteBtnText: { color: '#e53935', fontSize: 13, fontFamily: 'SreeKrushnadevaraya' },
});