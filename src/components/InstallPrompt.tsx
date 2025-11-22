// src/components/InstallPrompt.tsx
import { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// Interfaz para el evento nativo de instalación
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string,
    }>;
    prompt(): Promise<void>;
}

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // Obtenemos la función del hook
    const { requestAndSaveToken } = useNotifications();

    useEffect(() => {
        // 1. Capturar el evento de instalación nativo
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // Evitar que el navegador muestre su banner feo
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowInstallBanner(true); // Mostrar nuestro banner bonito
        };

        // 2. Verificar si ya tenemos permiso de notificaciones
        const checkNotificationStatus = async () => {
            if ('Notification' in window && Notification.permission === 'granted') {
                setNotificationsEnabled(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        checkNotificationStatus();

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Manejador para el botón "Instalar App"
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Resultado de instalación: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    // Manejador para el botón "Activar Notificaciones"
    const handleEnableNotifications = async () => {
        setLoading(true);
        const success = await requestAndSaveToken();
        setLoading(false);

        if (success) {
            setNotificationsEnabled(true);
            // Opcional: Usar un toast aquí
            alert('¡Notificaciones activadas!');
        } else {
            // Opcional: Usar un toast de error
            alert('No se pudieron activar las notificaciones. Verifica los permisos de tu navegador.');
        }
    };

    // Si ya está todo instalado y activado, no mostramos nada
    if (!showInstallBanner && notificationsEnabled && !deferredPrompt) {
        return null;
    }

    // Renderizamos el banner fijo en la parte inferior
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-primary-blue-dark text-white shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideInUp">
            <p className="text-sm font-medium text-center sm:text-left">
                📱 ¡Mejora tu experiencia! Instala la app y recibe alertas al instante.
            </p>
            <div className="flex gap-3">
                {!notificationsEnabled && (
                    <button
                        onClick={handleEnableNotifications}
                        disabled={loading}
                        className={`btn-accent px-4 py-2 rounded-lg text-sm font-semibold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Activando...' : '🔔 Activar Notificaciones'}
                    </button>
                )}
                {(showInstallBanner || deferredPrompt) && (
                    <button
                        onClick={handleInstallClick}
                        className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        ⬇️ Instalar App
                    </button>
                )}
            </div>
        </div>
    );
};

export default InstallPrompt;