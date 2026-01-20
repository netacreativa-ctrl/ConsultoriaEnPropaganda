
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, MediaData, OutputLanguage, GroundingSource } from "../types";

export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  let testUrl = trimmed;
  if (!/^https?:\/\//i.test(testUrl)) testUrl = 'https://' + testUrl;
  try {
    const parsed = new URL(testUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname;
    if (/\s/.test(hostname) || hostname.length === 0) return false;
    const parts = hostname.split('.');
    if (parts.length < 2) {
      if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) return false;
    }
    if (parts.some(part => part.length === 0)) return false;
    const tld = parts[parts.length - 1];
    if (/^\d+$/.test(tld)) {
      const isIPv4 = parts.length === 4 && parts.every(p => {
        const n = parseInt(p, 10);
        return !isNaN(n) && n >= 0 && n <= 255;
      });
      if (!isIPv4) return false;
    } else if (tld.length < 2) return false;
    return true;
  } catch { return false; }
};

const sanitizeUrl = (url: string): string => {
  let sanitized = url.trim();
  if (!/^https?:\/\//i.test(sanitized)) sanitized = 'https://' + sanitized;
  return sanitized;
};

export const analyzePropaganda = async (media: MediaData): Promise<AnalysisResult> => {
  // Siempre crear instancia nueva para capturar la API Key más reciente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Usamos el modelo Pro para soportar búsqueda y análisis multimodal complejo
  const modelName = media.type === 'image' ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview';

  const systemInstruction = `
    ERES EL EXPERTO ANALISTA DE "CONSULTORÍA EN PROPAGANDA. BY RICARDO RODRÍGUEZ INDA".
    REGLAS:
    - Genera un objeto JSON puro al final de tu respuesta.
    - messageDescription: 6-8 líneas.
    - persuasionPrinciples: 19 principios clásicos (sin mencionar autores).
    - manipulationTechniques: 38 técnicas de dialéctica erística (sin mencionar autores).
    - Idioma: ${media.targetLanguage}.
    - Si usas búsqueda, mantén el formato JSON solicitado.
  `;

  let promptParts: any[] = [];
  let userPrompt = "";

  if (media.type === 'url') {
    userPrompt = `Analiza exhaustivamente la fuente en: ${sanitizeUrl(media.content || '')}. Investiga su contexto actual en la web.`;
  } else if (media.type === 'hashtag') {
    userPrompt = `Analiza la tendencia, origen y propósito del hashtag: ${media.content}.`;
  } else if (media.type === 'text') {
    userPrompt = `Analiza este discurso: ${media.content}`;
  } else {
    userPrompt = `Analiza este archivo multimedia adjunto para detectar propaganda.`;
  }

  promptParts.push({ text: userPrompt + "\n\nResponde estrictamente con el esquema JSON solicitado." });

  if (media.base64) {
    promptParts.push({ 
      inlineData: { 
        data: media.base64, 
        mimeType: media.mimeType || 'application/octet-stream'
      } 
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: promptParts },
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "";
  // Extraer JSON usando Regex para manejar casos donde Search añade texto extra
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No se pudo obtener un dictamen válido del sensor.");
  
  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

  // Extraer fuentes de búsqueda
  const sources: GroundingSource[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }
  
  result.sources = sources;
  return result;
};

export const generateAudioExplanation = async (text: string, language: OutputLanguage): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Dossier Estratégico. Ricardo Rodríguez Inda. Idioma: ${language}. Informe: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateVideoSummary = async (result: AnalysisResult, onProgress: (msg: string) => void): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  onProgress("Inicializando motores de renderizado estratégico...");
  const prompt = `Advanced strategic intelligence dashboard, dark navy theme, holographic data visualization, 4K professional cinematography.`;
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    onProgress("Sintetizando flujo de video táctico...");
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioPCM(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}
