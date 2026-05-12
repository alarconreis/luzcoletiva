import { useState, useEffect } from 'react';
import { Plus, X, FileText, ExternalLink, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api.js';

export default function BlogTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = criar, obj = editar
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [kind, setKind] = useState('external');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [imageMode, setImageMode] = useState('url'); // 'url' ou 'upload'
  const [imageExternalUrl, setImageExternalUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/blog/posts');
      setPosts(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showOk = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (m) => { setError(m); setTimeout(() => setError(''), 5000); };

  const reset = () => {
    setKind('external');
    setTitle('');
    setSummary('');
    setBodyMd('');
    setSourceUrl('');
    setSourceName('');
    setImageMode('url');
    setImageExternalUrl('');
    setImageFile(null);
    setPublished(false);
  };

  const openCreate = () => {
    reset();
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setKind(p.kind);
    setTitle(p.title);
    setSummary(p.summary);
    setBodyMd(p.body_md || '');
    setSourceUrl(p.source_url || '');
    setSourceName(p.source_name || '');
    if (p.image_is_external) {
      setImageMode('url');
      setImageExternalUrl(p.image_url || '');
    } else {
      setImageMode('upload');
      setImageExternalUrl('');
    }
    setImageFile(null);
    setPublished(p.published);
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('title', title);
      fd.append('summary', summary);
      if (bodyMd) fd.append('body_md', bodyMd);
      if (sourceUrl) fd.append('source_url', sourceUrl);
      if (sourceName) fd.append('source_name', sourceName);
      fd.append('published', published ? 'true' : 'false');
      if (imageMode === 'url' && imageExternalUrl) {
        fd.append('image_external_url', imageExternalUrl);
      } else if (imageMode === 'upload' && imageFile) {
        fd.append('image_file', imageFile);
      }

      if (editing) {
        await api.patch(`/admin/blog/posts/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showOk('Post atualizado');
      } else {
        await api.post('/admin/blog/posts', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showOk('Post criado');
      }
      setShowModal(false);
      load();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublished = async (p) => {
    try {
      const fd = new FormData();
      fd.append('published', p.published ? 'false' : 'true');
      await api.patch(`/admin/blog/posts/${p.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showOk(p.published ? 'Despublicado' : 'Publicado');
      load();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro');
    }
  };

  const remove = async (p) => {
    if (!confirm(`Deletar post "${p.title}"?\n\nEsta ação é irreversível.`)) return;
    try {
      await api.delete(`/admin/blog/posts/${p.id}`);
      showOk('Post deletado');
      load();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao deletar');
    }
  };

  if (loading) return <div className="card p-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-ink-900 text-2xl flex items-center gap-2">
            <FileText size={24} /> Blog
          </h2>
          <p className="font-body text-sm text-ink-700 mt-1">
            Notícias e posts da Luz Coletiva. Limite recomendado: 1-2 posts/mês.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Novo post
        </button>
      </div>

      {error && <div className="card p-3 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="card p-3 bg-leaf-50 border-leaf-200 text-leaf-700 text-sm">{success}</div>}

      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">Nenhum post ainda. Clique em "Novo post" pra começar.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left">
              <tr>
                <th className="px-3 py-2 font-display font-semibold">Título</th>
                <th className="px-3 py-2 font-display font-semibold">Tipo</th>
                <th className="px-3 py-2 font-display font-semibold">Status</th>
                <th className="px-3 py-2 font-display font-semibold">Slug</th>
                <th className="px-3 py-2 font-display font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} className="border-t border-ink-100">
                  <td className="px-3 py-2">
                    {p.published ? (
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="hover:underline text-ink-900">{p.title}</a>
                    ) : (
                      <span className="text-ink-700">{p.title}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.kind === 'external' ? (
                      <span className="inline-flex items-center gap-1 text-ink-700"><ExternalLink size={11} /> Externo</span>
                    ) : (
                      <span className="text-ink-700">Interno</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {p.published ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-leaf-100 text-leaf-800">Publicado</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-700">Rascunho</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-ink-700">{p.slug}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => togglePublished(p)} className="btn-ghost p-1.5" title={p.published ? 'Despublicar' : 'Publicar'}>
                        {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="btn-ghost p-1.5" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => remove(p)} className="btn-ghost p-1.5 text-red-600 hover:text-red-700" title="Deletar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink-900 text-xl">
                  {editing ? `Editar: ${editing.title}` : 'Novo post'}
                </h3>
                <button onClick={() => setShowModal(false)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setKind('external')}
                    className={`text-sm py-2 px-3 rounded-lg flex-1 ${kind === 'external' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                    🔗 Notícia externa (link)
                  </button>
                  <button type="button" onClick={() => setKind('internal')}
                    className={`text-sm py-2 px-3 rounded-lg flex-1 ${kind === 'internal' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                    📝 Post próprio
                  </button>
                </div>

                <input type="text" placeholder="Título" className="input-field"
                  value={title} onChange={e => setTitle(e.target.value)} required minLength={5} maxLength={200} />

                <textarea placeholder="Resumo curto (até 300 chars, aparece no card)" rows={2} className="input-field resize-none"
                  value={summary} onChange={e => setSummary(e.target.value)} required minLength={10} maxLength={300} />

                {kind === 'external' && (
                  <>
                    <input type="url" placeholder="URL da notícia (ex: https://g1.globo.com/...)" className="input-field"
                      value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} required={kind === 'external'} />
                    <input type="text" placeholder="Nome da fonte (ex: G1, Folha)" className="input-field"
                      value={sourceName} onChange={e => setSourceName(e.target.value)} maxLength={120} />
                  </>
                )}

                {kind === 'internal' && (
                  <textarea placeholder="Conteúdo (markdown suportado: **negrito**, [link](url), # título)" rows={10} className="input-field resize-none font-mono text-sm"
                    value={bodyMd} onChange={e => setBodyMd(e.target.value)} required={kind === 'internal'} />
                )}

                <div>
                  <label className="block text-sm font-display font-medium text-ink-900 mb-2">Imagem</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setImageMode('url')}
                      className={`text-xs py-1.5 px-3 rounded-lg ${imageMode === 'url' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                      URL externa
                    </button>
                    <button type="button" onClick={() => setImageMode('upload')}
                      className={`text-xs py-1.5 px-3 rounded-lg ${imageMode === 'upload' ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                      Upload
                    </button>
                  </div>
                  {imageMode === 'url' ? (
                    <input type="url" placeholder="https://..." className="input-field"
                      value={imageExternalUrl} onChange={e => setImageExternalUrl(e.target.value)} />
                  ) : (
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="block text-sm" />
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                  Publicar imediatamente {!published && <span className="text-ink-700">(rascunho)</span>}
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Salvando...' : (editing ? 'Salvar alterações' : 'Criar post')}
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
