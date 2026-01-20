
import React, { useState } from 'react';
import { AnalysisResult, OutputLanguage, MediaData } from '../types';
import { generateAudioExplanation, decodeBase64ToUint8, decodeAudioPCM, generateVideoSummary } from '../services/propagandaService';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  targetLanguage: OutputLanguage;
  sourceMedia: MediaData;
}

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6 border-b border-navy/10 pb-4">
    <h3 className="text-xl font-medium text-navy tracking-tight uppercase">{title}</h3>
    {subtitle && <p className="text-[10px] text-navy/40 font-medium uppercase tracking-[0.2em] mt-1">{subtitle}</p>}
  </div>
);

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, targetLanguage, sourceMedia }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");

  const handleGenerateVideo = async () => {
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }
    setVideoLoading(true);
    try {
      const url = await generateVideoSummary(result, setVideoProgress);
      setVideoUrl(url);
    } catch (e) {
      setVideoProgress("Falla visual.");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleAudio = async () => {
    setIsPlaying(true);
    try {
      const summaryText = result.messageDescription;
      const base64 = await generateAudioExplanation(summaryText, targetLanguage);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bytes = decodeBase64ToUint8(base64);
      const buffer = await decodeAudioPCM(bytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const handlePDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(0, 31, 63);
    doc.text("Informe Estratégico de Propaganda", 20, 20);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Consultoría en Propaganda. By Ricardo Rodríguez Inda | Idioma: ${targetLanguage}`, 20, 28);
    doc.line(20, 32, 190, 32);
    let y = 45;
    const addSection = (title: string, text: string) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 31, 63);
      doc.text(title, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y + 8);
      y += (lines.length * 7) + 18;
    };
    addSection("Resumen descriptivo del objeto analizado", result.messageDescription);
    addSection("Tipo de Mensaje", result.messageType);
    addSection("Impacto Deseado", result.desiredImpact);
    addSection("Estrategia de Contrapropaganda", result.counterPropagandaStrategy);
    addSection("Dictamen Maestro", result.strategicAnalysis);
    doc.save(`Informe_Propaganda_Inda.pdf`);
  };

  const handlePPTX = () => {
    const ppt = new pptxgen();
    const addSlide = (title: string, content: string) => {
      let slide = ppt.addSlide();
      slide.background = { color: 'F8FAFC' };
      slide.addText(title, { x: 0.5, y: 0.5, fontSize: 24, fontFace: 'Arial', color: '001F3F' });
      slide.addText(content, { x: 0.5, y: 1.5, fontSize: 14, fontFace: 'Arial', color: '334155', w: '90%' });
    };
    addSlide("1. Resumen descriptivo", result.messageDescription);
    addSlide("2. Sentimiento de Recepción", `Positivo: ${result.sentimentStats.positivo}% | Neutro: ${result.sentimentStats.neutro}% | Negativo: ${result.sentimentStats.negativo}%`);
    addSlide("3. Tipo de Mensaje", result.messageType);
    addSlide("4. Matriz: Propagado y Propagandema", `Propagado: ${result.matrix.propagado.content} (${result.matrix.propagado.sign})\nPropagandema: ${result.matrix.propagandema.content} (${result.matrix.propagandema.sign})`);
    addSlide("5. Condiciones de Recepción", `Universal: ${result.matrix.recepcionUniversal.content} (${result.matrix.recepcionUniversal.sign})\nCultural: ${result.matrix.recepcionCultural.content} (${result.matrix.recepcionCultural.sign})`);
    addSlide("6. Principios de Persuasión", result.persuasionPrinciples.map(p => p.name).join(", "));
    addSlide("7. Técnicas de Manipulación", result.manipulationTechniques.map(t => t.name).join(", "));
    addSlide("8. Impacto Deseado", result.desiredImpact);
    addSlide("9. Estrategia de Contrapropaganda", result.counterPropagandaStrategy);
    ppt.writeFile({ fileName: "Reporte_Propaganda_Inda" });
  };

  const handleTXT = () => {
    const content = `INFORME ESTRATÉGICO DE PROPAGANDA\nConsultoría en Propaganda. By Ricardo Rodríguez Inda\n\nResumen descriptivo:\n${result.messageDescription}\n\nTipo de Mensaje: ${result.messageType}\nSentimiento: Positivo ${result.sentimentStats.positivo}%, Neutro ${result.sentimentStats.neutro}%, Negativo ${result.sentimentStats.negativo}%\n\nImpacto Deseado:\n${result.desiredImpact}\n\nEstrategia de Contrapropaganda:\n${result.counterPropagandaStrategy}\n\nDictamen Final:\n${result.strategicAnalysis}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "Informe_Propaganda.txt";
    link.click();
  };

  const handleShare = (platform: string) => {
    const text = `Análisis de Propaganda - Ricardo Rodríguez Inda: ${result.messageDescription.substring(0, 50)}...`;
    const url = window.location.href;
    let shareUrl = "";
    switch(platform) {
      case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`; break;
      case 'x': shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      case 'email': shareUrl = `mailto:?subject=Análisis de Propaganda&body=${encodeURIComponent(text + "\n\n" + url)}`; break;
    }
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-32 max-w-full overflow-hidden">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-navy p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-medium tracking-tight">Dossier Maestro de Inteligencia</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase font-medium tracking-widest text-white/80">Protocolo de Análisis Finalizado</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white/40 uppercase font-medium">Idioma de Emisión</p>
              <p className="text-sm font-medium">{targetLanguage}</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🌐</div>
          </div>
        </div>

        <div className="p-8 md:p-16 space-y-20">
          <section>
            <SectionHeader title="Resumen descriptivo del objeto analizado" subtitle="Visión General del Mensaje" />
            <div className="p-8 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-inner">
              <p className="text-lg text-navy/90 leading-relaxed font-normal whitespace-pre-wrap italic">
                {result.messageDescription}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              <SectionHeader title="Sentimiento de Impacto" subtitle="Relación con el Contenido Propagado" />
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Positivo', value: result.sentimentStats.positivo, color: 'text-green-600 bg-green-50/50 border-green-100' },
                  { label: 'Neutro', value: result.sentimentStats.neutro, color: 'text-slate-600 bg-slate-50 border-slate-100' },
                  { label: 'Negativo', value: result.sentimentStats.negativo, color: 'text-red-600 bg-red-50/50 border-red-100' }
                ].map(s => (
                  <div key={s.label} className={`p-6 rounded-2xl text-center border transition-all hover:shadow-md ${s.color}`}>
                    <p className="text-3xl font-medium tracking-tighter">{s.value}%</p>
                    <p className="text-[10px] uppercase font-medium mt-2 tracking-widest opacity-60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <SectionHeader title="Clasificación" subtitle="Tipo de Mensaje Estratégico" />
              <div className="p-8 bg-navy text-white rounded-2xl text-center shadow-lg h-full flex flex-col justify-center border-4 border-navy/5">
                <p className="text-2xl font-medium uppercase tracking-[0.3em]">{result.messageType}</p>
                <div className="h-px bg-white/20 my-4 w-12 mx-auto"></div>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Dimensión Dialéctica</p>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader title="Matriz Detallada de Análisis" subtitle="Dimensiones del Discurso y Condiciones de Recepción" />
            <div className="overflow-hidden rounded-2xl border-2 border-navy/5 shadow-sm">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="p-5 text-xs font-medium uppercase tracking-[0.2em] w-1/4 border-r border-white/10">Dimensión de Análisis</th>
                    <th className="p-5 text-xs font-medium uppercase tracking-[0.2em] w-2/4 border-r border-white/10">Contenido Estratégico Identificado</th>
                    <th className="p-5 text-xs font-medium uppercase tracking-[0.2em] w-1/4 text-center">Signo (+/-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {[
                    { dim: 'Propagado', val: result.matrix.propagado },
                    { dim: 'Propagandema', val: result.matrix.propagandema },
                    { dim: 'Recepción Universal', val: result.matrix.recepcionUniversal },
                    { dim: 'Recepción Cultural', val: result.matrix.recepcionCultural }
                  ].map((row, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-navy/5 transition-colors group`}>
                      <td className="p-5 font-medium text-navy/40 uppercase text-[10px] tracking-widest border-r border-gray-100">{row.dim}</td>
                      <td className="p-5 text-navy/80 italic font-normal border-r border-gray-100 leading-relaxed">
                        <span className="text-navy/20 font-serif mr-1">"</span>
                        {row.val.content}
                        <span className="text-navy/20 font-serif ml-1">"</span>
                      </td>
                      <td className="p-5 text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-medium text-xl shadow-sm transition-transform group-hover:scale-110 ${
                          row.val.sign === '+' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {row.val.sign}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {result.sources && result.sources.length > 0 && (
            <section>
              <SectionHeader title="Fuentes de Información" subtitle="Grounding Data de Google Search" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-navy/20 hover:bg-white transition-all group flex items-start gap-3"
                  >
                    <span className="text-navy/20 group-hover:text-navy transition-colors mt-1">🔗</span>
                    <div>
                      <p className="text-xs font-medium text-navy/80 line-clamp-1">{source.title}</p>
                      <p className="text-[9px] uppercase tracking-widest text-navy/30 mt-1 truncate">{source.uri}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <SectionHeader title="Principios de Persuasión" subtitle="Mecanismos de Influencia Aplicados" />
              <div className="space-y-4">
                {result.persuasionPrinciples.map((p, i) => (
                  <div key={i} className="p-6 bg-white border-l-4 border-navy border-t border-b border-r border-gray-100 rounded-r-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium uppercase text-navy/60 mb-2 tracking-widest">{p.name}</p>
                    <p className="text-sm font-normal text-navy/80 leading-relaxed italic opacity-80">{p.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <SectionHeader title="Técnicas de Manipulación" subtitle="Dialéctica Erística Detectada" />
              <div className="space-y-4">
                {result.manipulationTechniques.map((t, i) => (
                  <div key={i} className="p-6 bg-white border-l-4 border-red-800 border-t border-b border-r border-gray-100 rounded-r-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium uppercase text-red-800/60 mb-2 tracking-widest">{t.name}</p>
                    <p className="text-sm font-normal text-navy/80 leading-relaxed italic opacity-80">{t.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-20">
            <div className="p-10 bg-gray-50 rounded-3xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-navy text-6xl group-hover:scale-110 transition-transform">🎯</div>
              <SectionHeader title="Impacto Deseado" subtitle="Finalidad Estratégica del Mensaje" />
              <p className="text-navy/80 text-lg font-normal leading-relaxed max-w-4xl relative z-10 italic">
                {result.desiredImpact}
              </p>
            </div>

            <div className="p-10 bg-red-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">🛡️</div>
              <SectionHeader title="Estrategia de Contrapropaganda" subtitle="Respuesta y Defensa Táctica" />
              <p className="text-white/90 text-lg font-medium leading-relaxed italic max-w-4xl border-l-2 border-white/20 pl-8">
                {result.counterPropagandaStrategy}
              </p>
            </div>
          </section>

          <section className="bg-navy p-16 rounded-[3rem] text-center text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent"></div>
             <h3 className="text-2xl font-medium tracking-[0.5em] uppercase mb-8 opacity-40">Dictamen Maestro Final</h3>
             <div className="max-w-4xl mx-auto">
               <p className="text-xl md:text-2xl font-normal leading-loose italic text-white/90">
                 {result.strategicAnalysis}
               </p>
             </div>
             <div className="mt-12 pt-8 border-t border-white/10 text-[10px] uppercase tracking-[0.4em] opacity-30 font-medium">
                Sello de Autenticidad Investigativa - Ricardo Rodríguez Inda
             </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-5 z-50 flex flex-wrap justify-center items-center gap-4 no-print shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2 mr-6 border-r border-gray-100 pr-6 items-center">
          <span className="text-[9px] uppercase font-medium text-navy/40 tracking-widest mr-2 hidden sm:block">Compartir</span>
          <button onClick={() => handleShare('whatsapp')} className="p-2 hover:bg-green-50 rounded-xl transition-colors text-xl grayscale hover:grayscale-0">💬</button>
          <button onClick={() => handleShare('linkedin')} className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-xl grayscale hover:grayscale-0">💼</button>
          <button onClick={() => handleShare('x')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-xl grayscale hover:grayscale-0">✖️</button>
          <button onClick={() => handleShare('email')} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-xl grayscale hover:grayscale-0">✉️</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePDF} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm">PDF</button>
          <button onClick={handlePPTX} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm">PPTX (9 Láminas)</button>
          <button onClick={handleTXT} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm">TXT</button>
          <button onClick={handleAudio} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-navy hover:text-white hover:border-navy transition-all flex items-center gap-2 shadow-sm">
            {isPlaying ? '⏹ Detener Audio' : '🔊 Reproducir Audio'}
          </button>
          {!videoUrl && !videoLoading && (
            <button onClick={handleGenerateVideo} className="px-6 py-2.5 bg-navy text-white rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-all shadow-md">Generar Video Informe</button>
          )}
        </div>
      </div>

      {(videoUrl || videoLoading) && (
        <div className="max-w-5xl mx-auto mt-12 mb-32 p-4">
          <div className="bg-navy rounded-3xl overflow-hidden shadow-2xl relative border-8 border-navy/20">
            {videoLoading ? (
              <div className="aspect-video flex flex-col items-center justify-center bg-navy text-white p-16 text-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-8"></div>
                <h4 className="text-lg font-medium tracking-tight mb-2">Compilando Dossier Visual</h4>
                <p className="text-xs font-medium uppercase tracking-widest opacity-40">{videoProgress}</p>
              </div>
            ) : (
              <video src={videoUrl!} controls autoPlay className="w-full aspect-video" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
