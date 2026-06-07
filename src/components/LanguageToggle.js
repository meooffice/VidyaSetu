import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.btn} onPress={toggleLanguage}>
        <Text style={styles.btnText}>
          {language === 'telugu' ? 'EN' : 'తె'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 40,
    right: 15,
    zIndex: 999,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  btnText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'BalooTammudu2',
    fontWeight: 'bold',
  },
});