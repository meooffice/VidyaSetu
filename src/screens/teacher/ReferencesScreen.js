import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { createReference, getReferencesByChapter, deleteReference } from '../../services/references';

export default function ReferencesScreen({ chapter, onBack }) {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('link');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    setLoading(true);
    const result = await getReferencesByChapter(chapter.$id);
    if (result.success) {
      setReferences(result.data);
    } else {
      Alert.alert('Error', result.error); // ✅ సరిగ్గా ఉంది
    }
    setLoading(false);
  };

  const handleSaveReference = async () => {
    if (!title) {
      Alert.alert('సందేశం', 'శీర్షిక రాయండి'); // ✅ title + message రెండూ ఉన్నాయి
      return;
    }
    setSaving(true);
    const result = await createReference(
      title, chapter.$id, 'teacher-id', type, url || 'no-file'
    );
    setSaving(false);
    if (result.success) {
      // ✅ FIX: Alert.alert కి title + message రెండూ ఇవ్వాలి
      Alert.alert('✅ సేవ్ అయింది!', 'రిఫరెన్స్ విజయవంతంగా జోడించబడింది.');
      setTitle('');
      setUrl('');
      setShowForm(false);
      // ✅ direct state update — వెంటనే UI లో కనిపిస్తుంది
      setReferences(prev => [...prev, result.data]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeleteReference = (refId) => {
    Alert.alert(
      'రిఫరెన్స్ డిలీట్ చేయాలా?',
      'ఈ రిఫరెన్స్ శాశ్వతంగా తొలగించబడుతుంది!',
      [
        { text: 'రద్దు చేయి', style: 'cancel' },
        {
          text: 'డిలీట్ చేయి',
          style: 'destructive',
          onPress: async () => {
            setDeleting(refId);
            const result = await deleteReference(refId);
            setDeleting(null);
            if (result.success) {
              // ✅ direct state update
              setReferences(prev => prev.filter(r => r.$id !== refId));
              // ✅ FIX: title + message రెండూ ఇవ్వాలి
              Alert.alert('✅ డిలీట్ అయింది!', 'రిఫరెన్స్ తొలగించబడింది.');
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const typeIcons = { pdf: '📄', image: '🖼️', video: '🎥', link: '🔗' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📎 {chapter.name}</Text>
        <Text style={styles.headerSub}>రిఫరెన్స్ మెటీరియల్స్</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త రిఫరెన్స్ జోడించు</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త రిఫరెన్స్:</Text>
            <TextInput
              style={styles.input}
              placeholder="శీర్షిక రాయండి"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="YouTube లేదా Website URL"
              placeholderTextColor="#999"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.typeLabel}>రకం ఎంచుకోండి:</Text>
            <View style={styles.typeRow}>
              {['pdf', 'image', 'video', 'link'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}>
                  <Text style={styles.typeIcon}>{typeIcons[t]}</Text>
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#1565c0" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReference}>
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
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : references.length === 0
            ? <Text style={styles.emptyText}>ఇంకా రిఫరెన్స్ లేవు</Text>
            : references.map((ref) => (
                <View key={ref.$id} style={styles.refCard}>
                  <Text style={styles.refIcon}>{typeIcons[ref.type] || '📎'}</Text>
                  <View style={styles.refInfo}>
                    <Text style={styles.refTitle}>{ref.title}</Text>
                    <Text style={styles.refType}>{ref.type}</Text>
                    {ref.fileId && ref.fileId !== 'no-file' && (
                      <Text style={styles.refUrl} numberOfLines={1}>{ref.fileId}</Text>
                    )}
                  </View>
                  {deleting === ref.$id
                    ? <ActivityIndicator color="#e53935" size="small" />
                    : <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteReference(ref.$id)}>
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                  }
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
  content: { flex: 1, padding: 15 },
  addBtn: { backgroundColor: '#1565c0', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  typeLabel: { fontSize: 16, color: '#333', marginBottom: 8, fontFamily: 'SreeKrushnadevaraya' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 3 },
  typeBtnActive: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  typeIcon: { fontSize: 20 },
  typeBtnText: { fontSize: 12, color: '#666', fontFamily: 'BalooTammudu2' },
  typeBtnTextActive: { color: 'white' },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#388e3c', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 30, fontFamily: 'SreeKrushnadevaraya' },
  refCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  refIcon: { fontSize: 32, marginRight: 12 },
  refInfo: { flex: 1 },
  refTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  refType: { fontSize: 13, color: '#888', marginTop: 3, fontFamily: 'BalooTammudu2' },
  refUrl: { fontSize: 12, color: '#1565c0', marginTop: 3, fontFamily: 'BalooTammudu2' },
  deleteBtn: { backgroundColor: '#ffebee', padding: 8, borderRadius: 8, marginLeft: 8 },
  deleteBtnText: { fontSize: 20 },
});