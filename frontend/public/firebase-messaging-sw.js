importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAx0ZBWVYBIiHQ8dpnrcbmIiutx9PPEhpc",
  authDomain: "supportflow-app-2ce28.firebaseapp.com",
  projectId: "supportflow-app-2ce28",
  storageBucket: "supportflow-app-2ce28.firebasestorage.app",
  messagingSenderId: "43565030150",
  appId: "1:43565030150:web:21c3f7eae5f6c9e1bb9c87"
});

const messaging = firebase.messaging();

// Handle Background Push Notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM Service Worker] Background Notification received:', payload);

  const notificationTitle = payload.notification.title || 'SupportFlow Alert';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new support ticket update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
