import { useState, useEffect } from 'react';
import { Sparkles, MapPin, Filter } from 'lucide-react';
import api from '../../services/api.js';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pending_review', label: 'Aguardando aprovação' },
  { value: 'open', label: 'Aberto' },
  { value: 'proposed', label: 'Com oferta' },
  { value: 'matched', label: 'Em andamento' },
  { value: 'in_transit', label: 'Em trânsito' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'closed', label: 'Fechado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'institutional', label: 'Apenas institucionais' },
  { value: 'regular', label: 'Apenas comuns' },
];

const STATUS_COLOR = {
  pending_review: 'bg-sun-100 text-sun-800',
  open: 'bg-sky-100 text-sky-800',
  proposed: 'bg-indigo-100 text-indigo-800',
  matched: 'bg-leaf-100 text-leaf-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-leaf-200 text-leaf-900',
  closed: 'bg-ink-200 text-ink-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  pending_review: 'Aguardando',
  open: 'Aberto',
  proposed: 'Com oferta',
  matched: 'Em andamento',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  closed: 'Fechado',
  cancelled: 'Cancelado',
};

export default function AllRequestsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status_filter = statusFilter;
    if (typeFilter) params.type_filter = typeFilter;
    api.get('/admin/help-requests/all', { params })
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-semibold text-ink-900 text-2xl">Todos os pedidos</h2>
        <p className="font-body text-sm text-ink-700 mt-1">
          Visão geral de todos os pedidos da plataforma. Use os filtros para refinar.
        </p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-ink-700" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 w-auto">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field py-2 w-auto">
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-sm text-ink-700 ml-auto">
          {loading ? 'Carregando...' : `${items.length} pedido(s)`}
        </span>
      </div>

      {!loading && items.length === 0 && (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">Nenhum pedido encontrado com esses filtros.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left">
              <tr>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">ID</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Título</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Solicitante</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Local</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Valor</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Status</th>
                <th className="px-3 py-2 font-display font-semibold text-ink-900">Criado</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                  <td className="px-3 py-2 font-mono text-xs">
                    <a href={`/help-requests/${r.id}`} className="text-sky-600 hover:underline">#{r.id}</a>
                  </td>
                  <td className="px-3 py-2">
                    <a href={`/help-requests/${r.id}`} className="text-ink-900 hover:text-sky-700">{r.title}</a>
                  </td>
                  <td className="px-3 py-2">
                    {r.is_institutional && <Sparkles size={12} className="inline text-sun-600 mr-1" />}
                    <span className="text-xs">{r.requester_name}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <MapPin size={11} className="inline mr-0.5" /> {r.city}/{r.state}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.value ? `R$ ${r.value.toFixed(0)}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[r.status] || 'bg-ink-100'}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-700">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
