import { Link } from 'react-router-dom';
import { Heart, Users, ShieldCheck, Eye, ArrowRight, Instagram } from 'lucide-react';
import PageMeta from '../components/PageMeta.jsx';

export default function Sobre() {
  return (
    <>
      <PageMeta
        title="Sobre nós"
        description="A Luz Coletiva é uma plataforma de solidariedade direta entre pessoas. Conheça nossa história, princípios e por que existimos."
        path="/sobre"
      />
      <div className="bg-gradient-to-b from-white via-sun-50/30 to-white">
        <section className="bg-sunrise-soft grain pt-16 pb-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/70 rounded-full px-4 py-1.5 mb-6">
              <Heart size={16} className="text-sun-600" />
              <span className="font-display font-medium text-sm text-ink-900">Sobre nós</span>
            </div>
            <h1 className="font-display font-bold text-5xl text-ink-900 mb-4">
              Por que Luz Coletiva existe
            </h1>
            <p className="font-body text-lg text-ink-700">
              Acreditamos que solidariedade direta — pessoa pra pessoa — pode ser segura, transparente e dignificante.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 space-y-10">
          <div>
            <h2 className="font-display font-semibold text-2xl text-ink-900 mb-3">A história</h2>
            <p className="font-body text-ink-700 leading-relaxed">
              Em 2025, vimos amigos próximos passarem por dificuldades pequenas mas urgentes —
              uma medicação, um livro escolar, um conserto de óculos — onde pedir ajuda diretamente
              era difícil pelo embaraço, e onde plataformas existentes ou eram caras, ou inseguras, ou
              misturavam doação com cobrança de taxas.
            </p>
            <p className="font-body text-ink-700 leading-relaxed mt-3">
              Luz Coletiva nasceu do desejo de fazer diferente: uma plataforma onde quem precisa
              descreve o que precisa, quem pode ajuda direto, e a tecnologia só serve pra dar
              confiança e organizar. Sem comissão. Sem intermediação de dinheiro.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-2xl text-ink-900 mb-3">Nossos princípios</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="card p-5">
                <ShieldCheck className="text-leaf-600 mb-2" size={24} />
                <h3 className="font-display font-semibold text-ink-900 mb-1">Identidade verificada</h3>
                <p className="font-body text-sm text-ink-700">
                  Quem cria pedido ou oferece ajuda passa por verificação de identidade.
                  Reduz golpes e protege todos.
                </p>
              </div>
              <div className="card p-5">
                <Eye className="text-sky-600 mb-2" size={24} />
                <h3 className="font-display font-semibold text-ink-900 mb-1">Transparência radical</h3>
                <p className="font-body text-sm text-ink-700">
                  Histórico de cada usuário fica visível. Avaliações honestas. Sem algoritmo opaco
                  priorizando ninguém.
                </p>
              </div>
              <div className="card p-5">
                <Users className="text-sun-600 mb-2" size={24} />
                <h3 className="font-display font-semibold text-ink-900 mb-1">Solidariedade direta</h3>
                <p className="font-body text-sm text-ink-700">
                  Sem comissão, sem taxa, sem propaganda. O que você dá, chega inteiro.
                </p>
              </div>
              <div className="card p-5">
                <Heart className="text-red-500 mb-2" size={24} />
                <h3 className="font-display font-semibold text-ink-900 mb-1">Cuidado humano</h3>
                <p className="font-body text-sm text-ink-700">
                  Moderação por pessoas, não só algoritmos. Suporte real quando algo dá errado.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-2xl text-ink-900 mb-3">O que NÃO somos</h2>
            <ul className="font-body text-ink-700 leading-relaxed space-y-2">
              <li>• Não somos uma plataforma de empréstimo, financiamento ou crowdfunding.</li>
              <li>• Não cobramos taxa de quem ajuda nem de quem recebe.</li>
              <li>• Não armazenamos dinheiro nem operamos como instituição financeira.</li>
              <li>• Não substituímos políticas públicas, ONGs ou redes de proteção formais.</li>
              <li>• Somos uma comunidade — pequena, intencional, gerenciável.</li>
            </ul>
          </div>

          <div className="card p-6 bg-sun-50 border-sun-200 text-center">
            <h3 className="font-display font-semibold text-xl text-ink-900 mb-2">Quer fazer parte?</h3>
            <p className="font-body text-ink-700 mb-4">
              Cadastre-se gratuitamente. Verifique sua identidade. Ajude ou seja ajudado.
            </p>
            <Link to="/register" className="btn-primary inline-flex">
              Começar agora <ArrowRight size={16} />
            </Link>
          </div>

          <div className="text-center pt-6 border-t border-ink-100">
            <p className="font-body text-sm text-ink-700">
              Dúvidas? Fale com a gente em <a href="mailto:contato@luzcoletiva.com.br" className="text-sky-600 hover:underline">contato@luzcoletiva.com.br</a>
            </p>
            <a
              href="https://instagram.com/luz_coletiva"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sky-700 hover:text-sun-600 font-body text-sm transition-colors"
              aria-label="Instagram do Luz Coletiva (@luz_coletiva)"
            >
              <Instagram size={18} />
              <span>Acompanhe no Instagram: @luz_coletiva</span>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
