// src/hooks/useNotifications.ts
import { useEffect, useCallback } from 'react';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../lib/supabaseClient';

export const useNotifications = () => {
  // Función para solicitar permiso y obtener/guardar el token (llamada por un botón)
  const requestAndSaveToken = useCallback(async () => {
    if (!messaging) {
      console.warn('Firebase Messaging no está disponible.');
      return false;
    }

    try {
      // 1. Pedir permiso al usuario (debe ser respuesta a un clic)
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido.');

        // 2. Esperar al Service Worker (crucial para Vite/PWA)
        const serviceWorkerRegistration = await navigator.serviceWorker.ready;

        // 3. Obtener el token usando el SW correcto
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: serviceWorkerRegistration
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);

          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            await supabase
              .from('profiles')
              .update({ fcm_token: currentToken })
              .eq('id', user.id);

            console.log('Token guardado/actualizado en Supabase con éxito.');
            return true; // Éxito
          } else {
            console.warn('No se pudo guardar el token: Usuario no identificado.');
            return false;
          }
        }
      } else {
        console.warn('Permiso de notificaciones denegado.');
        return false; // Permiso denegado
      }
    } catch (error: any) {
      console.error('Error al configurar notificaciones:', error);
      // Opcional: Mostrar un toast/alerta aquí si quieres feedback visual del error
      return false;
    }
    return false; // Fallo general
  }, []);

  // useEffect para escuchar mensajes en PRIMER PLANO
  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 ¡NOTIFICACIÓN RECIBIDA EN PRIMER PLANO!', payload);
        // Aquí podrías usar una librería de Toast (ej: react-hot-toast) en lugar de alert
        alert(`📢 ${payload.notification?.title}\n${payload.notification?.body}`);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Devolvemos la función para que pueda ser usada en un botón
  return { requestAndSaveToken };
};