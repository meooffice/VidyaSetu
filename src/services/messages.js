import { databases, client, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Message పంపు
export const sendMessage = async (senderId, receiverId, content) => {
  try {
    console.log('Sending message from:', senderId, 'to:', receiverId);
    const result = await databases.createDocument(
      DB, C.messages, ID.unique(),
      {
        senderId,
        receiverId,
        content,
        isRead: false,
        sentAt: new Date().toISOString(),
      }
    );
    console.log('Message sent:', result.$id);
    return { success: true, message: result };
  } catch (error) {
    console.log('sendMessage error:', error.message);
    return { success: false, error: error.message };
  }
};

// Conversation తీసుకో — Simple approach
export const getConversation = async (userId1, userId2) => {
  try {
    console.log('Getting conversation:', userId1, '<->', userId2);

    // Method 1: senderId తో filter చేయి
    const sentByUser1 = await databases.listDocuments(
      DB, C.messages,
      [Query.equal('senderId', userId1),
       Query.limit(100)]
    );
    console.log('Sent by user1:', sentByUser1.documents.length);

    await new Promise(r => setTimeout(r, 200));

    // Method 2: senderId తో filter చేయి
    const sentByUser2 = await databases.listDocuments(
      DB, C.messages,
      [Query.equal('senderId', userId2),
       Query.limit(100)]
    );
    console.log('Sent by user2:', sentByUser2.documents.length);

    // Filter — conversation కి relevant messages మాత్రమే
    const user1Messages = sentByUser1.documents.filter(m => m.receiverId === userId2);
    const user2Messages = sentByUser2.documents.filter(m => m.receiverId === userId1);

    console.log('User1 sent to user2:', user1Messages.length);
    console.log('User2 sent to user1:', user2Messages.length);

    // Debug — userId2 check చేయి
    sentByUser2.documents.forEach(m => {
      console.log('Message receiverId:', m.receiverId, '=== userId1:', userId1, '?', m.receiverId === userId1);
    });

    const conversation = [
      ...user1Messages,
      ...user2Messages,
    ].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

    console.log('Conversation messages:', conversation.length);
    return { success: true, data: conversation };
  } catch (error) {
    console.log('getConversation error:', error.message);
    return { success: false, error: error.message };
  }
};

// Unread messages count
export const getUnreadMessages = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.messages,
      [Query.equal('receiverId', userId),
       Query.equal('isRead', false)]
    );
    return { success: true, count: result.total };
  } catch (error) {
    return { success: false, count: 0 };
  }
};

// Message read చేయి
export const markMessageRead = async (messageId) => {
  try {
    await databases.updateDocument(
      DB, C.messages, messageId,
      { isRead: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// User కి వచ్చిన conversations
export const getMyConversations = async (userId) => {
  try {
    const sent = await databases.listDocuments(
      DB, C.messages,
      [Query.equal('senderId', userId),
       Query.orderDesc('sentAt'),
       Query.limit(50)]
    );
    await new Promise(r => setTimeout(r, 300));
    const received = await databases.listDocuments(
      DB, C.messages,
      [Query.equal('receiverId', userId),
       Query.orderDesc('sentAt'),
       Query.limit(50)]
    );

    const contactIds = new Set();
    [...sent.documents, ...received.documents].forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      contactIds.add(otherId);
    });

    return { success: true, contactIds: Array.from(contactIds) };
  } catch (error) {
    return { success: false, contactIds: [] };
  }
};

// Real-time subscription
export const subscribeToMessages = (userId, onNewMessage) => {
  try {
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.messages}.documents`,
      (response) => {
        if (response.events.some(e => e.includes('.create'))) {
          const msg = response.payload;
          // మనకు వచ్చిన message అయితే మాత్రమే
          if (msg.receiverId === userId) {
            console.log('New message received:', msg.content);
            onNewMessage(msg);
          }
        }
      }
    );
    return unsubscribe; // cleanup కోసం
  } catch (e) {
    console.log('Subscribe error:', e.message);
    return null;
  }
};