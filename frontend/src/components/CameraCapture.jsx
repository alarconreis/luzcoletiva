import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Check, AlertTriangle } from 'lucide-react';

/**
 * Captura de imagem pela webcam usando getUserMedia.
 *
 * Props:
 *  - facingMode: 'user' (frontal) ou 'environment' (traseira)
 *  - onCapture: (blob: Blob) => void
 *  - aspect: 'square' (selfie) ou 'card' (RG)
 *  - hint: texto de orientação
 */
export default function CameraCapture({
  facingMode = 'user',
  onCapture,
  aspect = 'square',
  hint = 'Posicione-se no centro da imagem',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  const startCamera = async () => {
    setError('');
    setSnapshot(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Seu navegador não suporta acesso à câmera.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Libere nas configurações do navegador e recarregue.');
      } else if (e.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setError('Erro ao acessar câmera: ' + e.message);
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setReady(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Espelha a selfie pra ficar natural (já estava espelhada no preview)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setSnapshot({ blob, url });
      }
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    if (snapshot) URL.revokeObjectURL(snapshot.url);
    setSnapshot(null);
  };

  const confirm = () => {
    if (snapshot) {
      onCapture(snapshot.blob);
      stopCamera();
    }
  };

  const aspectClass = aspect === 'card'
    ? 'aspect-[1.586/1]'  // proporção de cartão (ISO/IEC 7810 ID-1)
    : 'aspect-square';

  if (error) {
    return (
      <div className="card p-6 bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="font-display font-semibold mb-2">Câmera indisponível</p>
          <p className="text-sm">{error}</p>
          <button onClick={startCamera} className="btn-secondary mt-4 text-sm py-2">
            <RefreshCw size={14} /> Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`relative ${aspectClass} bg-ink-900 rounded-2xl overflow-hidden`}>
        {!snapshot && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}
        {snapshot && (
          <img src={snapshot.url} alt="captura" className="w-full h-full object-cover" />
        )}
        {!ready && !snapshot && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Iniciando câmera…
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <p className="font-body text-sm text-ink-700 text-center">{hint}</p>

      <div className="flex gap-2 justify-center">
        {!snapshot ? (
          <button onClick={capture} disabled={!ready} className="btn-primary disabled:opacity-50">
            <Camera size={18} /> Capturar
          </button>
        ) : (
          <>
            <button onClick={retake} className="btn-ghost">
              <RefreshCw size={16} /> Tirar de novo
            </button>
            <button onClick={confirm} className="btn-primary">
              <Check size={18} /> Usar esta foto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
