import { Helmet } from 'react-helmet-async';

const SITE = 'https://luzcoletiva.com.br';
const DEFAULT_OG_IMAGE = `${SITE}/og-image.png`;

/**
 * Componente que injeta meta tags por página.
 *
 * Limitação conhecida: como esta SPA injeta meta via JS,
 * bots que não rodam JS (Facebook/WhatsApp preview, Twitter Cards
 * em alguns clientes) podem ver os meta tags do index.html (home),
 * não os da página específica. Para correção definitiva, considerar
 * pré-renderização (SSG) das rotas estáticas.
 *
 * Uso:
 *   <PageMeta
 *     title="Sobre nós"
 *     description="Quem somos e por que existimos"
 *     path="/sobre"
 *   />
 */
export default function PageMeta({ title, description, path = '/', noindex = false, ogImage }) {
  const fullTitle = title ? `${title} — Luz Coletiva` : 'Luz Coletiva — Iluminando vidas juntos';
  const url = `${SITE}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
