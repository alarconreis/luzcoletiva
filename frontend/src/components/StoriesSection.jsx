import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import api from '../services/api.js';

export default function StoriesSection() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/stories')
      .then(({ data }) => setStories(data))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-display font-semibold text-sun-600 uppercase tracking-widest text-sm">
            Histórias
          </span>
          <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-ink-900">
            Vozes que <em className="not-italic text-sun-600">iluminam</em>
          </h2>
        </div>
        <p className="font-body text-ink-700 max-w-md">
          Relatos reais de pessoas que mudaram — e foram mudadas — por um
          encontro na nossa rede.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card p-6 animate-pulse h-80 bg-ink-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 stagger">
          {stories.map((s) => (
            <article key={s.id} className="card overflow-hidden flex flex-col">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={s.image_url}
                  alt={s.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="inline-block self-start text-xs font-display font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                  {s.category}
                </span>
                <h3 className="mt-4 font-display font-semibold text-xl text-ink-900 leading-snug">
                  {s.title}
                </h3>
                <p className="mt-3 font-body text-ink-700 leading-relaxed flex-1">
                  <Quote
                    size={16}
                    className="inline text-sun-500 mr-1 -mt-1"
                  />
                  {s.excerpt}
                </p>
                <div className="mt-5 pt-4 border-t border-ink-100 font-body text-sm text-ink-700">
                  — {s.author}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
