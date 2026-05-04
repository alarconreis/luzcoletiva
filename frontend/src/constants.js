export const CATEGORIES = [
  { value: 'alimentacao',           label: 'Alimentação' },
  { value: 'educacao',              label: 'Educação' },
  { value: 'saude',                 label: 'Saúde' },
  { value: 'instrumentos_musicais', label: 'Instrumentos musicais' },
  { value: 'livros',                label: 'Livros' },
];

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
);

export const STATUS_LABEL = {
  pending_review: 'Aguardando aprovação',
  open:      'Aberto',
  proposed:  'Com ofertas',
  matched:   'Em andamento',
  closed:    'Concluído',
  cancelled: 'Cancelado',
};

export const STATUS_COLOR = {
  pending_review: 'bg-purple-100 text-purple-700',
  open:      'bg-sky-100 text-sky-700',
  proposed:  'bg-sun-100 text-sun-700',
  matched:   'bg-leaf-400/20 text-leaf-500',
  closed:    'bg-ink-100 text-ink-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const TRUST_LEVELS = [
  { value: 'novo',              label: 'Novo',              limit: 2 },
  { value: 'verificado',        label: 'Verificado',        limit: 5 },
  { value: 'confiavel',         label: 'Confiável',         limit: 10 },
  { value: 'parceiro_validado', label: 'Parceiro Validado', limit: null },
];

export const TRUST_LABEL = Object.fromEntries(
  TRUST_LEVELS.map(t => [t.value, t.label])
);

// Tailwind classes para cada nível (badge)
export const TRUST_BADGE = {
  novo:              null,  // sem badge
  verificado:        'bg-sky-100 text-sky-700',
  confiavel:         'bg-leaf-100 text-leaf-700',
  parceiro_validado: 'bg-sun-100 text-sun-700 ring-1 ring-sun-400',
};

export function memberSince(dateStr) {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days < 1)  return 'hoje';
  if (days < 30) return `${days} dia${days !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ano${years !== 1 ? 's' : ''}`;
}

// Estados brasileiros
export const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];
