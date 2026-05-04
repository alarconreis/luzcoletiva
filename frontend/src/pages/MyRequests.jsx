import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, MessageCircle, Paperclip, X, DollarSign } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES, CATEGORY_LABEL, STATES, STATUS_COLOR, STATUS_LABEL } from '../constants.js';

export default function MyRequests() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'alimentacao', city: '', state: 'SP', value: '',
  });
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/my-requests')
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (user?.profile_type !== 'requester') {
    return (
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Acesso restrito</h1>
        <p className="font-body text-ink-700">Esta página é para quem solicita ajuda. Se você quer ajudar, vá em <Link to="/help-requests" className="text-sky-600 underline">Pedidos abertos</Link>.</p>
      </section>
    );
  }

  const resetForm = () => {
    setCreating(false);
    setForm({ title: '', description: '', category: 'alimentacao', city: '', state: 'SP', value: '' });
    setDocFile(null);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const val = parseFloat(form.value);
    if (!form.value || isNaN(val) || val < 50 || val > 300) {
      setError('O valor deve ser entre R$ 50,00 e R$ 300,00.');
      return;
    }
    if (!docFile) { setError('Anexe um documento de comprovação antes de enviar.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('city', form.city);
      fd.append('state', form.state);
      fd.append('value', val.toFixed(2));
      fd.append('document', docFile);
      await api.post('/help-requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-4xl text-ink-900">Meus pedidos</h1>
          <p className="font-body text-ink-700 mt-1">
            Acompanhe seus pedidos e converse com quem se ofereceu.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary" disabled={creating}>
          <Plus size={18} /> Novo pedido
        </button>
      </div>

      {creating && (
        <div className="card p-6 mb-8 bg-sun-50/50">
          <h2 className="font-display font-semibold text-xl text-ink-900 mb-4">Criar novo pedido</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Título</label>
              <input type="text" required minLength={5} maxLength={120}
                className="input-field"
                placeholder="Ex: Preciso de cesta básica para minha família"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Descrição</label>
              <textarea required minLength={10} maxLength={2000} rows={4}
                className="input-field resize-none"
                placeholder="Conte um pouco sobre o que você precisa..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Categoria</label>
                <select className="input-field" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Cidade</label>
                <input type="text" required minLength={2} maxLength={80}
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">Estado</label>
                <select className="input-field" value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Valor solicitado */}
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
                Valor solicitado <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-medium text-sm">R$</span>
                <input
                  type="number" required min={50} max={300} step="0.01"
                  className="input-field pl-10"
                  placeholder="Ex: 150,00"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <p className="text-xs text-ink-400 mt-1">Valor mínimo R$ 50,00 · máximo R$ 300,00.</p>
            </div>

            {/* Upload de documento obrigatório */}
            <div>
              <label className="block font-display font-medium text-sm text-ink-900 mb-1.5">
                Documento de comprovação <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-ink-700 mb-2">
                Anexe um comprovante, orçamento ou qualquer documento que demonstre a necessidade.
                Aceito: PDF, JPEG, PNG, WebP — máx. 10 MB.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
              {docFile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-leaf-50 border border-leaf-200 text-sm text-leaf-700">
                  <Paperclip size={14} />
                  <span className="flex-1 truncate">{docFile.name}</span>
                  <button type="button" onClick={() => { setDocFile(null); fileRef.current.value = ''; }}
                    className="text-leaf-600 hover:text-leaf-800">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-ink-300 text-ink-700 hover:border-sky-400 hover:text-sky-700 text-sm transition-colors">
                  <Paperclip size={16} /> Selecionar arquivo
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="btn-ghost" disabled={submitting}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={submitting || !docFile}>
                {submitting ? 'Enviando…' : 'Enviar para aprovação'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="card h-32 animate-pulse bg-ink-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">
            Você ainda não criou nenhum pedido. Clique em "Novo pedido" para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(req => (
            <article key={req.id} className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display font-semibold text-lg text-ink-900 leading-snug">
                  {req.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[req.status] || ''}`}>
                  {STATUS_LABEL[req.status] || req.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-700 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium">
                  {CATEGORY_LABEL[req.category]}
                </span>
                <span className="flex items-center gap-1"><MapPin size={12} />{req.city}/{req.state}</span>
                {req.value != null && (
                  <span className="px-2 py-0.5 rounded-full bg-leaf-50 text-leaf-700 font-medium">
                    R$ {Number(req.value).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              <p className="font-body text-sm text-ink-700 line-clamp-2 mb-4">{req.description}</p>
              {req.status === 'pending_review' ? (
                <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                  Seu pedido está sendo analisado pela moderação. Você será avisado quando for aprovado.
                </p>
              ) : (
                <Link to={`/help-requests/${req.id}`} className="btn-secondary text-sm py-2">
                  <MessageCircle size={16} /> Ver detalhes
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
