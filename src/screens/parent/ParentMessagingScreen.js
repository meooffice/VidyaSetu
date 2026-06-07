import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { sendMessage, getConversation, subscribeToMessages } from '../../services/messages';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ─── Custom Alert Modal ───────────────────────────────────────────────────────
function AlertModal({ visible, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.message}>{message}</Text>
          <TouchableOpacity style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>సరే</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentMessagingScreen({ onBack, userId }) {
  const PARENT_ID = userId;

  const [mode, setMode] = useState('list');
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Alert modal state
  const [alertMsg, setAlertMsg] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const showAlert = (msg) => { setAlertMsg(msg); setAlertVisible(true); };

  useEffect(() => { loadTeachers(); }, []);

  // ─── Real-time subscription for incoming messages ─────────────────────────
  useEffect(() => {
    if (mode !== 'chat' || !selectedTeacher) return;

    console.log('🔔 Subscribing for PARENT_ID:', PARENT_ID);
    console.log('🔔 Expecting messages from teacher:', selectedTeacher.$id);

    const unsubscribe = subscribeToMessages(PARENT_ID, (newMsg) => {
      console.log('📨 Raw msg:', JSON.stringify(newMsg));
      console.log('📨 senderId:', newMsg.senderId, '| expected:', selectedTeacher.$id);
      console.log('📨 Match?', newMsg.senderId === selectedTeacher.$id);

      if (newMsg.senderId === selectedTeacher.$id) {
        console.log('✅ Adding to UI');
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        console.log('⛔ Skipped — sender mismatch');
      }
    });

    console.log('🔔 unsubscribe type:', typeof unsubscribe);

    return () => {
      console.log('🔕 Unsubscribing...');
      if (unsubscribe) unsubscribe();
    };
  }, [mode, selectedTeacher]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const result = await databases.listDocuments(
        DB, C.users,
        [Query.equal('role', 'teacher')]
      );
      setTeachers(result.documents);
      console.log('Teachers loaded:', result.documents.length);
    } catch (e) {
      console.log('Error:', e.message);
      setTeachers([]);
    }
    setLoading(false);
  };

  const openChat = async (teacher) => {
    setMessages([]);
    setSelectedTeacher(teacher);
    setMode('chat');
    setLoading(true);
    const result = await getConversation(PARENT_ID, teacher.$id);
    if (result.success) setMessages(result.data);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const result = await sendMessage(PARENT_ID, selectedTeacher.$id, newMessage.trim());
    setSending(false);
    if (result.success) {
      setMessages(prev => [...prev, result.message]);
      setNewMessage('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      showAlert('❌ Error: ' + result.error);
    }
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('te-IN', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('te-IN');

  // ── Chat View ──
  if (mode === 'chat' && selectedTeacher) {
    return (
      <View style={styles.container}>

        <AlertModal
          visible={alertVisible}
          message={alertMsg}
          onClose={() => setAlertVisible(false)}
        />

        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => { setMode('list'); setMessages([]); }}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatHeaderAvatarText}>
              {selectedTeacher.name?.charAt(0) || 'T'}
            </Text>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedTeacher.name}</Text>
            <Text style={styles.chatHeaderRole}>👨‍🏫 టీచర్</Text>
          </View>
        </View>

        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ flex: 1 }} />
          : <ScrollView
              ref={scrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}>
              {messages.length === 0
                ? <View style={styles.noMessagesBox}>
                    <Text style={styles.noMessagesText}>💬 మొదటి message పంపండి!</Text>
                  </View>
                : messages.map((msg, index) => {
                    const isMine = msg.senderId === PARENT_ID;
                    const showDate = index === 0 ||
                      formatDate(messages[index - 1].sentAt) !== formatDate(msg.sentAt);
                    return (
                      <View key={msg.$id}>
                        {showDate && (
                          <Text style={styles.dateSeparator}>{formatDate(msg.sentAt)}</Text>
                        )}
                        <View style={[styles.messageBubble,
                          isMine ? styles.myMessage : styles.theirMessage]}>
                          <Text style={[styles.messageText,
                            isMine ? styles.myMessageText : styles.theirMessageText]}>
                            {msg.content}
                          </Text>
                          <Text style={[styles.messageTime,
                            isMine ? styles.myMessageTime : styles.theirMessageTime]}>
                            {formatTime(msg.sentAt)}
                            {isMine && (msg.isRead ? ' ✓✓' : ' ✓')}
                          </Text>
                        </View>
                      </View>
                    );
                  })
              }
            </ScrollView>
        }

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Message రాయండి..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}>
            {sending
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.sendBtnText}>📤</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Teacher List View ──
  return (
    <View style={styles.container}>

      <AlertModal
        visible={alertVisible}
        message={alertMsg}
        onClose={() => setAlertVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtnRow}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 టీచర్ తో మాట్లాడు</Text>
        <Text style={styles.headerSub}>Teacher Messaging</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#1565c0" size="large" style={{ marginTop: 30 }} />
          : teachers.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>టీచర్లు లేరు</Text>
              </View>
            : teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.$id}
                  style={styles.contactCard}
                  onPress={() => openChat(teacher)}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {teacher.name?.charAt(0) || 'T'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{teacher.name}</Text>
                    <Text style={styles.contactRole}>👨‍🏫 టీచర్</Text>
                  </View>
                  <Text style={styles.chatArrow}>💬</Text>
                </TouchableOpacity>
              ))
        }
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1565c0', padding: 20, paddingTop: 50 },
  chatHeader: {
    backgroundColor: '#1565c0',
    padding: 15,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnRow: { marginBottom: 5 },
  backBtnText: {
    color: 'white', fontSize: 20,
    fontFamily: 'SreeKrushnadevaraya', marginRight: 10,
  },
  chatHeaderAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  chatHeaderAvatarText: {
    color: 'white', fontSize: 18, fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: {
    fontSize: 18, fontWeight: 'bold', color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  chatHeaderRole: { fontSize: 12, color: '#bbdefb', fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: { fontSize: 14, color: '#bbdefb', fontFamily: 'SreeKrushnadevaraya' },
  content: { flex: 1, padding: 15 },
  messagesContainer: { flex: 1, backgroundColor: '#f0f4f8' },
  messagesContent: { padding: 15, paddingBottom: 10 },
  noMessagesBox: { alignItems: 'center', marginTop: 100 },
  noMessagesText: { fontSize: 16, color: '#999', fontFamily: 'SreeKrushnadevaraya' },
  dateSeparator: {
    textAlign: 'center', fontSize: 12, color: '#999',
    marginVertical: 10, fontFamily: 'BalooTammudu2',
  },
  messageBubble: {
    maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 6,
  },
  myMessage: {
    backgroundColor: '#1565c0', alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'white', alignSelf: 'flex-start',
    borderBottomLeftRadius: 4, elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 20, fontFamily: 'SreeKrushnadevaraya' },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#333' },
  messageTime: { fontSize: 11, marginTop: 4, fontFamily: 'BalooTammudu2' },
  myMessageTime: { color: '#bbdefb', textAlign: 'right' },
  theirMessageTime: { color: '#999' },
  inputContainer: {
    flexDirection: 'row', padding: 10, backgroundColor: 'white',
    alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 15, paddingVertical: 8, fontSize: 15,
    maxHeight: 100, color: '#333', fontFamily: 'SreeKrushnadevaraya', marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#1565c0', width: 44, height: 44,
    borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#bdbdbd' },
  sendBtnText: { fontSize: 20 },
  emptyBox: {
    backgroundColor: 'white', borderRadius: 15, padding: 30,
    alignItems: 'center', marginTop: 30,
  },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyText: { fontSize: 18, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  contactCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 15,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  contactAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#f57c00', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  contactAvatarText: {
    color: 'white', fontSize: 22, fontWeight: 'bold', fontFamily: 'BalooTammudu2',
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya',
  },
  contactRole: { fontSize: 13, color: '#888', fontFamily: 'SreeKrushnadevaraya', marginTop: 2 },
  chatArrow: { fontSize: 24 },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 40,
    alignItems: 'center',
    elevation: 10,
    minWidth: 260,
  },
  message: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
    lineHeight: 26,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});