import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal,
  Alert   // ✅ React Native Alert import చేశాం
} from 'react-native';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function ParentManagementScreen({ onBack }) {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ Delete Confirmation Modal కోసం state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [parentToDelete, setParentToDelete] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Parent@1234');

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await databases.listDocuments(DB, C.users);
      setParents(allUsers.documents.filter(u => u.role === 'parent'));
      setStudents(allUsers.documents.filter(u => u.role === 'student'));
    } catch (e) {
      console.log('Error:', e.message);
    }
    setLoading(false);
  };

  const handleAddParent = async () => {
    if (!name || !email) {
      // ✅ alert() కి బదులు React Native Alert
      Alert.alert('తప్పు', 'పేరు మరియు Email రాయండి!');
      return;
    }
    setSaving(true);
    try {
      const authUser = await account.create(ID.unique(), email, password, name);
      await new Promise(r => setTimeout(r, 500));
      const schoolResult = await databases.listDocuments(DB, C.schools);
      const schoolId = schoolResult.documents[0]?.$id || '';

      await databases.createDocument(DB, C.users, authUser.$id, {
        name, email, phone,
        role: 'parent',
        schoolId,
        classId: '',
        parentId: '',
        isActive: true,
      });

      // ✅ Multi-line alert సరిగ్గా పని చేస్తుంది
      Alert.alert(
        '✅ విజయవంతం!',
        `Parent add అయ్యారు!\nEmail: ${email}\nPassword: ${password}\n\n💡 విద్యార్థి screen లో student తో link చేయండి!`
      );
      setName(''); setEmail(''); setPhone('');
      setShowForm(false);
      loadData();
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleEditParent = (parent) => {
    setEditingParent(parent);
    setEditName(parent.name || '');
    setEditPhone(parent.phone || '');
    setEditEmail(parent.email || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      Alert.alert('తప్పు', 'పేరు రాయండి!');
      return;
    }
    setSaving(true);
    try {
      await databases.updateDocument(DB, C.users, editingParent.$id, {
        name: editName,
        phone: editPhone,
      });
      Alert.alert('✅ విజయవంతం!', 'Parent info update అయింది!');
      setShowEditModal(false);
      setEditingParent(null);
      loadData();
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setSaving(false);
  };

  // ✅ window.confirm() తొలగించి — Custom Delete Modal వాడుతున్నాం
  const handleDelete = (parent) => {
    setParentToDelete(parent);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await databases.deleteDocument(DB, C.users, parentToDelete.$id);
      setParents(prev => prev.filter(p => p.$id !== parentToDelete.$id));
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setParentToDelete(null);
  };

  const getLinkedStudents = (parentId) =>
    students.filter(s => s.parentId === parentId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍👩‍👧 తల్లిదండ్రుల నిర్వహణ</Text>
        <Text style={styles.headerSub}>{parents.length} తల్లిదండ్రులు</Text>
      </View>

      {/* ✅ Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Parent Edit చేయి</Text>
            <TextInput style={styles.input} placeholder="పేరు"
              placeholderTextColor="#999" value={editName}
              onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Phone"
              placeholderTextColor="#999" value={editPhone}
              onChangeText={setEditPhone} keyboardType="phone-pad" />
            <Text style={styles.emailNote}>
              📧 Email: {editEmail} (మార్చలేరు)
            </Text>
            <View style={styles.modalBtns}>
              {saving
                ? <ActivityIndicator color="#1565c0" />
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

      {/* ✅ Delete Confirmation Modal — window.confirm() కి బదులు */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.deleteModalIcon}>🗑️</Text>
            <Text style={styles.modalTitle}>Delete చేయాలా?</Text>
            <Text style={styles.deleteModalMsg}>
              <Text style={{ fontWeight: 'bold' }}>{parentToDelete?.name}</Text> ని
              శాశ్వతంగా delete చేయాలా?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.saveBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => { setShowDeleteModal(false); setParentToDelete(null); }}>
                <Text style={styles.cancelBtnText}>రద్దు</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 ముందు Parent add చేయండి → తర్వాత విద్యార్థి screen లో student తో link చేయండి!
          </Text>
        </View>

        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త Parent Add చేయి</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త Parent:</Text>
            <TextInput style={styles.input} placeholder="Parent పేరు"
              placeholderTextColor="#999" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email"
              placeholderTextColor="#999" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone (optional)"
              placeholderTextColor="#999" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Password"
              placeholderTextColor="#999" value={password} onChangeText={setPassword} />
            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#1565c0" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddParent}>
                      <Text style={styles.saveBtnText}>✅ Add చేయి</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn}
                      onPress={() => setShowForm(false)}>
                      <Text style={styles.cancelBtnText}>రద్దు</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        )}

        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : parents.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
                <Text style={styles.emptyText}>ఇంకా తల్లిదండ్రులు లేరు</Text>
              </View>
            : parents.map((parent) => {
                const linkedStudents = getLinkedStudents(parent.$id);
                return (
                  <View key={parent.$id} style={styles.parentCard}>
                    <View style={styles.parentAvatar}>
                      <Text style={styles.parentAvatarText}>
                        {parent.name?.charAt(0) || 'P'}
                      </Text>
                    </View>
                    <View style={styles.parentInfo}>
                      <Text style={styles.parentName}>{parent.name}</Text>
                      <Text style={styles.parentEmail}>{parent.email}</Text>
                      {parent.phone
                        ? <Text style={styles.parentPhone}>📞 {parent.phone}</Text>
                        : null}
                      {linkedStudents.length > 0 && (
                        <View style={styles.linkedStudents}>
                          {linkedStudents.map(s => (
                            <Text key={s.$id} style={styles.studentBadge}>
                              👨‍🎓 {s.name}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.editBtn}
                        onPress={() => handleEditParent(parent)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteIconBtn}
                        onPress={() => handleDelete(parent)}>
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
  header: { backgroundColor: '#1565c0', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#bbdefb', fontFamily: 'BalooTammudu2' },
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
  deleteModalIcon: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  deleteModalMsg: {
    fontSize: 15, color: '#555', textAlign: 'center',
    marginBottom: 15, fontFamily: 'SreeKrushnadevaraya',
  },
  emailNote: { fontSize: 13, color: '#888', fontFamily: 'BalooTammudu2', marginBottom: 10 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  content: { flex: 1, padding: 15 },
  infoBox: {
    backgroundColor: '#e3f2fd', borderRadius: 10, padding: 12,
    marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#1565c0',
  },
  infoText: { fontSize: 13, color: '#0d47a1', fontFamily: 'SreeKrushnadevaraya' },
  addBtn: {
    backgroundColor: '#1565c0', padding: 15,
    borderRadius: 10, alignItems: 'center', marginBottom: 15,
  },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: {
    backgroundColor: 'white', borderRadius: 12,
    padding: 15, marginBottom: 15, elevation: 2,
  },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 15, marginBottom: 10,
    color: '#333', fontFamily: 'SreeKrushnadevaraya',
  },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: {
    backgroundColor: '#388e3c', padding: 12, borderRadius: 8,
    flex: 1, marginRight: 8, alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: {
    backgroundColor: '#e53935', padding: 12, borderRadius: 8,
    flex: 1, alignItems: 'center',
  },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  deleteConfirmBtn: {
    backgroundColor: '#c62828', padding: 12, borderRadius: 8,
    flex: 1, marginRight: 8, alignItems: 'center',
  },
  emptyBox: { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  parentCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 12,
    marginBottom: 10, flexDirection: 'row',
    alignItems: 'flex-start', elevation: 2,
  },
  parentAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#1565c0', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  parentAvatarText: { color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  parentEmail: { fontSize: 13, color: '#888', fontFamily: 'BalooTammudu2' },
  parentPhone: { fontSize: 13, color: '#666', fontFamily: 'BalooTammudu2', marginTop: 2 },
  linkedStudents: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  studentBadge: {
    fontSize: 11, backgroundColor: '#e8f5e9', color: '#388e3c',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    marginRight: 4, marginBottom: 2, fontFamily: 'SreeKrushnadevaraya',
  },
  actionBtns: { flexDirection: 'column', alignItems: 'center' },
  editBtn: { padding: 6, marginBottom: 4 },
  editBtnText: { fontSize: 18 },
  deleteIconBtn: { padding: 6 },
  deleteIcon: { fontSize: 18 },
});