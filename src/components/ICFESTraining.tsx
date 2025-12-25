// ================================================
// ICFES TRAINING - Componente Principal
// ================================================
// Sistema de entrenamiento con IA personalizada (Modo Tarjetas)
// ================================================

import { useState, useEffect } from 'react';
import { Button, Loading, ErrorDisplay, Card, Badge } from './ui';
import {
    MODULOS_CONFIG,
    startICFESChat,
    sendMessageToChat,
    type ICFESQuestion
} from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
    studentId: string;
    studentName: string;
    apiKey: string;
    onConfigureApiKey: () => void;
}

type ViewState = 'modules' | 'question';

export default function ICFESTraining({ studentName, apiKey, onConfigureApiKey }: Props) {
    const [view, setView] = useState<ViewState>('modules');
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado del entrenamiento
    const [chatSession, setChatSession] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<ICFESQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [stats, setStats] = useState({ correct: 0, total: 0 });

    // Helper para parsear JSON de la respuesta de la IA
    const parseQuestionFromResponse = (text: string): ICFESQuestion | null => {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed.enunciado && parsed.opcion_a) {
                    return {
                        id: `q-${Date.now()}`,
                        modulo: selectedModule || '',
                        ...parsed
                    };
                }
            }
        } catch (e) {
            console.warn('Error parsing question JSON:', e);
        }
        return null;
    };

    // Iniciar sesión de entrenamiento
    const startTraining = async (modulo: string) => {
        setLoading(true);
        setError(null);
        try {
            const { chat, initialMessage } = await startICFESChat(apiKey, modulo, studentName);
            setChatSession(chat);

            const question = parseQuestionFromResponse(initialMessage);
            if (question) {
                setCurrentQuestion(question);
                setView('question');
            } else {
                // Si no hay pregunta en el primer mensaje, pedir una explícitamente
                const response = await sendMessageToChat(chat, "Dame la primera pregunta por favor.");
                const retryQuestion = parseQuestionFromResponse(response);
                if (retryQuestion) {
                    setCurrentQuestion(retryQuestion);
                    setView('question');
                } else {
                    throw new Error("No se pudo generar la pregunta. Intenta de nuevo.");
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al iniciar el entrenamiento");
        } finally {
            setLoading(false);
        }
    };

    // Manejar respuesta del estudiante
    const handleAnswer = (option: string) => {
        if (showFeedback) return;
        setSelectedAnswer(option);
        setShowFeedback(true);

        const isCorrect = option === currentQuestion?.respuesta_correcta;
        if (isCorrect) {
            setStats(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
        } else {
            setStats(prev => ({ ...prev, total: prev.total + 1 }));
        }
    };

    // Cargar siguiente pregunta
    const handleNextQuestion = async () => {
        if (!chatSession) return;
        setLoading(true);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setCurrentQuestion(null); // Limpiar para mostrar loading

        try {
            const response = await sendMessageToChat(chatSession, "Dame otra pregunta.");
            const question = parseQuestionFromResponse(response);

            if (question) {
                setCurrentQuestion(question);
            } else {
                // Retry simple
                const retry = await sendMessageToChat(chatSession, "Por favor genera la pregunta en formato JSON.");
                const retryQ = parseQuestionFromResponse(retry);
                if (retryQ) setCurrentQuestion(retryQ);
                else throw new Error("Error al cargar la siguiente pregunta");
            }
        } catch (err) {
            console.error(err);
            setError("Error al cargar la pregunta. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleModuleSelect = (modulo: string) => {
        setSelectedModule(modulo);
        startTraining(modulo);
    };

    const handleBackToModules = () => {
        setView('modules');
        setSelectedModule(null);
        setChatSession(null);
        setCurrentQuestion(null);
        setStats({ correct: 0, total: 0 });
    };

    // RENDER: Selección de módulos
    if (view === 'modules') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">🎓 Entrenamiento ICFES</h2>
                    <p className="text-zinc-400">Selecciona un módulo para comenzar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(MODULOS_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => handleModuleSelect(key)}
                            disabled={loading}
                            className={`bg-gradient-to-br ${config.color} p-6 rounded-lg 
                hover:scale-105 transition-transform text-left group disabled:opacity-50 disabled:hover:scale-100`}
                        >
                            <div className="text-5xl mb-3">{config.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{config.nombre}</h3>
                            <p className="text-white/80 text-sm">{config.descripcion}</p>
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                    <Button variant="secondary" onClick={onConfigureApiKey}>
                        ⚙️ Configurar API Key
                    </Button>
                </div>

                {loading && <Loading text="Iniciando sesión con el Tutor IA..." />}
                {error && <ErrorDisplay error={error} />}
            </div>
        );
    }

    // RENDER: Question Card Mode
    if (view === 'question' && currentQuestion) {
        const moduleInfo = MODULOS_CONFIG[selectedModule as keyof typeof MODULOS_CONFIG];
        const isCorrect = selectedAnswer === currentQuestion.respuesta_correcta;

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBackToModules} className="text-white hover:text-blue-300 transition-colors">
                            ← Salir
                        </button>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${moduleInfo.color}`}>
                            {moduleInfo.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{moduleInfo.nombre}</h3>
                            <p className="text-xs text-zinc-300">Pregunta {stats.total + (showFeedback ? 0 : 1)}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-white border-white/30">
                        Aciertos: {stats.correct}/{stats.total}
                    </Badge>
                </div>

                {/* Question Card */}
                <div className="space-y-8">
                    {/* Question Area */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center min-h-[200px] flex items-center justify-center border-b-4 border-slate-200">
                        <div className="prose prose-xl max-w-none text-slate-800 font-medium">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {currentQuestion.enunciado}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Options Grid - Kahoot Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { val: 'A', txt: currentQuestion.opcion_a, color: 'bg-red-500 hover:bg-red-600 border-red-700', icon: '▲' },
                            { val: 'B', txt: currentQuestion.opcion_b, color: 'bg-blue-500 hover:bg-blue-600 border-blue-700', icon: '◆' },
                            { val: 'C', txt: currentQuestion.opcion_c, color: 'bg-amber-500 hover:bg-amber-600 border-amber-700', icon: '●' },
                            { val: 'D', txt: currentQuestion.opcion_d, color: 'bg-green-500 hover:bg-green-600 border-green-700', icon: '■' }
                        ].map((opt) => {
                            let btnClass = `${opt.color} text-white border-b-4 active:border-b-0 active:translate-y-1`;

                            // Feedback Logic
                            if (showFeedback) {
                                if (opt.val === currentQuestion.respuesta_correcta) {
                                    btnClass = "bg-green-500 border-green-700 text-white ring-4 ring-green-300 scale-105 z-10"; // Correct
                                } else if (opt.val === selectedAnswer) {
                                    btnClass = "bg-red-500 border-red-700 text-white opacity-50"; // Wrong
                                } else {
                                    btnClass = "bg-slate-300 border-slate-400 text-slate-500 opacity-50 grayscale"; // Others
                                }
                            }

                            return (
                                <button
                                    key={opt.val}
                                    onClick={() => handleAnswer(opt.val)}
                                    disabled={showFeedback}
                                    className={`p-6 rounded-xl transition-all duration-200 flex items-center gap-4 shadow-lg ${btnClass}`}
                                >
                                    <div className="bg-black/20 w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold shrink-0 backdrop-blur-sm">
                                        {opt.icon}
                                    </div>
                                    <span className="text-lg md:text-xl font-bold text-left leading-tight shadow-black drop-shadow-md">
                                        {opt.txt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback Section */}
                    {showFeedback && (
                        <div className={`p-6 rounded-2xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl
                            ${isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 text-center md:text-left">
                                <div className={`text-5xl ${isCorrect ? 'animate-bounce' : 'animate-shake'}`}>
                                    {isCorrect ? '🏆' : '😢'}
                                </div>
                                <div>
                                    <h4 className={`text-2xl font-black uppercase ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                        {isCorrect ? '¡Respuesta Correcta!' : '¡Respuesta Incorrecta!'}
                                    </h4>
                                    <p className="text-slate-600 font-medium">
                                        {isCorrect ? '¡Sigue así, vas muy bien!' : 'No te rindas, aprende del error.'}
                                    </p>
                                </div>
                                <div className="flex-1" />
                                <Button
                                    onClick={handleNextQuestion}
                                    disabled={loading}
                                    className="w-full md:w-auto text-lg px-8 py-4 shadow-xl"
                                >
                                    {loading ? 'Cargando...' : 'Siguiente Pregunta ➜'}
                                </Button>
                            </div>

                            <div className="bg-white/50 p-4 rounded-xl border border-black/5">
                                <h5 className="font-bold text-slate-700 mb-2">Explicación:</h5>
                                <div className="text-slate-800 leading-relaxed text-lg">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {currentQuestion.explicacion || "No hay explicación disponible."}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loading text={loading ? "Generando pregunta..." : "Cargando..."} />
        </div>
    );
}
