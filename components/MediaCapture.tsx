
import React, { useState, useRef, useEffect } from 'react';
import { InputType, MediaData } from '../types';

interface MediaCaptureProps {
  onCapture: (data: MediaData) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ onCapture }) => {
  const [activeTab, setActiveTab] = useState<InputType | 'audio'>('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Su navegador no soporta el acceso a medios.");
      }
      // Intenta primero con video y audio, si falla busca alternativas
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Error accediendo a cámara:", err.name);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Cámara no detectada. Puede subir un archivo en su lugar.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Permiso de cámara denegado.");
      } else {
        setCameraError("Error al inicializar cámara. Verifique que no esté en uso por otra app.");
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'image' || activeTab === 'video') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          onCapture({ type: 'audio', base64, mimeType: 'audio/webm' });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecordingAudio = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleCaptureImage = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
      onCapture({ type: 'image', base64, mimeType: 'image/jpeg' });
    } else {
      alert("La cámara no está lista o no fue encontrada.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="flex border-b overflow-x-auto bg-gray-50">
        {(['text', 'image', 'video', 'audio', 'url']).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-4 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-navy text-white' : 'text-gray-400 hover:text-navy hover:bg-white'
            }`}
          >
            {tab === 'audio' ? '🎤 Voz' : tab === 'url' ? '🔗 Liga' : tab === 'image' ? '📸 Foto' : tab === 'video' ? '🎥 Video' : '✍️ Texto'}
          </button>
        ))}
      </div>

      <div className="p-8">
        {activeTab === 'text' && (
          <div className="space-y-4">
            <textarea
              className="w-full h-48 p-5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-navy transition-all outline-none text-gray-700"
              placeholder="Inserte el mensaje textual o nota periodística para análisis..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
            <button
              onClick={() => textContent.trim() && onCapture({ type: 'text', content: textContent })}
              className="w-full bg-navy text-white py-4 rounded-xl font-bold hover:shadow-xl active:scale-[0.98] transition-all"
            >
              PROCESAR TEXTO
            </button>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="flex flex-col items-center py-10 space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-navy'}`}>
              <span className="text-white text-3xl">🎤</span>
            </div>
            <p className="text-navy font-bold">{isRecording ? 'Grabando ambiental...' : 'Captura de Voz en Tiempo Real'}</p>
            <button
              onClick={isRecording ? stopRecordingAudio : startRecordingAudio}
              className={`px-10 py-3 rounded-full font-bold text-white transition-all shadow-lg ${isRecording ? 'bg-red-600 ring-4 ring-red-100' : 'bg-navy hover:bg-opacity-90'}`}
            >
              {isRecording ? 'Terminar Análisis' : 'Iniciar Micrófono'}
            </button>
          </div>
        )}

        {(activeTab === 'image' || activeTab === 'video') && (
          <div className="space-y-6">
            {cameraError ? (
              <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed border-gray-300">
                <span className="text-4xl mb-2">🚫</span>
                <p className="text-gray-500 font-medium">{cameraError}</p>
                <p className="text-xs text-gray-400 mt-2">Utilice la opción de subir archivo debajo.</p>
              </div>
            ) : (
              <div className="relative aspect-video bg-navy/10 rounded-2xl overflow-hidden border-2 border-dashed border-navy/20 shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4">
              {!cameraError && (
                <button onClick={handleCaptureImage} className="flex-1 bg-navy text-white py-4 rounded-xl font-bold hover:bg-opacity-95 shadow-md">
                  Capturar Ahora
                </button>
              )}
              <label className="flex-1 border-2 border-navy text-navy py-4 rounded-xl font-bold text-center cursor-pointer hover:bg-navy hover:text-white transition-all">
                Subir del Dispositivo
                <input type="file" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onloadend = () => onCapture({ type: file.type.startsWith('video') ? 'video' : 'image', base64: (reader.result as string).split(',')[1], mimeType: file.type });
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="bg-navy/5 p-4 rounded-lg border-l-4 border-navy mb-4">
              <p className="text-[10px] text-navy font-bold uppercase">Instrucción Especial</p>
              <p className="text-xs text-navy/70">La IA navegará y analizará el contenido íntegro de la liga proporcionada (Redes sociales, portales de noticias o blogs).</p>
            </div>
            <input
              type="url"
              className="w-full p-5 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-navy transition-all outline-none"
              placeholder="https://www.ejemplo.com/noticia-propagandistica"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
            />
            <button 
              onClick={() => urlContent.trim() && onCapture({ type: 'url', content: urlContent })} 
              className="w-full bg-navy text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              INVESTIGAR LIGA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCapture;
