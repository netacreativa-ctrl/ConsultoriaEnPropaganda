
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { generateAudioExplanation, decodeBase64ToUint8, decodeAudioPCM } from '../services/propagandaService';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'report' | 'slides' | 'notebook'>('report');

  const handleAudio = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const base64 = await generateAudioExplanation(result.justification);
      if (!base64) throw new Error("Audio generation failed");
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bytes = decodeBase64ToUint8(base64);
      const buffer = await decodeAudioPCM(bytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
      alert("Error al generar la voz analítica.");
    }
  };

  const downloadReport = () => {
    const header = `REPORTE DE CONSULTORÍA DE PROPAGANDA\nBy Ricardo Rodríguez Inda\nFECHA: ${new Date().toLocaleString()}\n\n`;
    const body = `
TIPO DE MENSAJE: ${result.messageType}
PROPAGADO: ${result.propagated}
PROPAGANDEMA: ${result.propagandema}
INTENCIÓN: ${result.intent}
POLARIDAD: ${result.polarity}
PRINCIPIO: ${result.propagandaPrinciple}

JUSTIFICACIÓN TÉCNICA:
${result.justification}

ARGUMENTOS DE CONCLUSIÓN:
${result.arguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

CONDICIONES DE RECEPCIÓN:
Universal: ${result.receptionConditions.universal}
Cultural: ${result.receptionConditions.cultural}
    `;
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consultoria_Propaganda_${result.propagated.substring(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSlides = () => {
    const slides = `
PRESENTACIÓN EJECUTIVA - CONSULTORÍA DE PROPAGANDA
-------------------------------------------------
DIAPOSITIVA 1: PORTADA
Título: Análisis Estratégico de Propaganda
Especialista: Ricardo Rodríguez Inda

DIAPOSITIVA 2: EL PROPAGADO Y SU NÚCLEO
- Ente/Idea: ${result.propagated}
- Propagandema: "${result.propagandema}"

DIAPOSITIVA 3: MECÁNICA DE PERSUASIÓN
- Intención: ${result.intent}
- Polaridad: ${result.polarity}
- Principio: ${result.propagandaPrinciple}

DIAPOSITIVA 4: ARGUMENTOS CLAVE
${result.arguments.map(a => `- ${a}`).join('\n')}

DIAPOSITIVA 5: CONCLUSIÓN
${result.audienceImpact}
    `;
    const blob = new Blob([slides], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Slides_Estructura_${result.propagated.substring(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap justify-center gap-3">
        {['report', 'slides', 'notebook'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${
              viewMode === mode ? 'bg-navy text-white scale-105' : 'bg-white text-gray-400 hover:text-navy'
            }`}
          >
            {mode === 'report' ? '📄 Reporte Word' : mode === 'slides' ? '📊 Presentación PPT' : '📔 Audio Notebook'}
          </button>
        ))}
      </div>

      <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500 ${viewMode === 'slides' ? 'max-w-4xl mx-auto ring-8 ring-navy/5' : ''}`}>
        <div className="bg-navy p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Intelligence Audit</h2>
            <p className="text-[10px] opacity-60 tracking-[0.3em] mt-2 font-bold uppercase">Ref: {result.intent.toUpperCase()}-{result.polarity.toUpperCase()}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase ${result.polarity === 'Positivo' ? 'bg-green-600' : 'bg-red-600'}`}>
              {result.polarity}
            </span>
            <span className="px-5 py-2 rounded-xl text-[10px] font-black uppercase bg-white/20 backdrop-blur-sm">
              {result.intent}
            </span>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {viewMode === 'report' && (
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] uppercase font-black text-navy/30 mb-2 tracking-widest">El Propagado</h4>
                  <p className="text-3xl font-black text-navy leading-tight">{result.propagated}</p>
                </div>
                <div className="p-6 bg-navy/5 border-l-8 border-navy rounded-r-2xl">
                  <h4 className="text-[10px] uppercase font-black text-navy/40 mb-2">Propagandema</h4>
                  <p className="text-2xl font-medium italic text-navy leading-snug">"{result.propagandema}"</p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black text-navy/30 mb-2 tracking-widest">Principio de Guerra Semiótica</h4>
                  <p className="text-sm font-black text-white bg-navy px-4 py-2 rounded-lg inline-block shadow-md">{result.propagandaPrinciple}</p>
                </div>
              </div>

              <div className="space-y-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="text-[10px] uppercase font-black text-navy/30 mb-2 tracking-widest">Proyección de Impacto</h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{result.audienceImpact}</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h5 className="text-[9px] font-black text-navy/40 uppercase mb-2">Recepción Universal (Psico-bio)</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">{result.receptionConditions.universal}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h5 className="text-[9px] font-black text-navy/40 uppercase mb-2">Recepción Cultural (Contexto)</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">{result.receptionConditions.cultural}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'slides' && (
            <div className="aspect-video bg-navy flex flex-col items-center justify-center p-12 text-center rounded-2xl shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-navy via-white/50 to-navy"></div>
               <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Caso de Estudio</h3>
               <h2 className="text-white text-4xl font-black mb-6 uppercase tracking-tighter leading-none max-w-2xl">{result.propagated}</h2>
               <div className="h-0.5 w-32 bg-white/20 mb-8"></div>
               <p className="text-white/90 text-2xl font-light italic mb-10 max-w-xl">"{result.propagandema}"</p>
               <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <span className="block text-[10px] text-white/40 uppercase font-black mb-1">Polaridad</span>
                    <span className="text-white font-black text-sm">{result.polarity}</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <span className="block text-[10px] text-white/40 uppercase font-black mb-1">Estrategia</span>
                    <span className="text-white font-black text-sm">{result.intent}</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <span className="block text-[10px] text-white/40 uppercase font-black mb-1">Medio</span>
                    <span className="text-white font-black text-sm">{result.messageType}</span>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'notebook' && (
             <div className="space-y-8 flex flex-col items-center py-12 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                <div className={`w-36 h-36 rounded-full flex items-center justify-center border-8 transition-all shadow-2xl bg-white ${isPlaying ? 'border-navy animate-pulse' : 'border-gray-100 hover:border-navy/20 cursor-pointer'}`} onClick={handleAudio}>
                   <button className="text-navy text-5xl translate-x-1">{isPlaying ? '⏹' : '▶'}</button>
                </div>
                <div className="text-center max-w-lg space-y-4">
                  <h3 className="text-navy font-black uppercase text-lg tracking-tight">Podcast de Auditoría Semiótica</h3>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed italic px-8">"Voz generada por IA personalizada en estilo NotebookLM para la alta dirección."</p>
                  {isPlaying && <div className="flex justify-center gap-1 h-4"><div className="w-1 bg-navy animate-bounce h-full"></div><div className="w-1 bg-navy animate-bounce h-3 delay-75"></div><div className="w-1 bg-navy animate-bounce h-full delay-150"></div></div>}
                </div>
             </div>
          )}

          <div className="border-t-2 border-gray-50 pt-10">
            <h4 className="text-[10px] uppercase font-black text-navy/40 mb-6 tracking-[0.2em]">Argumentación del Veredicto</h4>
            <div className="grid gap-6">
              {result.arguments.map((arg, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <span className="bg-navy/5 text-navy text-[10px] font-black w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-navy/10 group-hover:bg-navy group-hover:text-white transition-colors">{i+1}</span>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-800 font-semibold leading-relaxed">{arg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-10 border-t border-gray-50">
             <button onClick={downloadReport} className="flex-grow md:flex-none px-8 py-4 bg-navy text-white text-xs font-black rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest">Descargar Word (.txt)</button>
             <button onClick={downloadSlides} className="flex-grow md:flex-none px-8 py-4 border-2 border-navy text-navy text-xs font-black rounded-xl hover:bg-navy hover:text-white transition-all uppercase tracking-widest">Descargar Slides (.txt)</button>
             <button onClick={handleAudio} disabled={isPlaying} className="flex-grow md:flex-none px-8 py-4 bg-gray-900 text-white text-xs font-black rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all uppercase tracking-widest disabled:opacity-50">
               {isPlaying ? 'Analizando por Voz...' : '🔊 Podcast de Consultoría'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
