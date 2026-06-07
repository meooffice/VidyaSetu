import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import {
  loginWithEmail,
  sendEmailOTP,
  verifyEmailOTP,
  verifyOTPAndLogin,
} from '../services/auth';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../config/translations';
import LanguageToggle from '../components/LanguageToggle';

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password — Student OTP తో same గా
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp

  const { language } = useLanguage();
  const T = translations[language];

  const resetForgot = () => {
    setForgotMode(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOTP('');
    setForgotUserId('');
  };

  // Email Login
  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert('Email మరియు Password enter చేయండి');
      return;
    }
    setLoading(true);
    const result = await loginWithEmail(email, password);
    setLoading(false);
    if (result.success) {
      onLoginSuccess(result.role);
    } else {
      alert('Login Failed: ' + result.error);
    }
  };

  // ==================
  // Student OTP
  // ==================
  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      alert('Valid Email enter చేయండి');
      return;
    }
    setLoading(true);
    const result = await sendEmailOTP(email);
    setLoading(false);
    if (result.success) {
      setUserId(result.userId);
      setMode('otp');
      alert('✅ OTP మీ email కి పంపబడింది!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      alert('6-digit OTP enter చేయండి');
      return;
    }
    setLoading(true);
    const result = await verifyEmailOTP(userId, otp);
    setLoading(false);
    if (result.success) {
      onLoginSuccess('student');
    } else {
      alert('Invalid OTP: ' + result.error);
    }
  };

  // ==================
  // Forgot Password — Student OTP తో exactly same
  // ==================

  // Step 1 — Email enter చేయి, OTP పంపు (sendEmailOTP reuse)
  const handleSendForgotOTP = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      alert('Valid Email enter చేయండి');
      return;
    }
    setLoading(true);
    const result = await sendEmailOTP(forgotEmail); // ← Student OTP same function!
    setLoading(false);
    if (result.success) {
      setForgotUserId(result.userId);
      setForgotStep(2);
      alert('✅ OTP మీ email కి పంపబడింది!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Step 2 — OTP verify చేయి → role='reset' తో login అవు
  const handleVerifyForgotOTP = async () => {
    if (!forgotOTP || forgotOTP.length < 6) {
      alert('6-digit OTP enter చేయండి');
      return;
    }
    setLoading(true);
    const result = await verifyOTPAndLogin(forgotUserId, forgotOTP);
    setLoading(false);
    if (result.success) {
      resetForgot();
      onLoginSuccess('reset'); // ← App లో Change Password screen చూపిస్తుంది
    } else {
      alert('Invalid OTP: ' + result.error);
    }
  };

  // ==================
  // SCREENS
  // ==================

  // Role Select
  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <LanguageToggle />
        <Text style={styles.appTitle}>🏫 {T.appName}</Text>
        <Text style={styles.subtitle}>{T.whoAreYou}</Text>
        {[
          { role: 'admin',   label: T.admin,   color: '#e53935', icon: '🔴' },
          { role: 'teacher', label: T.teacher, color: '#f57c00', icon: '🟡' },
          { role: 'student', label: T.student, color: '#388e3c', icon: '🟢' },
          { role: 'parent',  label: T.parent,  color: '#1565c0', icon: '🔵' },
        ].map((item) => (
          <TouchableOpacity
            key={item.role}
            style={[styles.roleBtn, { backgroundColor: item.color }]}
            onPress={() => setMode(item.role === 'student' ? 'student' : 'email')}>
            <Text style={styles.roleBtnText}>{item.icon} {item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Email Login + Forgot Password
  if (mode === 'email') {

    // Forgot Step 1 — Email
    if (forgotMode && forgotStep === 1) {
      return (
        <View style={styles.container}>
          <LanguageToggle />
          <Text style={styles.appTitle}>🏫 {T.appName}</Text>
          <Text style={styles.subtitle}>🔑 Password మర్చిపోయారా?</Text>
          <Text style={styles.hintText}>
            మీ Email enter చేయండి{'\n'}OTP తో login చేయవచ్చు!
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#999"
            value={forgotEmail}
            onChangeText={setForgotEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {loading
            ? <ActivityIndicator color="white" size="large" />
            : <TouchableOpacity style={styles.submitBtn} onPress={handleSendForgotOTP}>
                <Text style={styles.submitBtnText}>📧 OTP పంపు</Text>
              </TouchableOpacity>
          }
          <TouchableOpacity onPress={resetForgot}>
            <Text style={styles.linkText}>← Login కి వెళ్ళు</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Forgot Step 2 — OTP Verify (Student OTP screen తో same గా)
    if (forgotMode && forgotStep === 2) {
      return (
        <View style={styles.container}>
          <LanguageToggle />
          <Text style={styles.appTitle}>🏫 {T.appName}</Text>
          <Text style={styles.subtitle}>📧 OTP నమోదు చేయండి</Text>
          <Text style={styles.hintText}>📧 {forgotEmail} కి OTP వచ్చింది</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="6-digit OTP"
            placeholderTextColor="#999"
            value={forgotOTP}
            onChangeText={setForgotOTP}
            keyboardType="number-pad"
            maxLength={6}
          />
          {loading
            ? <ActivityIndicator color="white" size="large" />
            : <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyForgotOTP}>
                <Text style={styles.submitBtnText}>✅ OTP తో Login చేయి</Text>
              </TouchableOpacity>
          }
          <TouchableOpacity onPress={() => { setForgotStep(1); setForgotOTP(''); }}>
            <Text style={styles.linkText}>← మళ్ళీ OTP పంపు</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Normal Login
    return (
      <View style={styles.container}>
        <LanguageToggle />
        <Text style={styles.appTitle}>🏫 {T.appName}</Text>
        <Text style={styles.subtitle}>{T.loginWithEmail}</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loading
          ? <ActivityIndicator color="white" size="large" />
          : <TouchableOpacity style={styles.submitBtn} onPress={handleEmailLogin}>
              <Text style={styles.submitBtnText}>{T.login}</Text>
            </TouchableOpacity>
        }
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => {
            setForgotEmail(email);
            setForgotMode(true);
            setForgotStep(1);
          }}>
          <Text style={styles.forgotText}>🔑 Password మర్చిపోయారా?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('select')}>
          <Text style={styles.linkText}>← వెనక్కి వెళ్ళు</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Student OTP — Email
  if (mode === 'student') {
    return (
      <View style={styles.container}>
        <LanguageToggle />
        <Text style={styles.appTitle}>🏫 {T.appName}</Text>
        <Text style={styles.subtitle}>🟢 విద్యార్థి Login</Text>
        <Text style={styles.hintText}>మీ Email తో OTP తీసుకొని login చేయండి!</Text>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {loading
          ? <ActivityIndicator color="white" size="large" />
          : <TouchableOpacity style={styles.submitBtn} onPress={handleSendOTP}>
              <Text style={styles.submitBtnText}>📧 OTP పంపు</Text>
            </TouchableOpacity>
        }
        <TouchableOpacity onPress={() => setMode('select')}>
          <Text style={styles.linkText}>← వెనక్కి వెళ్ళు</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Student OTP — Verify
  if (mode === 'otp') {
    return (
      <View style={styles.container}>
        <LanguageToggle />
        <Text style={styles.appTitle}>🏫 {T.appName}</Text>
        <Text style={styles.subtitle}>OTP నమోదు చేయండి</Text>
        <Text style={styles.hintText}>📧 {email} కి OTP వచ్చింది</Text>
        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder="6-digit OTP"
          placeholderTextColor="#999"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        {loading
          ? <ActivityIndicator color="white" size="large" />
          : <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyOTP}>
              <Text style={styles.submitBtnText}>✅ {T.verifyOTP}</Text>
            </TouchableOpacity>
        }
        <TouchableOpacity onPress={() => { setMode('student'); setOtp(''); }}>
          <Text style={styles.linkText}>← మళ్ళీ OTP పంపు</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'SreeKrushnadevaraya',
  },
  subtitle: {
    fontSize: 20,
    color: '#e8f0fe',
    marginBottom: 25,
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#e8f0fe',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
  roleBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  roleBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: 'BalooTammudu2',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  forgotBtn: { marginBottom: 15 },
  forgotText: {
    color: '#e8f0fe',
    fontSize: 15,
    fontFamily: 'SreeKrushnadevaraya',
  },
  linkText: {
    color: '#e8f0fe',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
    marginTop: 5,
  },
});