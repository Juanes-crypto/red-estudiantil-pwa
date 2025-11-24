// ================================================
// ICFES TRAINING - Componente Principal
// ================================================
// Sistema de entrenamiento con IA personalizada
// ================================================

import { useState } from 'react';
import { Button, Card, Loading, ErrorDisplay, Badge } from './ui';
import { ICFESService } from '../lib/services';
import {
    getModuleGreeting,
    getAnswerFeedback,
    MODULOS_CONFIG,
    getFormattedOptions,
    type ICFESQuestion
} from '../lib/gemini';

interface Props {
    studentId: string;
    studentName: string;
    apiKey: string;
    onConfigureApiKey: () => void;
}

type ViewState = 'modules' | 'question' | 'feedback';

export default function ICFESTraining({ studentId, studentName, apiKey, onConfigureApiKey }: Props) {
    const [view, setView] = useState<ViewState>('modules');
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<ICFESQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [aiGreeting, setAiGreeting] = useState<string>('');
    const [aiFeedback, setAiFeedback] = useState<string>('');
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    // Seleccionar módulo y obtener saludo de IA
    const handleModuleSelect = async (modulo: string) => {
        setSelectedModule(modulo);
        setLoading(true);
        setError(null);

        try {
            // Obtener saludo de IA
            const greeting = await getModuleGreeting(apiKey, modulo, studentName);
            setAiGreeting(greeting);

            // Cargar primera pregunta
            await loadNextQuestion(modulo);
            setView('question');
        } catch (err: any) {
            console.error('Error:', err);
            setError('Error al cargar el módulo. Verifica tu API Key.');
        } finally {
            setLoading(false);
        }
    };

    const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);

    // Cargar siguiente pregunta
    const loadNextQuestion = async (modulo: string) => {
        try {
            setLoading(true);

            // 1. Intentar obtener de BD excluyendo las vistas
            let question = await ICFESService.getRandomQuestion(modulo, seenQuestionIds);

            // 2. Si no hay en BD (o se acabaron), generar con IA
            if (!question) {
                console.log('📭 Se acabaron las preguntas en BD. Generando con IA...');
                const { generateICFESQuestion } = await import('../lib/gemini');
                const aiQuestion = await generateICFESQuestion(apiKey, modulo);

                // Guardar en BD para tener ID real y contribuir al pool (Escalabilidad)
                question = await ICFESService.saveGeneratedQuestion(aiQuestion);
            }

            if (question) {
                setCurrentQuestion(question);
                setSeenQuestionIds(prev => [...prev, question.id]);
                setSelectedAnswer(null);
            }
        } catch (err: any) {
            setError('Error al cargar pregunta');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Enviar respuesta
    const handleSubmitAnswer = async () => {
        if (!selectedAnswer || !currentQuestion) return;

        setLoading(true);
        setError(null);

        try {
            const correct = selectedAnswer === currentQuestion.respuesta_correcta;
            setIsCorrect(correct);

            // Guardar intento en BD
            // Nota: Si la pregunta es de IA y falló el guardado, esto podría fallar por FK.
            // Pero saveGeneratedQuestion retorna la original si falla, así que manejamos el error silenciosamente en el servicio.
            if (!currentQuestion.id.toString().startsWith('ai-')) {
                await ICFESService.createAttempt({
                    student_id: studentId,
                    question_id: currentQuestion.id,
                    respuesta_estudiante: selectedAnswer,
                    es_correcta: correct
                });
            }

            // Obtener feedback de IA
            const feedback = await getAnswerFeedback(
                apiKey,
                currentQuestion,
                selectedAnswer,
                correct,
                studentName
            );
            setAiFeedback(feedback);
            setQuestionsAnswered(prev => prev + 1);
            setView('feedback');
        } catch (err: any) {
            console.error('Error:', err);
            setError('Error al procesar respuesta');
        } finally {
            setLoading(false);
        }
    };

    // Siguiente pregunta
    const handleNextQuestion = () => {
        if (selectedModule && !loading) {
            loadNextQuestion(selectedModule);
            setView('question');
            setAiFeedback('');
            setSelectedAnswer(null);
        }
    };

    // Volver a módulos
    const handleBackToModules = () => {
        setView('modules');
        setSelectedModule(null);
        setCurrentQuestion(null);
        setAiGreeting('');
        setQuestionsAnswered(0);
        setSeenQuestionIds([]);
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

                {loading && <Loading text="Cargando módulo..." />}
                {error && <ErrorDisplay error={error} />}
            </div>
        );
    }

    // RENDER: Pregunta
    if (view === 'question' && currentQuestion) {
        const options = getFormattedOptions(currentQuestion);
        const moduloInfo = MODULOS_CONFIG[selectedModule as keyof typeof MODULOS_CONFIG];

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Badge variant="info">
                        {moduloInfo.icon} {moduloInfo.nombre}
                    </Badge>
                    <Badge variant="success">
                        Pregunta #{questionsAnswered + 1}
                    </Badge>
                </div>

                {/* Saludo de IA (primera pregunta) */}
                {aiGreeting && questionsAnswered === 0 && (
                    <Card className="bg-cyan-900/20 border-cyan-700">
                        <div className="flex gap-3">
                            <div className="text-3xl">🤖</div>
                            <div className="flex-1">
                                <p className="text-cyan-300 whitespace-pre-line">{aiGreeting}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Pregunta */}
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-6">
                        {currentQuestion.enunciado}
                    </h3>

                    <div className="space-y-3">
                        {options.map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedAnswer === option.value
                                        ? 'border-cyan-500 bg-cyan-900/30'
                                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option.value}
                                    checked={selectedAnswer === option.value}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                    className="mt-1 accent-cyan-500"
                                />
                                <div className="flex-1">
                                    <span className="font-semibold text-cyan-400">{option.value}.</span>{' '}
                                    <span className="text-white">{option.label}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>

                {/* Botones */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleBackToModules}
                        disabled={loading}
                    >
                        ← Cambiar Módulo
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitAnswer}
                        disabled={!selectedAnswer || loading}
                        loading={loading}
                        fullWidth
                    >
                        {loading ? 'Procesando...' : 'Enviar Respuesta →'}
                    </Button>
                </div>

                {error && <ErrorDisplay error={error} />}
            </div>
        );
    }

    // RENDER: Feedback
    if (view === 'feedback') {
        return (
            <div className="space-y-6">
                {/* Resultado */}
                <Card className={isCorrect ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}>
                    <div className="text-center mb-4">
                        <div className="text-6xl mb-3">
                            {isCorrect ? '✅' : '📚'}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {isCorrect ? '¡Respuesta Correcta!' : 'Sigue Aprendiendo'}
                        </h3>
                        <Badge variant={isCorrect ? 'success' : 'warning'} size="md">
                            Respuesta correcta: {currentQuestion?.respuesta_correcta}
                        </Badge>
                    </div>

                    {/* Feedback de IA */}
                    <div className="bg-zinc-900/50 rounded-lg p-4">
                        <div className="flex gap-3">
                            <div className="text-2xl">🤖</div>
                            <div className="flex-1">
                                <p className="text-white whitespace-pre-line leading-relaxed">
                                    {aiFeedback}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Estadísticas */}
                <Card>
                    <div className="text-center">
                        <p className="text-zinc-400 text-sm mb-2">Preguntas respondidas en esta sesión</p>
                        <p className="text-3xl font-bold text-cyan-400">{questionsAnswered}</p>
                    </div>
                </Card>

                {/* Botones */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleBackToModules}
                        disabled={loading}
                    >
                        ← Cambiar Módulo
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleNextQuestion}
                        disabled={loading}
                        loading={loading}
                        fullWidth
                    >
                        {loading ? 'Cargando...' : 'Siguiente Pregunta →'}
                    </Button>
                </div>
            </div>
        );
    }

    return <Loading />;
}
