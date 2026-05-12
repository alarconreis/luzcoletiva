import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Calendar, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import PageMeta from '../components/PageMeta.jsx';

const DISCLAIMER = "Conteúdo informativo. Para doação verificada, use a plataforma. Doações externas são por sua conta e risco.";

// Renderizador markdown super simples — só negrito, links, parágrafos, headers H2/H3
function renderMd(md) {
  if (!md) return null;
  const lines = md.split('\n');
  const blocks = [];
  let para = [];
  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
  };
  for (const line of lines) {
    if (!line.trim()) { flushPara(); continue; }
    if (line.startsWith('## ')) { flushPara(); blocks.push({ type: 'h2', text: line.slice(3) }); continue; }
    if (line.startsWith('# ')) { flushPara(); blocks.push({ type: 'h2', text: line.slice(2) }); continue; }
    para.push(line);
  }
  flushPara();

  // Função pra converter inline: **bold** e [text](url)
  const inline = (s) => {
    const parts = [];
    let i = 0;
    let lastEnd = 0;
    const re = /(\*\*([^\*]+)\*\*)|(\[([^\]]+)\]\(([^\)]+)\))/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > lastEnd) parts.push(s.slice(lastEnd, m.index));
      if (m[2]) parts.push(<strong key={parts.length}>{m[2]}</strong>);
      else if (m[4]) parts.push(<a key={parts.length} href={m[5]} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 underline">{m[4]}</a>);
      lastEnd = m.index + m[0].length;
    }
    if (lastEnd < s.length) parts.push(s.slice(lastEnd));
    return parts.length === 0 ? s : parts;
  };

  return blocks.map((b, i) => {
    if (b.type === 'h2') return <h2 key={i} className="font-display font-semibold text-2xl text-ink-900 mt-6 mb-3">{b.text}</h2>;
    return <p key={i} className="text-ink-900 leading-relaxed mb-4">{inline(b.text)}</p>;
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/blog/posts/${slug}`)
      .then(({ data }) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="max-w-3xl mx-auto px-6 py-12"><p>Carregando...</p></section>;

  if (notFound) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Post não encontrado</h1>
        <p className="font-body text-ink-700 mb-6">Esse post pode ter sido removido ou não existe.</p>
        <Link to="/blog" className="btn-primary"><ArrowLeft size={16} /> Voltar ao blog</Link>
      </section>
    );
  }

  const ogImage = post.image_url
    ? (post.image_is_external ? post.image_url : `https://luzcoletiva.com.br/api/blog/images/${post.image_url}`)
    : 'https://luzcoletiva.com.br/og-image.png';

  return (
    <>
      <PageMeta
        title={`${post.title} — Luz Coletiva`}
        description={post.summary}
        url={`https://luzcoletiva.com.br/blog/${post.slug}`}
        image={ogImage}
        type="article"
      />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-ink-700 hover:text-sky-700 mb-6">
          <ArrowLeft size={14} /> Blog
        </Link>

        {post.image_url && (
          <div className="aspect-video bg-ink-100 rounded-2xl overflow-hidden mb-6">
            <img
              src={post.image_is_external ? post.image_url : `/api/blog/images/${post.image_url}`}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="font-display font-bold text-3xl md:text-4xl text-ink-900 mb-3">{post.title}</h1>

        {post.published_at && (
          <p className="text-sm text-ink-700 flex items-center gap-1 mb-6">
            <Calendar size={12} /> {new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {post.kind === 'external' && post.source_name && <span> · Fonte: {post.source_name}</span>}
          </p>
        )}

        <p className="text-lg text-ink-700 leading-relaxed mb-6 italic border-l-4 border-sun-300 pl-4">
          {post.summary}
        </p>

        {post.kind === 'internal' && post.body_md && (
          <div className="prose-luz">{renderMd(post.body_md)}</div>
        )}

        {post.kind === 'external' && post.source_url && (
          <div className="card p-5 bg-sky-50 border-sky-200 mt-6">
            <p className="text-sm text-ink-900 mb-3">Leia a matéria completa na fonte original:</p>
            <a href={post.source_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-sm">
              <ExternalLink size={14} /> Ler em {post.source_name || 'fonte original'}
            </a>
          </div>
        )}

        <div className="card p-4 bg-sun-50 border-sun-200 mt-8 flex gap-3 items-start">
          <AlertCircle className="text-sun-700 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-sun-900 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </article>
    </>
  );
}
