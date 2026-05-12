import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Shield, User, HandHeart, HelpingHand, X, Instagram } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'moderator');
  const isHelper = user?.profile_type === 'helper';
  const isRequester = user?.profile_type === 'requester';

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size={44} />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/como-funciona" className="btn-ghost text-ink-700">
            Como funciona
          </Link>
          <Link to="/faq" className="btn-ghost text-ink-700">
            FAQ
          </Link>
          <Link to="/blog" className="btn-ghost text-ink-700">
            Blog
          </Link>
          {user ? (
            <>
              {isHelper && (
                <Link to="/help-requests" className="btn-ghost">
                  <HandHeart size={18} />
                  <span>Pedidos abertos</span>
                </Link>
              )}
              {isRequester && (
                <Link to="/my-requests" className="btn-ghost">
                  <HelpingHand size={18} />
                  <span>Meus pedidos</span>
                </Link>
              )}
              <Link to="/dashboard" className="btn-ghost">
                <User size={18} />
                <span>Olá, {user.name.split(' ')[0]}</span>
              </Link>
              {isStaff && (
                <Link to="/admin" className="btn-ghost text-sun-600" title="Painel admin">
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
              <button onClick={handleLogout} className="btn-ghost">
                <LogOut size={18} />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Entrar</Link>
              <Link to="/register" className="btn-primary">Cadastrar-se</Link>
            </>
          )}
          <a
            href="https://instagram.com/luz_coletiva"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center justify-center w-10 h-10 rounded-full text-ink-700 hover:bg-sun-100 hover:text-sun-600 transition-colors"
            aria-label="Instagram do Luz Coletiva (@luz_coletiva)"
            title="@luz_coletiva no Instagram"
          >
            <Instagram size={20} />
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-ink-700 hover:bg-ink-100 transition-colors"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-20 bg-ink-900/40 backdrop-blur-sm z-30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            className="md:hidden absolute top-20 inset-x-0 bg-white border-b border-ink-100 shadow-card z-40"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              <Link to="/como-funciona" className="btn-ghost justify-start text-ink-700">
                Como funciona
              </Link>
              <Link to="/faq" className="btn-ghost justify-start text-ink-700">
                FAQ
              </Link>
              <Link to="/blog" className="btn-ghost justify-start text-ink-700">
                Blog
              </Link>
              {user ? (
                <>
                  {isHelper && (
                    <Link to="/help-requests" className="btn-ghost justify-start">
                      <HandHeart size={18} />
                      <span>Pedidos abertos</span>
                    </Link>
                  )}
                  {isRequester && (
                    <Link to="/my-requests" className="btn-ghost justify-start">
                      <HelpingHand size={18} />
                      <span>Meus pedidos</span>
                    </Link>
                  )}
                  <Link to="/dashboard" className="btn-ghost justify-start">
                    <User size={18} />
                    <span>Olá, {user.name.split(' ')[0]}</span>
                  </Link>
                  {isStaff && (
                    <Link to="/admin" className="btn-ghost justify-start text-sun-600">
                      <Shield size={18} />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="btn-ghost justify-start">
                    <LogOut size={18} />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" className="btn-ghost justify-start">Entrar</Link>
                  <Link to="/register" className="btn-primary">Cadastrar-se</Link>
                </div>
              )}
              <a
                href="https://instagram.com/luz_coletiva"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost justify-start mt-2 border-t border-ink-100 pt-3"
                aria-label="Instagram do Luz Coletiva (@luz_coletiva)"
              >
                <Instagram size={18} />
                <span>@luz_coletiva</span>
              </a>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
