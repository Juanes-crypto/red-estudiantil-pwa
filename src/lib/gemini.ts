// ================================================
// GEMINI AI - Integration Layer
// ================================================
// Google Gemini API para feedback personalizado ICFES
// ================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Interface para preguntas ICFES
 */
export interface ICFESQuestion {
    id: string;
    modulo: string;
    enunciado: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
    respuesta_correcta: string;
    explicacion: string;
}

/**
 * Configuración de módulos ICFES
 */
export const MODULOS_CONFIG = {
    lectura: {
        nombre: 'Lectura Crítica',
        icon: '📖',
        color: 'from-blue-600 to-blue-700',
        descripcion: 'Comprensión y análisis de textos'
    },
    matematicas: {
        nombre: 'Matemáticas',
        icon: '🔢',
        color: 'from-purple-600 to-purple-700',
        descripcion: 'Razonamiento cuantitativo'
    },
    sociales: {
        nombre: 'Ciencias Sociales',
        icon: '🌎',
        color: 'from-green-600 to-green-700',
        descripcion: 'Historia, geografía y ciudadanía'
    },
    ciencias: {
        nombre: 'Ciencias Naturales',
        icon: '⚗️',
        color: 'from-yellow-600 to-yellow-700',
        descripcion: 'Biología, química y física'
    },
    ingles: {
        nombre: 'Inglés',
        icon: '🗣️',
        color: 'from-red-600 to-red-700',
        descripcion: 'Comprensión de lectura en inglés'
    }
};

/**
 * Inicializar cliente Gemini con la API key del estudiante
 */
export function initGemini(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API Key de Gemini requerida');
    }

    return new GoogleGenerativeAI(apiKey);
}

/**
 * Generar saludo de bienvenida al seleccionar módulo
 */
