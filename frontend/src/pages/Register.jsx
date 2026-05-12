import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, HandHeart, HelpingHand, CreditCard, FileText, Clock, Building2, Smartphone, Camera, Paperclip, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

import { useNoIndex } from '../components/NoIndex.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
const formatCpf = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatCnpj = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const cpfValid = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11 || new Set(d).size === 1) return false;
  const check = (len) => {
    const s = Array.from({ length: len }, (_, i) => parseInt(d[i]) * (len + 1 - i)).reduce((a, b) => a + b, 0);
    const r = (s * 10) % 11;
    return (r === 10 ? 0 : r) === parseInt(d[len]);
  };
  return check(9) && check(10);
};

const cnpjValid = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length !== 14 || new Set(d).size === 1) return false;
  const mod = (n) => { const r = n % 11; return r < 2 ? 0 : 11 - r; };
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const s1 = d.slice(0,12).split('').reduce((s,c,i) => s + parseInt(c)*w1[i], 0);
  const s2 = d.slice(0,13).split('').reduce((s,c,i) => s + parseInt(c)*w2[i], 0);
  return mod(s1) === parseInt(d[12]) && mod(s2) === parseInt(d[13]);
};

function FileField({ label, icon: Icon, accept, file, onChange, onClear, hint }) {
  const ref = useRef();
  return (
    <div>
      <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">{label}</label>
      {file ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-leaf-400 bg-leaf-50">
          <Icon size={18} className="text-leaf-600 shrink-0" />
          <span className="text-sm font-body text-ink-900 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={onClear} className="text-ink-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current.click()}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-ink-300 hover:border-sky-400 transition-colors text-left"
        >
          <Icon size={18} className="text-ink-400 shrink-0" />
          <span className="text-sm font-body text-ink-500">Selecionar arquivo</span>
        </button>
      )}
      {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
    </div>
  );
}

