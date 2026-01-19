
import React, { useState } from 'react';
import Layout from './components/Layout';
import MediaCapture from './components/MediaCapture';
import AnalysisDisplay from './components/AnalysisDisplay';
import { AnalysisStatus, AnalysisResult, MediaData } from './types';
import { analyzePropaganda } from './services/propagandaService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (media: MediaData) => {
    setStatus(AnalysisStatus.PROCESSING);
    setError(null);
    try {
      const analysisResult = await analyzePropaganda(media);
      setResult(analysisResult);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError("Falla en la conexión con el servidor de inteligencia. Reintente el proceso.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-12 py-10">
        <section className="text-center space-y-4">
          <div className="inline-block bg-navy/5 px-6 py-1 rounded-full border border-navy/10 text-navy font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
            Security Intelligence & Semiotics
          </div>
          <h2 className="text-6xl font-black text-navy leading-[0.9] tracking-tighter">
            CONSULTORÍA DE <br/><span className="text-gray-400">PROPAGANDA.</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg font-light">
            Análisis algorítmico de estructuras de persuasión masiva y desinformación.
          </p>
        </section>

        {status === AnalysisStatus.IDLE && (
          <div className="max-w-2xl mx-auto">
            <MediaCapture onCapture={handleCapture} />
          </div>
        )}

        {status === AnalysisStatus.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-pulse">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-navy/20 border-t-navy rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-navy text-xs">IA</div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-navy uppercase tracking-widest">Calculando Vectores Semánticos</h3>
              <p className="text-gray-400 text-sm italic">Identificando principios de Goebbels y Domenach...</p>
            </div>
          </div>
        )}

        {status === AnalysisStatus.COMPLETED && result && (
          <div className="space-y-6">
            <div className="flex justify-start">
              <button 
                onClick={reset}
                className="bg-white border-2 border-navy text-navy px-8 py-2 rounded-xl font-bold uppercase text-xs hover:bg-navy hover:text-white transition-all shadow-xl shadow-navy/10"
              >
                ← Reiniciar Protocolo
              </button>
            </div>
            <AnalysisDisplay result={result} />
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="bg-red-50 border-2 border-red-200 p-12 rounded-3xl text-center shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-red-900 font-black text-2xl uppercase mb-2">Error Crítico de Análisis</h3>
            <p className="text-red-600/70 mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={reset}
              className="bg-red-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-800 transition-all"
            >
              Reestablecer Conexión
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
