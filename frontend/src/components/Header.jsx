import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Shield, User, HandHeart, HelpingHand } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
        </nav>

        <div className="md:hidden">
          {user ? (
            isHelper ? (
              <Link to="/help-requests" className="btn-ghost"><HandHeart size={18} /></Link>
            ) : isRequester ? (
              <Link to="/my-requests" className="btn-ghost"><HelpingHand size={18} /></Link>
            ) : (
              <Link to="/dashboard" className="btn-ghost"><User size={18} /></Link>
            )
          ) : (
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
