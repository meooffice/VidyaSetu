import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LanguageToggle from './LanguageToggle';

export default function AppHeader({
  title,
  subtitle,
  backgroundColor,
  onBack,
  rightComponent,
  showLanguageToggle = false,
}) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showLanguageToggle && <LanguageToggle />}
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
      )}
      <View style={styles.titleRow}>
        <View style={styles.titleContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightComponent && (
          <View style={styles.rightContent}>{rightComponent}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 50,
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContent: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'SreeKrushnadevaraya',
    marginTop: 3,
  },
  rightContent: { marginLeft: 10 },
});