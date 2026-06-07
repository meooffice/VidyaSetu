import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export default function SessionWarning({ visible, onContinue, onLogout, timeLeft }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.title}>Session Warning!</Text>
          <Text style={styles.message}>
            మీ session {timeLeft} నిమిషాల్లో expire అవుతుంది.
            {'\n'}Continue చేయాలంటే నొక్కండి!
          </Text>
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueBtnText}>✅ Continue చేయి</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>🚪 Logout చేయి</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
  },
  icon: { fontSize: 50, marginBottom: 15 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e53935',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
    lineHeight: 24,
    marginBottom: 20,
  },
  continueBtn: {
    backgroundColor: '#388e3c',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  continueBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  logoutBtn: {
    backgroundColor: '#ffebee',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e53935',
  },
  logoutBtnText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});