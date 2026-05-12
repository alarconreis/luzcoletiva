import { useState } from 'react';
import { MapPin } from 'lucide-react';
import api from '../../services/api.js';

export default function PickupLocationForm({ requestId, onUpdated }) {
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/help-requests/${requestId}/pickup-location`, { location });
      onUpdated && onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar ponto de retirada');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 bg-leaf-50/30">
      <h3 className="font-display font-semibold text-lg text-ink-900 mb-2 flex items-center gap-2">
        <MapPin size={20} className="text-leaf-600" /> Ponto de retirada
      </h3>
      <p className="font-body text-sm text-ink-700 mb-4">
        Descreva o ponto onde você prefere retirar. Recomendamos uma agência dos Correios
        ou local público próximo (não a sua casa).
      </p>

      <form onSubmit={submit} className="space-y-3">
        <textarea
          rows={4}
          className="input-field resize-none"
          placeholder="Ex: Agência dos Correios Centro, Av. Sete de Setembro 1234, próximo à estação X. Aberto de seg a sex 9h–17h. CEP 40000-000."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          minLength={10}
          maxLength={500}
        />
        <p className="text-xs text-ink-700">
          {location.length}/500 caracteres
        </p>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Salvar ponto'}
        </button>
      </form>
    </div>
  );
}
