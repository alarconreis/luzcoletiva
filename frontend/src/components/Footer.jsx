import { Link } from 'react-router-dom';
import { Mail, MapPin, Heart } from 'lucide-react';
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
          </div>

          <div>
            <h4 className="font-display font-semibold text-white text-base uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="mt-4 space-y-2 font-body text-white/80">
              <li><Link to="/como-funciona" className="hover:text-sun-400 transition-colors">Como funciona</Link></li>
              <li><a href="#" className="hover:text-sun-400 transition-colors">Histórias</a></li>
              <li><a href="#" className="hover:text-sun-400 transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-sun-400 transition-colors">Perguntas frequentes</a></li>
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
                <MapPin size={16} className="mt-1 text-sun-400 shrink-0" />
                <span>São Paulo — Brasil</span>
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
