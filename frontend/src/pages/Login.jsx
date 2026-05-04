import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login, verifyOtp, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState({ token: '', phoneHint: '', code: '' });
  const [step, setStep] = useState('password'); // 'password' | 'otp'
  const [error, setError] = useState('');

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.otp_required) {
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

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 md:p-10">
        <div className="text-center mb-8">
          <Logo size={48} withText={false} className="justify-center" />
          <h1 className="mt-5 font-display font-bold text-3xl text-ink-900">
            {step === 'otp' ? 'Verificação em duas etapas' : 'Bem-vindo de volta'}
          </h1>
          <p className="mt-2 font-body text-ink-700">
            {step === 'otp'
              ? `Enviamos um código SMS para o número terminado em ${otp.phoneHint}`
              : 'Sua luz faz falta por aqui ✨'}
          </p>
        </div>

        {step === 'password' ? (
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
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Verificando…' : 'Entrar'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
                Código de 6 dígitos
              </label>
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
