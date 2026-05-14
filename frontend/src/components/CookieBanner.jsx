import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../hooks/useAnalytics.js';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Só mostra se ainda não decidiu
    if (getConsent() === null) {
      // Pequeno delay pra não atrapalhar load inicial
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    setConsent('granted');
    setShow(false);
  };

  const decline = () => {
    setConsent('denied');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-sky-600 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 md:py-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="text-sky-600 shrink-0 mt-0.5" size={22} />
          <div className="text-sm text-ink-900 leading-relaxed">
            <strong className="block mb-1">Cookies de analytics</strong>
            Usamos cookies do Google Analytics para entender como você usa a plataforma e melhorá-la. Seu IP é anonimizado e nenhum dado pessoal é coletado.
            <Link to="/privacidade" className="text-sky-700 hover:text-sky-900 underline ml-1">
              Saiba mais
            </Link>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={decline}
            className="btn-ghost text-sm flex-1 md:flex-initial"
            aria-label="Rejeitar cookies de analytics"
          >
            Rejeitar
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm flex-1 md:flex-initial"
            aria-label="Aceitar cookies de analytics"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