export async function getModuleGreeting(
    apiKey: string,
    modulo: string,
    studentName: string
): Promise<string> {
    try {
        const genAI = initGemini(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const moduloInfo = MODULOS_CONFIG[modulo as keyof typeof MODULOS_CONFIG];

        const prompt = `Eres un tutor motivacional para estudiantes colombianos preparándose para el ICFES.
El estudiante ${studentName} acaba de seleccionar el módulo de ${moduloInfo.nombre}.

Genera un saludo corto (máximo 3 líneas) que:
1. Sea muy motivador y energético
2. Mencione brevemente qué van a practicar
3. Los anime a dar lo mejor de sí

Usa emojis relevantes y un tono amigable pero profesional.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('Error generating greeting:', error);
        // Fallback en caso de error
        const moduloInfo = MODULOS_CONFIG[modulo as keyof typeof MODULOS_CONFIG];
        return `¡Hola ${studentName}! ${moduloInfo.icon} Bienvenido al módulo de ${moduloInfo.nombre}. ¡Vamos a practicar juntos!`;
    }
}

/**
 * Generar feedback personalizado después de responder
 */
export async function getAnswerFeedback(
    apiKey: string,
    question: ICFESQuestion,
    studentAnswer: string,
    isCorrect: boolean,
    studentName: string
): Promise<string> {
    try {
        const genAI = initGemini(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = isCorrect
            ? `Eres un tutor entusiasta del ICFES. El estudiante ${studentName} acaba de responder CORRECTAMENTE esta pregunta:

Pregunta: "${question.enunciado}"
Respuesta correcta: ${question.respuesta_correcta}

Genera un mensaje de felicitación (máximo 4 líneas) que:
1. Felicite calurosamente al estudiante
2. Explique brevemente POR QUÉ esa respuesta es correcta
3. Relacione la explicación con: ${question.explicacion}
4. Lo motive a seguir así

Usa emojis y un tono muy positivo.`
            : `Eres un tutor comprensivo del ICFES. El estudiante ${studentName} respondió INCORRECTAMENTE esta pregunta:

Pregunta: "${question.enunciado}"
Su respuesta: ${studentAnswer}
Respuesta correcta: ${question.respuesta_correcta}

Genera un mensaje motivador (máximo 5 líneas) que:
1. No lo desanime (usar frases como "No te preocupes", "Sigue intentando")
2. Explique claramente por qué la respuesta ${question.respuesta_correcta} es la correcta
3. Use esta explicación: ${question.explicacion}
4. Lo anime a aprender del error

Usa emojis y un tono empático pero educativo.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('Error generating feedback:', error);
        // Fallback en caso de error
        if (isCorrect) {
            return `¡Excelente ${studentName}! ✅ Respuesta correcta. ${question.explicacion}`;
        } else {
            return `No te preocupes ${studentName}. La respuesta correcta es ${question.respuesta_correcta}. ${question.explicacion}`;
        }
    }
}

/**
 * Validar API Key de Gemini
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
    try {
        const genAI = initGemini(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Hacer una consulta simple para validar
        const result = await model.generateContent('Hello');
        await result.response;

        return true;
    } catch (error: any) {
        console.error('❌ Gemini Validation Error:', error);
        return false;
    }
}

/**
 * Obtener opciones formateadas de una pregunta
 */
export function getFormattedOptions(question: ICFESQuestion) {
    return [
        { value: 'A', label: question.opcion_a },
        { value: 'B', label: question.opcion_b },
        { value: 'C', label: question.opcion_c },
        { value: 'D', label: question.opcion_d }
    ];
}
import { ICFES_EXAMPLES } from './icfes_examples';

/**
 * Generar nueva pregunta ICFES con IA (Modo Infinito)
 */
export async function generateICFESQuestion(
    apiKey: string,
    modulo: string
): Promise<ICFESQuestion> {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const moduloInfo = MODULOS_CONFIG[modulo as keyof typeof MODULOS_CONFIG];

    // Obtener ejemplo si existe
    const ejemplo = ICFES_EXAMPLES[modulo as keyof typeof ICFES_EXAMPLES];
    const ejemploTexto = ejemplo ? `
EJEMPLO DE PREGUNTA REAL (ÚSALO COMO REFERENCIA DE ESTILO Y COMPLEJIDAD):
Contexto: "${ejemplo.contexto}"
Enunciado: "${ejemplo.enunciado}"
Opciones:
A) ${ejemplo.opciones.A}
B) ${ejemplo.opciones.B}
C) ${ejemplo.opciones.C}
D) ${ejemplo.opciones.D}
Respuesta Correcta: ${ejemplo.respuesta_correcta}
Explicación: ${ejemplo.explicacion}
` : '';

    const prompt = `Eres un experto creador de preguntas para el examen ICFES de Colombia.
Tu tarea es generar una NUEVA pregunta de selección múltiple para el módulo de: ${moduloInfo.nombre}.

${ejemploTexto}

REGLAS DE FORMATO:
1. La pregunta debe tener un contexto breve (texto, situación o problema) similar al del ejemplo.
2. Un enunciado claro.
3. 4 opciones de respuesta (A, B, C, D).
4. SOLO UNA respuesta correcta.
5. Una explicación detallada de por qué es la correcta.

ESTILO ICFES:
- Las preguntas deben evaluar competencias, no solo memoria.
- Usa un lenguaje formal pero claro.
- Las opciones incorrectas (distractores) deben ser plausibles.
- NO copies el ejemplo, crea una pregunta NUEVA y ORIGINAL sobre un tema diferente pero con la misma estructura lógica.

Responde EXCLUSIVAMENTE con un objeto JSON con esta estructura (sin markdown):
{
  "enunciado": "Texto del contexto + pregunta",
  "opcion_a": "Texto opción A",
  "opcion_b": "Texto opción B",
  "opcion_c": "Texto opción C",
  "opcion_d": "Texto opción D",
  "respuesta_correcta": "Letra (A, B, C o D)",
  "explicacion": "Justificación detallada"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpiar markdown si la IA lo incluye
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return {
            id: `ai-${Date.now()}`, // ID temporal
            modulo,
            ...data
        };
    } catch (error) {
        console.error('Error generating question:', error);
        throw new Error('No se pudo generar una nueva pregunta con IA');
    }
}

/**
 * Obtener ruta del PDF según el módulo
 */
function getModulePdfPath(modulo: string): string {
    const map: Record<string, string> = {
        'lectura': '02_PRACTICA_LECTURA.pdf',
        'matematicas': '04_PRACTICA_MATEMATICAS.pdf',
        'sociales': '06_PRACTICA_SOCIALES.pdf',
        'ciencias': '08_PRACTICA_CIENCIAS.pdf',
        'ingles': '10_PRACTICA_INGLES.pdf'
    };
    return map[modulo] ? `/cuadernillosIcfes/${map[modulo]}` : '';
}

/**
 * Fetch PDF and convert to Base64
 */
async function fetchPdfAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove data:application/pdf;base64, prefix
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Iniciar sesión de chat para entrenamiento ICFES
 */
export async function startICFESChat(apiKey: string, modulo: string, studentName: string) {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const moduloInfo = MODULOS_CONFIG[modulo as keyof typeof MODULOS_CONFIG];
    const pdfPath = getModulePdfPath(modulo);

    let history: any[] = [];
    let systemInstruction = `Eres un tutor experto del ICFES en el área de ${moduloInfo.nombre}. 
    Tu objetivo es ayudar al estudiante ${studentName} a practicar.
    
    INSTRUCCIONES:
    1. Usa el documento PDF adjunto como fuente principal de preguntas y contexto.
    2. Cuando generes una pregunta, intenta sacar una similar o inspirada en el documento.
    3. Si el estudiante pregunta algo, responde basándote en el documento si es posible.
    4. Sé amable, motivador y claro.
    5. Usa formato Markdown para fórmulas matemáticas. IMPORTANTE: Al escribir en JSON, usa DOBLE BACKSLASH (\\\\) para comandos LaTeX. Ejemplo: $\\\\frac{1}{2}$, $\\\\pi$.`;

    try {
        if (pdfPath) {
            console.log(`📚 Cargando cuadernillo: ${pdfPath}`);
            const pdfBase64 = await fetchPdfAsBase64(pdfPath);

            history = [
                {
                    role: "user",
                    parts: [
                        { text: `Hola, soy ${studentName}. Quiero practicar ${moduloInfo.nombre}. Aquí tienes el cuadernillo oficial para que lo uses de referencia.` },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: pdfBase64
                            }
                        }
                    ],
                },
                {
                    role: "model",
                    parts: [{ text: `¡Hola ${studentName}! 🎓 He recibido el cuadernillo de ${moduloInfo.nombre}. Lo he analizado y estoy listo para ayudarte a practicar con preguntas basadas en este material oficial. ¿Empezamos?` }],
                },
            ];
        } else {
            // Fallback sin PDF
            history = [
                {
                    role: "user",
                    parts: [{ text: `Hola, soy ${studentName}. Quiero practicar ${moduloInfo.nombre}.` }],
                },
                {
                    role: "model",
                    parts: [{ text: `¡Hola ${studentName}! 🎓 Vamos a practicar ${moduloInfo.nombre}.` }],
                },
            ];
        }

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 2000,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: systemInstruction }]
            }
        });

        // Generar primera pregunta
        const prompt = `Genera una pregunta de selección múltiple basada en el cuadernillo (si lo tienes).
        
        IMPORTANTE: Responde CON UN OBJETO JSON (sin markdown) con esta estructura:
        {
          "enunciado": "Texto de la pregunta. Para fórmulas matemáticas usa LaTeX con DOBLE BACKSLASH (\\\\) y signos de dólar. Ejemplo: $\\\\frac{3}{4}$, $x^2$.",
          "opcion_a": "Opción A",
          "opcion_b": "Opción B",
          "opcion_c": "Opción C",
          "opcion_d": "Opción D",
          "respuesta_correcta": "Letra",
          "explicacion": "Explicación breve (usa LaTeX con doble backslash para fórmulas)"
        }
        
        Añade un mensaje motivador corto antes del JSON.`;

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            chat,
            initialMessage: text
        };

    } catch (error) {
        console.error('Error starting chat with PDF:', error);
        // Fallback simple si falla la carga del PDF
        throw error;
    }
}

/**
 * Enviar mensaje al chat
 */
export async function sendMessageToChat(chatSession: any, message: string) {
    try {
        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error sending message to chat:', error);
        throw error;
    }
}
