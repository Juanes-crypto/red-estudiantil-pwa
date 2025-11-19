// 1. Importar funciones de Firebase
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// 2. ¡AQUÍ PEGAS TUS LLAVES DEL PASO 90!
// (Copia los valores que te muestra la web de Firebase)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 3. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 4. Exportar el servicio de mensajería (Messaging)
// Usamos un "try-catch" porque Firebase Messaging a veces falla
// si se ejecuta en un navegador que no soporta notificaciones.
export const messaging = (() => {
  try {
    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging no soportado en este navegador o entorno.", error);
    return null;
  }
})();

export default app;