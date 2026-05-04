import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Filter } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES, CATEGORY_LABEL, STATES, STATUS_COLOR, STATUS_LABEL, TRUST_BADGE, TRUST_LABEL, memberSince } from '../constants.js';

export default function HelpRequests() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (state) params.state = state;
    api.get('/help-requests', { params })
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (user?.profile_type !== 'helper') {
    return (
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Acesso restrito</h1>
        <p className="font-body text-ink-700">Esta página é para quem oferece ajuda. Se você precisa de apoio, vá em <Link to="/my-requests" className="text-sky-600 underline">Meus pedidos</Link>.</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-ink-900">Pedidos abertos</h1>
        <p className="font-body text-ink-700 mt-1">
          Pessoas pedindo ajuda agora. Escolha um pedido e ofereça apoio.
        </p>
      </div>

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-ink-700" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field py-2 w-auto">
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className="input-field py-2 w-auto">
          <option value="">Todos os estados</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="btn-secondary py-2 px-4">Filtrar</button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-48 animate-pulse bg-ink-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">Nenhum pedido encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(req => {
            const trust = req.requester?.trust_level;
            const badgeClass = TRUST_BADGE[trust];
            const isParceiro = trust === 'parceiro_validado';
            return (
              <article
                key={req.id}
                className={`card p-6 flex flex-col ${isParceiro ? 'ring-2 ring-sun-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-display font-semibold">
                    {CATEGORY_LABEL[req.category] || req.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status] || ''}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-lg text-ink-900 leading-snug">
                  {req.title}
                </h3>
                {req.value != null && (
                  <p className="mt-1 font-display font-bold text-sun-600 text-base">
                    R$ {Number(req.value).toFixed(2).replace('.', ',')}
                  </p>
                )}
                <p className="mt-2 font-body text-sm text-ink-700 leading-relaxed line-clamp-3">
                  {req.description}
                </p>

                <div className="mt-4 pt-4 border-t border-ink-100 text-xs text-ink-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {req.city}/{req.state}
                    </span>
                    <span className="flex items-center gap-2">
                      {badgeClass && (
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>
                          {TRUST_LABEL[trust]}
                        </span>
                      )}
                      {req.requester?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-400">
                    <span>membro há {memberSince(req.requester?.created_at)}</span>
                    {req.requester?.rating_count > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-sun-500">★</span>
                        {req.requester.avg_rating?.toFixed(1)}
                        <span>({req.requester.rating_count})</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link to={`/help-requests/${req.id}`} className="btn-primary mt-4 text-sm py-2">
                  <Heart size={16} /> Ver e ajudar
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
