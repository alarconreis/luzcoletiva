import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import Logo from '../components/Logo.jsx';

import { useNoIndex } from '../components/NoIndex.jsx';
export default function ForgotPassword() {
  useNoIndex();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/password-reset/request', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 md:p-10">
        <div className="text-center mb-8">
          <Logo size={48} withText={false} className="justify-center" />
          <h1 className="mt-5 font-display font-bold text-3xl text-ink-900">Esqueci minha senha</h1>
          <p className="mt-2 font-body text-ink-700">
            Informe seu e-mail e enviaremos um link para redefinir a senha.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-5 py-4 text-sm font-body text-center leading-relaxed">
            <p className="font-semibold text-base mb-1">E-mail enviado!</p>
            <p>Se este endereço estiver cadastrado, você receberá as instruções em breve. Verifique também a caixa de spam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="input-field pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
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
              {loading ? 'Enviando…' : 'Enviar link de redefinição'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        <p className="mt-6 text-center font-body text-sm text-ink-700">
          <Link to="/login" className="font-semibold text-sky-900 hover:text-sky-600">
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </section>
  );
}
