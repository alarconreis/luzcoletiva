import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import Logo from '../components/Logo.jsx';

import { useNoIndex } from '../components/NoIndex.jsx';
export default function ResetPassword() {
  useNoIndex();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    {
      const p = form.new_password;
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
    if (form.new_password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/password-reset/confirm', { token, new_password: form.new_password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <div className="text-center">
          <p className="font-body text-ink-700">Link inválido.</p>
          <Link to="/forgot-password" className="mt-4 inline-block font-semibold text-sky-700 hover:text-sky-500">
            Solicitar novo link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-sunrise-soft grain">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 md:p-10">
        <div className="text-center mb-8">
          <Logo size={48} withText={false} className="justify-center" />
          <h1 className="mt-5 font-display font-bold text-3xl text-ink-900">Nova senha</h1>
          <p className="mt-2 font-body text-ink-700">Escolha uma senha forte para a sua conta.</p>
        </div>

        {done ? (
          <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-5 py-4 text-sm font-body text-center leading-relaxed">
            <p className="font-semibold text-base mb-1">Senha redefinida!</p>
            <p>Você será redirecionado para o login em instantes…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Nova senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo"
                  className="input-field pl-11"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                />
              </div>
              <p className="text-xs text-ink-400 mt-1">
                Pelo menos 8 caracteres, incluindo uma maiúscula, uma minúscula, um número
                e um caractere especial.
              </p>
            </div>
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Confirmar nova senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  required
                  placeholder="Repita a senha"
                  className="input-field pl-11"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
              {loading ? 'Salvando…' : 'Redefinir senha'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {!done && (
          <p className="mt-6 text-center font-body text-sm text-ink-700">
            <Link to="/login" className="font-semibold text-sky-900 hover:text-sky-600">
              ← Voltar para o login
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
