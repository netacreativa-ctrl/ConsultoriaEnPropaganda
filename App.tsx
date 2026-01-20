
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import MediaCapture from './components/MediaCapture';
import AnalysisDisplay from './components/AnalysisDisplay';
import { AnalysisStatus, AnalysisResult, MediaData, OutputLanguage } from './types';
import { analyzePropaganda } from './services/propagandaService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<OutputLanguage>('Español Mexicano');
  const [sourceMedia, setSourceMedia] = useState<MediaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (status === AnalysisStatus.PROCESSING) {
      setProgress(0);
      setProgressLabel("Iniciando motores de consulta estratégica...");
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          let next = prev;
          if (prev < 30) next += 1.5;
          else if (prev < 60) next += 0.8;
          else if (prev < 85) next += 0.4;
          else if (prev < 98) next += 0.1;
          if (next >= 99) next = 99;
          if (next < 15) setProgressLabel("Iniciando motores de consulta estratégica...");
          else if (next < 45) setProgressLabel("Identificando propagandemas nucleares...");
          else if (next < 75) setProgressLabel("Detectando principios de persuasión...");
          else setProgressLabel("Finalizando reporte maestro...");
          return parseFloat(next.toFixed(1));
        });
      }, 150);
    } else if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [status]);

  const handleCapture = async (media: MediaData) => {
    // Requerir selección de llave API si se va a usar un modelo Pro o búsqueda real
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    setStatus(AnalysisStatus.PROCESSING);
    setSelectedLanguage(media.targetLanguage);
    setSourceMedia(media);
    setError(null);
    try {
      const analysisResult = await analyzePropaganda(media);
      setResult(analysisResult);
      setProgress(100);
      setTimeout(() => setStatus(AnalysisStatus.COMPLETED), 500);
    } catch (err: any) {
      console.error(err);
      setError("Falla en el enlace estratégico. Verifique su conexión o intente más tarde.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    setSourceMedia(null);
    setError(null);
    setProgress(0);
  };

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto">
        {status === AnalysisStatus.IDLE && <MediaCapture onCapture={handleCapture} />}
        {status === AnalysisStatus.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-32 space-y-10">
            <div className="w-full max-w-2xl bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
              <div className="bg-navy h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-medium text-navy uppercase tracking-tight">{progressLabel}</h3>
              <p className="text-navy/20 font-medium text-4xl">{Math.floor(progress)}%</p>
            </div>
          </div>
        )}
        {status === AnalysisStatus.COMPLETED && result && sourceMedia && (
          <div className="space-y-8">
            <button onClick={reset} className="bg-navy/5 text-navy px-8 py-3 rounded-xl font-medium uppercase text-xs tracking-widest border border-navy/10">← Nueva Consulta</button>
            <AnalysisDisplay result={result} targetLanguage={selectedLanguage} sourceMedia={sourceMedia} />
          </div>
        )}
        {status === AnalysisStatus.ERROR && (
          <div className="bg-white border border-red-100 p-16 rounded-[2rem] text-center shadow-xl max-w-2xl mx-auto">
            <h3 className="text-red-900 font-medium text-2xl uppercase mb-4">Error de Protocolo</h3>
            <p className="text-red-600/70 mb-10">{error}</p>
            <button onClick={reset} className="bg-navy text-white px-12 py-5 rounded-xl font-medium uppercase text-sm">Reiniciar Protocolo</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
