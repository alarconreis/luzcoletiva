import { useEffect, useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle2, Users, Clock, X, FileText, ClipboardList, ShieldCheck, ShieldOff, Flag, Eye, EyeOff, MessageSquare, Sparkles} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TRUST_LABEL, TRUST_BADGE, TRUST_LEVELS, CATEGORY_LABEL } from '../constants.js';

import { useNoIndex } from '../components/NoIndex.jsx';
import AssistedTab from '../components/admin/AssistedTab.jsx';
import AllRequestsTab from '../components/admin/AllRequestsTab.jsx';
import BlogTab from '../components/admin/BlogTab.jsx';
import SecurityTab from '../components/admin/SecurityTab.jsx';
export default function Admin() {
  useNoIndex();
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [openReports, setOpenReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loginLog, setLoginLog] = useState([]);
  const [auditSubtab, setAuditSubtab] = useState('actions');
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadStats = () =>
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});

  const loadPending = () =>
    api.get('/admin/pending-users').then(({ data }) => setPending(data)).catch(() => setPending([]));

  const loadPendingRequests = () =>
    api.get('/admin/help-requests/pending').then(({ data }) => setPendingRequests(data)).catch(() => setPendingRequests([]));

  const loadOpenReports = () =>
    api.get('/admin/reports', { params: { only_open: true } })
      .then(({ data }) => setOpenReports(data))
      .catch(() => setOpenReports([]));

  const loadUsers = () => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (statusFilter) params.status_filter = statusFilter;
    if (roleFilter) params.role_filter = roleFilter;
    api.get('/admin/users', { params })
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  const loadAuditLog = () => {
    setAuditLoading(true);
    api.get('/admin/audit')
      .then(({ data }) => setAuditLog(data))
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  };

  const loadLoginLog = (failures = false) => {
    setAuditLoading(true);
    api.get('/admin/login-log', { params: { only_failures: failures } })
      .then(({ data }) => setLoginLog(data))
      .catch(() => setLoginLog([]))
      .finally(() => setAuditLoading(false));
  };

  useEffect(() => { loadStats(); loadPending(); loadPendingRequests(); loadOpenReports(); loadUsers(); }, []);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const doApprove = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/approve`);
      showToast(`${u.name} aprovado`);
      loadPending(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao aprovar', 'error');
    }
  };

  const doReject = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/reject`);
      showToast(`${u.name} rejeitado`);
      loadPending(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao rejeitar', 'error');
    }
  };

  const doSuspend = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/suspend`);
      showToast(`${u.name} suspenso`);
      loadUsers(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao suspender', 'error');
    }
  };

  const doActivate = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/activate`);
      showToast(`${u.name} reativado`);
      loadUsers(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao ativar', 'error');
    }
  };

  const doPromote = async (u, role) => {
    try {
      await api.post(`/admin/users/${u.id}/role`, { role });
      showToast(`${u.name} agora é ${role}`);
      loadUsers(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao alterar role', 'error');
    }
  };

  const openDocument = async (reqId) => {
    try {
      const res = await api.get(`/help-requests/${reqId}/document`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      showToast('Erro ao abrir documento', 'error');
    }
  };

  const openUserFile = async (userId, type) => {
    try {
      const res = await api.get(`/admin/users/${userId}/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      showToast('Arquivo não encontrado', 'error');
    }
  };

  const doApproveRequest = async (r) => {
    try {
      await api.post(`/admin/help-requests/${r.id}/approve`);
      showToast(`Pedido "${r.title}" aprovado`);
      loadPendingRequests(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao aprovar pedido', 'error');
    }
  };

  const doRejectRequest = async (r) => {
    try {
      await api.post(`/admin/help-requests/${r.id}/reject`);
      showToast(`Pedido "${r.title}" rejeitado`);
      loadPendingRequests(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao rejeitar pedido', 'error');
    }
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      cpf: u.cpf || '',
      rg: u.rg || '',
      cnpj: u.cnpj || '',
      is_verified: u.is_verified,
    });
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const body = {};
      if (editForm.name !== editTarget.name) body.name = editForm.name;
      if (editForm.email !== editTarget.email) body.email = editForm.email;
      if (editForm.phone !== (editTarget.phone || '')) body.phone = editForm.phone;
      if (editForm.cpf !== (editTarget.cpf || '')) body.cpf = editForm.cpf;
      if (editForm.rg !== (editTarget.rg || '')) body.rg = editForm.rg;
      if (editForm.cnpj !== (editTarget.cnpj || '')) body.cnpj = editForm.cnpj;
      if (editForm.is_verified !== editTarget.is_verified) body.is_verified = editForm.is_verified;
      if (Object.keys(body).length === 0) { setEditTarget(null); return; }
      await api.patch(`/admin/users/${editTarget.id}`, body);
      showToast(`${editTarget.name} atualizado`);
      setEditTarget(null);
      loadUsers();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao salvar', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const doDelete = async (u, reason) => {
    try {
      const params = reason ? { reason } : {};
      await api.delete(`/admin/users/${u.id}`, { params });
      showToast(`${u.name} excluído permanentemente`);
      loadUsers(); loadStats();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao excluir', 'error');
    }
  };

  const doTrustLevel = async (u, trust_level) => {
    try {
      await api.patch(`/admin/users/${u.id}/trust-level`, { trust_level });
      showToast(`Score de ${u.name} atualizado para ${TRUST_LABEL[trust_level]}`);
      loadUsers();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao alterar score', 'error');
    }
  };

  const handleConfirm = () => {
    if (!confirm) return;
    const { action, target, role, trust_level } = confirm;
    if (action === 'suspend') doSuspend(target);
    else if (action === 'activate') doActivate(target);
    else if (action === 'role') doPromote(target, role);
    else if (action === 'approve') doApprove(target);
    else if (action === 'reject') doReject(target);
    else if (action === 'trust') doTrustLevel(target, trust_level);
    else if (action === 'approve_req') doApproveRequest(target);
    else if (action === 'reject_req') doRejectRequest(target);
    else if (action === 'delete') doDelete(target, confirm.reason);
    setConfirm(null);
  };

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-4xl text-ink-900 flex items-center gap-3">
            <Shield className="text-sun-600" size={36} /> Painel administrativo
          </h1>
          <p className="font-body text-ink-700 mt-1">Gestão de usuários e moderação da rede.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <StatCard label="Total" value={stats.total_users} accent="bg-sky-500" />
          <StatCard label="Ativos" value={stats.active_users} accent="bg-leaf-500" />
          <StatCard label="Suspensos" value={stats.suspended_users} accent="bg-red-500" />
          <StatCard label="Aguardando" value={stats.pending_approval} accent="bg-sun-500" />
          <StatCard label="Novos (7d)" value={stats.new_last_7_days} accent="bg-ink-700" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-ink-200 flex-wrap">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')} badge={pending.length}>
          <Clock size={16} /> Aprovações pendentes
        </TabBtn>
        <TabBtn active={tab === 'requests'} onClick={() => { setTab('requests'); loadPendingRequests(); }} badge={pendingRequests.length}>
          <FileText size={16} /> Pedidos pendentes
        </TabBtn>
        <TabBtn active={tab === 'reports'} onClick={() => { setTab('reports'); loadOpenReports(); }} badge={openReports.length}>
          <Flag size={16} /> Chats reportados
        </TabBtn>
        <TabBtn active={tab === 'users'} onClick={() => { setTab('users'); loadUsers(); }}>
          <Users size={16} /> Todos os usuários
        </TabBtn>
        {isAdmin && (
          <TabBtn active={tab === 'assisted'} onClick={() => setTab('assisted')}>
            <Sparkles size={16} /> Atendimento Assistido
          </TabBtn>
        )}
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>
          <FileText size={16} /> Todos os pedidos
        </TabBtn>
        {isAdmin && (
          <TabBtn active={tab === 'blog'} onClick={() => setTab('blog')}>
            <FileText size={16} /> Blog
          </TabBtn>
        )}
        {isAdmin && (
          <TabBtn active={tab === 'security'} onClick={() => setTab('security')}>
            <Shield size={16} /> Segurança
          </TabBtn>
        )}
        {isAdmin && (
          <TabBtn active={tab === 'audit'} onClick={() => { setTab('audit'); setAuditSubtab('actions'); loadAuditLog(); }}>
            <ClipboardList size={16} /> Auditoria
          </TabBtn>
        )}
      </div>

      {/* Painel de aprovações */}
      {tab === 'pending' && (
        <div className="card overflow-hidden">
          {pending.length === 0 ? (
            <div className="px-6 py-14 text-center text-ink-400 font-body">
              Nenhum cadastro aguardando aprovação.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left">
                  <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Cadastro</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {pending.map((u) => (
                    <tr key={u.id} className="hover:bg-ink-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{u.name}</div>
                        <div className="text-xs text-ink-700">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-900">
                        {u.doc_type === 'pj'
                          ? <span><span className="text-leaf-600 font-sans font-semibold">CNPJ</span> {u.cnpj || '—'}</span>
                          : <span><span className="text-sky-600 font-sans font-semibold">CPF</span> {u.cpf || '—'} · RG {u.rg || '—'}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.profile_type === 'helper' ? 'bg-sun-100 text-sun-600' : 'bg-sky-100 text-sky-600'
                        }`}>
                          {u.profile_type === 'helper' ? 'Ajudante' : 'Solicitante'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-700">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {u.selfie_path && (
                          <button
                            onClick={() => openUserFile(u.id, 'selfie')}
                            className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                          >
                            Selfie
                          </button>
                        )}
                        {u.doc_photo_path && (
                          <button
                            onClick={() => openUserFile(u.id, 'doc-photo')}
                            className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                          >
                            Doc
                          </button>
                        )}
                        <button
                          onClick={() => setConfirm({ action: 'approve', target: u, label: `aprovar ${u.name}` })}
                          className="text-xs text-leaf-600 hover:text-leaf-700 font-medium"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => setConfirm({ action: 'reject', target: u, label: `rejeitar ${u.name}` })}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Rejeitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Painel de pedidos pendentes */}
      {tab === 'requests' && (
        <div className="card overflow-hidden">
          {pendingRequests.length === 0 ? (
            <div className="px-6 py-14 text-center text-ink-400 font-body">
              Nenhum pedido aguardando aprovação.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left">
                  <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Local</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {pendingRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-ink-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900 max-w-[200px] truncate">{r.title}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {CATEGORY_LABEL[r.category] || r.category}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{r.city}/{r.state}</td>
                      <td className="px-4 py-3 text-ink-700">{r.requester_name}</td>
                      <td className="px-4 py-3 text-xs text-ink-700">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {r.has_document && (
                          <button
                            onClick={() => openDocument(r.id)}
                            className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                          >
                            Ver doc
                          </button>
                        )}
                        <button
                          onClick={() => setConfirm({ action: 'approve_req', target: r, label: `aprovar pedido "${r.title}"` })}
                          className="text-xs text-leaf-600 hover:text-leaf-700 font-medium"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => setConfirm({ action: 'reject_req', target: r, label: `rejeitar pedido "${r.title}"` })}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Rejeitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Painel de todos os usuários */}
      {tab === 'users' && (
        <>
          <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="Buscar por nome ou e-mail"
                className="input-field pl-10 py-2"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field py-2 w-auto">
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field py-2 w-auto">
              <option value="">Todos os roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={loadUsers} className="btn-secondary py-2 px-4">Filtrar</button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left">
                  <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Aprovação</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cadastro</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-400">Carregando…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-400">Nenhum usuário encontrado</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-ink-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{u.name}</div>
                        <div className="text-xs text-ink-700">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.profile_type === 'helper' ? 'bg-sun-100 text-sun-600' : 'bg-sky-100 text-sky-600'
                        }`}>
                          {u.profile_type === 'helper' ? 'Ajudante' : 'Solicitante'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'moderator' ? 'bg-sun-100 text-sun-700' :
                          'bg-ink-100 text-ink-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.trust_level}
                          onChange={(e) => {
                            if (e.target.value !== u.trust_level) {
                              setConfirm({
                                action: 'trust',
                                target: u,
                                trust_level: e.target.value,
                                label: `alterar score de ${u.name} para ${TRUST_LABEL[e.target.value]}`,
                              });
                              e.target.value = u.trust_level;
                            }
                          }}
                          className={`text-xs border rounded px-2 py-1 font-medium ${
                            TRUST_BADGE[u.trust_level]
                              ? TRUST_BADGE[u.trust_level].replace('ring-1 ring-sun-400', '') + ' border-transparent'
                              : 'border-ink-200 text-ink-700'
                          }`}
                        >
                          {TRUST_LEVELS.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_approved ? (
                          <span className="text-leaf-500 text-xs flex items-center gap-1"><CheckCircle2 size={14}/> Aprovado</span>
                        ) : (
                          <span className="text-sun-600 text-xs flex items-center gap-1"><Clock size={14}/> Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="text-leaf-500 text-xs flex items-center gap-1"><CheckCircle2 size={14}/> Ativo</span>
                        ) : (
                          <span className="text-red-500 text-xs flex items-center gap-1"><AlertTriangle size={14}/> Suspenso</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-700">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                        >
                          Editar
                        </button>
                        {!u.is_approved && u.is_active && (
                          <button
                            onClick={() => setConfirm({ action: 'approve', target: u, label: `aprovar ${u.name}` })}
                            className="text-xs text-leaf-600 hover:text-leaf-700 font-medium"
                          >
                            Aprovar
                          </button>
                        )}
                        {u.is_active ? (
                          <button
                            onClick={() => setConfirm({ action: 'suspend', target: u, label: `suspender ${u.name}` })}
                            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={u.id === user.id}
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirm({ action: 'activate', target: u, label: `reativar ${u.name}` })}
                            className="text-xs text-leaf-600 hover:text-leaf-700 font-medium"
                          >
                            Reativar
                          </button>
                        )}
                        {isAdmin && u.id !== user.id && (
                          <select
                            defaultValue={u.role}
                            onChange={(e) => {
                              if (e.target.value !== u.role) {
                                setConfirm({ action: 'role', target: u, role: e.target.value, label: `alterar ${u.name} para ${e.target.value}` });
                                e.target.value = u.role;
                              }
                            }}
                            className="text-xs border border-ink-200 rounded px-2 py-1"
                          >
                            <option value="user">user</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                        {isAdmin && u.id !== user.id && (
                          <button
                            onClick={() => setConfirm({ action: 'delete', target: u, label: `excluir permanentemente ${u.name}` })}
                            className="text-xs text-red-700 hover:text-red-900 font-semibold"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Painel de chats reportados */}
      {tab === 'reports' && (
        <ReportsPanel showToast={showToast} onChange={loadOpenReports} />
      )}

      {/* Painel de auditoria */}
      {tab === 'audit' && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setAuditSubtab('actions'); loadAuditLog(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${auditSubtab === 'actions' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
            >
              Ações administrativas
            </button>
            <button
              onClick={() => { setAuditSubtab('logins'); loadLoginLog(onlyFailures); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${auditSubtab === 'logins' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
            >
              Tentativas de acesso
            </button>
          </div>

          {auditSubtab === 'actions' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-left">
                    <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                      <th className="px-4 py-3">Data/hora</th>
                      <th className="px-4 py-3">Operador</th>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3">Alvo</th>
                      <th className="px-4 py-3">Detalhes</th>
                      <th className="px-4 py-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {auditLoading ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-400">Carregando…</td></tr>
                    ) : auditLog.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-400">Nenhum registro encontrado</td></tr>
                    ) : auditLog.map((e) => (
                      <tr key={e.id} className="hover:bg-ink-50/50">
                        <td className="px-4 py-3 text-xs text-ink-700 whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-900">{e.actor_email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_BADGE[e.action] || 'bg-ink-100 text-ink-700'}`}>
                            {ACTION_LABEL[e.action] || e.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-700">{e.target_email || '—'}</td>
                        <td className="px-4 py-3 text-xs text-ink-700 max-w-[200px] truncate">{e.details || '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-ink-500">{e.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {auditSubtab === 'logins' && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyFailures}
                    onChange={(e) => { setOnlyFailures(e.target.checked); loadLoginLog(e.target.checked); }}
                    className="rounded border-ink-300"
                  />
                  Mostrar apenas falhas
                </label>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-left">
                      <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                        <th className="px-4 py-3">Data/hora</th>
                        <th className="px-4 py-3">E-mail</th>
                        <th className="px-4 py-3">Resultado</th>
                        <th className="px-4 py-3">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {auditLoading ? (
                        <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-400">Carregando…</td></tr>
                      ) : loginLog.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-400">Nenhum registro encontrado</td></tr>
                      ) : loginLog.map((e) => (
                        <tr key={e.id} className="hover:bg-ink-50/50">
                          <td className="px-4 py-3 text-xs text-ink-700 whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-900">{e.email}</td>
                          <td className="px-4 py-3">
                            {e.success ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-leaf-100 text-leaf-700">Sucesso</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Falha</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-ink-500">{e.ip || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-5">
              Editar usuário — {editTarget.name}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Nome</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">E-mail</label>
                <input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Telefone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+55 11 99999-9999" className="input-field w-full" />
              </div>
              {editTarget.doc_type === 'pf' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">CPF</label>
                    <input value={editForm.cpf} onChange={(e) => setEditForm((f) => ({ ...f, cpf: e.target.value }))} className="input-field w-full font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">RG</label>
                    <input value={editForm.rg} onChange={(e) => setEditForm((f) => ({ ...f, rg: e.target.value }))} className="input-field w-full font-mono" />
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-1">CNPJ</label>
                  <input value={editForm.cnpj} onChange={(e) => setEditForm((f) => ({ ...f, cnpj: e.target.value }))} className="input-field w-full font-mono" />
                </div>
              )}
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified}
                    onChange={(e) => setEditForm((f) => ({ ...f, is_verified: e.target.checked }))}
                    className="rounded border-ink-300"
                  />
                  <span className="text-sm font-medium text-ink-700">Conta verificada</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditTarget(null)} className="btn-ghost" disabled={editSaving}>Cancelar</button>
              <button onClick={saveEdit} className="btn-primary" disabled={editSaving}>
                {editSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-sun-600 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-display font-semibold text-lg text-ink-900">Confirmar ação</h3>
                <p className="font-body text-ink-700 mt-1">
                  Você tem certeza que quer <strong>{confirm.label}</strong>?
                </p>
              </div>
            </div>
            {confirm.action === 'delete' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Motivo da exclusão <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={confirm.reason || ''}
                  onChange={(e) => setConfirm((c) => ({ ...c, reason: e.target.value }))}
                  placeholder="Ex: solicitação do titular, violação de termos…"
                  rows={3}
                  className="input-field w-full text-sm resize-none"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="btn-ghost">Cancelar</button>
              <button
                onClick={handleConfirm}
                disabled={confirm.action === 'delete' && !confirm.reason?.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-card font-body text-sm z-50 ${
          toast.kind === 'error' ? 'bg-red-500 text-white' : 'bg-leaf-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
      {tab === 'security' && (
        <SecurityTab />
      )}

      {tab === 'blog' && (
        <BlogTab />
      )}

      {tab === 'all' && (
        <AllRequestsTab />
      )}

      {tab === 'assisted' && (
        <AssistedTab />
      )}

    </section>
  );
}

const ACTION_LABEL = {
  approve: 'Aprovação',
  reject: 'Rejeição',
  suspend: 'Suspensão',
  activate: 'Reativação',
  role_change: 'Mudança de role',
  trust_level_change: 'Mudança de score',
  delete_user: 'Exclusão de usuário',
  view_selfie: 'Visualização de selfie',
  view_doc_photo: 'Visualização de documento',
  approve_request: 'Aprovação de pedido',
  reject_request: 'Rejeição de pedido',
  redact_message: 'Remoção de mensagem',
  resolve_report: 'Resolução de denúncia',
};

const ACTION_BADGE = {
  approve: 'bg-leaf-100 text-leaf-700',
  activate: 'bg-leaf-100 text-leaf-700',
  approve_request: 'bg-leaf-100 text-leaf-700',
  resolve_report: 'bg-leaf-100 text-leaf-700',
  reject: 'bg-red-100 text-red-700',
  suspend: 'bg-red-100 text-red-700',
  delete_user: 'bg-red-200 text-red-800',
  reject_request: 'bg-red-100 text-red-700',
  redact_message: 'bg-red-100 text-red-700',
  role_change: 'bg-sun-100 text-sun-700',
  trust_level_change: 'bg-sun-100 text-sun-700',
  view_selfie: 'bg-sky-100 text-sky-700',
  view_doc_photo: 'bg-sky-100 text-sky-700',
};

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-white mb-3`}>
        <Users size={20} />
      </div>
      <div className="font-display font-bold text-3xl text-ink-900">{value}</div>
      <div className="font-body text-sm text-ink-700">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-display font-medium border-b-2 transition-colors ${
        active
          ? 'border-sky-600 text-sky-900'
          : 'border-transparent text-ink-700 hover:text-ink-900'
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="bg-sun-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function VerificationsPanel({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/verifications', { params: { only_manual: true } })
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await api.post(`/admin/verifications/${id}/approve`);
      showToast('Verificação aprovada');
      load();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro', 'error');
    }
  };

  const reject = async (id) => {
    try {
      await api.post(`/admin/verifications/${id}/reject`);
      showToast('Verificação rejeitada');
      load();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro', 'error');
    }
  };

  return (
    <div className="card overflow-hidden mb-8">
      <div className="px-5 py-3 bg-sun-50 border-b border-sun-200 flex items-center gap-2">
        <ShieldCheck size={18} className="text-sun-700" />
        <h2 className="font-display font-semibold text-ink-900">Verificações em revisão manual</h2>
        <span className="ml-auto text-xs text-ink-700">{items.length} pendente(s)</span>
      </div>
      {loading ? (
        <div className="p-8 text-center text-ink-400 text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-ink-400 text-sm">Sem pendências.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left">
            <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Doc</th>
              <th className="px-4 py-2">Liveness</th>
              <th className="px-4 py-2">Match</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Motivo</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map(v => (
              <tr key={v.id} className="hover:bg-ink-50/50">
                <td className="px-4 py-2 font-mono text-xs">{v.user_id}</td>
                <td className="px-4 py-2">{v.score_document?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-2">{v.score_liveness?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-2">{v.score_face_match?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{v.extracted_name || '—'} ({v.name_match_score?.toFixed(2) ?? '—'})</td>
                <td className="px-4 py-2 text-xs text-ink-700 max-w-[200px] truncate" title={v.rejection_reason}>{v.rejection_reason || '—'}</td>
                <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => approve(v.id)} className="text-xs text-leaf-600 hover:text-leaf-700 font-medium">Aprovar</button>
                  <button onClick={() => reject(v.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Rejeitar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReportsPanel({ showToast, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openReport, setOpenReport] = useState(null); // { report, messages }

  const load = () => {
    setLoading(true);
    api.get('/admin/reports', { params: { only_open: true } })
      .then(({ data }) => { setItems(data); onChange?.(); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openConversation = async (report) => {
    try {
      const { data } = await api.get(`/admin/help-requests/${report.request_id}/messages`);
      setOpenReport({ report, messages: data });
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao carregar conversa', 'error');
    }
  };

  const refreshConversation = async () => {
    if (!openReport) return;
    try {
      const { data } = await api.get(`/admin/help-requests/${openReport.report.request_id}/messages`);
      setOpenReport({ ...openReport, messages: data });
    } catch {}
  };

  const redactMessage = async (msgId) => {
    if (!confirm('Censurar esta mensagem? Os usuários verão "[mensagem removida pela moderação]". Esta ação fica registrada na auditoria.')) return;
    try {
      await api.post(`/admin/messages/${msgId}/redact`);
      showToast('Mensagem censurada');
      refreshConversation();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao censurar', 'error');
    }
  };

  const resolveReport = async (reportId) => {
    if (!confirm('Marcar esta denúncia como resolvida?')) return;
    try {
      await api.post(`/admin/reports/${reportId}/resolve`);
      showToast('Denúncia resolvida');
      setOpenReport(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao resolver', 'error');
    }
  };

  return (
    <>
      <div className="card overflow-hidden mb-8">
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <Flag size={18} className="text-red-600" />
          <h2 className="font-display font-semibold text-ink-900">Chats reportados</h2>
          <span className="ml-auto text-xs text-ink-700">{items.length} pendente(s)</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-ink-400 text-sm">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-ink-400 text-sm">Sem denúncias abertas. Boa notícia.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left">
              <tr className="text-xs font-display font-semibold uppercase tracking-wider text-ink-700">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Pedido</th>
                <th className="px-4 py-2">Reporter</th>
                <th className="px-4 py-2">Motivo</th>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map(r => (
                <tr key={r.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-2 font-mono text-xs">#{r.id}</td>
                  <td className="px-4 py-2 font-mono text-xs">#{r.request_id}</td>
                  <td className="px-4 py-2 font-mono text-xs">user {r.reporter_id}</td>
                  <td className="px-4 py-2 text-xs text-ink-700 max-w-[260px] truncate" title={r.reason}>
                    {r.reason || <span className="italic text-ink-400">(sem descrição)</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-ink-700">
                    {r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => openConversation(r)} className="text-xs text-sky-700 hover:text-sky-900 font-medium">
                      Ver conversa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de conversa */}
      {openReport && (
        <div className="fixed inset-0 bg-ink-900/60 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-card max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink-900 flex items-center gap-2">
                  <MessageSquare size={20} className="text-sky-600" />
                  Conversa do pedido #{openReport.report.request_id}
                </h3>
                <p className="text-xs text-ink-700 mt-0.5">
                  Denúncia #{openReport.report.id} — {openReport.report.reason || 'sem descrição'}
                </p>
              </div>
              <button onClick={() => setOpenReport(null)} className="text-ink-400 hover:text-ink-700 text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-ink-50/50 space-y-2">
              {openReport.messages.length === 0 ? (
                <p className="text-center text-ink-400 text-sm py-8">Sem mensagens nesta conversa.</p>
              ) : openReport.messages.map(m => (
                <div key={m.id} className={`flex gap-3 items-start p-3 rounded-xl ${
                  m.is_redacted ? 'bg-red-50 border border-red-200' : 'bg-white border border-ink-200'
                }`}>
                  <div className="text-xs text-ink-700 font-mono shrink-0 w-20">
                    user {m.sender_id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm whitespace-pre-wrap break-words ${m.is_redacted ? 'italic text-red-700' : 'text-ink-900'}`}>
                      {m.content}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-1">
                      {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : ''} · #{m.id}
                    </p>
                  </div>
                  {!m.is_redacted ? (
                    <button
                      onClick={() => redactMessage(m.id)}
                      title="Censurar mensagem"
                      className="text-xs text-red-600 hover:text-red-800 font-medium shrink-0 flex items-center gap-1"
                    >
                      <EyeOff size={14} /> Censurar
                    </button>
                  ) : (
                    <span className="text-xs text-red-500 italic shrink-0">censurada</span>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-ink-100 flex items-center justify-between gap-2">
              <p className="text-xs text-ink-700">
                Para suspender um usuário, use a tabela de usuários abaixo.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setOpenReport(null)} className="btn-ghost">Fechar</button>
                <button onClick={() => resolveReport(openReport.report.id)} className="btn-primary">
                  Marcar como resolvida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

