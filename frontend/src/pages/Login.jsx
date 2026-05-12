import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Smartphone, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

import { useNoIndex } from '../components/NoIndex.jsx';
export default function Login() {
  useNoIndex();
  const { login, verifyOtp, verifyTotp, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState({ token: '', phoneHint: '', code: '' });
  const [totp, setTotp] = useState({ challenge: '', code: '', isBackup: false });
  const [step, setStep] = useState('password'); // 'password' | 'otp' | 'totp'
  const [error, setError] = useState('');

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.totp_required) {
      setTotp({ challenge: result.challenge_token, code: '', isBackup: false });
      setStep('totp');
    } else if (result.otp_required) {
      setOtp({ token: result.otp_token, phoneHint: result.phone_hint, code: '' });
      setStep('otp');
    } else {
      navigate('/dashboard');
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.code.length !== 6) { setError('Digite os 6 dígitos do código.'); return; }
    const result = await verifyOtp(otp.token, otp.code);
    if (result.ok) navigate('/dashboard');
    else setError(result.error);
  };

  const handleTotp = async (e) => {
    e.preventDefault();
    setError('');
    if (!totp.isBackup && !/^\d{6}$/.test(totp.code)) {
      setError('Código TOTP deve ter 6 dígitos numéricos.');
      return;
    }
    if (totp.isBackup && totp.code.length < 8) {
      setError('Código de backup tem 8 caracteres (formato XXXX-XXXX).');
      return;
    }
    const result = await verifyTotp(totp.challenge, totp.code, totp.isBackup);
    if (result.ok) navigate('/dashboard');
    else setError(result.error);
  };

  const titles = {
    password: 'Bem-vindo de volta',
    otp: 'Verificação em duas etapas',
    totp: 'Autenticação TOTP',
  };
  const subtitles = {
    password: 'Sua luz faz falta por aqui ✨',
    otp: `Enviamos um código SMS para o número terminado em ${otp.phoneHint}`,
    totp: totp.isBackup
      ? 'Digite um dos seus backup codes (formato XXXX-XXXX)'
      : 'Digite o código de 6 dígitos do seu app autenticador',
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 md:p-10">
        <div className="text-center mb-8">
          <Logo size={48} withText={false} className="justify-center" />
          <h1 className="mt-5 font-display font-bold text-3xl text-ink-900">
            {titles[step]}
          </h1>
          <p className="mt-2 font-body text-ink-700">
            {subtitles[step]}
          </p>
        </div>

        {step === 'password' && (
          <form onSubmit={handlePassword} className="space-y-4">
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
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password" required
                  placeholder="••••••••"
                  className="input-field pl-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            {error && (
              error === 'Cadastro aguardando aprovação' ? (
                <div className="rounded-xl bg-sun-50 border border-sun-300 text-sun-800 px-4 py-3 text-sm font-body">
                  <strong>Cadastro em análise.</strong> Nossa equipe ainda está verificando seus dados.
                  Você receberá acesso assim que a aprovação for concluída.
                </div>
              ) : (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-body">
                  {error}
                </div>
              )
            )}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-body text-sky-700 hover:text-sky-500">
                Esqueci minha senha
              </Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Verificando…' : 'Entrar'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtp} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Código de 6 dígitos</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="000000"
                  className="input-field pl-11 tracking-[0.4em] text-center font-mono text-xl"
                  value={otp.code}
                  onChange={(e) => setOtp({ ...otp, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Verificando…' : 'Confirmar código'}
              {!loading && <ArrowRight size={18} />}
            </button>
            <button
              type="button"
              onClick={() => { setStep('password'); setError(''); setOtp({ token: '', phoneHint: '', code: '' }); }}
              className="w-full text-sm text-center text-ink-700 hover:text-ink-900 font-body"
            >
              ← Voltar
            </button>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotp} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
                {totp.isBackup ? 'Backup code' : 'Código TOTP'}
              </label>
              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  inputMode={totp.isBackup ? 'text' : 'numeric'}
                  maxLength={totp.isBackup ? 9 : 6}
                  required
                  placeholder={totp.isBackup ? 'XXXX-XXXX' : '000000'}
                  className="input-field pl-11 tracking-[0.3em] text-center font-mono text-xl uppercase"
                  value={totp.code}
                  onChange={(e) => setTotp({ ...totp, code: totp.isBackup
                    ? e.target.value.toUpperCase().slice(0, 9)
                    : e.target.value.replace(/\D/g, '').slice(0, 6)
                  })}
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Verificando…' : 'Confirmar'}
              {!loading && <ArrowRight size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setTotp({ ...totp, isBackup: !totp.isBackup, code: '' })}
              className="w-full text-sm text-center text-sky-700 hover:text-sky-500 font-body"
            >
              {totp.isBackup ? '← Usar código do app' : 'Não tenho acesso ao app — usar backup code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('password'); setError(''); setTotp({ challenge: '', code: '', isBackup: false }); }}
              className="w-full text-xs text-center text-ink-600 hover:text-ink-900 font-body"
            >
              ← Voltar ao login
            </button>
          </form>
        )}

        {step === 'password' && (
          <p className="mt-6 text-center font-body text-sm text-ink-700">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-semibold text-sky-900 hover:text-sky-600">
              Cadastre-se
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
