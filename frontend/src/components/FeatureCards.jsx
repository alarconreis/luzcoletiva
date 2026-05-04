import { ShieldCheck, Sparkles, Users } from 'lucide-react';

const cards = [
  {
    icon: Users,
    title: 'Como Funciona',
    description:
      'Cadastre-se em segundos, escolha seu papel — ajudante ou solicitante — e conecte-se com pessoas próximas que compartilham o mesmo propósito.',
    accent: 'from-sun-50 to-sun-100',
    iconBg: 'bg-sun-400',
  },
  {
    icon: Sparkles,
    title: 'Histórias Inspiradoras',
    description:
      'Conheça relatos reais de quem ajudou e foi ajudado. Cada história é prova de que pequenos gestos transformam realidades.',
    accent: 'from-sky-50 to-sky-50',
    iconBg: 'bg-sky-500',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança e Confiança',
    description:
      'Verificação de perfil, comunicação criptografada e moderação ativa garantem um ambiente acolhedor e protegido para todos.',
    accent: 'from-leaf-400/10 to-leaf-400/5',
    iconBg: 'bg-leaf-500',
  },
];

export default function FeatureCards() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="font-display font-semibold text-sky-600 uppercase tracking-widest text-sm">
          Por que existir
        </span>
        <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-ink-900">
          Solidariedade <em className="not-italic text-sky-900">que se organiza</em>
        </h2>
        <p className="mt-5 font-body text-lg text-ink-700">
          Três pilares sustentam tudo o que fazemos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 stagger">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.title}
              className={`card p-8 bg-gradient-to-br ${c.accent} relative overflow-hidden`}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center text-white shadow-soft`}
              >
                <Icon size={26} strokeWidth={2.2} />
              </div>
              <h3 className="mt-6 font-display font-semibold text-2xl text-ink-900">
                {c.title}
              </h3>
              <p className="mt-3 font-body text-ink-700 leading-relaxed">
                {c.description}
              </p>

              {/* Detalhe decorativo no canto */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/40 blur-2xl pointer-events-none" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
