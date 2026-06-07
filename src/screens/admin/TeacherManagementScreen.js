import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Modal, Alert,   // ✅ Alert add చేశాను
} from 'react-native';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function TeacherManagementScreen({ onBack }) {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    message: '',
    onConfirm: null,
  });

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Teacher@1234');
  const [phone, setPhone] = useState('');

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClasses, setEditClasses] = useState([]);

  // ✅ alert() కి బదులు
  const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'సరే', style: 'default' }]);
  };

  // ✅ window.confirm() కి బదులు
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await databases.listDocuments(DB, C.users);
      setTeachers(allUsers.documents.filter(u => u.role === 'teacher'));

      const schoolResult = await databases.listDocuments(DB, C.schools);
      if (schoolResult.documents.length > 0) {
        const classResult = await databases.listDocuments(
          DB, C.classes,
          [Query.equal('schoolId', schoolResult.documents[0].$id)]
        );
        setClasses(classResult.documents);
      }
    } catch (e) {
      console.log('loadData error:', e.message);
    }
    setLoading(false);
  };

  const toggleClass = (cls, selectedList, setSelectedList) => {
    if (selectedList.find(c => c.$id === cls.$id)) {
      setSelectedList(selectedList.filter(c => c.$id !== cls.$id));
    } else {
      setSelectedList([...selectedList, cls]);
    }
  };

  const handleAddTeacher = async () => {
    if (!name || !email) {
      showAlert('సందేశం', 'పేరు మరియు Email రాయండి!'); // ✅ fixed
      return;
    }
    setSaving(true);
    try {
      const authUser = await account.create(ID.unique(), email, password, name);
      await new Promise(r => setTimeout(r, 500));

      const schoolResult = await databases.listDocuments(DB, C.schools);
      const schoolId = schoolResult.documents[0]?.$id || '';

      const classIds = selectedClasses.map(c => c.$id).join(',');

      // ✅ BUG FIX: "emai" → "email" (Appwrite collection లో ఉన్న exact field name వాడాలి)
      const newDoc = await databases.createDocument(
        DB, C.users, authUser.$id,
        {
          name,
          email,       // ✅ "emai" కాదు, "email" సరైనది
          phone,
          role: 'teacher',
          schoolId,
          classId: classIds,
          parentId: '',
          isActive: true,
        }
      );

      // Classes కి teacherId update చేయి
      for (const cls of selectedClasses) {
        await databases.updateDocument(DB, C.classes, cls.$id, {
          teacherId: authUser.$id
        });
        await new Promise(r => setTimeout(r, 300));
      }

      // ✅ FIX: loadData() కాదు — direct state update చేయాలి (వెంటనే UI లో కనిపిస్తుంది)
      setTeachers(prev => [...prev, newDoc]);

      showAlert(
        '✅ Teacher Add అయ్యారు!',
        `Email: ${email}\nPassword: ${password}\nClasses: ${selectedClasses.map(c => c.name).join(', ') || 'None'}`
      ); // ✅ fixed

      // Form reset
      setName('');
      setEmail('');
      setPhone('');
      setPassword('Teacher@1234');
      setSelectedClasses([]);
      setShowForm(false);

    } catch (e) {
      // ✅ Appwrite error message clearly చూపించు
      showAlert('Error', e.message); // ✅ fixed
    }
    setSaving(false);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name || '');
    setEditPhone(teacher.phone || '');
    const existingClassIds = teacher.classId ? teacher.classId.split(',') : [];
    const existingClasses = classes.filter(c => existingClassIds.includes(c.$id));
    setEditClasses(existingClasses);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      showAlert('సందేశం', 'పేరు రాయండి!'); // ✅ fixed
      return;
    }
    setSaving(true);
    try {
      const classIds = editClasses.map(c => c.$id).join(',');
      const updatedDoc = await databases.updateDocument(
        DB, C.users, editingTeacher.$id,
        { name: editName, phone: editPhone, classId: classIds }
      );

      for (const cls of editClasses) {
        await databases.updateDocument(DB, C.classes, cls.$id, {
          teacherId: editingTeacher.$id
        });
        await new Promise(r => setTimeout(r, 300));
      }

      // ✅ FIX: direct state update — వెంటనే UI లో కనిపిస్తుంది
      setTeachers(prev =>
        prev.map(t => t.$id === editingTeacher.$id ? updatedDoc : t)
      );

      showAlert('✅ Update అయింది!', 'Teacher info సేవ్ అయింది.'); // ✅ fixed
      setShowEditModal(false);
      setEditingTeacher(null);

    } catch (e) {
      showAlert('Error', e.message); // ✅ fixed
    }
    setSaving(false);
  };

  const handleDelete = async (teacher) => {
    // ✅ window.confirm() తొలగించి showConfirm() వాడాం
    showConfirm(`${teacher.name} ని delete చేయాలా?`, async () => {
      try {
        await databases.deleteDocument(DB, C.users, teacher.$id);
        // ✅ direct state update
        setTeachers(prev => prev.filter(t => t.$id !== teacher.$id));
        showAlert('✅ Delete అయింది!', 'Teacher delete చేయబడ్డారు.'); // ✅ fixed
      } catch (e) {
        showAlert('Error', e.message); // ✅ fixed
      }
    });
  };

  const getTeacherClasses = (teacher) => {
    if (!teacher.classId) return [];
    const ids = teacher.classId.split(',');
    return classes.filter(c => ids.includes(c.$id));
  };

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
            <Text style={styles.confirmIcon}>🗑️</Text>
            <Text style={styles.confirmMessage}>{confirmModal.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmBtnNo} onPress={handleConfirmNo}>
                <Text style={styles.confirmBtnNoText}>వద్దు</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtnYes} onPress={handleConfirmYes}>
                <Text style={styles.confirmBtnYesText}>అవును, Delete చేయి</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🏫 టీచర్ నిర్వహణ</Text>
        <Text style={styles.headerSub}>{teachers.length} టీచర్లు</Text>
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Teacher Edit చేయి</Text>

            <TextInput style={styles.input} placeholder="పేరు"
              placeholderTextColor="#999" value={editName}
              onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Phone"
              placeholderTextColor="#999" value={editPhone}
              onChangeText={setEditPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Classes ఎంచుకోండి:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classRow}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.$id}
                  style={[styles.classBtn,
                    editClasses.find(c => c.$id === cls.$id) && styles.classBtnActive]}
                  onPress={() => toggleClass(cls, editClasses, setEditClasses)}>
                  <Text style={[styles.classBtnText,
                    editClasses.find(c => c.$id === cls.$id) && { color: 'white' }]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.selectedText}>
              ✅ Selected: {editClasses.map(c => c.name).join(', ') || 'None'}
            </Text>

            <View style={styles.modalBtns}>
              {saving
                ? <ActivityIndicator color="#f57c00" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                      <Text style={styles.saveBtnText}>💾 సేవ్ చేయి</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn}
                      onPress={() => setShowEditModal(false)}>
                      <Text style={styles.cancelBtnText}>రద్దు</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content}>
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త టీచర్ Add చేయి</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త టీచర్:</Text>
            <TextInput style={styles.input} placeholder="పూర్తి పేరు"
              placeholderTextColor="#999" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email"
              placeholderTextColor="#999" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone (optional)"
              placeholderTextColor="#999" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Password"
              placeholderTextColor="#999" value={password} onChangeText={setPassword} />

            <Text style={styles.label}>Classes ఎంచుకోండి (multiple OK):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classRow}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.$id}
                  style={[styles.classBtn,
                    selectedClasses.find(c => c.$id === cls.$id) && styles.classBtnActive]}
                  onPress={() => toggleClass(cls, selectedClasses, setSelectedClasses)}>
                  <Text style={[styles.classBtnText,
                    selectedClasses.find(c => c.$id === cls.$id) && { color: 'white' }]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedClasses.length > 0 && (
              <Text style={styles.selectedText}>
                ✅ Selected: {selectedClasses.map(c => c.name).join(', ')}
              </Text>
            )}

            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#f57c00" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddTeacher}>
                      <Text style={styles.saveBtnText}>✅ Add చేయి</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn}
                      onPress={() => { setShowForm(false); setSelectedClasses([]); }}>
                      <Text style={styles.cancelBtnText}>రద్దు</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        )}

        {loading
          ? <ActivityIndicator color="#f57c00" size="large" style={{ marginTop: 30 }} />
          : teachers.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👨‍🏫</Text>
                <Text style={styles.emptyText}>ఇంకా టీచర్లు లేరు</Text>
              </View>
            : teachers.map((teacher) => {
                const teacherClasses = getTeacherClasses(teacher);
                return (
                  <View key={teacher.$id} style={styles.teacherCard}>
                    <View style={styles.teacherAvatar}>
                      <Text style={styles.teacherAvatarText}>
                        {teacher.name?.charAt(0) || 'T'}
                      </Text>
                    </View>
                    <View style={styles.teacherInfo}>
                      <Text style={styles.teacherName}>{teacher.name}</Text>
                      <Text style={styles.teacherEmail}>{teacher.email}</Text>
                      {teacher.phone ? (
                        <Text style={styles.teacherPhone}>📞 {teacher.phone}</Text>
                      ) : null}
                      {teacherClasses.length > 0 && (
                        <View style={styles.classBadgeRow}>
                          {teacherClasses.map(cls => (
                            <Text key={cls.$id} style={styles.classBadge}>
                              📚 {cls.name}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.editBtn}
                        onPress={() => handleEditTeacher(teacher)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteIconBtn}
                        onPress={() => handleDelete(teacher)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
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
  headerSub: { fontSize: 14, color: '#ffe0b2', fontFamily: 'BalooTammudu2' },

  // ✅ Confirm Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  confirmBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
  },
  confirmIcon: { fontSize: 36, marginBottom: 10 },
  confirmMessage: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'SreeKrushnadevaraya',
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

  // Edit Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 15,
    padding: 20, elevation: 5,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#333',
    marginBottom: 15, fontFamily: 'SreeKrushnadevaraya',
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },

  content: { flex: 1, padding: 15 },
  addBtn: { backgroundColor: '#f57c00', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  classRow: { marginBottom: 8 },
  classBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  classBtnActive: { backgroundColor: '#f57c00', borderColor: '#f57c00' },
  classBtnText: { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  selectedText: { fontSize: 13, color: '#388e3c', fontFamily: 'SreeKrushnadevaraya', marginBottom: 10, fontWeight: 'bold' },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#388e3c', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  emptyBox: { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  teacherCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', elevation: 2 },
  teacherAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f57c00', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teacherAvatarText: { color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  teacherEmail: { fontSize: 13, color: '#888', fontFamily: 'BalooTammudu2' },
  teacherPhone: { fontSize: 13, color: '#666', fontFamily: 'BalooTammudu2', marginTop: 2 },
  classBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  classBadge: { fontSize: 11, backgroundColor: '#fff3e0', color: '#f57c00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 4, marginBottom: 4, fontFamily: 'SreeKrushnadevaraya' },
  actionBtns: { flexDirection: 'column', alignItems: 'center' },
  editBtn: { padding: 6, marginBottom: 4 },
  editBtnText: { fontSize: 18 },
  deleteIconBtn: { padding: 6 },
  deleteIcon: { fontSize: 18 },
});