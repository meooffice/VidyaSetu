import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native';
import { getSchools, getClasses, getSubjects, getChapters } from '../../services/database';

export default function ClassStructureScreen({ onBack, onChapterSelect }) {
  const [step, setStep] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchoolAndClasses();
  }, []);

  const loadSchoolAndClasses = async () => {
    setLoading(true);
    const schoolResult = await getSchools();
    if (schoolResult.success && schoolResult.data.length > 0) {
      const school = schoolResult.data[0];
      const classResult = await getClasses(school.$id);
      if (classResult.success) {
        setClasses(classResult.data);
      }
    }
    setLoading(false);
  };

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    const result = await getSubjects(cls.$id);
    if (result.success) {
      setSubjects(result.data);
    }
    setStep('subjects');
    setLoading(false);
  };

  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    const result = await getChapters(subject.$id);
    if (result.success) {
      setChapters(result.data);
    }
    setStep('chapters');
    setLoading(false);
  };

  const handleBack = () => {
    if (step === 'chapters') {
      setStep('subjects');
    } else if (step === 'subjects') {
      setStep('classes');
      setSelectedClass(null);
    } else {
      onBack();
    }
  };

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumb}>
      <TouchableOpacity onPress={() => {
        setStep('classes');
        setSelectedClass(null);
        setSelectedSubject(null);
      }}>
        <Text style={[styles.breadcrumbText, step === 'classes' && styles.breadcrumbActive]}>
          తరగతులు
        </Text>
      </TouchableOpacity>
      {selectedClass && (
        <>
          <Text style={styles.breadcrumbSep}> › </Text>
          <TouchableOpacity onPress={() => setStep('subjects')}>
            <Text style={[styles.breadcrumbText, step === 'subjects' && styles.breadcrumbActive]}>
              {selectedClass.name}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {selectedSubject && (
        <>
          <Text style={styles.breadcrumbSep}> › </Text>
          <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>
            {selectedSubject.name}
          </Text>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>లోడ్ అవుతుంది...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 నా తరగతి</Text>
        {renderBreadcrumb()}
      </View>

      <ScrollView style={styles.content}>
        {step === 'classes' && (
          <View>
            <Text style={styles.sectionTitle}>తరగతి ఎంచుకోండి:</Text>
            {classes.length === 0 && (
              <Text style={styles.emptyText}>తరగతులు లేవు</Text>
            )}
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.$id}
                style={styles.card}
                onPress={() => handleClassSelect(cls)}>
                <Text style={styles.cardIcon}>🏫</Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{cls.name}</Text>
                  <Text style={styles.cardSub}>సెక్షన్: {cls.section}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'subjects' && (
          <View>
            <Text style={styles.sectionTitle}>సబ్జెక్ట్ ఎంచుకోండి:</Text>
            {subjects.length === 0 && (
              <Text style={styles.emptyText}>సబ్జెక్టులు లేవు</Text>
            )}
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.$id}
                style={styles.card}
                onPress={() => handleSubjectSelect(subject)}>
                <Text style={styles.cardIcon}>📖</Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{subject.name}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'chapters' && (
          <View>
            <Text style={styles.sectionTitle}>పాఠాలు:</Text>
            {chapters.length === 0 && (
              <Text style={styles.emptyText}>పాఠాలు లేవు</Text>
            )}
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.$id}
                style={styles.card}
                onPress={() => onChapterSelect && onChapterSelect(chapter)}>
                <Text style={styles.cardIcon}>📝</Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{chapter.name}</Text>
                  <Text style={styles.cardSub}>పాఠం {chapter.orderNo}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  breadcrumb: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  breadcrumbText: {
    color: '#bbdefb',
    fontSize: 14,
    fontFamily: 'SreeKrushnadevaraya',
  },
  breadcrumbActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  breadcrumbSep: {
    color: '#bbdefb',
    fontSize: 14,
  },
  content: { flex: 1, padding: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'SreeKrushnadevaraya',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'SreeKrushnadevaraya',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  cardIcon: { fontSize: 28, marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  cardSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
    fontFamily: 'SreeKrushnadevaraya',
  },
  cardArrow: {
    fontSize: 24,
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
  },
});