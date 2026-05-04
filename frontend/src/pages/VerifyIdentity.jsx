import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Upload, Camera, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CameraCapture from '../components/CameraCapture.jsx';

export default function VerifyIdentity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState('intro'); // intro | rg | selfie | review | sending | done
  const [rgBlob, setRgBlob] = useState(null);
  const [rgPreview, setRgPreview] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [keepAvatar, setKeepAvatar] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const loadStatus = () => api.get('/verify/status').then(({ data }) => setStatus(data)).catch(() => {});

  useEffect(() => { loadStatus(); }, []);

  const handleRgFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError('Arquivo maior que 8MB. Tire outra foto ou comprima.');
      return;
    }
    setRgBlob(f);
    setRgPreview(URL.createObjectURL(f));
    setError('');
  };

  const submit = async () => {
    if (!rgBlob || !selfieBlob) return;
    setStep('sending');
    setError('');
    const fd = new FormData();
    fd.append('rg', rgBlob, 'rg.jpg');
    fd.append('selfie', selfieBlob, 'selfie.jpg');
    fd.append('keep_avatar', keepAvatar ? 'true' : 'false');
    try {
      const { data } = await api.post('/verify/submit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(data);
      setStep('done');
      loadStatus();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao enviar. Tente novamente.');
      setStep('review');
    }
  };

  // ====== Já verificado ======
  if (user?.is_verified || status?.is_verified) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-leaf-400/20 flex items-center justify-center mb-6">
          <ShieldCheck className="text-leaf-500" size={40} />
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Você já está verificado</h1>
        <p className="font-body text-ink-700 mb-6">
          Sua identidade foi confirmada. Você já pode criar pedidos e oferecer ajuda.
        </p>
        <Link to="/dashboard" className="btn-primary">Voltar ao painel</Link>
      </section>
    );
  }

  // ====== Limite atingido ======
  if (status && !status.can_retry && status.status === 'rejected') {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <AlertTriangle className="text-sun-600 mx-auto mb-6" size={64} />
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Limite de tentativas atingido</h1>
        <p className="font-body text-ink-700 mb-2">
          Você fez {status.attempts_last_24h} tentativas nas últimas 24 horas.
        </p>
        <p className="font-body text-ink-700 mb-6">
          Sua próxima tentativa entrará em fila de revisão manual da equipe.
        </p>
        <Link to="/dashboard" className="btn-secondary">Voltar ao painel</Link>
      </section>
    );
  }

  // ====== Resultado final ======
  if (step === 'done' && result) {
    const isApproved = result.status === 'approved';
    const isManual = result.status === 'manual';
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        {isApproved && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-leaf-400/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="text-leaf-500" size={40} />
            </div>
            <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Identidade verificada!</h1>
            <p className="font-body text-ink-700 mb-6">
              Sua conta agora tem o selo de verificada. Você já pode criar pedidos ou oferecer ajuda.
            </p>
            <Link to="/dashboard" className="btn-primary">Continuar</Link>
          </>
        )}
        {isManual && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-sun-100 flex items-center justify-center mb-6">
              <Clock className="text-sun-600" size={40} />
            </div>
            <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Em análise manual</h1>
            <p className="font-body text-ink-700 mb-6">
              Sua verificação ficou em uma faixa de incerteza e será revisada pela nossa equipe.
              Você receberá uma resposta em breve.
            </p>
            <Link to="/dashboard" className="btn-secondary">Voltar ao painel</Link>
          </>
        )}
        {!isApproved && !isManual && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Verificação não aprovada</h1>
            <p className="font-body text-ink-700 mb-2">
              <strong>Motivo:</strong> {result.rejection_reason}
            </p>
            <p className="font-body text-ink-700 mb-6 text-sm">
              Você pode tentar novamente. Dicas: boa iluminação, foto nítida do RG inteiro, e selfie sem máscara/óculos escuros.
            </p>
            <button onClick={() => { setStep('intro'); setRgBlob(null); setSelfieBlob(null); setResult(null); }} className="btn-primary">
              Tentar novamente
            </button>
          </>
        )}
      </section>
    );
  }

  // ====== Loading ======
  if (step === 'sending') {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-sky-100 flex items-center justify-center mb-6 animate-pulse-soft">
          <ShieldCheck className="text-sky-600" size={40} />
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Analisando sua verificação…</h1>
        <p className="font-body text-ink-700">
          Isso pode levar até 30 segundos. Não feche esta página.
        </p>
      </section>
    );
  }

  // ====== Wizard ======
  return (
    <section className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <ShieldCheck className="text-sky-600 mx-auto mb-3" size={48} />
        <h1 className="font-display font-bold text-3xl text-ink-900">Verificação de identidade</h1>
        <p className="font-body text-ink-700 mt-2">
          Para sua segurança e da rede, precisamos confirmar quem você é antes de criar pedidos ou oferecer ajuda.
        </p>
      </div>

      {/* Progresso */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {['rg', 'selfie', 'review'].map((s, i) => {
          const order = { intro: 0, rg: 1, selfie: 2, review: 3 };
          const cur = order[step] || 0;
          const reached = cur > i;
          const active = cur === i + 1;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                reached ? 'bg-leaf-500 text-white' :
                active ? 'bg-sky-600 text-white' :
                'bg-ink-200 text-ink-700'
              }`}>
                {reached ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 ${reached ? 'bg-leaf-500' : 'bg-ink-200'}`} />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* INTRO */}
      {step === 'intro' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-xl text-ink-900">Como funciona</h2>
          <ol className="space-y-3 font-body text-ink-700">
            <li className="flex gap-3"><span className="font-display font-bold text-sky-600">1.</span> Você envia uma foto do seu RG ou CNH (frente).</li>
            <li className="flex gap-3"><span className="font-display font-bold text-sky-600">2.</span> Tira uma selfie com a câmera deste dispositivo.</li>
            <li className="flex gap-3"><span className="font-display font-bold text-sky-600">3.</span> Nossa IA verifica se o documento é válido e se a selfie é sua.</li>
          </ol>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-ink-700">
            <p className="font-display font-semibold mb-1 text-sky-900">Privacidade</p>
            <p>Suas imagens ficam cifradas e são apagadas em até 30 dias após a verificação. Não compartilhamos com terceiros.</p>
          </div>
          <button onClick={() => setStep('rg')} className="btn-primary w-full">Começar</button>
        </div>
      )}

      {/* PASSO 1 — RG */}
      {step === 'rg' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-xl text-ink-900">1. Foto do documento</h2>
          <p className="font-body text-ink-700 text-sm">
            Envie a frente do RG ou CNH. Garanta que o nome e a foto estejam nítidos e a imagem inteira esteja visível.
          </p>

          {rgPreview ? (
            <div className="space-y-3">
              <img src={rgPreview} alt="RG" className="w-full rounded-xl border border-ink-200" />
              <div className="flex gap-2">
                <button onClick={() => { setRgBlob(null); setRgPreview(null); }} className="btn-ghost">Trocar</button>
                <button onClick={() => setStep('selfie')} className="btn-primary flex-1">Próximo</button>
              </div>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-ink-200 rounded-xl p-8 text-center cursor-pointer hover:border-sky-400 transition-colors">
              <Upload className="mx-auto mb-2 text-ink-400" size={32} />
              <span className="font-display font-medium text-ink-900">Selecionar arquivo</span>
              <p className="font-body text-xs text-ink-700 mt-1">JPG ou PNG até 8MB</p>
              <input type="file" accept="image/*" capture="environment" onChange={handleRgFile} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* PASSO 2 — SELFIE */}
      {step === 'selfie' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-xl text-ink-900">2. Selfie</h2>
          <p className="font-body text-ink-700 text-sm">
            Olhe diretamente para a câmera. Boa iluminação, sem máscara ou óculos escuros. A selfie deve ser tirada agora — não aceitamos imagens já existentes.
          </p>

          {selfiePreview ? (
            <div className="space-y-3">
              <img src={selfiePreview} alt="selfie" className="w-full rounded-xl" />
              <label className="flex items-start gap-2 text-sm font-body text-ink-700">
                <input type="checkbox" checked={keepAvatar} onChange={(e) => setKeepAvatar(e.target.checked)} className="mt-1" />
                <span>Quero usar essa foto como avatar do meu perfil (opcional, você pode mudar depois)</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => { setSelfieBlob(null); setSelfiePreview(null); }} className="btn-ghost">Tirar de novo</button>
                <button onClick={() => setStep('review')} className="btn-primary flex-1">Próximo</button>
              </div>
            </div>
          ) : (
            <CameraCapture
              facingMode="user"
              aspect="square"
              hint="Centralize seu rosto e olhe pra câmera"
              onCapture={(blob) => {
                setSelfieBlob(blob);
                setSelfiePreview(URL.createObjectURL(blob));
              }}
            />
          )}
        </div>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-xl text-ink-900">3. Confirmar e enviar</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-display font-semibold text-ink-700 uppercase mb-1">Documento</p>
              <img src={rgPreview} alt="RG" className="w-full rounded-lg border border-ink-200" />
            </div>
            <div>
              <p className="text-xs font-display font-semibold text-ink-700 uppercase mb-1">Selfie</p>
              <img src={selfiePreview} alt="selfie" className="w-full rounded-lg" />
            </div>
          </div>
          <div className="bg-sun-50 border border-sun-200 rounded-xl p-4 text-sm text-ink-700">
            <p className="font-display font-semibold mb-1 text-sun-700">Antes de enviar</p>
            <p>Confira que ambas as imagens estão legíveis. Você tem até 3 tentativas em 24h.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('selfie')} className="btn-ghost">Voltar</button>
            <button onClick={submit} className="btn-primary flex-1">Enviar para verificação</button>
          </div>
        </div>
      )}
    </section>
  );
}
