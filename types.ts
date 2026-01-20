
export enum AnalysisStatus {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type InputType = 'text' | 'image' | 'video' | 'audio' | 'url' | 'hashtag';

export type OutputLanguage = string;

export interface AnalysisElement {
  content: string;
  sign: '+' | '-';
}

export interface SentimentStats {
  positivo: number;
  neutro: number;
  negativo: number;
}

export interface TheoryElement {
  name: string;
  explanation: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface AnalysisResult {
  messageDescription: string;
  summary: string;
  sentimentStats: SentimentStats;
  messageType: 'Afirmación' | 'Reacción' | 'Negación';
  matrix: {
    propagado: AnalysisElement;
    propagandema: AnalysisElement;
    recepcionUniversal: AnalysisElement;
    recepcionCultural: AnalysisElement;
  };
  persuasionPrinciples: TheoryElement[];
  manipulationTechniques: TheoryElement[];
  desiredImpact: string;
  counterPropagandaStrategy: string;
  strategicAnalysis: string;
  sources?: GroundingSource[];
}

export interface MediaData {
  type: InputType;
  content?: string; 
  base64?: string; 
  mimeType?: string;
  targetLanguage: OutputLanguage;
  fileName?: string;
}