export default function Register() {
  useNoIndex();
  const { register, loading } = useAuth();
  const [params] = useSearchParams();
  const [pending, setPending] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    profile_type: 'helper',
    doc_type: 'pf',
    cpf: '',
    rg: '',
    cnpj: '',
  });
  const [selfie, setSelfie] = useState(null);
  const [selfieMode, setSelfieMode] = useState('webcam'); // 'webcam' ou 'upload'
  const [selfieWasUploaded, setSelfieWasUploaded] = useState(false);
  const [docPhoto, setDocPhoto] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = params.get('type');
    if (t === 'helper' || t === 'requester') {
      setForm((f) => ({ ...f, profile_type: t }));
    }
  }, [params]);

  const isPj = form.doc_type === 'pj';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    {
      const p = form.password;
      const missing = [];
      if (p.length < 8) missing.push('8 caracteres');
      if (!/[A-Z]/.test(p)) missing.push('uma letra maiúscula');
      if (!/[a-z]/.test(p)) missing.push('uma letra minúscula');
      if (!/\d/.test(p)) missing.push('um número');
      if (!/[^A-Za-z0-9]/.test(p)) missing.push('um caractere especial');
      if (missing.length) {
        setError(`A senha deve conter ao menos: ${missing.join(', ')}.`);
        return;
      }
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) { setError('Número de telefone inválido.'); return; }
    if (!isPj) {
      if (!cpfValid(form.cpf)) { setError('CPF inválido. Verifique o número digitado.'); return; }
      if (form.rg.trim().length < 4) { setError('RG inválido.'); return; }
    } else {
      if (!cnpjValid(form.cnpj)) { setError('CNPJ inválido. Verifique o número digitado.'); return; }
    }
    if (!selfie) { setError('Envie uma selfie para verificação.'); return; }
    if (!docPhoto) { setError('Envie uma foto do seu documento.'); return; }
    if (!acceptTerms || !acceptPrivacy) {
      setError('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('email', form.email);
    fd.append('password', form.password);
    fd.append('phone', form.phone);
    fd.append('profile_type', form.profile_type);
    fd.append('doc_type', form.doc_type);
    if (!isPj) {
      fd.append('cpf', form.cpf);
      fd.append('rg', form.rg);
    } else {
      fd.append('cnpj', form.cnpj);
    }
    fd.append('selfie', selfie);
    fd.append('selfie_was_uploaded', selfieWasUploaded ? 'true' : 'false');
    fd.append('doc_photo', docPhoto);
    fd.append('accept_terms', 'true');
    fd.append('accept_privacy', 'true');

    const result = await register(fd);
    if (result.ok) setPending(true);
    else setError(result.error);
  };

  if (pending) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-card p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sun-100 flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="text-sun-600" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">
            Cadastro recebido!
          </h1>
          <p className="font-body text-ink-700 leading-relaxed mb-6">
            Nossa equipe vai analisar seus dados e liberar o acesso em breve.
            Você receberá uma confirmação por e-mail.
          </p>
          <Link to="/login" className="btn-primary inline-flex">
            Ir para o login <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-card p-8 md:p-10">
        <div className="text-center mb-8">
          <Logo size={48} withText={false} className="justify-center" />
          <h1 className="mt-5 font-display font-bold text-3xl text-ink-900">
            Junte-se à rede
          </h1>
          <p className="mt-2 font-body text-ink-700">
            Sua história pode começar a iluminar outras hoje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de perfil */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-2">
              Como você quer participar?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, profile_type: 'helper' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.profile_type === 'helper'
                    ? 'border-sun-500 bg-sun-50 shadow-glow'
                    : 'border-ink-200 hover:border-sun-400'
                }`}
              >
                <HandHeart size={22} className="text-sun-600 mb-2" />
                <div className="font-display font-semibold text-ink-900">Quero ajudar</div>
                <div className="text-xs font-body text-ink-700 mt-1">
                  Ofereço tempo, recursos ou conhecimento
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, profile_type: 'requester' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.profile_type === 'requester'
                    ? 'border-sky-500 bg-sky-50 shadow-card'
                    : 'border-ink-200 hover:border-sky-400'
                }`}
              >
                <HelpingHand size={22} className="text-sky-600 mb-2" />
                <div className="font-display font-semibold text-ink-900">Preciso de ajuda</div>
                <div className="text-xs font-body text-ink-700 mt-1">
                  Busco apoio em um momento da minha vida
                </div>
              </button>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
              {isPj ? 'Nome da empresa / ONG' : 'Nome completo'}
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text" required minLength={2}
                placeholder={isPj ? 'Razão social ou nome fantasia' : 'Seu nome completo'}
                className="input-field pl-11"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          {/* Toggle PF / PJ */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-2">
              Tipo de cadastro
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, doc_type: 'pf', cnpj: '' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  !isPj ? 'border-sky-500 bg-sky-50' : 'border-ink-200 hover:border-sky-300'
                }`}
              >
                <CreditCard size={18} className="text-sky-600 mb-1" />
                <div className="font-display font-semibold text-sm text-ink-900">Pessoa física</div>
                <div className="text-xs text-ink-700">CPF + RG</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, doc_type: 'pj', cpf: '', rg: '' })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isPj ? 'border-leaf-500 bg-leaf-50' : 'border-ink-200 hover:border-leaf-300'
                }`}
              >
                <Building2 size={18} className="text-leaf-600 mb-1" />
                <div className="font-display font-semibold text-sm text-ink-900">Empresa / ONG</div>
                <div className="text-xs text-ink-700">CNPJ</div>
              </button>
            </div>
          </div>

          {/* Campos de documento */}
          {!isPj ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">CPF</label>
                <div className="relative">
                  <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text" required
                    placeholder="000.000.000-00"
                    className="input-field pl-11"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">RG</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text" required minLength={4} maxLength={30}
                    placeholder="Número do RG"
                    className="input-field pl-11"
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">CNPJ</label>
              <div className="relative">
                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text" required
                  placeholder="00.000.000/0000-00"
                  className="input-field pl-11"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* E-mail */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email" required
                placeholder="seu@email.com"
                className="input-field pl-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
              Telefone celular
            </label>
            <div className="relative">
              <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="tel" required
                placeholder="(11) 91234-5678"
                className="input-field pl-11"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
              />
            </div>
            <p className="text-xs text-ink-400 mt-1">Usado para verificação via SMS no login.</p>
          </div>

          {/* Senha */}
          <div>
            <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password" required minLength={8}
                placeholder="Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo"
                className="input-field pl-11"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <p className="text-xs text-ink-400 mt-1">
              Pelo menos 8 caracteres, incluindo uma maiúscula, uma minúscula, um número
              e um caractere especial (ex.: !@#$%).
            </p>
          </div>

          {/* Selfie — webcam preferida + fallback upload */}
          <div className="space-y-2">
            <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
              Selfie (foto do rosto)
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setSelfieMode('webcam'); setSelfie(null); setSelfieWasUploaded(false); }}
                className={`text-sm py-2 px-3 rounded-lg flex-1 transition-colors ${selfieMode === 'webcam' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
              >
                📹 Webcam (recomendado)
              </button>
              <button
                type="button"
                onClick={() => { setSelfieMode('upload'); setSelfie(null); setSelfieWasUploaded(true); }}
                className={`text-sm py-2 px-3 rounded-lg flex-1 transition-colors ${selfieMode === 'upload' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
              >
                📁 Enviar arquivo
              </button>
            </div>
            {selfieMode === 'webcam' && !selfie && (
              <CameraCapture
                facingMode="user"
                aspect="square"
                hint="Posicione seu rosto centralizado e bem iluminado. Olhe para a câmera."
                onCapture={(blob) => {
                  const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                  setSelfie(file);
                  setSelfieWasUploaded(false);
                }}
              />
            )}
            {selfieMode === 'webcam' && selfie && (
              <div className="card p-3 bg-leaf-50 border-leaf-200 text-leaf-800 text-sm flex items-center justify-between">
                <span>✓ Selfie capturada com sucesso</span>
                <button
                  type="button"
                  onClick={() => setSelfie(null)}
                  className="text-xs text-leaf-700 hover:text-leaf-800 underline"
                >
                  Capturar outra
                </button>
              </div>
            )}
            {selfieMode === 'upload' && (
              <>
                <FileField
                  label=""
                  icon={Camera}
                  accept="image/jpeg,image/png,image/webp"
                  file={selfie}
                  onChange={setSelfie}
                  onClear={() => setSelfie(null)}
                  hint="JPEG, PNG ou WebP. Use uma foto recente do seu rosto."
                />
                <p className="text-xs text-sun-700 italic mt-1">
                  ⚠ Selfies enviadas como arquivo passam por verificação manual mais rigorosa, podendo levar mais tempo.
                </p>
              </>
            )}
          </div>

          {/* Foto do documento */}
          <FileField
            label={isPj ? 'Foto do cartão CNPJ ou contrato social' : 'Foto do documento (RG ou CNH)'}
            icon={Paperclip}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            file={docPhoto}
            onChange={setDocPhoto}
            onClear={() => setDocPhoto(null)}
            hint="JPEG, PNG ou PDF. Máximo 10 MB."
          />

          <p className="text-xs font-body text-ink-400">
            {isPj
              ? 'CNPJ é usado apenas para verificação e não será compartilhado.'
              : 'CPF, RG e documentos são usados apenas para verificação de identidade.'}
          </p>

          {/* LGPD — aceites obrigatórios */}
          <div className="space-y-3 pt-2 border-t border-ink-100">
            <label className="flex items-start gap-2 text-sm font-body text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-ink-300"
              />
              <span>
                Li e aceito os{' '}
                <Link to="/termos" target="_blank" className="text-sky-600 hover:text-sky-800 underline">
                  Termos de Uso
                </Link>.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm font-body text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 rounded border-ink-300"
              />
              <span>
                Li e concordo com a{' '}
                <Link to="/privacidade" target="_blank" className="text-sky-600 hover:text-sky-800 underline">
                  Política de Privacidade
                </Link>{' '}
                e autorizo o tratamento dos meus dados pessoais para fins de cadastro,
                verificação e operação da plataforma (LGPD, Art. 7º, I).
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando…' : 'Enviar cadastro'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-ink-700">
          Já faz parte?{' '}
          <Link to="/login" className="font-semibold text-sky-900 hover:text-sky-600">
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}
