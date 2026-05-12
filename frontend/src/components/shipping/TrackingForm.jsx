import { useState } from 'react';
import { Package } from 'lucide-react';
import api from '../../services/api.js';

export default function TrackingForm({ requestId, onUpdated }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const cleaned = code.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleaned)) {
      setError('Formato esperado: XX123456789BR (2 letras + 9 dígitos + BR)');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/help-requests/${requestId}/start-shipping`, { tracking_code: cleaned });
      onUpdated && onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao registrar envio');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5 bg-indigo-50/30">
      <h3 className="font-display font-semibold text-base text-ink-900 mb-2 flex items-center gap-2">
        <Package size={18} className="text-indigo-600" /> Anexar código de rastreio
      </h3>
      <p className="font-body text-sm text-ink-700 mb-3">
        Após postar nos Correios, cole aqui o código de rastreio. O solicitante será notificado.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="text"
          placeholder="Ex: BR123456789BR"
          className="input-field font-mono uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Registrando…' : 'Marcar como enviado'}
        </button>
      </form>
    </div>
  );
}
