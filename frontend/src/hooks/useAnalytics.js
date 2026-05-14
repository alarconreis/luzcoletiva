/**
 * Analytics consent + GA4 loader.
 * LGPD-compliant: GA NÃO carrega antes de consentimento explícito.
 */
const GA_ID = 'G-ZYN1JED1G6';
const CONSENT_KEY = 'luz_analytics_consent';

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY); // 'granted' | 'denied' | null
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === 'granted') {
      loadGA();
    }
  } catch {}
}

let _gaLoaded = false;

export function loadGA() {
  if (_gaLoaded || typeof window === 'undefined') return;
  if (getConsent() !== 'granted') return;

  // Script GA
  const s1 = document.createElement('script');
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s1);

  // Init gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  _gaLoaded = true;
}

// Inicializa no boot do app: se já consentiu antes, carrega imediatamente
export function initAnalytics() {
  if (getConsent() === 'granted') {
    loadGA();
  }
}
