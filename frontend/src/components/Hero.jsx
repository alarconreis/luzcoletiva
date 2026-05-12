import { Link } from 'react-router-dom';
import { HandHeart, HelpingHand, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradiente da marca: amarelo → azul claro → verde */}
      <div className="absolute inset-0 bg-sunrise bg-[length:200%_200%] animate-shimmer" />

      {/* Camadas decorativas — círculos suaves */}
      <div className="absolute top-10 -left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-20 right-0 w-96 h-96 rounded-full bg-sun-100/40 blur-3xl" />

      {/* Sol orbital decorativo */}
      <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-gradient-to-br from-sun-50 to-sun-400 shadow-glow animate-pulse-soft hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-32 grain">
        <div className="max-w-3xl stagger">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm border border-white/60 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={16} className="text-ink-900" />
            <span className="font-display font-medium text-sm text-ink-900">
              Uma rede de solidariedade que cresce todos os dias
            </span>
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl text-ink-900 leading-[1.05] tracking-tight">
            Iluminando<br />
            <span className="relative inline-block">
              vidas juntos.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 9 Q 75 2, 150 6 T 298 5"
                  stroke="#1565C0"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 font-body text-lg md:text-xl text-ink-900/80 max-w-2xl leading-relaxed">
            Luz Coletiva conecta quem precisa de apoio com quem pode oferecer.
            Um gesto, uma palavra, uma ação — cada interação acende uma nova
            possibilidade.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/register?type=helper" className="btn-primary text-base">
              <HandHeart size={20} />
              Quero Ajudar
            </Link>
            <Link to="/register?type=requester" className="btn-secondary text-base">
              <HelpingHand size={20} />
              Preciso de Ajuda
            </Link>
          </div>

          {/* Métricas suaves de prova social */}
          <div className="mt-14 flex flex-wrap gap-8 text-ink-900">
            <div>
              <div className="font-display font-bold text-3xl">100%</div>
              <div className="font-body text-sm opacity-75">gratuito e seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onda divisória */}
      <svg
        className="relative block w-full"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z"
          fill="white"
        />
      </svg>
    </section>
  );
}
