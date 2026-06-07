import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { sendMessage, getConversation, getMyConversations, subscribeToMessages } from '../../services/messages';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ✅ Custom Alert Modal — alert() కి replacement
function CustomAlert({ visible, type, title, message, onClose }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
          </Text>
          <Text style={modalStyles.title}>{title}</Text>
          {message ? <Text style={modalStyles.message}>{message}</Text> : null}
          <TouchableOpacity style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>సరే</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'SreeKrushnadevaraya',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: 'SreeKrushnadevaraya',
  },
  btn: {
    backgroundColor: '#f57c00',
    paddingVertical: 11,
    paddingHorizontal: 40,
    borderRadius: 9,
    marginTop: 4,
  },
  btnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});

// ✅ Main TeacherMessagingScreen
export default function TeacherMessagingScreen({ onBack, userId }) {
  const TEACHER_ID = userId;

  const [mode, setMode] = useState('list');
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (type, title, message) => {
    setAlert({ visible: true, type, title, message });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadParents(); }, []);

  useEffect(() => {
    if (mode !== 'chat' || !selectedParent) return;
    const unsubscribe = subscribeToMessages(TEACHER_ID, (newMsg) => {
      if (newMsg.senderId === selectedParent.$id) {
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [mode, selectedParent]);

  const loadParents = async () => {
    setLoading(true);
    try {
      const allUsers = await databases.listDocuments(DB, C.users);
      const parentList = allUsers.documents.filter(u => u.role === 'parent');
      setParents(parentList);
    } catch (e) {
      console.log('Error:', e.message);
    }
    setLoading(false);
  };

  const openChat = async (parent) => {
    setSelectedParent(parent);
    setMode('chat');
    loadMessages(parent.$id);
  };

  const loadMessages = async (parentId) => {
    setLoading(true);
    const result = await getConversation(TEACHER_ID, parentId);
    if (result.success) setMessages(result.data);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const result = await sendMessage(TEACHER_ID, selectedParent.$id, newMessage.trim());
    setSending(false);
    if (result.success) {
      setMessages(prev => [...prev, result.message]);
      setNewMessage('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('te-IN', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('te-IN');

  // CHAT Screen
  if (mode === 'chat' && selectedParent) {
    return (
      <View style={styles.container}>
        {/* Custom Alert Modal */}
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={closeAlert}
        />

        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => { setMode('list'); setMessages([]); }}
            style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatHeaderAvatarText}>
              {selectedParent.name?.charAt(0) || 'P'}
            </Text>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedParent.name}</Text>
            <Text style={styles.chatHeaderRole}>తల్లిదండ్రులు</Text>
          </View>
        </View>

        {loading
          ? <ActivityIndicator color="#f57c00" size="large" style={{ flex: 1 }} />
          : <ScrollView
              ref={scrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}>
              {messages.length === 0
                ? <View style={styles.noMessagesBox}>
                    <Text style={styles.noMessagesText}>💬 మొదటి message పంపండి!</Text>
                  </View>
                : messages.map((msg, index) => {
                    const isMine = msg.senderId === TEACHER_ID;
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

  // PARENTS LIST Screen
  return (
    <View style={styles.container}>
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <Text style={styles.headerSub}>తల్లిదండ్రులతో సంభాషణ</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#f57c00" size="large" style={{ marginTop: 30 }} />
          : parents.length === 0
            ? <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>తల్లిదండ్రులు లేరు</Text>
                <Text style={styles.emptySub}>Admin తల్లిదండ్రులను add చేసిన తర్వాత కనిపిస్తారు</Text>
              </View>
            : parents.map((parent) => (
                <TouchableOpacity
                  key={parent.$id}
                  style={styles.contactCard}
                  onPress={() => openChat(parent)}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {parent.name?.charAt(0) || 'P'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{parent.name}</Text>
                    <Text style={styles.contactRole}>👨‍👩‍👧 తల్లిదండ్రులు</Text>
                    {parent.phone && (
                      <Text style={styles.contactPhone}>📞 {parent.phone}</Text>
                    )}
                  </View>
                  <Text style={styles.chatArrow}>💬</Text>
                </TouchableOpacity>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#f57c00', padding: 20, paddingTop: 50 },
  chatHeader: { backgroundColor: '#f57c00', padding: 15, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginBottom: 5, marginRight: 10 },
  backBtnText: { color: 'white', fontSize: 20, fontFamily: 'SreeKrushnadevaraya' },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chatHeaderAvatarText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 18, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  chatHeaderRole: { fontSize: 12, color: '#ffe0b2', fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#ffe0b2', fontFamily: 'SreeKrushnadevaraya' },
  content: { flex: 1, padding: 15 },
  messagesContainer: { flex: 1, backgroundColor: '#f0f4f8' },
  messagesContent: { padding: 15, paddingBottom: 10 },
  noMessagesBox: { alignItems: 'center', marginTop: 100 },
  noMessagesText: { fontSize: 16, color: '#999', fontFamily: 'SreeKrushnadevaraya' },
  dateSeparator: { textAlign: 'center', fontSize: 12, color: '#999', marginVertical: 10, fontFamily: 'BalooTammudu2' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 6 },
  myMessage: { backgroundColor: '#f57c00', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: 'white', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 20, fontFamily: 'SreeKrushnadevaraya' },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#333' },
  messageTime: { fontSize: 11, marginTop: 4, fontFamily: 'BalooTammudu2' },
  myMessageTime: { color: '#ffe0b2', textAlign: 'right' },
  theirMessageTime: { color: '#999' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  messageInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 15, maxHeight: 100, color: '#333', fontFamily: 'SreeKrushnadevaraya', marginRight: 8 },
  sendBtn: { backgroundColor: '#f57c00', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#bdbdbd' },
  sendBtnText: { fontSize: 20 },
  emptyBox: { backgroundColor: 'white', borderRadius: 15, padding: 30, alignItems: 'center', marginTop: 30 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyText: { fontSize: 18, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#999', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  contactCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  contactAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1565c0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactAvatarText: { color: 'white', fontSize: 22, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  contactRole: { fontSize: 13, color: '#888', fontFamily: 'SreeKrushnadevaraya', marginTop: 2 },
  contactPhone: { fontSize: 12, color: '#666', fontFamily: 'BalooTammudu2', marginTop: 2 },
  chatArrow: { fontSize: 24 },
});