import { useState, useEffect } from 'react';
import { Sparkles, Plus, X, MapPin, Phone, Heart, Pencil, Archive, Lock } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { CATEGORIES } from '../../constants.js';

function formatCep(digits) {
  if (!digits) return '';
  const d = String(digits).replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/**
 * Componente que carrega imagem via API blob (rota protegida /admin/assisted-profiles/{id}/photo)
 * e exibe via URL.createObjectURL.
 */
function AssistedPhoto({ profileId, alt }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let url;
    let cancelled = false;
    api.get(`/admin/assisted-profiles/${profileId}/photo`, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [profileId]);

  if (error) {
    return (
      <div className="w-20 h-20 rounded-xl bg-ink-100 flex items-center justify-center text-xs text-ink-700">
        Sem foto
      </div>
    );
  }
  if (!src) {
    return <div className="w-20 h-20 rounded-xl bg-ink-100 animate-pulse" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-20 h-20 rounded-xl object-cover border border-ink-200"
    />
  );
}


function AssistedRequests({ profileId }) {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get(`/admin/assisted-profiles/${profileId}/requests`)
      .then(({ data }) => { if (!cancelled) setReqs(data); })
      .catch(() => { if (!cancelled) setReqs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  if (loading) return <div className="text-xs text-ink-700 italic">Carregando pedidos...</div>;
  if (reqs.length === 0) {
    return <div className="text-xs text-ink-700 italic">Nenhum pedido criado ainda.</div>;
  }

  const statusColor = {
    pending_review: 'bg-sun-100 text-sun-800',
    open: 'bg-sky-100 text-sky-800',
    proposed: 'bg-indigo-100 text-indigo-800',
    matched: 'bg-leaf-100 text-leaf-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-leaf-200 text-leaf-900',
    closed: 'bg-ink-100 text-ink-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabel = {
    pending_review: 'Aguardando aprovação',
    open: 'Aberto',
    proposed: 'Com oferta',
    matched: 'Em andamento',
    in_transit: 'Em trânsito',
    delivered: 'Entregue',
    closed: 'Fechado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="mt-3 pt-3 border-t border-ink-100">
      <div className="text-xs font-display font-semibold text-ink-900 mb-2">Pedidos institucionais ({reqs.length})</div>
      <div className="space-y-1.5">
        {reqs.map(r => (
          <a
            key={r.id}
            href={`/help-requests/${r.id}`}
            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <span className="text-xs text-ink-900 truncate flex-1">{r.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor[r.status] || 'bg-ink-100'}`}>
              {statusLabel[r.status] || r.status}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AssistedTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showCreateRequest, setShowCreateRequest] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form perfil (criar e editar usam o mesmo)
  const [pName, setPName] = useState('');
  const [pCity, setPCity] = useState('');
  const [pState, setPState] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pCep, setPCep] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pStory, setPStory] = useState('');
  const [pPhoto, setPPhoto] = useState(null);

  // Form pedido
  const [rTitle, setRTitle] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rCategory, setRCategory] = useState('');
  const [rValue, setRValue] = useState(100);

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/assisted-profiles');
      setProfiles(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showOk = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const resetForm = () => {
    setPName(''); setPCity(''); setPState(''); setPPhone('');
    setPCep(''); setPAddress('');
    setPStory(''); setPPhoto(null);
  };

  const openEdit = (profile) => {
    setEditingProfile(profile);
    setPName(profile.full_name);
    setPCity(profile.city);
    setPState(profile.state);
    setPPhone(profile.contact_phone || '');
    setPCep(formatCep(profile.cep || ''));
    setPAddress(profile.address || '');
    setPStory(profile.story);
    setPPhoto(null);
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingProfile) {
        // PATCH: só envia campos que mudaram (mais simples: envia tudo)
        fd.append('full_name', pName);
        fd.append('city', pCity);
        fd.append('state', pState);
        fd.append('story', pStory);
        fd.append('contact_phone', pPhone || '');
        if (isAdmin) {
          fd.append('cep', pCep || '');
          fd.append('address', pAddress || '');
        }
        if (pPhoto) fd.append('photo', pPhoto);

        await api.patch(`/admin/assisted-profiles/${editingProfile.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showOk('Perfil atualizado.');
      } else {
        if (!pPhoto) { showErr('Anexe uma foto da pessoa'); setSubmitting(false); return; }
        fd.append('full_name', pName);
        fd.append('city', pCity);
        fd.append('state', pState);
        fd.append('story', pStory);
        if (pPhone) fd.append('contact_phone', pPhone);
        if (isAdmin && pCep) fd.append('cep', pCep);
        if (isAdmin && pAddress) fd.append('address', pAddress);
        fd.append('photo', pPhoto);

        await api.post('/admin/assisted-profiles', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showOk('Perfil assistido criado.');
      }
      setShowCreateProfile(false);
      setEditingProfile(null);
      resetForm();
      load();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao salvar perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const archiveProfile = async (profile) => {
    if (!confirm(`Arquivar perfil de ${profile.full_name}?\n\nO perfil sumirá da lista mas pedidos antigos continuarão acessíveis.\nNão funcionará se houver pedidos abertos ou em andamento.`)) return;
    try {
      await api.post(`/admin/assisted-profiles/${profile.id}/archive`);
      showOk('Perfil arquivado.');
      load();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao arquivar');
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/help-requests/institutional', {
        assisted_profile_id: showCreateRequest.id,
        title: rTitle,
        description: rDesc,
        category: rCategory,
        value: parseFloat(rValue),
      });
      showOk(`Pedido criado em nome de ${showCreateRequest.full_name}.`);
      setShowCreateRequest(null);
      setRTitle(''); setRDesc(''); setRCategory(''); setRValue(100);
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const closeProfileModal = () => {
    setShowCreateProfile(false);
    setEditingProfile(null);
    resetForm();
  };

  if (loading) return <div className="card p-8">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-ink-900 text-2xl flex items-center gap-2">
            <Sparkles className="text-sun-600" size={24} /> Atendimento Assistido
          </h2>
          <p className="font-body text-sm text-ink-700 mt-1">
            Cadastre pessoas reais sem acesso digital e crie pedidos em nome delas. Limite: 5 perfis novos por mês.
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowCreateProfile(true); }} className="btn-primary">
          <Plus size={18} /> Novo perfil
        </button>
      </div>

      {error && <div className="card p-3 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="card p-3 bg-leaf-50 border-leaf-200 text-leaf-700 text-sm">{success}</div>}

      {profiles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">Nenhum perfil assistido cadastrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {profiles.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex gap-4">
                <AssistedPhoto profileId={p.id} alt={p.full_name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-ink-900">{p.full_name}</h3>
                  <p className="text-xs text-ink-700 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {p.city}, {p.state}
                  </p>
                  {p.contact_phone && (
                    <p className="text-xs text-ink-700 flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {p.contact_phone}
                    </p>
                  )}
                </div>
              </div>
              {isAdmin && (p.cep || p.address) && (
                <div className="mt-3 rounded-lg bg-sun-50/50 border border-sun-200 p-2.5 text-xs text-ink-800">
                  <div className="flex items-center gap-1 font-display font-semibold text-sun-800 uppercase tracking-wider text-[10px] mb-1">
                    <Lock size={10} /> Endereço (admin)
                  </div>
                  {p.cep && <div>CEP: {formatCep(p.cep)}</div>}
                  {p.address && <div className="leading-snug whitespace-pre-line">{p.address}</div>}
                </div>
              )}
              <p className="text-sm text-ink-700 mt-3 leading-relaxed line-clamp-3">{p.story}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => setShowCreateRequest(p)}
                  className="btn-secondary col-span-2 text-sm py-2"
                  title="Criar pedido em nome desta pessoa"
                >
                  <Heart size={14} /> Criar pedido
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="btn-ghost text-sm py-2"
                  title="Editar perfil"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <button
                onClick={() => archiveProfile(p)}
                className="btn-ghost w-full mt-2 text-xs text-red-600 hover:text-red-700"
                title="Arquivar perfil"
              >
                <Archive size={12} /> Arquivar perfil
              </button>
              <AssistedRequests profileId={p.id} />
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar perfil */}
      {(showCreateProfile || editingProfile) && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink-900 text-xl">
                  {editingProfile ? `Editar perfil: ${editingProfile.full_name}` : 'Novo perfil assistido'}
                </h3>
                <button onClick={closeProfileModal} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <form onSubmit={submitProfile} className="space-y-4">
                <input type="text" placeholder="Nome completo" className="input-field"
                  value={pName} onChange={e => setPName(e.target.value)} required minLength={2} maxLength={120} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Cidade" className="input-field col-span-2"
                    value={pCity} onChange={e => setPCity(e.target.value)} required />
                  <input type="text" placeholder="UF" className="input-field uppercase" maxLength={2}
                    value={pState} onChange={e => setPState(e.target.value.toUpperCase())} required />
                </div>
                <input type="tel" placeholder="Telefone (opcional)" className="input-field"
                  value={pPhone} onChange={e => setPPhone(e.target.value)} />
                {isAdmin && (
                  <div className="rounded-xl border border-sun-200 bg-sun-50/40 p-3 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-display font-semibold text-sun-800 uppercase tracking-wider">
                      <Lock size={12} /> Endereço — visível só para admin
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="CEP (00000-000)"
                      className="input-field"
                      value={pCep}
                      onChange={e => setPCep(formatCep(e.target.value))}
                      maxLength={9}
                    />
                    <textarea
                      placeholder="Endereço completo: rua, número, complemento, bairro, ponto de referência…"
                      rows={3}
                      className="input-field resize-none"
                      value={pAddress}
                      onChange={e => setPAddress(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                )}
                <textarea placeholder="História da pessoa (mínimo 20 caracteres)" rows={5} className="input-field resize-none"
                  value={pStory} onChange={e => setPStory(e.target.value)} required minLength={20} maxLength={2000} />
                <div>
                  <label className="block text-sm font-display font-medium text-ink-900 mb-1">
                    {editingProfile ? 'Trocar foto (opcional)' : 'Foto da pessoa'}
                  </label>
                  <input type="file" accept="image/*"
                    onChange={e => setPPhoto(e.target.files?.[0] || null)}
                    required={!editingProfile}
                    className="block text-sm" />
                  {editingProfile && (
                    <p className="text-xs text-ink-700 mt-1">Deixe vazio pra manter a foto atual.</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeProfileModal} className="btn-ghost">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Salvando...' : (editingProfile ? 'Salvar alterações' : 'Criar perfil')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar pedido em nome */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink-900 text-xl">
                  Criar pedido em nome de {showCreateRequest.full_name}
                </h3>
                <button onClick={() => setShowCreateRequest(null)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <p className="text-sm text-ink-700 mb-4">
                Este pedido será marcado como "Verificado pela Luz Coletiva" e auto-aprovado.
                Cidade/Estado virão do perfil ({showCreateRequest.city}, {showCreateRequest.state}).
              </p>
              <form onSubmit={submitRequest} className="space-y-4">
                <input type="text" placeholder="Título" className="input-field"
                  value={rTitle} onChange={e => setRTitle(e.target.value)} required minLength={5} maxLength={120} />
                <select className="input-field" value={rCategory} onChange={e => setRCategory(e.target.value)} required>
                  <option value="">Selecione categoria</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <textarea placeholder="Descrição do pedido" rows={4} className="input-field resize-none"
                  value={rDesc} onChange={e => setRDesc(e.target.value)} required minLength={10} maxLength={2000} />
                <div>
                  <label className="block text-sm font-display font-medium text-ink-900 mb-1">Valor (R$ 50–500)</label>
                  <input type="number" min={50} max={500} step={1} className="input-field"
                    value={rValue} onChange={e => setRValue(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreateRequest(null)} className="btn-ghost">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Criando...' : 'Criar pedido institucional'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
