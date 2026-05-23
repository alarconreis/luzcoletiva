import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PageMeta from '../components/PageMeta.jsx';

const FAQS = [
  {
    q: 'O que é a Luz Coletiva?',
    a: 'É uma plataforma brasileira de solidariedade direta entre pessoas. Quem precisa de ajuda descreve o que precisa, quem pode ajudar oferece apoio direto. Não somos crowdfunding nem instituição financeira — apenas conectamos pessoas com identidade verificada.',
  },
  {
    q: 'Como funciona, em resumo?',
    a: 'Você se cadastra (com verificação de identidade), escolhe se quer pedir ou oferecer ajuda. Quem pede descreve o item desejado e o motivo. Quem ajuda oferece, conversam pelo chat da plataforma, e combinam a entrega — direto, sem que dinheiro passe pela Luz Coletiva. Veja detalhes em /como-funciona.',
  },
  {
    q: 'É grátis mesmo?',
    a: 'Sim, completamente. Não cobramos comissão de quem ajuda nem de quem recebe. Não temos taxa de cadastro, nem assinatura, nem propaganda. Mantemos a plataforma com recursos próprios e doações livres.',
  },
  {
    q: 'Como sei que não vou cair em golpe?',
    a: 'Toda conta passa por verificação de identidade (RG/CPF + selfie). Pedidos são aprovados manualmente por moderadores antes de ficarem públicos. Há sistema de avaliação após cada interação e canal de denúncia. Mesmo assim, recomendamos cautela: nunca envie dinheiro via Pix antecipado, sempre prefira entregas presenciais ou rastreadas pelos Correios.',
  },
  {
    q: 'Como verifico minha identidade?',
    a: 'Após o cadastro, vá em "Verificar identidade". Você vai mandar uma foto do seu RG (ou CNH) e uma selfie ao vivo. Nossa equipe (e ferramentas automatizadas) comparam os dois e aprovam normalmente em até 24 horas.',
  },
  {
    q: 'Posso criar pedidos sem CPF?',
    a: 'Não. CPF é obrigatório para pessoa física. Para pessoa jurídica (CNPJ), aceitamos casos institucionais — ONGs, igrejas, projetos sociais. Em ambos os casos, é único: cada CPF/CNPJ pode criar apenas uma conta.',
  },
  {
    q: 'Quem aprova os pedidos?',
    a: 'Moderadores humanos da Luz Coletiva. Eles verificam se o pedido está dentro das regras (valor entre R$ 50 e R$ 500, descrição clara, item permitido, requester com identidade verificada). Aprovações normalmente saem em 24-48h.',
  },
  {
    q: 'Quanto posso pedir?',
    a: 'Entre R$ 50 e R$ 500 por pedido. Esse limite existe pra manter a plataforma focada em ajudas pequenas e diretas, e pra evitar fraudes de alto valor. Se você precisa de algo maior, recomendamos plataformas de crowdfunding tradicionais.',
  },
  {
    q: 'Quem paga o frete?',
    a: 'O helper (quem está ajudando) assume o frete por padrão, com disclaimer de R$ 15-35 típicos. Se quiserem dividir, conversam pelo chat e combinam Pix direto entre as partes. A Luz Coletiva não medeia pagamento de frete.',
  },
  {
    q: 'E se o item não chegar? Tem reembolso?',
    a: 'Não há reembolso pela Luz Coletiva — não somos parte da transação financeira. O que oferecemos: rastreio via Correios (com código), prazo de 7 dias para confirmação automática, sistema de avaliação após cada interação, canal de denúncia. Em caso de problema, abra denúncia na plataforma e nossa equipe investiga.',
  },
  {
    q: 'Quando meus dados são apagados?',
    a: 'Endereços de entrega são apagados automaticamente quando o pedido é fechado (LGPD). Tentativas de verificação de identidade ficam armazenadas por 30 dias e depois são apagadas. Sua conta com nome, CPF e histórico fica até você pedir a exclusão. Veja política completa em /privacidade.',
  },
  {
    q: 'Como reportar abuso ou comportamento suspeito?',
    a: 'Em qualquer pedido em que você esteja envolvido, há botão "Denunciar conversa". Sua denúncia chega direto pra moderação humana. Casos graves: contato@luzcoletiva.com.br.',
  },
  {
    q: 'Posso ser admin ou moderador?',
    a: 'Hoje a equipe de moderação é fechada — somos uma comunidade pequena e crescendo com calma. Se você quer contribuir de outra forma (testes, divulgação, código), escreva pra contato@luzcoletiva.com.br.',
  },
  {
    q: 'Tem CNPJ? Quem é o responsável?',
    a: 'A Luz Coletiva é um projeto independente em fase MVP. Operamos sob responsabilidade individual no momento. Conforme a comunidade crescer, formalizaremos como associação ou OSC. Para questões legais, fale com contato@luzcoletiva.com.br.',
  },
  {
    q: 'Como entro em contato com vocês?',
    a: 'Por e-mail: contato@luzcoletiva.com.br. Respondemos em até 48h úteis. Para denúncias urgentes, use o botão de denúncia dentro de cada pedido — chega mais rápido.',
  },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-sun-50/30 transition-colors"
      >
        <span className="font-display font-semibold text-ink-900">{q}</span>
        {open ? <ChevronUp size={20} className="text-ink-700 shrink-0" /> : <ChevronDown size={20} className="text-ink-700 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="font-body text-ink-700 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <>
      <PageMeta
        title="Perguntas frequentes"
        description="Tudo que você quer saber sobre a Luz Coletiva. É grátis, é seguro, como funciona a verificação de identidade, e como reportar abuso."
        path="/faq"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className="bg-gradient-to-b from-white via-sun-50/30 to-white">
        <section className="bg-sunrise-soft grain pt-16 pb-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/70 rounded-full px-4 py-1.5 mb-6">
              <HelpCircle size={16} className="text-sun-600" />
              <span className="font-display font-medium text-sm text-ink-900">Perguntas frequentes</span>
            </div>
            <h1 className="font-display font-bold text-5xl text-ink-900 mb-4">
              Tudo que você quer saber
            </h1>
            <p className="font-body text-lg text-ink-700">
              Se a sua dúvida não está aqui, escreve pra gente: <a href="mailto:contato@luzcoletiva.com.br" className="text-sky-700 hover:underline">contato@luzcoletiva.com.br</a>
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          {FAQS.map((f, i) => <Item key={i} q={f.q} a={f.a} />)}

          <div className="mt-12 card p-6 bg-sun-50 border-sun-200 text-center">
            <h3 className="font-display font-semibold text-xl text-ink-900 mb-2">Pronto pra começar?</h3>
            <p className="font-body text-ink-700 mb-4">
              Cadastro grátis. Verificação de identidade simples. Comunidade real.
            </p>
            <Link to="/register" className="btn-primary inline-flex">Cadastrar</Link>
          </div>
        </section>
      </div>
    </>
  );
}
