// ================================================
// ICFES API KEY SETUP - Componente de Configuración
// ================================================
// Modal/Pantalla para que estudiantes configuren su API Key
// ================================================

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button, Input, Card, Modal } from './ui';
import { validateGeminiKey } from '../lib/gemini';
import { supabase } from '../lib/supabaseClient';

interface Props {
    studentId: string;
    studentName: string;
    currentApiKey?: string | null;
    onSave: (apiKey: string) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export default function ICFESApiKeySetup({
    studentId,
    studentName,
    currentApiKey,
    onSave,
    onCancel,
    isModal = true
}: Props) {
    const [apiKey, setApiKey] = useState(currentApiKey || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            setError('Por favor ingresa tu API Key');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Validar que la API key funcione
            const isValid = await validateGeminiKey(apiKey.trim());

            if (!isValid) {
                setError('API Key inválida. Verifica que sea correcta.');
                setLoading(false);
                return;
            }

            // 2. Guardar en la base de datos usando RPC (bypassea RLS)
            const { error: dbError } = await supabase.rpc('update_student_gemini_key', {
                p_student_id: studentId,
                p_api_key: apiKey.trim()
            });

            if (dbError) throw dbError;

            // 3. Éxito
            setSuccess(true);
            setTimeout(() => {
                onSave(apiKey.trim());
            }, 1500);

        } catch (err: any) {
            console.error('Error saving API key:', err);
            setError('Error al guardar. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="space-y-6">
            {/* Título */}
            <div className="text-center">
                <div className="text-5xl mb-3">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Configura tu IA Personal
                </h2>
                <p className="text-zinc-400">
                    Hola <span className="text-cyan-400 font-semibold">{studentName}</span>,
                    para usar el módulo ICFES necesitas tu propia API key de Google Gemini
                </p>
            </div>

            {/* Instrucciones */}
            <Card className="bg-cyan-900/20 border-cyan-700">
                <div className="space-y-4 text-sm">
                    <h3 className="font-semibold text-cyan-300 flex items-center gap-2">
                        📋 Cómo obtener tu API Key (Gratis):
                    </h3>
                    <div className="flex flex-col gap-3">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 group"
                        >
                            <span>🔑 Obtener API Key Gratis</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <p className="text-xs text-center text-zinc-400">
                            (Te llevará a Google AI Studio. Inicia sesión, crea la key y pégala abajo)
                        </p>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-3">
                        <p className="text-yellow-300 text-xs">
                            ⚠️ <strong>Importante:</strong> Tu API key es personal y gratuita.
                            No la compartas con nadie. Puedes cambiarla cuando quieras.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tu Gemini API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    error={error || undefined}
                    disabled={loading || success}
                />

                <div className="min-h-[4rem]">
                    {success && (
                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center animate-fade-in-up">
                            <p className="text-green-300 font-semibold">✅ API Key guardada correctamente</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {onCancel && !success && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={loading}
                            fullWidth
                        >
                            Cancelar
                        </Button>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={success}
                        fullWidth
                    >
                        {loading ? 'Validando...' : currentApiKey ? 'Actualizar API Key' : 'Guardar y Continuar'}
                    </Button>
                </div>
            </form>

            {/* Info adicional */}
            <div className="text-center text-xs text-zinc-500">
                Tu API key se guarda de forma segura y solo tú puedes verla
            </div>
        </div>
    );

    // Render como modal o pantalla completa
    if (isModal && onCancel) {
        return (
            <Modal
                isOpen={true}
                onClose={onCancel}
                title="Configuración ICFES"
            >
                {content}
            </Modal>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card>
                {content}
            </Card>
        </div>
    );
}
