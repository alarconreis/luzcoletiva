import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, UserPlus, ShieldCheck, HelpingHand, HandHeart, MessageCircle,
  CheckCircle2, AlertTriangle, Users, Lock, Eye, Heart, ArrowRight,
} from 'lucide-react';
import IllusTrust from '../components/illustrations/IllusTrust.jsx';
import IllusSignup from '../components/illustrations/IllusSignup.jsx';
import IllusAsk from '../components/illustrations/IllusAsk.jsx';
import IllusHelp from '../components/illustrations/IllusHelp.jsx';
import IllusChat from '../components/illustrations/IllusChat.jsx';

const TRACKS = [
  { id: 'visitor',   label: 'Sou novo aqui', icon: Sparkles },
  { id: 'requester', label: 'Preciso de ajuda', icon: HelpingHand },
  { id: 'helper',    label: 'Quero ajudar', icon: HandHeart },
];

export default function ComoFunciona() {
  const [track, setTrack] = useState('visitor');

  return (
    <div className="bg-gradient-to-b from-white via-sun-50/30 to-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-sunrise-soft grain pt-16 pb-40 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/70 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={16} className="text-sun-600" />
            <span className="font-display font-medium text-sm text-ink-900">
              Tudo o que você precisa saber pra começar
            </span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-ink-900 leading-[1.05]">
            Como o <em className="not-italic text-sky-900">Luz Coletiva</em> funciona
          </h1>
          <p className="mt-6 font-body text-lg md:text-xl text-ink-700 max-w-2xl mx-auto leading-relaxed">
            Uma rede onde quem precisa de apoio se encontra com quem pode oferecer.
            Sem intermediários, sem cobrança, sem complicação. Mas com cuidado e
            respeito em cada passo.
          </p>
        </div>
      </section>

      {/* TRACK SWITCHER */}
      <section className="max-w-5xl mx-auto px-6 -mt-14 mb-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-3 flex flex-col sm:flex-row gap-2">
          {TRACKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTrack(id)}
              className={`flex-1 min-h-[60px] flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-display font-semibold text-sm leading-none transition-all ${
                track === id
                  ? 'bg-sunrise text-ink-900 shadow-glow'
                  : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* CONTEÚDO POR TRILHA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        {track === 'visitor' && <VisitorTrack />}
        {track === 'requester' && <RequesterTrack />}
        {track === 'helper' && <HelperTrack />}
      </section>

      {/* SEGURANÇA */}
      <SecuritySection />

      {/* O QUE NÃO FAZER */}
      <DoNotSection />

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Heart className="text-sun-500 mx-auto mb-4" size={40} fill="#FFD54F" />
        <h2 className="font-display font-bold text-3xl md:text-4xl text-ink-900">
          Pronto pra fazer parte?
        </h2>
        <p className="mt-4 font-body text-lg text-ink-700">
          Sua presença aqui já é luz pra alguém.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/register?type=helper" className="btn-primary">
            <HandHeart size={18} /> Quero ajudar
          </Link>
          <Link to="/register?type=requester" className="btn-secondary">
            <HelpingHand size={18} /> Preciso de ajuda
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ----------- TRILHAS ----------- */

function VisitorTrack() {
  return (
    <div className="space-y-16">
      <Block
        eyebrow="O que é"
        title="Uma rede de gente cuidando de gente"
        text="Luz Coletiva conecta pessoas que estão passando por um momento difícil com quem está disposto a ajudar — com tempo, conhecimento, recursos ou simplesmente presença. Sem fins lucrativos, sem propaganda, sem cobrança."
        illus={<IllusTrust className="w-full max-w-md" />}
      />

      <ThreeStep
        eyebrow="Como funciona"
        title="Em três passos simples"
        steps={[
          { icon: UserPlus, title: 'Cadastro', text: 'Você cria conta dizendo se vem ajudar ou pedir ajuda. Leva menos de 2 minutos.' },
          { icon: ShieldCheck, title: 'Verificação', text: 'Confirmamos sua identidade pra proteger todo mundo na rede. Você verifica uma vez só.' },
          { icon: MessageCircle, title: 'Encontro', text: 'Pedidos e ofertas se encontram. Vocês conversam pelo chat seguro e combinam como vai funcionar.' },
        ]}
      />

      <Block
        eyebrow="Por que verificar identidade"
        title="Confiança que se constrói com cuidado"
        text="Antes de criar pedidos ou oferecer ajuda, você passa por uma verificação rápida com foto do RG e selfie. Isso protege a rede de pessoas mal-intencionadas e garante que quem está do outro lado é gente de verdade. Sua imagem é cifrada, não é compartilhada com ninguém, e é apagada em até 30 dias."
        illus={<IllusSignup className="w-full max-w-md" />}
        reverse
      />
    </div>
  );
}

function RequesterTrack() {
  return (
    <div className="space-y-16">
      <Block
        eyebrow="Pra quem precisa"
        title="Pedir ajuda é coragem, não fraqueza"
        text="Todo mundo passa por momentos em que precisa. Aqui você encontra pessoas dispostas a estender a mão sem julgamento. Você decide o que pedir, com quem aceitar, e quando encerrar."
        illus={<IllusAsk className="w-full max-w-md" />}
      />

      <ThreeStep
        eyebrow="Como pedir ajuda"
        title="Três passos pra encontrar quem pode ajudar"
        steps={[
          { icon: UserPlus, title: '1. Cadastre-se como solicitante', text: 'Crie sua conta e faça a verificação de identidade. É rápido e protege todo mundo.' },
          { icon: HelpingHand, title: '2. Crie um pedido', text: 'Conte o que você precisa: alimentação, educação, saúde, instrumentos musicais ou livros. Adicione uma descrição clara e sua cidade.' },
          { icon: MessageCircle, title: '3. Receba ofertas e converse', text: 'Quando alguém se oferecer, você verá o nome e a mensagem. Aceite, recuse ou converse pelo chat antes de decidir.' },
        ]}
      />

      <Block
        eyebrow="O que esperar"
        title="Você sempre tem o controle"
        text="Você decide quem aceitar e pode recusar quantas ofertas quiser. Pode encerrar uma conversa a qualquer momento. Pode marcar o pedido como concluído quando o apoio chegou — ou cancelar se preferir desistir. Nada acontece sem o seu sim."
        illus={<IllusChat className="w-full max-w-md" />}
        reverse
      />
    </div>
  );
}

function HelperTrack() {
  return (
    <div className="space-y-16">
      <Block
        eyebrow="Pra quem oferece"
        title="Pequenos gestos, grandes histórias"
        text="Você não precisa ter muito pra ajudar. Tempo, conhecimento, um livro que você não usa mais, uma cesta básica, uma escuta. Toda forma de presença vale, e a outra pessoa decide o que serve melhor pra ela."
        illus={<IllusHelp className="w-full max-w-md" />}
      />

      <ThreeStep
        eyebrow="Como ajudar"
        title="Três passos pra fazer diferença"
        steps={[
          { icon: UserPlus, title: '1. Cadastre-se como ajudante', text: 'Crie sua conta e faça a verificação de identidade. Isso protege quem está pedindo ajuda.' },
          { icon: Eye, title: '2. Veja pedidos abertos', text: 'Filtre por categoria e estado. Leia com calma e escolha um pedido que faça sentido pra você.' },
          { icon: HandHeart, title: '3. Ofereça e combine', text: 'Envie sua oferta com uma mensagem (opcional). Se aceita, vocês conversam pelo chat e combinam como vai funcionar.' },
        ]}
      />

      <Block
        eyebrow="Limites saudáveis"
        title="Ajudar sem se machucar"
        text="Você não é responsável por resolver tudo. Ofereça o que pode, do jeito que pode. Se algo te incomodar, pode recusar uma conversa, denunciar abusos pela moderação ou simplesmente não responder. Cuidar dos outros começa por se cuidar."
        illus={<IllusTrust className="w-full max-w-md" />}
        reverse
      />
    </div>
  );
}

/* ----------- BLOCOS REUTILIZÁVEIS ----------- */

function Block({ eyebrow, title, text, illus, reverse = false }) {
  return (
    <div className={`grid md:grid-cols-2 gap-10 items-center ${reverse ? 'md:[direction:rtl]' : ''}`}>
      <div className="md:[direction:ltr]">
        <span className="font-display font-semibold text-sky-600 uppercase tracking-widest text-xs">
          {eyebrow}
        </span>
        <h2 className="mt-3 font-display font-bold text-3xl md:text-4xl text-ink-900 leading-tight">
          {title}
        </h2>
        <p className="mt-5 font-body text-ink-700 text-lg leading-relaxed">
          {text}
        </p>
      </div>
      <div className="md:[direction:ltr] flex justify-center">
        {illus}
      </div>
    </div>
  );
}

function ThreeStep({ eyebrow, title, steps }) {
  return (
    <div>
      <div className="text-center mb-10">
        <span className="font-display font-semibold text-sun-600 uppercase tracking-widest text-xs">
          {eyebrow}
        </span>
        <h2 className="mt-3 font-display font-bold text-3xl md:text-4xl text-ink-900">
          {title}
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const accents = ['bg-sun-400', 'bg-sky-500', 'bg-leaf-500'];
          return (
            <div key={i} className="card p-6 relative">
              <div className={`w-12 h-12 rounded-xl ${accents[i]} flex items-center justify-center text-white mb-4 shadow-soft`}>
                <Icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-xl text-ink-900">{s.title}</h3>
              <p className="mt-2 font-body text-ink-700 leading-relaxed">{s.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------- SEGURANÇA ----------- */

function SecuritySection() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Verificação de identidade',
      text: 'Todos os usuários passam por um check com foto do RG e selfie. Quem não verifica não consegue criar pedidos nem oferecer ajuda.',
    },
    {
      icon: Lock,
      title: 'Imagens cifradas',
      text: 'Suas fotos do RG são cifradas (AES-256) e ficam acessíveis só pra quem precisa avaliar. Apagamos em 30 dias automaticamente.',
    },
    {
      icon: MessageCircle,
      title: 'Chat com moderação',
      text: 'Telefones, e-mails e links são bloqueados automaticamente. Linguagem ofensiva também. Tudo pra evitar abuso e exposição de dados.',
    },
    {
      icon: AlertTriangle,
      title: 'Denúncia em um clique',
      text: 'Em qualquer conversa, você pode denunciar abuso. Nossa equipe revisa, censura mensagens e suspende contas que violam as regras.',
    },
  ];
  return (
    <section className="bg-sky-900 text-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-display font-semibold text-sun-400 uppercase tracking-widest text-xs">
            Privacidade e segurança
          </span>
          <h2 className="mt-3 font-display font-bold text-3xl md:text-4xl">
            O que fazemos pra você ficar bem aqui
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-sun-400 flex items-center justify-center text-ink-900 mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-display font-semibold text-xl">{it.title}</h3>
                <p className="mt-2 font-body text-white/85 leading-relaxed">{it.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------- O QUE NÃO FAZER ----------- */

function DoNotSection() {
  const dont = [
    {
      title: 'Não envie ou peça dinheiro',
      text: 'Luz Coletiva não envolve transações financeiras. Pedidos legítimos são por bens, tempo ou conhecimento — não por transferências bancárias.',
    },
    {
      title: 'Não compartilhe documentos pessoais',
      text: 'CPF, RG, comprovantes, fotos de cartão. Nunca. Mesmo se a outra pessoa pedir "pra confirmar". Bons ajudantes nunca pedem isso.',
    },
    {
      title: 'Não combine encontros isolados na primeira conversa',
      text: 'Se vocês precisam se encontrar pessoalmente, escolha local público, durante o dia, e avise alguém de confiança. Confiança se constrói com tempo.',
    },
    {
      title: 'Não dê seu endereço residencial sem necessidade',
      text: 'Se a entrega de algo é o ponto, considere combinar um ponto de encontro neutro. Se sua casa for mesmo necessária, não esteja sozinho.',
    },
    {
      title: 'Não tente burlar a moderação',
      text: 'Substituir letras por números, escrever telefone separado, mandar foto com endereço — a IA pega, e quem tenta uma vez perde a confiança da rede.',
    },
    {
      title: 'Não tolere desrespeito',
      text: 'Se alguém te pressionar, te ofender, te assediar ou te fizer sentir mal — denuncie. Nossa moderação é ativa, e ninguém precisa engolir maus tratos pra "merecer ajuda".',
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <AlertTriangle className="text-red-500 mx-auto mb-3" size={36} />
        <span className="font-display font-semibold text-red-600 uppercase tracking-widest text-xs">
          Importante
        </span>
        <h2 className="mt-3 font-display font-bold text-3xl md:text-4xl text-ink-900">
          O que <em className="not-italic text-red-600">não</em> fazer
        </h2>
        <p className="mt-4 font-body text-ink-700 max-w-2xl mx-auto">
          Plataformas que omitem isso são as que viram problema. Luz Coletiva
          quer ser honesta com você desde o começo.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {dont.map((d) => (
          <div key={d.title} className="rounded-2xl border-2 border-red-100 bg-red-50/40 p-6">
            <h3 className="font-display font-semibold text-lg text-ink-900 flex items-start gap-2">
              <span className="text-red-500 shrink-0">✕</span>
              {d.title}
            </h3>
            <p className="mt-2 font-body text-ink-700 leading-relaxed">{d.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
