import { useEffect } from 'react';

/**
 * Hook que adiciona <meta name="robots" content="noindex, nofollow">
 * enquanto o componente que o usa estiver montado.
 *
 * Uso:
 *   useNoIndex();
 *
 * Útil pra páginas atrás de auth ou páginas de auth (login, register)
 * onde queremos reforço além do que o robots.txt fornece.
 */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    meta.dataset.dynamic = 'noindex';
    document.head.appendChild(meta);

    return () => {
      const existing = document.head.querySelector('meta[data-dynamic="noindex"]');
      if (existing) document.head.removeChild(existing);
    };
  }, []);
}

// Manter export default pra compatibilidade caso queira usar como componente
export default function NoIndex() {
  useNoIndex();
  return null;
}
