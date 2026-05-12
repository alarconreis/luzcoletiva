import { useState } from 'react';
import { Package, ExternalLink, Check } from 'lucide-react';
import api from '../../services/api.js';

export default function TrackingDisplay({ requestId, trackingCode, isRequester, onUpdated }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const correiosUrl = `https://www.linkcorreios.com.br/?id=${trackingCode}`;

  async function confirmDelivery() {
    setError('');
    setConfirming(true);
    try {
      const { data } = await api.post(`/help-requests/${requestId}/confirm-delivery`);
      onUpdated && onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao confirmar recebimento');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="card p-5 bg-indigo-50/30 space-y-3">
      <div className="font-display font-semibold text-base text-ink-900 flex items-center gap-2">
        <Package size={18} className="text-indigo-600" /> Pedido em transito
      </div>

      <div className="bg-white rounded-xl px-4 py-3 border border-indigo-200">
        <div className="text-xs text-ink-700 mb-1">Codigo de rastreio</div>
        <div className="font-mono text-lg tracking-wider text-ink-900">{trackingCode}</div>
      </div>

      <a
        href={correiosUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
      >
        <ExternalLink size={14} /> Rastrear nos Correios
      </a>

      {isRequester && (
        <>
          <div className="border-t border-indigo-100 pt-3">
            <p className="text-xs text-ink-700 mb-2">
              Quando o pedido chegar, confirme o recebimento.
              Se nao confirmar em 7 dias, o pedido sera fechado automaticamente.
            </p>
            <button
              onClick={confirmDelivery}
              disabled={confirming}
              className="btn-primary w-full"
            >
              <Check size={16} /> {confirming ? 'Confirmando...' : 'Confirmei o recebimento'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </>
      )}

      {!isRequester && (
        <p className="text-xs text-ink-700 italic">Aguardando confirmacao do solicitante...</p>
      )}
    </div>
  );
}
