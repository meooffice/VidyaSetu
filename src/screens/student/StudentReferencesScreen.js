import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import * as Linking from 'expo-linking';
import { getReferencesByChapter } from '../../services/references';

export default function StudentReferencesScreen({ chapter, onBack }) {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    setLoading(true);
    const result = await getReferencesByChapter(chapter.$id);
    if (result.success) {
      setReferences(result.data);
    }
    setLoading(false);
  };

  const handleOpen = async (ref) => {
    if (ref.fileId && ref.fileId !== 'no-file') {
      try {
        await Linking.openURL(ref.fileId);
      } catch (error) {
        Alert.alert('Error', 'Link తెరవడం సాధ్యం కాలేదు');
      }
    } else {
      Alert.alert('సమాచారం', 'ఈ రిఫరెన్స్ కి link లేదు');
    }
  };

  const typeIcons = {
    pdf: '📄',
    image: '🖼️',
    video: '🎥',
    link: '🔗',
  };

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
        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : references.length === 0
            ? <Text style={styles.emptyText}>ఇంకా రిఫరెన్స్ మెటీరియల్స్ లేవు</Text>
            : references.map((ref) => (
                <TouchableOpacity
                  key={ref.$id}
                  style={styles.refCard}
                  onPress={() => handleOpen(ref)}>
                  <Text style={styles.refIcon}>{typeIcons[ref.type] || '📎'}</Text>
                  <View style={styles.refInfo}>
                    <Text style={styles.refTitle}>{ref.title}</Text>
                    <Text style={styles.refType}>{ref.type}</Text>
                    {ref.fileId && ref.fileId !== 'no-file' && (
                      <Text style={styles.refLink}>🔗 తెరవడానికి నొక్కండి</Text>
                    )}
                  </View>
                  <Text style={styles.refArrow}>›</Text>
                </TouchableOpacity>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1565c0',
    padding: 20,
    paddingTop: 50,
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 14,
    color: '#bbdefb',
    fontFamily: 'SreeKrushnadevaraya',
  },
  content: { flex: 1, padding: 15 },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    fontFamily: 'SreeKrushnadevaraya',
  },
  refCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  refIcon: { fontSize: 32, marginRight: 12 },
  refInfo: { flex: 1 },
  refTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  refType: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
    fontFamily: 'BalooTammudu2',
  },
  refLink: {
    fontSize: 13,
    color: '#1565c0',
    marginTop: 4,
    fontFamily: 'SreeKrushnadevaraya',
  },
  refArrow: {
    fontSize: 24,
    color: '#1565c0',
    fontWeight: 'bold',
  },
});