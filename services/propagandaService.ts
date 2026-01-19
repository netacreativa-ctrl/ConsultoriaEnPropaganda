
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, MediaData } from "../types";

const API_KEY = process.env.API_KEY || "";

export const analyzePropaganda = async (media: MediaData): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `
    Eres el consultor estratégico senior de "Consultoría de Propaganda - Ricardo Rodríguez Inda".
    Tu objetivo es desmantelar y analizar piezas de comunicación con profundidad quirúrgica.
    
    CRITERIOS TÉCNICOS OBLIGATORIOS:
    1. Propagado: Identifica quién o qué idea es el centro del mensaje.
    2. Propagandema: El núcleo simbólico o frase de alto impacto (ej: eslogan, imagen arquetípica).
    3. Clasificación de Intención:
       - AFIRMACIÓN: Construye o refuerza un mito, verdad o valor positivo sobre el propagado.
       - NEGACIÓN: Ataca, ridiculiza o deshumaniza a un oponente o idea contraria.
       - REACCIÓN: Responde a una crisis, ataque o situación externa para mitigar daños o retomar control.
    4. Polaridad: Determina si el tono emocional dominante es Positivo (inspiración, orden) o Negativo (amenaza, caos).
    5. Principios Propagandísticos: Utiliza la terminología de Goebbels (Simplificación, Orquestación, Transfusión, Silencio, etc.) o Domenach.
    
    PARA URLs: Debes analizar la información contenida en la liga, su intención comunicativa y el contexto del sitio.
    
    Justifica con argumentos técnicos cada conclusión. Responde en el idioma original detectado.
  `;

  let promptParts: any[] = [];
  if (media.type === 'text') {
    promptParts.push({ text: `Analiza este texto bajo el protocolo de propaganda: ${media.content}` });
  } else if (media.type === 'url') {
    promptParts.push({ text: `Accede y analiza el contenido de esta URL para desglosar su estrategia de propaganda: ${media.content}` });
  } else if (media.base64 && media.mimeType) {
    promptParts.push({ inlineData: { data: media.base64, mimeType: media.mimeType } });
    promptParts.push({ text: "Analiza esta pieza visual/auditiva capturada bajo el protocolo de propaganda." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Pro is better for complex URL and text analysis
    contents: { parts: promptParts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          messageType: { type: Type.STRING },
          propagated: { type: Type.STRING },
          propagandema: { type: Type.STRING },
          polarity: { type: Type.STRING, enum: ['Positivo', 'Negativo', 'Neutro'] },
          intent: { type: Type.STRING, enum: ['Afirmación', 'Negación', 'Reacción'] },
          receptionConditions: {
            type: Type.OBJECT,
            properties: { universal: { type: Type.STRING }, cultural: { type: Type.STRING } }
          },
          mediaUsed: { type: Type.STRING },
          audienceImpact: { type: Type.STRING },
          propagandaPrinciple: { type: Type.STRING },
          justification: { type: Type.STRING },
          arguments: { type: Type.ARRAY, items: { type: Type.STRING } },
          languageDetected: { type: Type.STRING }
        },
        required: ["propagated", "propagandema", "intent", "polarity", "justification", "arguments"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateAudioExplanation = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Realiza un resumen profesional para este análisis de consultoría de propaganda. Tono serio y analítico: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioPCM(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
