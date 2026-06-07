import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal, Alert
} from 'react-native';
import {
  createHomework,
  getHomeworkByClass,
  deleteHomework
} from '../../services/homework';
import { getSchools, getClasses, getSubjects } from '../../services/database';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function TeacherHomeworkScreen({ onBack, userId }) {
  const [classes,         setClasses]         = useState([]);
  const [subjects,        setSubjects]        = useState([]);
  const [homeworks,       setHomeworks]       = useState([]);
  const [selectedClass,   setSelectedClass]   = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hwToDelete,      setHwToDelete]      = useState(null);
  const [hwStats,         setHwStats]         = useState({}); // homeworkId → {done, confirmed}

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [dueDate,     setDueDate]     = useState('');

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects(selectedClass.$id);
      loadHomework(selectedClass.$id);
    }
  }, [selectedClass]);

  const getClassDisplay = (cls) =>
    cls.section ? `${cls.name} - ${cls.section}` : cls.name;

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

  const loadSubjects = async (classId) => {
    try {
      const result = await getSubjects(classId);
      if (result.success) setSubjects(result.data);
    } catch (e) {
      console.log('loadSubjects error:', e.message);
    }
  };

  const loadHomework = async (classId) => {
    try {
      const result = await getHomeworkByClass(classId);
      if (result.success) {
        setHomeworks(result.data);
        loadStats(result.data);
      }
    } catch (e) {
      console.log('loadHomework error:', e.message);
    }
  };

  // ప్రతి homework కి done/confirmed count తీసుకో
  const loadStats = async (hwList) => {
    const stats = {};
    for (const hw of hwList) {
      try {
        const statusResult = await databases.listDocuments(
          DB, C.homeworkStatus,
          [Query.equal('homeworkId', hw.$id), Query.limit(100)]
        );
        const doneCount = statusResult.documents.filter(
          s => s.status === 'done' || s.status === 'confirmed' || s.status === 'rejected'
        ).length;
        const confirmedCount = statusResult.documents.filter(
          s => s.status === 'confirmed'
        ).length;
        stats[hw.$id] = { doneCount, confirmedCount };
        await new Promise(r => setTimeout(r, 150));
      } catch (e) {
        stats[hw.$id] = { doneCount: 0, confirmedCount: 0 };
      }
    }
    setHwStats(stats);
  };

  const handleCreate = async () => {
    if (!title || !selectedClass || !dueDate) {
      Alert.alert('తప్పు', 'Title, తరగతి మరియు గడువు తేదీ రాయండి!');
      return;
    }
    setSaving(true);
    try {
      const result = await createHomework(
        title, description,
        selectedClass.$id,
        selectedSubject?.$id || '',
        userId || '',
        dueDate
      );
      if (result.success) {
        Alert.alert('✅ విజయవంతం!', 'Homework ఇవ్వబడింది!');
        setTitle('');
        setDescription('');
        setDueDate('');
        setSelectedSubject(null);
        setShowForm(false);
        loadHomework(selectedClass.$id);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const handleDelete = (hw) => {
    setHwToDelete(hw);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteHomework(hwToDelete.$id);
      setHomeworks(prev => prev.filter(h => h.$id !== hwToDelete.$id));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setHwToDelete(null);
  };

  return (
    <View style={styles.container}>
      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>🗑️</Text>
            <Text style={styles.modalTitle}>Delete చేయాలా?</Text>
            <Text style={styles.modalMsg}>"{hwToDelete?.title}"</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>రద్దు</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Homework ఇవ్వు</Text>
        <Text style={styles.headerSub}>
          {selectedClass ? getClassDisplay(selectedClass) : ''}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Class Select */}
        <Text style={styles.label}>తరగతి ఎంచుకోండి:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.chipRow}>
          {classes.map(cls => (
            <TouchableOpacity
              key={cls.$id}
              style={[styles.chip,
                selectedClass?.$id === cls.$id && styles.chipActive]}
              onPress={() => setSelectedClass(cls)}>
              <Text style={[styles.chipText,
                selectedClass?.$id === cls.$id && { color: 'white' }]}>
                {getClassDisplay(cls)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add Button */}
        {!showForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త Homework ఇవ్వు</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త Homework:</Text>

            <Text style={styles.label}>Title: *</Text>
            <TextInput
              style={styles.input}
              placeholder="ఉదా: 10వ పాఠం చదవండి"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>వివరణ:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Homework వివరాలు..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Subject (optional):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipRow}>
              {subjects.map(sub => (
                <TouchableOpacity
                  key={sub.$id}
                  style={[styles.chip,
                    selectedSubject?.$id === sub.$id && styles.chipActiveBlue]}
                  onPress={() => setSelectedSubject(
                    selectedSubject?.$id === sub.$id ? null : sub
                  )}>
                  <Text style={[styles.chipText,
                    selectedSubject?.$id === sub.$id && { color: 'white' }]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>గడువు తేదీ: * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="ఉదా: 2026-05-30"
              placeholderTextColor="#999"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#00838f" />
                : <>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleCreate}>
                      <Text style={styles.saveBtnText}>✅ Homework ఇవ్వు</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowForm(false)}>
                      <Text style={styles.cancelBtnText}>రద్దు</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        )}

        {/* Homework List */}
        <Text style={styles.sectionTitle}>
          📋 ఇచ్చిన Homework ({homeworks.length}):
        </Text>

        {loading
          ? <ActivityIndicator color="#00838f" size="large" />
          : homeworks.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>ఇంకా Homework ఇవ్వలేదు</Text>
              </View>
            : homeworks.map(hw => {
                const stat = hwStats[hw.$id] || { doneCount: 0, confirmedCount: 0 };
                const isOver = hw.dueDate && new Date(hw.dueDate) < new Date();
                return (
                  <View key={hw.$id} style={[
                    styles.hwCard,
                    isOver && styles.hwCardOverdue
                  ]}>
                    <View style={styles.hwCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.hwTitle}>{hw.title}</Text>
                        {hw.description ? (
                          <Text style={styles.hwDesc} numberOfLines={2}>
                            {hw.description}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(hw)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                      <View style={[styles.statChip,
                        { backgroundColor: '#e3f2fd' }]}>
                        <Text style={[styles.statNum, { color: '#1565c0' }]}>
                          {stat.doneCount}
                        </Text>
                        <Text style={styles.statLabel}>Done చేశారు</Text>
                      </View>
                      <View style={[styles.statChip,
                        { backgroundColor: '#e8f5e9' }]}>
                        <Text style={[styles.statNum, { color: '#388e3c' }]}>
                          {stat.confirmedCount}
                        </Text>
                        <Text style={styles.statLabel}>Parent Confirmed</Text>
                      </View>
                    </View>

                    {hw.dueDate && (
                      <Text style={[styles.hwDue,
                        { color: isOver ? '#e53935' : '#666' }]}>
                        📅 గడువు: {hw.dueDate}
                        {isOver ? ' (గడువు మించింది!)' : ''}
                      </Text>
                    )}
                  </View>
                );
              })
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: '#00838f', padding: 20, paddingTop: 50 },
  backBtn:      { marginBottom: 5 },
  backBtnText:  { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle:  { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub:    { fontSize: 14, color: '#b2ebf2', fontFamily: 'BalooTammudu2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalBox:     { backgroundColor: 'white', borderRadius: 15, padding: 24, width: '100%', alignItems: 'center', elevation: 5 },
  modalIcon:    { fontSize: 36, marginBottom: 8 },
  modalTitle:   { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, fontFamily: 'SreeKrushnadevaraya' },
  modalMsg:     { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, fontFamily: 'SreeKrushnadevaraya' },
  modalBtns:    { flexDirection: 'row', width: '100%' },
  content:      { flex: 1, padding: 15 },
  label:        { fontSize: 14, color: '#555', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya' },
  chipRow:      { marginBottom: 12 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  chipActive:   { backgroundColor: '#00838f', borderColor: '#00838f' },
  chipActiveBlue: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  chipText:     { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  addBtn:       { backgroundColor: '#00838f', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText:   { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form:         { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle:    { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'SreeKrushnadevaraya' },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea:     { height: 80, textAlignVertical: 'top' },
  formBtns:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  saveBtn:      { backgroundColor: '#00838f', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText:  { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn:    { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText:{ color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  deleteBtn:    { backgroundColor: '#c62828', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  deleteBtnText:{ color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  emptyBox:     { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center', elevation: 1 },
  emptyIcon:    { fontSize: 40, marginBottom: 10 },
  emptyText:    { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  hwCard:       { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#00838f' },
  hwCardOverdue:{ borderLeftColor: '#e53935' },
  hwCardTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  hwTitle:      { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  hwDesc:       { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginTop: 3 },
  deleteIcon:   { fontSize: 20, paddingLeft: 8 },
  statsRow:     { flexDirection: 'row', marginBottom: 8 },
  statChip:     { borderRadius: 8, padding: 8, marginRight: 8, alignItems: 'center', minWidth: 90 },
  statNum:      { fontSize: 20, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  statLabel:    { fontSize: 11, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  hwDue:        { fontSize: 13, fontFamily: 'SreeKrushnadevaraya' },
});