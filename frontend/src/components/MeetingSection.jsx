import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Hand } from 'lucide-react';

export default function MeetingSection() {
  return (
    <section className="bg-sunrise-soft grain py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-display font-semibold text-leaf-500 uppercase tracking-widest text-sm">
            Encontros
          </span>
          <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-ink-900">
            Onde a luz <em className="not-italic text-leaf-500">se encontra</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Ofereça Ajuda */}
          <article className="group relative rounded-3xl overflow-hidden shadow-card bg-white">
            <div className="aspect-[4/3] relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-sun-200 to-sun-400" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
              <div className="absolute top-5 left-5 w-12 h-12 rounded-2xl bg-sun-400 flex items-center justify-center shadow-glow">
                <Heart size={22} className="text-ink-900" />
              </div>
              <h3 className="absolute bottom-5 left-5 right-5 font-display font-bold text-3xl text-white">
                Ofereça Ajuda
              </h3>
            </div>
            <div className="p-7">
              <p className="font-body text-ink-700 leading-relaxed">
                Compartilhe tempo, conhecimento ou recursos. Pequenos gestos de
                quem oferece transformam grandes histórias de quem recebe.
              </p>
              <Link
                to="/register?type=helper"
                className="mt-6 inline-flex items-center gap-2 font-display font-semibold text-sky-900 hover:gap-3 transition-all"
              >
                Quero ajudar <ArrowRight size={18} />
              </Link>
            </div>
          </article>

          {/* Peça Ajuda */}
          <article className="group relative rounded-3xl overflow-hidden shadow-card bg-white">
            <div className="aspect-[4/3] relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-sky-200 to-sky-400" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
              <div className="absolute top-5 left-5 w-12 h-12 rounded-2xl bg-sky-400 flex items-center justify-center shadow-card">
                <Hand size={22} className="text-white" />
              </div>
              <h3 className="absolute bottom-5 left-5 right-5 font-display font-bold text-3xl text-white">
                Peça Ajuda
              </h3>
            </div>
            <div className="p-7">
              <p className="font-body text-ink-700 leading-relaxed">
                Pedir não é fraqueza — é o primeiro passo para receber. Conte
                com uma rede que escuta sem julgar e age com empatia.
              </p>
              <Link
                to="/register?type=requester"
                className="mt-6 inline-flex items-center gap-2 font-display font-semibold text-sky-900 hover:gap-3 transition-all"
              >
                Preciso de ajuda <ArrowRight size={18} />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
