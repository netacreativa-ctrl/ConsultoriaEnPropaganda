
import React, { useState, useRef, useEffect } from 'react';
import { InputType, MediaData, OutputLanguage } from '../types';
import { validateUrl } from '../services/propagandaService';

interface MediaCaptureProps {
  onCapture: (data: MediaData) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ onCapture }) => {
  const [activeTab, setActiveTab] = useState<InputType>('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [hashtagContent, setHashtagContent] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<OutputLanguage>('Español Mexicano');
  const [uploadedFile, setUploadedFile] = useState<{base64: string, mime: string, name: string} | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const languages = ['Español Mexicano', 'Español Latino', 'Español Ibérico', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Ruso', 'Chino Mandarín', 'Japonés', 'Árabe'].sort();

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = { 
        video: { facingMode: facingMode }, 
        audio: activeTab === 'audio' || activeTab === 'video' 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) { 
      console.error("Acceso a hardware denegado o no disponible:", err); 
      setIsCameraActive(false);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setUploadedFile({ base64, mime: 'audio/webm', name: `audio_captura_${Date.now()}.webm` });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Falla en sensor de audio:", err);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if ((activeTab === 'image' || activeTab === 'video') && !uploadedFile) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, uploadedFile, facingMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      setUploadedFile({ base64, mime: file.type, name: file.name });
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1];
        setUploadedFile({ base64, mime: 'image/jpeg', name: `captura_${Date.now()}.jpg` });
        stopCamera();
      }
    }
  };

  const clearCapture = () => {
    setUploadedFile(null);
    if (activeTab === 'image' || activeTab === 'video') startCamera();
  };

  const executeProtocol = () => {
    if (activeTab === 'url' && !validateUrl(urlContent)) {
      setUrlError(true);
      return;
    }
    let media: MediaData;
    if (uploadedFile) {
      media = { 
        type: activeTab, 
        base64: uploadedFile.base64, 
        mimeType: uploadedFile.mime, 
        targetLanguage,
        fileName: uploadedFile.name
      };
    } else {
      const content = activeTab === 'text' ? textContent : activeTab === 'url' ? urlContent : hashtagContent;
      media = { type: activeTab, content, targetLanguage };
    }
    onCapture(media);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden flex flex-col max-h-[85vh]">
      <div className="bg-navy p-1 grid grid-cols-3 sm:grid-cols-6 gap-1 shrink-0">
        {(['text', 'hashtag', 'url', 'image', 'video', 'audio']).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setUploadedFile(null); }}
            className={`py-2 text-[10px] font-medium uppercase tracking-wider rounded transition-all ${
              activeTab === tab ? 'bg-white text-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow overflow-hidden">
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scroll pr-2">
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase text-navy/40 tracking-wider block">Idioma del Informe</label>
            <select 
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-navy font-medium py-3 px-4 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/10 transition-all appearance-none"
            >
              {languages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-grow flex flex-col justify-end space-y-4">
            <div className="p-4 bg-navy/5 rounded-xl border border-navy/10 space-y-3">
              <p className="text-[9px] uppercase font-medium text-navy/40 tracking-widest text-center">Gestión de Archivos</p>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className={`w-full bg-white border-2 border-dashed border-gray-200 text-navy/60 py-8 rounded-xl font-medium uppercase text-[10px] hover:bg-gray-50 transition-all flex flex-col items-center gap-3 ${uploadedFile ? 'border-green-300 bg-green-50 text-green-700' : ''}`}
              >
                <div className="w-12 h-12 bg-navy/5 rounded-full flex items-center justify-center text-xl">
                  {uploadedFile ? '✅' : '📁'}
                </div>
                <span className="px-4 text-center leading-relaxed">
                  {uploadedFile ? uploadedFile.name : 'Subir desde Dispositivo\n(Imagen, Video, Audio, PDF)'}
                </span>
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*,application/pdf" />
            
            {uploadedFile && (
              <button onClick={clearCapture} className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-red-100 transition-all">
                Eliminar Captura / Archivo
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex-grow min-h-0 relative bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden shadow-inner">
            {activeTab === 'text' && (
              <textarea 
                className="w-full h-full p-8 bg-transparent outline-none text-lg border-none resize-none focus:ring-0 font-normal text-navy/90" 
                placeholder="Inserte el discurso o texto para análisis estratégico profundo..." 
                value={textContent} 
                onChange={e => setTextContent(e.target.value)} 
              />
            )}
            {activeTab === 'url' && (
              <div className="h-full flex flex-col justify-center px-12 gap-4 text-center">
                <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-navy/30">Análisis de Fuente Externa</h4>
                <input 
                  type="url" 
                  className={`w-full p-5 bg-white rounded-xl border shadow-sm outline-none font-medium text-lg transition-all ${urlError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5'}`} 
                  placeholder="https://plataforma.com/contenido-analizable" 
                  value={urlContent} 
                  onChange={e => { setUrlContent(e.target.value); setUrlError(false); }} 
                />
                {urlError && <p className="text-red-500 text-[10px] uppercase font-medium tracking-widest animate-pulse">PROTOCOL NO VÁLIDO. VERIFIQUE LA LIGA.</p>}
              </div>
            )}
            {activeTab === 'hashtag' && (
              <div className="h-full flex flex-col items-center justify-center p-12">
                <span className="text-6xl text-navy/5 mb-8">#</span>
                <input 
                  type="text" 
                  className="w-full bg-transparent border-none outline-none font-medium text-navy text-4xl text-center placeholder:text-navy/10" 
                  placeholder="TENDENCIA" 
                  value={hashtagContent} 
                  onChange={e => setHashtagContent(e.target.value.replace(/\s/g, '').toUpperCase())} 
                />
              </div>
            )}
            {(activeTab === 'image' || activeTab === 'video') && (
              <div className="w-full h-full bg-black relative flex items-center justify-center">
                {uploadedFile ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    {uploadedFile.mime.startsWith('image') ? <img src={`data:${uploadedFile.mime};base64,${uploadedFile.base64}`} alt="Preview" className="max-w-full max-h-full object-contain" /> : <div className="text-white/40 uppercase tracking-widest text-[10px]">Multimedia Cargado</div>}
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover opacity-90 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                    {isCameraActive && activeTab === 'image' && (
                      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none">
                        <button onClick={toggleCamera} className="bg-white/10 backdrop-blur-md border border-white/20 text-white w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all">🔄</button>
                        <button onClick={capturePhoto} className="bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform"><div className="w-16 h-16 rounded-full border-4 border-navy/10"></div></button>
                        <div className="w-14 h-14"></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-8">
                 {uploadedFile ? (
                   <div className="text-navy text-xl uppercase tracking-widest font-medium">Grabación Lista</div>
                 ) : (
                   <button 
                    onClick={isRecording ? stopRecordingAudio : startRecordingAudio}
                    className={`w-32 h-32 rounded-full border flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 border-red-200 animate-pulse' : 'bg-navy/5 border-navy/10 hover:bg-navy/10'}`}
                   >
                     <span className="text-4xl">{isRecording ? '⏹' : '🎙️'}</span>
                   </button>
                 )}
                 <span className="text-[10px] text-navy/40 uppercase font-medium tracking-widest">{isRecording ? 'Grabando...' : 'Pulse para capturar audio'}</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-auto pt-2">
            <button onClick={executeProtocol} disabled={(!uploadedFile && !textContent && !urlContent && !hashtagContent) || urlError} className="group relative w-full bg-navy text-white py-5 rounded-2xl font-medium uppercase text-sm tracking-[0.2em] overflow-hidden hover:bg-black transition-all disabled:opacity-20 shadow-xl">
              Iniciar Protocolo de Análisis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCapture;
