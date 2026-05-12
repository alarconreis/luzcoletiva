import { Truck, MapPin } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api.js';

export default function ShippingMethodPicker({ requestId, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function pick(method) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post(`/help-requests/${requestId}/shipping-method`, { method });
      onUpdated && onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao definir modo de entrega');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 bg-sun-50/30">
      <h3 className="font-display font-semibold text-lg text-ink-900 mb-2">Como você vai entregar?</h3>
      <p className="font-body text-sm text-ink-700 mb-4">
        Escolha o modo de entrega. O solicitante recebe a notificação para informar o local.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => pick('correios')}
          disabled={submitting}
          className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-ink-200 hover:border-sky-400 hover:bg-sky-50 transition-colors text-left disabled:opacity-50"
        >
          <Truck className="text-sky-600" size={24} />
          <span className="font-display font-semibold text-ink-900">Correios PAC/Sedex</span>
          <span className="text-xs text-ink-700">Envia direto pra casa do solicitante.</span>
        </button>

        <button
          type="button"
          onClick={() => pick('pickup_point')}
          disabled={submitting}
          className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-ink-200 hover:border-leaf-400 hover:bg-leaf-50 transition-colors text-left disabled:opacity-50"
        >
          <MapPin className="text-leaf-600" size={24} />
          <span className="font-display font-semibold text-ink-900">Ponto de retirada</span>
          <span className="text-xs text-ink-700">Solicitante indica uma agência ou ponto neutro.</span>
        </button>
      </div>

      <div className="mt-4 px-4 py-3 rounded-xl bg-sun-50 border border-sun-200 text-xs text-ink-700">
        <strong>Lembre:</strong> ao escolher Correios, você se compromete a pagar o frete (R$ 15–35 típico,
        varia com peso e distância). Se quiser dividir, conversem pelo chat. Luz Coletiva não medeia pagamento.
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
