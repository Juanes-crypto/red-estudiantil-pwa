import { useState, useEffect, useRef } from 'react';
// Removed unused imports
import { type ICFESQuestion, MODULOS_CONFIG } from '../lib/gemini';
import { startICFESChat, sendMessageToChat } from '../lib/gemini';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    type?: 'text' | 'question' | 'feedback';
    questionData?: ICFESQuestion;
    options?: { value: string; label: string }[];
}

interface Props {
    studentName: string;
    apiKey: string;
    module: string;
    onBack: () => void;
}

export default function ICFESChat({ studentName, apiKey, module, onBack }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatSession, setChatSession] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const moduleInfo = MODULOS_CONFIG[module as keyof typeof MODULOS_CONFIG];

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Chat
    useEffect(() => {
        const initChat = async () => {
            setLoading(true);
            try {
                const { chat, initialMessage } = await startICFESChat(apiKey, module, studentName);
                setChatSession(chat);
                setMessages([
                    {
                        id: 'init',
                        role: 'model',
                        text: initialMessage,
                        type: 'text'
                    }
                ]);
            } catch (error) {
                console.error('Error starting chat:', error);
                setMessages([
                    {
                        id: 'error',
                        role: 'model',
                        text: '❌ Lo siento, hubo un error al iniciar el chat. Por favor verifica tu API Key.',
                        type: 'text'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        initChat();
    }, [apiKey, module, studentName]);

    const handleSend = async (text: string) => {
        if (!text.trim() || !chatSession) return;

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            type: 'text'
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Send to Gemini
            const responseText = await sendMessageToChat(chatSession, text);

            // Parse response to check if it contains a JSON question
            // Gemini might return JSON wrapped in markdown code blocks
            let aiMsgType: 'text' | 'question' | 'feedback' = 'text';
            let questionData: ICFESQuestion | undefined;
            let displayText = responseText;

            // 1. Extract JSON string
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const jsonStr = jsonMatch[0];
                    const parsed = JSON.parse(jsonStr);

                    // It's a question!
                    if (parsed.enunciado && parsed.opcion_a) {
                        aiMsgType = 'question';
                        const { grafico_svg, ...restOfParsed } = parsed; // Exclude grafico_svg
                        questionData = {
                            id: `chat-${Date.now()}`,
                            modulo: module,
                            ...restOfParsed
                        };

                        // Remove JSON from display text to show only the motivational part
                        // Also remove any markdown code fences that might surround it
                        displayText = responseText.replace(/```json\s*\{[\s\S]*\}\s*```/, '') // Try removing fenced block first
                            .replace(jsonStr, '') // Fallback to removing just the JSON
                            .trim();

                        // If text is empty after removal (rare), use default
                        if (!displayText) {
                            displayText = "¡Aquí tienes una nueva pregunta para practicar! 👇";
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse potential JSON in chat response', e);
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: displayText,
                type: aiMsgType,
                questionData: questionData
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: '⚠️ Hubo un error de conexión. Intenta de nuevo.',
                type: 'text'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = (option: string, label: string) => {
        handleSend(`Elijo la opción ${option}: ${label}`);
    };

    return (
        <div className="flex flex-col h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            {/* Header */}
            <div className={`bg-gradient-to-r ${moduleInfo.color} p-4 text-white flex items-center justify-between shadow-md z-10`}>
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{moduleInfo.icon}</div>
                    <div>
                        <h3 className="font-bold text-lg">{moduleInfo.nombre}</h3>
                        <p className="text-xs opacity-90">Tutor IA Personalizado</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                                }`}
                        >
                            {/* Text Content */}
                            <div className="markdown-content leading-relaxed break-words w-full overflow-hidden">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 break-words" {...props} />,
                                        strong: ({ node, ...props }) => <span className="font-bold text-blue-700" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-300 pl-4 italic my-2" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>

                            {/* Question Card (if applicable) */}
                            {msg.type === 'question' && msg.questionData && (
                                <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 w-full">
                                    <h4 className="font-bold text-slate-900 mb-3 break-words">{msg.questionData.enunciado}</h4>
                                    <div className="space-y-2">
                                        {[
                                            { val: 'A', txt: msg.questionData.opcion_a },
                                            { val: 'B', txt: msg.questionData.opcion_b },
                                            { val: 'C', txt: msg.questionData.opcion_c },
                                            { val: 'D', txt: msg.questionData.opcion_d }
                                        ].map((opt) => (
                                            <button
                                                key={opt.val}
                                                onClick={() => handleOptionClick(opt.val, opt.txt)}
                                                disabled={loading}
                                                className="w-full text-left p-3 rounded-lg border border-slate-300 hover:bg-blue-50 hover:border-blue-300 transition-all flex gap-3 group"
                                            >
                                                <span className="font-bold text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {opt.val}
                                                </span>
                                                <span className="text-sm text-slate-700">{opt.txt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu respuesta o pregunta..."
                        className="flex-1 p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-blue-500/30"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
