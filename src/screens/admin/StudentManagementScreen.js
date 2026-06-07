import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
  Alert, FlatList
} from 'react-native';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ── Searchable Dropdown Component ──────────────────────────────────────────
function SearchableDropdown({ items, selectedItem, onSelect, placeholder, displayKey }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter(item =>
    (item[displayKey] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={ddStyles.container}>
      <TouchableOpacity
        style={ddStyles.selector}
        onPress={() => { setOpen(!open); setSearch(''); }}>
        <Text style={[ddStyles.selectorText, !selectedItem && { color: '#999' }]}>
          {selectedItem ? selectedItem[displayKey] : placeholder}
        </Text>
        <Text style={ddStyles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={ddStyles.dropdown}>
          <TextInput
            style={ddStyles.searchInput}
            placeholder="వెతకండి..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {/* ✅ FlatList replaced with mapped Views to avoid nested VirtualizedList */}
          <View style={ddStyles.list}>
            {filtered.length === 0 ? (
              <Text style={ddStyles.emptyText}>ఫలితాలు లేవు</Text>
            ) : (
              filtered.map(item => (
                <TouchableOpacity
                  key={item.$id}
                  style={[ddStyles.item, selectedItem?.$id === item.$id && ddStyles.itemSelected]}
                  onPress={() => {
                    onSelect(selectedItem?.$id === item.$id ? null : item);
                    setOpen(false);
                    setSearch('');
                  }}>
                  <Text style={[ddStyles.itemText, selectedItem?.$id === item.$id && { color: 'white' }]}>
                    {item[displayKey]}
                  </Text>
                  {selectedItem?.$id === item.$id && (
                    <Text style={ddStyles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
          {selectedItem && (
            <TouchableOpacity
              style={ddStyles.clearBtn}
              onPress={() => { onSelect(null); setOpen(false); }}>
              <Text style={ddStyles.clearBtnText}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function StudentManagementScreen({ onBack }) {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editClass, setEditClass] = useState(null);
  const [editParent, setEditParent] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => { loadData(); }, []);

  const getClassDisplayName = (cls) => {
    if (!cls) return '';
    const section = cls.section ? ` - ${cls.section}` : '';
    return `${cls.name}${section}`;
  };

  const classesWithDisplay = classes.map(cls => ({
    ...cls,
    displayName: getClassDisplayName(cls),
  }));

  const parentsWithDisplay = parents.map(p => ({
    ...p,
    displayName: p.phone ? `${p.name} (${p.phone})` : p.name,
  }));

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await databases.listDocuments(DB, C.users);
      setStudents(allUsers.documents.filter(u => u.role === 'student'));
      setParents(allUsers.documents.filter(u => u.role === 'parent'));
      await new Promise(r => setTimeout(r, 1000));
      const schoolResult = await databases.listDocuments(DB, C.schools);
      if (schoolResult.documents.length > 0) {
        await new Promise(r => setTimeout(r, 1000));
        const classResult = await databases.listDocuments(
          DB, C.classes,
          [Query.equal('schoolId', schoolResult.documents[0].$id)]
        );
        setClasses(classResult.documents);
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
    setLoading(false);
  };

  const handleAddStudent = async () => {
    if (!name || !email || !selectedClass) {
      Alert.alert('తప్పు', 'పేరు, Email మరియు తరగతి ఎంచుకోండి!');
      return;
    }
    setSaving(true);
    try {
      const authUser = await account.create(ID.unique(), email, 'Student@1234', name);
      await new Promise(r => setTimeout(r, 500));
      const schoolResult = await databases.listDocuments(DB, C.schools);
      const schoolId = schoolResult.documents[0]?.$id || '';
      await databases.createDocument(DB, C.users, authUser.$id, {
        name, email,
        phone: '',
        role: 'student',
        schoolId,
        classId: selectedClass.$id,
        parentId: selectedParent?.$id || '',
        isActive: true,
      });
      Alert.alert(
        '✅ విజయవంతం!',
        `Student add అయ్యారు!\nEmail: ${email}\nPassword: Student@1234\nతరగతి: ${getClassDisplayName(selectedClass)}${selectedParent ? '\nParent: ' + selectedParent.name : ''}`
      );
      setName(''); setEmail('');
      setSelectedClass(null); setSelectedParent(null);
      setShowForm(false);
      loadData();
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditName(student.name || '');
    const foundClass = classes.find(c => c.$id === student.classId);
    setEditClass(foundClass ? { ...foundClass, displayName: getClassDisplayName(foundClass) } : null);
    const foundParent = parents.find(p => p.$id === student.parentId);
    setEditParent(foundParent ? {
      ...foundParent,
      displayName: foundParent.phone ? `${foundParent.name} (${foundParent.phone})` : foundParent.name
    } : null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      Alert.alert('తప్పు', 'పేరు రాయండి!');
      return;
    }
    setSaving(true);
    try {
      await databases.updateDocument(DB, C.users, editingStudent.$id, {
        name: editName,
        classId: editClass?.$id || editingStudent.classId,
        parentId: editParent?.$id || '',
      });
      Alert.alert('✅ విజయవంతం!', 'Student info update అయింది!');
      setShowEditModal(false);
      setEditingStudent(null);
      loadData();
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await databases.deleteDocument(DB, C.users, studentToDelete.$id);
      setStudents(prev => prev.filter(s => s.$id !== studentToDelete.$id));
    } catch (e) {
      Alert.alert('లోపం', 'Error: ' + e.message);
    }
    setStudentToDelete(null);
  };

  const getStudentClassDisplay = (classId) => {
    const cls = classes.find(c => c.$id === classId);
    return cls ? getClassDisplayName(cls) : '';
  };

  const getParentName = (parentId) => {
    const parent = parents.find(p => p.$id === parentId);
    return parent ? parent.name : '';
  };

  // ── FlatList data: header item + student items ──────────────────────────
  const listData = loading
    ? [{ type: 'header' }, { type: 'loading' }]
    : students.length === 0
      ? [{ type: 'header' }, { type: 'empty' }]
      : [{ type: 'header' }, ...students.map(s => ({ type: 'student', data: s }))];

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View>
          {!showForm && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ కొత్త విద్యార్థి Add చేయి</Text>
            </TouchableOpacity>
          )}
          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>కొత్త విద్యార్థి:</Text>
              <TextInput
                style={styles.input} placeholder="విద్యార్థి పేరు"
                placeholderTextColor="#999" value={name} onChangeText={setName} />
              <TextInput
                style={styles.input} placeholder="Email (OTP login కి)"
                placeholderTextColor="#999" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>తరగతి ఎంచుకోండి: *</Text>
              <SearchableDropdown
                items={classesWithDisplay}
                selectedItem={selectedClass}
                onSelect={setSelectedClass}
                placeholder="తరగతి ఎంచుకోండి... (10-A)"
                displayKey="displayName"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>
                Parent Link చేయి (optional):
              </Text>
              <SearchableDropdown
                items={parentsWithDisplay}
                selectedItem={selectedParent}
                onSelect={setSelectedParent}
                placeholder="Parent వెతకండి... (పేరు లేదా phone)"
                displayKey="displayName"
              />

              <View style={[styles.formBtns, { marginTop: 15 }]}>
                {saving
                  ? <ActivityIndicator color="#388e3c" />
                  : <>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleAddStudent}>
                        <Text style={styles.saveBtnText}>✅ Add చేయి</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                        <Text style={styles.cancelBtnText}>రద్దు</Text>
                      </TouchableOpacity>
                    </>
                }
              </View>
            </View>
          )}
        </View>
      );
    }

    if (item.type === 'loading') {
      return <ActivityIndicator color="#388e3c" size="large" style={{ marginTop: 30 }} />;
    }

    if (item.type === 'empty') {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>👨‍🎓</Text>
          <Text style={styles.emptyText}>ఇంకా విద్యార్థులు లేరు</Text>
        </View>
      );
    }

    const student = item.data;
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name?.charAt(0) || 'S'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <View style={styles.badgeRow}>
            {student.classId && (
              <Text style={styles.badge}>
                📚 {getStudentClassDisplay(student.classId)}
              </Text>
            )}
            {student.parentId && (
              <Text style={[styles.badge, styles.badgeBlue]}>
                👨‍👩‍👧 {getParentName(student.parentId)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEditStudent(student)}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDelete(student)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🎓 విద్యార్థి నిర్వహణ</Text>
        <Text style={styles.headerSub}>{students.length} విద్యార్థులు</Text>
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          {/* ✅ FlatList inside Modal to avoid nesting in outer ScrollView */}
          <FlatList
            data={[{ key: 'form' }]}
            keyExtractor={item => item.key}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingTop: 60 }}
            renderItem={() => (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>✏️ Student Edit చేయి</Text>

                <Text style={styles.label}>పేరు:</Text>
                <TextInput
                  style={styles.input} placeholder="పేరు"
                  placeholderTextColor="#999" value={editName}
                  onChangeText={setEditName} />

                <Text style={styles.label}>తరగతి మార్చు:</Text>
                <SearchableDropdown
                  items={classesWithDisplay}
                  selectedItem={editClass}
                  onSelect={setEditClass}
                  placeholder="తరగతి ఎంచుకోండి..."
                  displayKey="displayName"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Parent మార్చు:</Text>
                <SearchableDropdown
                  items={parentsWithDisplay}
                  selectedItem={editParent}
                  onSelect={setEditParent}
                  placeholder="Parent ఎంచుకోండి..."
                  displayKey="displayName"
                />

                <View style={[styles.modalBtns, { marginTop: 20 }]}>
                  {saving
                    ? <ActivityIndicator color="#388e3c" />
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
            )}
          />
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.deleteModalIcon}>🗑️</Text>
            <Text style={styles.modalTitle}>Delete చేయాలా?</Text>
            <Text style={styles.deleteModalMsg}>
              <Text style={{ fontWeight: 'bold' }}>{studentToDelete?.name}</Text> ని
              శాశ్వతంగా delete చేయాలా?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.saveBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => { setShowDeleteModal(false); setStudentToDelete(null); }}>
                <Text style={styles.cancelBtnText}>రద్దు</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Single top-level FlatList — no nested ScrollView */}
      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          item.type === 'student' ? item.data.$id : `${item.type}-${index}`
        }
        renderItem={renderItem}
        style={styles.content}
        contentContainerStyle={{ padding: 15 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

// ── Dropdown Styles ──────────────────────────────────────────────────────────
const ddStyles = StyleSheet.create({
  container: { marginBottom: 4 },
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
    flex: 1,
  },
  arrow: { fontSize: 12, color: '#666', marginLeft: 8 },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 2,
    elevation: 5,
    maxHeight: 220,
    zIndex: 999,
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 14,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  // ✅ View with maxHeight + overflow hidden instead of FlatList
  list: { maxHeight: 160, overflow: 'hidden' },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSelected: { backgroundColor: '#388e3c' },
  itemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
    flex: 1,
  },
  checkMark: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  emptyText: {
    padding: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
  clearBtn: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#e53935',
    fontSize: 14,
    fontFamily: 'SreeKrushnadevaraya',
  },
});

// ── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#388e3c', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#c8e6c9', fontFamily: 'BalooTammudu2' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
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
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  content: { flex: 1 },
  addBtn: {
    backgroundColor: '#388e3c', padding: 15,
    borderRadius: 10, alignItems: 'center', marginBottom: 15,
  },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: {
    backgroundColor: 'white', borderRadius: 12,
    padding: 15, marginBottom: 15, elevation: 2,
  },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya' },
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
  studentCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 12,
    marginBottom: 10, flexDirection: 'row',
    alignItems: 'flex-start', elevation: 2,
  },
  studentAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#388e3c', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  studentAvatarText: { color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  studentEmail: { fontSize: 13, color: '#888', fontFamily: 'BalooTammudu2' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  badge: {
    fontSize: 11, backgroundColor: '#fff3e0', color: '#f57c00',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    marginRight: 4, marginBottom: 2, fontFamily: 'SreeKrushnadevaraya',
  },
  badgeBlue: { backgroundColor: '#e3f2fd', color: '#1565c0' },
  actionBtns: { flexDirection: 'column', alignItems: 'center' },
  editBtn: { padding: 6, marginBottom: 4 },
  editBtnText: { fontSize: 18 },
  deleteIconBtn: { padding: 6 },
  deleteIcon: { fontSize: 18 },
});