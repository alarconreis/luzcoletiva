import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import api from '../../services/api.js';
import { STATES } from '../../constants.js';

export default function ShippingAddressForm({ requestId, defaultName, onUpdated }) {
  const [form, setForm] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    recipient_name: defaultName || '',
    recipient_phone: '',
  });
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function searchCep() {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError('CEP precisa ter 8 dígitos');
      return;
    }
    setError('');
    setSearching(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await r.json();
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      setForm(f => ({
        ...f,
        cep: digits.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch (e) {
      setError('Erro ao consultar CEP. Preencha manualmente.');
    } finally {
      setSearching(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/help-requests/${requestId}/shipping-address`, form);
      onUpdated && onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar endereço');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 bg-sky-50/30">
      <h3 className="font-display font-semibold text-lg text-ink-900 mb-2 flex items-center gap-2">
        <MapPin size={20} className="text-sky-600" /> Endereço de entrega
      </h3>
      <p className="font-body text-sm text-ink-700 mb-4">
        O helper escolheu enviar pelos Correios. Preencha seu endereço completo.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            placeholder="CEP (8 dígitos)"
            className="input-field"
            value={form.cep}
            onChange={(e) => set('cep', e.target.value)}
            maxLength={9}
            required
          />
          <button
            type="button"
            onClick={searchCep}
            disabled={searching}
            className="btn-ghost px-3"
            title="Buscar endereço pelo CEP"
          >
            <Search size={16} /> {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        <input
          type="text"
          placeholder="Rua / logradouro"
          className="input-field"
          value={form.street}
          onChange={(e) => set('street', e.target.value)}
          required
          minLength={3}
          maxLength={120}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Número"
            className="input-field"
            value={form.number}
            onChange={(e) => set('number', e.target.value)}
            required
            maxLength={20}
          />
          <input
            type="text"
            placeholder="Complemento (opcional)"
            className="input-field"
            value={form.complement}
            onChange={(e) => set('complement', e.target.value)}
            maxLength={80}
          />
        </div>

        <input
          type="text"
          placeholder="Bairro"
          className="input-field"
          value={form.neighborhood}
          onChange={(e) => set('neighborhood', e.target.value)}
          required
          minLength={2}
          maxLength={80}
        />

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <input
            type="text"
            placeholder="Cidade"
            className="input-field"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
          <select
            className="input-field"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            required
          >
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <input
          type="text"
          placeholder="Nome do destinatário (você pode simplificar, ex: Maria S.)"
          className="input-field"
          value={form.recipient_name}
          onChange={(e) => set('recipient_name', e.target.value)}
          required
          minLength={2}
          maxLength={120}
        />

        <input
          type="tel"
          placeholder="Telefone (Correios pede)"
          className="input-field"
          value={form.recipient_phone}
          onChange={(e) => set('recipient_phone', e.target.value)}
          required
          minLength={10}
          maxLength={20}
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Salvar endereço'}
        </button>
      </form>
    </div>
  );
}
