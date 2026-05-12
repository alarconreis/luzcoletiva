import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, FileText } from 'lucide-react';
import api from '../services/api.js';
import PageMeta from '../components/PageMeta.jsx';

const DISCLAIMER = "Conteúdo informativo. Para doação verificada, use a plataforma. Doações externas são por sua conta e risco.";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blog/posts')
      .then(({ data }) => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageMeta
        title="Blog — Luz Coletiva"
        description="Notícias e histórias sobre solidariedade, ações sociais e atualizações da plataforma Luz Coletiva."
        url="https://luzcoletiva.com.br/blog"
      />
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-ink-900 mb-2 flex items-center gap-3">
            <FileText className="text-sky-600" size={36} /> Blog
          </h1>
          <p className="font-body text-ink-700">
            Notícias, histórias e atualizações da Luz Coletiva.
          </p>
        </div>

        {loading && <p className="font-body text-ink-700">Carregando...</p>}

        {!loading && posts.length === 0 && (
          <div className="card p-12 text-center">
            <p className="font-body text-ink-700">Em breve, nossas primeiras notícias.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map(p => (
              <article key={p.slug} className="card p-0 overflow-hidden hover:shadow-lg transition-shadow">
                {p.image_url && (
                  <div className="aspect-video bg-ink-100">
                    <img
                      src={p.image_is_external ? p.image_url : `/api/blog/images/${p.image_url}`}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display font-semibold text-ink-900 text-xl mb-2">
                    <Link to={`/blog/${p.slug}`} className="hover:text-sky-700">{p.title}</Link>
                  </h2>
                  {p.published_at && (
                    <p className="text-xs text-ink-700 flex items-center gap-1 mb-2">
                      <Calendar size={11} /> {new Date(p.published_at).toLocaleDateString('pt-BR')}
                      {p.kind === 'external' && p.source_name && <span> · {p.source_name}</span>}
                    </p>
                  )}
                  <p className="text-sm text-ink-700 leading-relaxed mb-3 line-clamp-3">{p.summary}</p>
                  <Link to={`/blog/${p.slug}`} className="text-sky-600 hover:text-sky-800 text-sm font-medium">
                    Ler mais →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
