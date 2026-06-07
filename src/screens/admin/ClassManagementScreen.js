import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Alert
} from 'react-native';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function ClassManagementScreen({ onBack }) {
  const [classes,         setClasses]         = useState([]);
  const [students,        setStudents]        = useState([]);
  const [selectedClass,   setSelectedClass]   = useState(null);
  const [targetClass,     setTargetClass]     = useState(null);
  const [selectedStudents,setSelectedStudents]= useState([]);
  const [loading,         setLoading]         = useState(true);
  const [processing,      setProcessing]      = useState(false);
  const [mode,            setMode]            = useState('view');
  // view, changeClass, delete
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [confirmAction,   setConfirmAction]   = useState(null);
  const [progress,        setProgress]        = useState({ current: 0, total: 0 });
  const [results,         setResults]         = useState(null);

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass.$id);
      setSelectedStudents([]);
      setMode('view');
    }
  }, [selectedClass]);

  const getClassDisplay = (cls) =>
    cls?.section ? `${cls.name} - ${cls.section}` : cls?.name || '';

  const loadClasses = async () => {
  setLoading(true);
  try {
    const schoolResult = await databases.listDocuments(DB, C.schools);
    console.log('Schools found:', schoolResult.documents.length);

    if (schoolResult.documents.length > 0) {
      const classResult = await databases.listDocuments(
        DB, C.classes,
        [Query.equal('schoolId', schoolResult.documents[0].$id)]
      );
      console.log('Classes found:', classResult.documents.length);
      setClasses(classResult.documents);

      if (classResult.documents.length > 0) {
        setSelectedClass(classResult.documents[0]);
        // loadStudents directly call చేయి
        await loadStudents(classResult.documents[0].$id);
      }
    } else {
      console.log('No schools found!');
    }
  } catch (e) {
    console.log('loadClasses error:', e.message);
  }
  setLoading(false);
};

  const loadStudents = async (classId) => {
  setLoading(true);
  try {
    console.log('Loading students for classId:', classId);

    // ముందు role filter లేకుండా try చేయి
    const result = await databases.listDocuments(
      DB, C.users,
      [Query.equal('classId', classId)]
    );
    console.log('All users in class:', result.documents.length);

    const studentOnly = result.documents.filter(u => u.role === 'student');
    console.log('Students only:', studentOnly.length);
    setStudents(studentOnly);
  } catch (e) {
    console.log('loadStudents error:', e.message);
    setStudents([]);
  }
  setLoading(false);
};

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.$id));
    }
  };

  // Class Change చేయి
  const handleClassChange = async () => {
    if (!targetClass) {
      Alert.alert('తప్పు', 'Target class ఎంచుకోండి!');
      return;
    }
    if (selectedStudents.length === 0) {
      Alert.alert('తప్పు', 'Students ఎంచుకోండి!');
      return;
    }
    setProcessing(true);
    setProgress({ current: 0, total: selectedStudents.length });
    let success = 0, failed = 0;

    for (let i = 0; i < selectedStudents.length; i++) {
      const studentId = selectedStudents[i];
      try {
        await databases.updateDocument(
          DB, C.users, studentId,
          { classId: targetClass.$id }
        );
        success++;
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        failed++;
        console.log('Update error:', e.message);
      }
      setProgress({ current: i + 1, total: selectedStudents.length });
    }

    setProcessing(false);
    setResults({ type: 'change', success, failed,
      message: `${getClassDisplay(selectedClass)} → ${getClassDisplay(targetClass)}`
    });
    setSelectedStudents([]);
    setTargetClass(null);
    setMode('view');
    loadStudents(selectedClass.$id);
  };

  // Bulk Delete చేయి
  const handleBulkDelete = async () => {
  if (selectedStudents.length === 0) {
    Alert.alert('తప్పు', 'Students ఎంచుకోండి!');
    return;
  }
  setProcessing(true);
  setProgress({ current: 0, total: selectedStudents.length });
  let success = 0, failed = 0;
  let parentsDeleted = 0;

  for (let i = 0; i < selectedStudents.length; i++) {
    const studentId = selectedStudents[i];
    try {
      // Student info తీసుకో — parentId కోసం
      const student = students.find(s => s.$id === studentId);
      const parentId = student?.parentId || '';

      // 1. Student delete చేయి
      await databases.deleteDocument(DB, C.users, studentId);
      success++;
      await new Promise(r => setTimeout(r, 200));

      // 2. Parent delete చేయి — parentId ఉంటే
      if (parentId && parentId !== '') {
        try {
          // ఈ parent కి వేరే students ఉన్నారా check చేయి
          const otherStudents = await databases.listDocuments(
            DB, C.users,
            [Query.equal('parentId', parentId),
             Query.equal('role', 'student')]
          );

          // వేరే students లేకపోతే parent delete చేయి
          if (otherStudents.documents.length === 0) {
            await databases.deleteDocument(DB, C.users, parentId);
            parentsDeleted++;
            console.log('Parent deleted:', parentId);
          } else {
            console.log('Parent has other students, skipping delete');
          }
          await new Promise(r => setTimeout(r, 200));
        } catch (parentErr) {
          console.log('Parent delete error:', parentErr.message);
        }
      }
    } catch (e) {
      failed++;
      console.log('Delete error:', e.message);
    }
    setProgress({ current: i + 1, total: selectedStudents.length });
  }

  setProcessing(false);
  setResults({
    type: 'delete',
    success,
    failed,
    parentsDeleted,
    message: `${getClassDisplay(selectedClass)} నుండి`
  });
  setSelectedStudents([]);
  setMode('view');
  loadStudents(selectedClass.$id);
};

  return (
    <View style={styles.container}>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>
              {confirmAction === 'delete' ? '🗑️' : '🔄'}
            </Text>
            <Text style={styles.modalTitle}>
              {confirmAction === 'delete'
                ? `${selectedStudents.length} Students Delete చేయాలా?`
                : `${selectedStudents.length} Students Class మార్చాలా?`}
            </Text>
            {confirmAction === 'change' && targetClass && (
              <Text style={styles.modalSub}>
                {getClassDisplay(selectedClass)} → {getClassDisplay(targetClass)}
              </Text>
            )}
            <Text style={styles.modalWarn}>
              {confirmAction === 'delete'
                ? '⚠️ ఇది permanent గా delete అవుతుంది!'
                : '⚠️ Students కి new class assign అవుతుంది!'}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn,
                  confirmAction === 'delete'
                    ? styles.modalBtnDelete : styles.modalBtnChange]}
                onPress={() => {
                  setShowConfirm(false);
                  if (confirmAction === 'delete') handleBulkDelete();
                  else handleClassChange();
                }}>
                <Text style={styles.modalBtnText}>
                  {confirmAction === 'delete' ? '🗑️ Delete చేయి' : '🔄 Move చేయి'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowConfirm(false)}>
                <Text style={styles.modalBtnCancelText}>రద్దు</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={!!results} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>
              {results?.failed === 0 ? '✅' : '⚠️'}
            </Text>
            <Text style={styles.modalTitle}>
              {results?.type === 'delete' ? 'Delete Complete!' : 'Class Change Complete!'}
            </Text>
            <Text style={styles.modalSub}>{results?.message}</Text>
            <View style={styles.resultStats}>
            <View style={[styles.resultStat, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[styles.resultNum, { color: '#388e3c' }]}>
                {results?.success}
              </Text>
              <Text style={styles.resultLabel}>👨‍🎓 Students</Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.resultNum, { color: '#1565c0' }]}>
                {results?.parentsDeleted || 0}
              </Text>
              <Text style={styles.resultLabel}>👨‍👩‍👧 Parents</Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: '#ffebee' }]}>
              <Text style={[styles.resultNum, { color: '#e53935' }]}>
                {results?.failed}
              </Text>
              <Text style={styles.resultLabel}>❌ Failed</Text>
            </View>
          </View>
                      <TouchableOpacity
              style={styles.modalBtnChange}
              onPress={() => setResults(null)}>
              <Text style={styles.modalBtnText}>సరే!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏫 Class Management</Text>
        <Text style={styles.headerSub}>Bulk Class Change & Delete</Text>
      </View>

      {/* Processing */}
      {processing && (
        <View style={styles.progressBar}>
          <ActivityIndicator color="white" size="small" />
          <Text style={styles.progressText}>
            Processing... {progress.current}/{progress.total}
          </Text>
        </View>
      )}

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
              {/* Student count badge */}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        {students.length > 0 && !processing && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#1565c0' }]}
              onPress={() => {
                setMode(mode === 'changeClass' ? 'view' : 'changeClass');
                setSelectedStudents([]);
                setTargetClass(null);
              }}>
              <Text style={styles.actionBtnText}>
                {mode === 'changeClass' ? '✕ రద్దు' : '🔄 Class మార్చు'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#e53935' }]}
              onPress={() => {
                setMode(mode === 'delete' ? 'view' : 'delete');
                setSelectedStudents([]);
              }}>
              <Text style={styles.actionBtnText}>
                {mode === 'delete' ? '✕ రద్దు' : '🗑️ Bulk Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Target Class Select (for Class Change) */}
        {mode === 'changeClass' && (
          <View style={styles.targetBox}>
            <Text style={styles.targetLabel}>
              🎯 Target Class (move to):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classes
                .filter(cls => cls.$id !== selectedClass?.$id)
                .map(cls => (
                  <TouchableOpacity
                    key={cls.$id}
                    style={[styles.targetChip,
                      targetClass?.$id === cls.$id && styles.targetChipActive]}
                    onPress={() => setTargetClass(cls)}>
                    <Text style={[styles.targetChipText,
                      targetClass?.$id === cls.$id && { color: 'white' }]}>
                      {getClassDisplay(cls)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {targetClass && (
              <Text style={styles.targetSelected}>
                ✅ {getClassDisplay(selectedClass)} → {getClassDisplay(targetClass)}
              </Text>
            )}
          </View>
        )}

        {/* Students List */}
        {loading
          ? <ActivityIndicator color="#e53935" size="large" style={{ marginTop: 20 }} />
          : students.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👨‍🎓</Text>
                <Text style={styles.emptyText}>
                  ఈ తరగతిలో students లేరు
                </Text>
              </View>
            : <>
                {/* Select All + Count */}
                {(mode === 'changeClass' || mode === 'delete') && (
                  <View style={styles.selectAllRow}>
                    <TouchableOpacity
                      style={styles.selectAllBtn}
                      onPress={toggleAll}>
                      <Text style={styles.selectAllText}>
                        {selectedStudents.length === students.length
                          ? '☑ అన్నీ Deselect'
                          : '☐ అన్నీ Select'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.selectedCount}>
                      {selectedStudents.length}/{students.length} selected
                    </Text>
                  </View>
                )}

                {students.map(student => {
                  const isSelected = selectedStudents.includes(student.$id);
                  const isSelectable = mode === 'changeClass' || mode === 'delete';
                  return (
                    <TouchableOpacity
                      key={student.$id}
                      style={[styles.studentCard,
                        isSelected && styles.studentCardSelected,
                        mode === 'delete' && isSelected && styles.studentCardDelete]}
                      onPress={() => isSelectable && toggleStudent(student.$id)}
                      activeOpacity={isSelectable ? 0.7 : 1}>
                      <View style={styles.studentLeft}>
                        {isSelectable && (
                          <Text style={styles.checkbox}>
                            {isSelected ? '☑' : '☐'}
                          </Text>
                        )}
                        <View style={[styles.avatar, {
                          backgroundColor: isSelected
                            ? (mode === 'delete' ? '#e53935' : '#1565c0')
                            : '#388e3c'
                        }]}>
                          <Text style={styles.avatarText}>
                            {student.name?.charAt(0) || 'S'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentEmail}>{student.email}</Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Text style={[styles.selectedBadge, {
                          color: mode === 'delete' ? '#e53935' : '#1565c0'
                        }]}>
                          {mode === 'delete' ? '🗑️' : '🔄'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Action Execute Button */}
                {selectedStudents.length > 0 && !processing && (
                  <TouchableOpacity
                    style={[styles.executeBtn, {
                      backgroundColor: mode === 'delete' ? '#e53935' : '#1565c0'
                    }]}
                    onPress={() => {
                      if (mode === 'changeClass' && !targetClass) {
                        Alert.alert('తప్పు', 'Target class ఎంచుకోండి!');
                        return;
                      }
                      setConfirmAction(mode === 'delete' ? 'delete' : 'change');
                      setShowConfirm(true);
                    }}>
                    <Text style={styles.executeBtnText}>
                      {mode === 'delete'
                        ? `🗑️ ${selectedStudents.length} Students Delete చేయి`
                        : `🔄 ${selectedStudents.length} Students Move చేయి → ${targetClass ? getClassDisplay(targetClass) : '?'}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: '#e53935', padding: 20, paddingTop: 50 },
  backBtn:      { marginBottom: 5 },
  backBtnText:  { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle:  { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub:    { fontSize: 14, color: '#ffcdd2', fontFamily: 'BalooTammudu2' },

  progressBar: {
    backgroundColor: '#f57c00', padding: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  progressText: { color: 'white', marginLeft: 10, fontFamily: 'SreeKrushnadevaraya', fontSize: 14 },

  content:      { flex: 1, padding: 15 },
  label:        { fontSize: 14, color: '#555', marginBottom: 8, fontFamily: 'SreeKrushnadevaraya' },
  chipRow:      { marginBottom: 15 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', marginRight: 8,
  },
  chipActive:   { backgroundColor: '#e53935', borderColor: '#e53935' },
  chipText:     { fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya' },

  actionRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBtn:    { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  actionBtnText:{ color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  targetBox: {
    backgroundColor: '#e3f2fd', borderRadius: 12, padding: 12,
    marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#1565c0',
  },
  targetLabel:   { fontSize: 14, color: '#0d47a1', fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  targetChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#1565c0', marginRight: 8,
  },
  targetChipActive: { backgroundColor: '#1565c0' },
  targetChipText:   { fontSize: 13, color: '#1565c0', fontFamily: 'SreeKrushnadevaraya' },
  targetSelected:   { fontSize: 13, color: '#388e3c', fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya', marginTop: 8 },

  selectAllRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  selectAllBtn: {
    backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#ddd',
  },
  selectAllText:  { fontSize: 13, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  selectedCount:  { fontSize: 13, color: '#666', fontFamily: 'BalooTammudu2' },

  studentCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 12,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', elevation: 1,
    borderWidth: 2, borderColor: 'transparent',
  },
  studentCardSelected: { borderColor: '#1565c0', backgroundColor: '#e3f2fd' },
  studentCardDelete:   { borderColor: '#e53935', backgroundColor: '#ffebee' },
  studentLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox:       { fontSize: 20, marginRight: 8, color: '#333' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText:     { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  studentName:    { fontSize: 15, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  studentEmail:   { fontSize: 12, color: '#888', fontFamily: 'BalooTammudu2' },
  selectedBadge:  { fontSize: 20 },

  executeBtn: {
    padding: 16, borderRadius: 12, alignItems: 'center',
    marginTop: 10, marginBottom: 20, elevation: 2,
  },
  executeBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  emptyBox:   { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center', marginTop: 20 },
  emptyIcon:  { fontSize: 50, marginBottom: 10 },
  emptyText:  { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 20,
  },
  modalBox: {
    backgroundColor: 'white', borderRadius: 15,
    padding: 20, alignItems: 'center', elevation: 5,
  },
  modalIcon:    { fontSize: 40, marginBottom: 10 },
  modalTitle:   { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', fontFamily: 'SreeKrushnadevaraya', marginBottom: 6 },
  modalSub:     { fontSize: 14, color: '#555', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8, textAlign: 'center' },
  modalWarn:    { fontSize: 13, color: '#f57c00', fontFamily: 'SreeKrushnadevaraya', marginBottom: 15, textAlign: 'center' },
  modalBtns:    { flexDirection: 'row', width: '100%' },
  modalBtn:     { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnChange:  { backgroundColor: '#1565c0', flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnDelete:  { backgroundColor: '#e53935', flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnText:    { color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  modalBtnCancel:  { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#f5f5f5' },
  modalBtnCancelText: { color: '#666', fontSize: 14, fontFamily: 'SreeKrushnadevaraya' },

  resultStats:  { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 15 },
  resultStat:   { borderRadius: 10, padding: 12, alignItems: 'center', width: '40%' },
  resultNum:    { fontSize: 28, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  resultLabel:  { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
});
