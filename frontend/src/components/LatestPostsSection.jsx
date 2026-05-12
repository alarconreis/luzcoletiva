import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import api from '../services/api.js';

export default function LatestPostsSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/blog/posts')
      .then(({ data }) => setPosts(data.slice(0, 3)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-display font-semibold text-sun-600 uppercase tracking-widest text-sm">
            Blog
          </span>
          <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-ink-900">
            Últimas <em className="not-italic text-sun-600">notícias</em>
          </h2>
        </div>
        <p className="font-body text-ink-700 max-w-md">
          Atualizações da rede, ações solidárias e conteúdo informativo sobre
          quem faz a Luz Coletiva acontecer.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse h-80 bg-ink-100" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-ink-700">
            Em breve, nossas primeiras notícias.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 stagger">
            {posts.map((p) => (
              <article
                key={p.slug}
                className="card overflow-hidden flex flex-col"
              >
                {p.image_url && (
                  <div className="aspect-[16/10] overflow-hidden bg-ink-100">
                    <img
                      src={
                        p.image_is_external
                          ? p.image_url
                          : `/api/blog/images/${p.image_url}`
                      }
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  {p.published_at && (
                    <span className="inline-flex items-center gap-1 self-start text-xs font-display font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                      <Calendar size={12} />
                      {new Date(p.published_at).toLocaleDateString('pt-BR')}
                      {p.kind === 'external' && p.source_name && (
                        <span> · {p.source_name}</span>
                      )}
                    </span>
                  )}
                  <h3 className="mt-4 font-display font-semibold text-xl text-ink-900 leading-snug">
                    <Link
                      to={`/blog/${p.slug}`}
                      className="hover:text-sky-700 transition-colors"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  {p.summary && (
                    <p className="mt-3 font-body text-ink-700 leading-relaxed flex-1 line-clamp-3">
                      {p.summary}
                    </p>
                  )}
                  <Link
                    to={`/blog/${p.slug}`}
                    className="mt-5 inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm font-medium"
                  >
                    Ler mais <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-display font-semibold text-ink-900 hover:text-sky-700 transition-colors"
            >
              Ver todas as notícias <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
