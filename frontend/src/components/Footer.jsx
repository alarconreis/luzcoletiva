import { Link } from 'react-router-dom';
import { Mail, MapPin, Heart, ShieldCheck, Instagram } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sky-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="bg-white inline-block rounded-2xl px-4 py-3">
              <Logo size={36} />
            </div>
            <p className="mt-5 font-body text-white/80 max-w-md leading-relaxed">
              Luz Coletiva é uma plataforma sem fins lucrativos que conecta
              pessoas dispostas a iluminar a vida umas das outras. Nada de
              algoritmos frios — só gente cuidando de gente.
            </p>
            <div className="mt-6">
              <h4 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-3">
                Siga nossa luz
              </h4>
              <a
                href="https://instagram.com/luz_coletiva"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-sun-400 hover:text-ink-900 transition-colors rounded-full px-4 py-2 font-body text-sm"
                aria-label="Instagram do Luz Coletiva (@luz_coletiva)"
              >
                <Instagram size={18} />
                <span>@luz_coletiva</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white text-base uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="mt-4 space-y-2 font-body text-white/80">
              <li><Link to="/como-funciona" className="hover:text-sun-400 transition-colors">Como funciona</Link></li>
              <li><Link to="/sobre" className="hover:text-sun-400 transition-colors">Sobre nós</Link></li>
              <li><Link to="/faq" className="hover:text-sun-400 transition-colors">Perguntas frequentes</Link></li>
              <li><Link to="/blog" className="hover:text-sun-400 transition-colors">Blog</Link></li>
              <li><Link to="/privacidade" className="hover:text-sun-400 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-sun-400 transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white text-base uppercase tracking-wider">
              Contato
            </h4>
            <ul className="mt-4 space-y-3 font-body text-white/80">
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-1 text-sun-400 shrink-0" />
                <a href="mailto:contato@luzcoletiva.com.br" className="hover:text-sun-400 transition-colors">contato@luzcoletiva.com.br</a>
              </li>
              <li className="flex items-start gap-2">
                <Instagram size={16} className="mt-1 text-sun-400 shrink-0" />
                <a
                  href="https://instagram.com/luz_coletiva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sun-400 transition-colors"
                >
                  @luz_coletiva
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 text-sun-400 shrink-0" />
                <span>São Paulo — Brasil</span>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t border-white/10 mt-3">
                <ShieldCheck size={16} className="mt-1 text-sun-400 shrink-0" />
                <div>
                  <div className="font-display font-semibold text-white text-sm">Encarregado de Dados (DPO)</div>
                  <a href="mailto:contato@luzcoletiva.com.br" className="hover:text-sun-400 transition-colors text-sm">
                    contato@luzcoletiva.com.br
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-sm text-white/70">
            © {year} Luz Coletiva — Todos os direitos reservados.
          </p>
          <p className="font-body text-sm text-white/70 flex items-center gap-1.5">
            Feito com <Heart size={14} className="text-sun-400 fill-sun-400" /> pela comunidade
          </p>
        </div>
      </div>
    </footer>
  );
}
