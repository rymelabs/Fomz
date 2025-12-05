import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';
const USER_NOTIFICATIONS_SUBCOLLECTION = 'notifications';

const buildUserNotificationRef = (userId, notificationId) =>
  doc(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION, notificationId);

const getUserNotificationStateMap = async (userId) => {
  if (!userId) return new Map();
  const snap = await getDocs(
    collection(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION)
  );
  const map = new Map();
  snap.forEach((docSnap) => {
    map.set(docSnap.id, docSnap.data());
  });
  return map;
};

const withUserState = (notifications, stateMap) =>
  notifications.map((notif) => {
    const state = stateMap.get(notif.id) || {};
    return {
      ...notif,
      read: Boolean(state.read),
      delivered: Boolean(state.delivered),
    };
  });

export const getNotifications = async (userId, limitCount = 30) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const [snapshot, stateMap] = await Promise.all([
    getDocs(q),
    getUserNotificationStateMap(userId),
  ]);

  const notifications = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return withUserState(notifications, stateMap);
};

export const subscribeToNotifications = (
  userId,
  callback,
  { limitCount = 30 } = {}
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      try {
        const stateMap = await getUserNotificationStateMap(userId);
        const notifications = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        callback(withUserState(notifications, stateMap));
      } catch (error) {
        console.error('Notification subscription error', error);
      }
    },
    (error) => {
      console.error('Notification subscription failed', error);
    }
  );

  return unsubscribe;
};

export const markNotificationRead = async (userId, notificationId) => {
  if (!userId) return;
  const ref = buildUserNotificationRef(userId, notificationId);
  await setDoc(
    ref,
    { read: true, delivered: true, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

export const markNotificationDelivered = async (userId, notificationId) => {
  if (!userId) return;
  const ref = buildUserNotificationRef(userId, notificationId);
  await setDoc(
    ref,
    { delivered: true, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

export const createNotification = async ({
  title,
  message,
  priority = 'normal',
  createdBy,
}) => {
  const payload = {
    title,
    message,
    priority,
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), payload);
  return { id: docRef.id, ...payload };
};

export const broadcastNotification = async (notificationId) => {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Notification not found');

  await updateDoc(ref, {
    broadcastedAt: serverTimestamp(),
  });

  return { id: notificationId, ...snap.data(), broadcastedAt: serverTimestamp() };
};

/**
 * Create a user-specific notification (stored in user's subcollection)
 * These are personal notifications like "You received a new response"
 */
export const createUserNotification = async (userId, { title, message, type = 'info', link = null, metadata = {} }) => {
  if (!userId) return null;
  
  try {
    const notificationData = {
      title,
      message,
      type,
      link,
      metadata,
      read: false,
      createdAt: serverTimestamp(),
    };
    
    const userNotificationsRef = collection(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION);
    const docRef = await addDoc(userNotificationsRef, notificationData);
    
    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error('Error creating user notification:', error);
    return null;
  }
};

/**
 * Get user's personal notifications
 */
export const getUserNotifications = async (userId, limitCount = 50) => {
  if (!userId) return [];
  
  try {
    const q = query(
      collection(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

/**
 * Subscribe to user's personal notifications
 */
export const subscribeToUserNotifications = (userId, callback, { limitCount = 50 } = {}) => {
  if (!userId) return () => {};
  
  const q = query(
    collection(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(notifications);
    },
    (error) => {
      console.error('User notification subscription failed', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Mark a user notification as read
 */
export const markUserNotificationRead = async (userId, notificationId) => {
  if (!userId) return;
  const ref = doc(db, 'users', userId, USER_NOTIFICATIONS_SUBCOLLECTION, notificationId);
  await updateDoc(ref, { read: true, readAt: serverTimestamp() });
};

/**
 * Create a response notification for form owner
 */
export const createResponseNotification = async (formOwnerId, formId, formTitle) => {
  return createUserNotification(formOwnerId, {
    title: 'New Response Received',
    message: `Your form "${formTitle || 'Untitled Form'}" received a new response.`,
    type: 'response',
    link: `/dashboard/forms/${formId}/responses`,
    metadata: { formId, formTitle }
  });
};