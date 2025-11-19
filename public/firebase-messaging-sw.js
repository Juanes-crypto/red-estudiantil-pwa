// public/firebase-messaging-sw.js

// 1. Importamos los scripts de Firebase desde la nube (CDN)
// (Los Service Workers funcionan así, importando scripts externos)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 2. Configuración de Firebase
// ¡IMPORTANTE! Pega aquí las MISMAS claves que pusiste en tu .env.local
// (Este archivo es público, así que no te preocupes por pegarlas aquí)
const firebaseConfig = {
  apiKey: "AIzaSyDp0txB9lNpN60w57gFXGcJPhSLNXQvh1U",
  authDomain: "pwa-colegial-notificacio-ecb35.firebaseapp.com",
  projectId: "pwa-colegial-notificacio-ecb35",
  storageBucket: "pwa-colegial-notificacio-ecb35.firebasestorage.app",
  messagingSenderId: "94593125524",
  appId: "1:94593125524:web:d5e7d6de333edc56a6b881"
};

// 3. Inicializar Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// 4. Activar el servicio de mensajería en segundo plano
const messaging = firebase.messaging();

// 5. Manejar notificaciones en segundo plano (Opcional, pero útil para debugging)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificación recibida en segundo plano:', payload);
  
  // Personalizamos el título y cuerpo de la notificación
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // Puedes poner tu logo aquí
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});