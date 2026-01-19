
export enum AnalysisStatus {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type InputType = 'text' | 'image' | 'video' | 'audio' | 'url';

export interface AnalysisResult {
  messageType: string;
  propagated: string;
  propagandema: string;
  polarity: 'Positivo' | 'Negativo' | 'Neutro';
  intent: 'Afirmación' | 'Negación' | 'Reacción';
  receptionConditions: {
    universal: string;
    cultural: string;
  };
  mediaUsed: string;
  audienceImpact: string;
  propagandaPrinciple: string;
  justification: string;
  arguments: string[];
  languageDetected: string;
}

export interface MediaData {
  type: InputType;
  content?: string; 
  base64?: string; 
  mimeType?: string;
}
