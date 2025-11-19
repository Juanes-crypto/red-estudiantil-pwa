import { useEffect } from 'react';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging'; // <--- ¡Importamos onMessage!
import { supabase } from '../lib/supabaseClient';

export const useNotifications = () => {

  useEffect(() => {
    const setupNotifications = async () => {
      if (!messaging) return;

      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          console.log('Permiso de notificaciones concedido.');

          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
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
            }
          }
        }
      } catch (error) {
        console.error('Error al configurar notificaciones:', error);
      }
    };

    setupNotifications();

    // --- ¡NUEVO! ESCUCHAR MENSAJES EN PRIMER PLANO ---
    if (messaging) {
      // Esta función se dispara cuando llega una notificación 
      // y tú estás mirando la página web.
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 ¡NOTIFICACIÓN RECIBIDA EN PRIMER PLANO!', payload);
        
        // Mostramos una alerta nativa del navegador o un Toast
        alert(`📢 ${payload.notification?.title}\n${payload.notification?.body}`);
      });

      // Limpieza al desmontar
      return () => {
        unsubscribe();
      };
    }

  }, []);
};