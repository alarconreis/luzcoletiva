import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Copy, Download, Heart, Mail, Pencil, Phone, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

import { useNoIndex } from '../components/NoIndex.jsx';
export default function Dashboard() {
  useNoIndex();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const openEdit = () => {
    setForm({ name: user.name, phone: user.phone || '', current_password: '', new_password: '' });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const body = {};
      if (form.name !== user.name) body.name = form.name;
      if (form.phone !== (user.phone || '')) body.phone = form.phone;
      if (form.new_password) {
        body.new_password = form.new_password;
        body.current_password = form.current_password;
      }
      if (Object.keys(body).length === 0) { setEditing(false); return; }
      const { data } = await api.patch('/profile', body);
      updateUser(data);
      setEditing(false);
      showToast('Perfil atualizado');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    api
      .get('/profile/history')
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory({ items: [] }))
      .finally(() => setLoading(false));
  }, []);

  const exportMyData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/profile/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luzcoletiva-meus-dados-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showToast('Dados exportados. Verifique o download.');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao exportar', 'error');
    } finally {
      setExporting(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText('316.402.348-02');
      showToast('Chave PIX copiada');
    } catch {
      showToast('Não foi possível copiar', 'error');
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      setDeleteConfirm(false);
      showToast('Conta excluída. Você será desconectado.');
      setTimeout(() => { logout(); navigate('/'); }, 1500);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao excluir conta', 'error');
      setDeleting(false);
    }
  };

  if (!user) return null;


  const showVerifyBanner = !user.is_verified;

  const profileLabel = user.profile_type === 'helper' ? 'Ajudante' : 'Solicitante';
  const profileColor =
    user.profile_type === 'helper'
      ? 'bg-sun-400 text-ink-900'
      : 'bg-sky-500 text-white';

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
      {/* Banner: verificação pendente */}
      {showVerifyBanner && (
        <div className="rounded-2xl bg-gradient-to-r from-sun-100 to-sun-50 border border-sun-200 p-5 mb-6 flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-sun-400 flex items-center justify-center text-ink-900 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h2 className="font-display font-semibold text-lg text-ink-900">Verifique sua identidade</h2>
            <p className="font-body text-sm text-ink-700 mt-1">
              Para criar pedidos ou oferecer ajuda, é necessário confirmar quem você é. Leva menos de 2 minutos.
            </p>
          </div>
          <Link to="/verify-identity" className="btn-primary text-sm">Verificar agora</Link>
        </div>
      )}

      {/* Card de boas-vindas */}
      <div className="relative overflow-hidden rounded-3xl bg-sunrise p-1 shadow-card mb-10">
        <div className="bg-white rounded-[22px] p-8 md:p-10 grain">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <span
                className={`inline-block font-display font-semibold text-xs uppercase tracking-wider px-3 py-1 rounded-full ${profileColor}`}
              >
                {profileLabel}
              </span>
              <h1 className="mt-4 font-display font-bold text-4xl md:text-5xl text-ink-900">
                Olá, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="mt-3 font-body text-lg text-ink-700 max-w-xl">
                {user.profile_type === 'helper'
                  ? 'Obrigado por estar aqui. Sua disposição em ajudar já é luz.'
                  : 'Você não está só. Estamos aqui para conectar você com quem pode ajudar.'}
              </p>
            </div>

            {/* Avatar com inicial */}
            <div className="w-20 h-20 rounded-2xl bg-sunrise flex items-center justify-center shadow-glow shrink-0">
              <span className="font-display font-bold text-3xl text-ink-900">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Apoie a plataforma */}
      <div className="rounded-2xl bg-gradient-to-r from-sun-100 to-sun-50 border border-sun-200 p-5 mb-10 flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-sun-400 flex items-center justify-center text-ink-900 shrink-0">
          <Heart size={22} />
        </div>
        <div className="flex-1 min-w-[240px]">
          <h2 className="font-display font-semibold text-lg text-ink-900">
            Ajude a manter a Luz Coletiva acesa
          </h2>
          <p className="font-body text-sm text-ink-700 mt-1">
            A plataforma é mantida com recursos próprios e doações voluntárias. Se puder
            contribuir, qualquer valor ajuda a continuar conectando quem precisa com quem
            pode ajudar.
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <code className="px-3 py-1.5 rounded-lg bg-white border border-ink-200 font-mono text-sm text-ink-900 select-all">
              316.402.348-02
            </code>
            <button
              onClick={copyPix}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-800 px-2 py-1.5"
            >
              <Copy size={14} /> Copiar chave PIX
            </button>
          </div>
          <p className="font-body text-xs text-ink-500 mt-2">
            Recebedor: Vinicius Alarcon Reis · Chave PIX (CPF)
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Card de informações do perfil */}
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-xl text-ink-900">Seu perfil</h2>
            <button onClick={openEdit} className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium">
              <Pencil size={14} /> Editar
            </button>
          </div>
          <ul className="space-y-4 font-body text-ink-700">
            <li className="flex items-start gap-3">
              <UserIcon size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">Nome</div>
                <div className="font-medium text-ink-900">{user.name}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">E-mail</div>
                <div className="font-medium text-ink-900 break-all">{user.email}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">Telefone</div>
                <div className="font-medium text-ink-900">{user.phone || <span className="text-ink-400 italic">não informado</span>}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className={user.is_verified ? 'text-leaf-500 mt-0.5 shrink-0' : 'text-ink-400 mt-0.5 shrink-0'}
              />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">Status</div>
                <div className="font-medium text-ink-900">
                  {user.is_verified ? 'Conta verificada' : 'Aguardando verificação'}
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Calendar size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">Membro desde</div>
                <div className="font-medium text-ink-900">
                  {new Date(user.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Histórico */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-display font-semibold text-xl text-ink-900 mb-5">
            Histórico de interações
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-ink-100 animate-pulse" />
              ))}
            </div>
          ) : history?.items?.length ? (
            <ul className="space-y-3">
              {history.items.map((item) => (
                <li key={item.id}>
                <Link
                  to={`/help-requests/${item.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 border border-ink-100 hover:border-sky-400 transition-colors"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      item.status === 'concluído'
                        ? 'bg-leaf-400/20 text-leaf-500'
                        : 'bg-sun-100 text-sun-600'
                    }`}
                  >
                    {item.status === 'concluído' ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-ink-900 truncate">
                      {item.title}
                    </div>
                    <div className="font-body text-sm text-ink-700">
                      {new Date(item.date).toLocaleDateString('pt-BR')} ·{' '}
                      <span className="capitalize">{item.status}</span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block font-display text-xs uppercase tracking-wider text-ink-400">
                    {item.type === 'offer' ? 'Oferecida' : 'Solicitada'}
                  </span>
                </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="font-body text-ink-700">
                Você ainda não tem interações. Em breve, novos encontros aparecem por aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LGPD — meus dados */}
      <div className="card p-6 mt-10">
        <h2 className="font-display font-semibold text-xl text-ink-900 mb-1 flex items-center gap-2">
          <ShieldCheck size={20} className="text-sky-600" /> Meus dados (LGPD)
        </h2>
        <p className="font-body text-sm text-ink-700 mb-5">
          Você pode exportar uma cópia completa dos seus dados ou solicitar a exclusão da
          conta a qualquer momento. Veja a{' '}
          <Link to="/privacidade" className="text-sky-600 hover:text-sky-800 underline">
            Política de Privacidade
          </Link>.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportMyData}
            disabled={exporting}
            className="btn-secondary text-sm py-2 disabled:opacity-50"
          >
            <Download size={16} /> {exporting ? 'Exportando…' : 'Exportar meus dados'}
          </button>
          <button
            onClick={() => { setDeleteConfirm(true); setDeleteText(''); }}
            className="btn-ghost text-sm py-2 text-red-600 border border-red-200 hover:bg-red-50"
          >
            <Trash2 size={16} /> Excluir minha conta
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-ink-900/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-6">
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-3">
              Excluir minha conta
            </h3>
            <p className="font-body text-sm text-ink-700 mb-3">
              Esta ação <strong>é irreversível</strong>. Seus dados pessoais serão
              anonimizados imediatamente e você não poderá mais entrar com este e-mail.
              Mensagens em chats já existentes permanecerão visíveis para os outros
              participantes, mas com sua identidade substituída por "Usuário removido".
            </p>
            <p className="font-body text-sm text-ink-700 mb-3">
              Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="input-field w-full mb-4"
              placeholder="EXCLUIR"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-ghost"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting || deleteText !== 'EXCLUIR'}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-6">
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-5">Editar perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Telefone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+55 11 99999-9999"
                  className="input-field w-full"
                />
              </div>
              <hr className="border-ink-100" />
              <p className="text-xs text-ink-500">Deixe em branco para não alterar a senha.</p>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Senha atual</label>
                <input
                  type="password"
                  value={form.current_password}
                  onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Nova senha</label>
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(false)} className="btn-ghost" disabled={saving}>Cancelar</button>
              <button onClick={saveProfile} className="btn-primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
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
    </section>
  );
}
