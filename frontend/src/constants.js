export const CATEGORIES = [
  {
    value: 'livros',
    label: 'Livros',
    placeholder: "Ex: Livro 'Anatomia da Cabeça' do Frank Netter, novo ou usado em bom estado, R$ 80–120",
    titlePlaceholder: "Ex: Livro 'Anatomia da Cabeça' do Frank Netter",
  },
  {
    value: 'material_escolar',
    label: 'Material escolar',
    placeholder: 'Ex: Kit de geometria para 7º ano (compasso, esquadro, transferidor) ou caderno universitário 200 folhas',
    titlePlaceholder: 'Ex: Kit de geometria para 7º ano',
  },
  {
    value: 'instrumentos_musicais',
    label: 'Instrumentos musicais',
    placeholder: 'Ex: Violão clássico tamanho 4/4 para iniciante, marca Giannini ou Memphis, R$ 250–350',
    titlePlaceholder: 'Ex: Violão clássico 4/4 para iniciante',
  },
  {
    value: 'roupas_calcados',
    label: 'Roupas e calçados',
    placeholder: 'Ex: Tênis Nike número 38 (preto ou branco), novo ou seminovo em ótimo estado',
    titlePlaceholder: 'Ex: Tênis número 38 para escola',
  },
  {
    value: 'itens_bebe',
    label: 'Itens de bebê',
    placeholder: 'Ex: Pacote de fralda Pampers tamanho M (40+ unidades) ou similar',
    titlePlaceholder: 'Ex: Fralda descartável tamanho M',
  },
  {
    value: 'racao_pets',
    label: 'Ração para pets',
    placeholder: 'Ex: Ração Premier para cão adulto porte médio, 15kg, ou similar',
    titlePlaceholder: 'Ex: Ração para cão adulto 15kg',
  },
];

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
);

export const STATUS_LABEL = {
  pending_review: 'Aguardando aprovação',
  open:        'Aberto',
  proposed:    'Com ofertas',
  matched:     'Em andamento',
  in_transit:  'A caminho',
  delivered:   'Entregue',
  closed:      'Concluído',
  cancelled:   'Cancelado',
};

export const STATUS_COLOR = {
  pending_review: 'bg-purple-100 text-purple-700',
  open:        'bg-sky-100 text-sky-700',
  proposed:    'bg-sun-100 text-sun-700',
  matched:     'bg-leaf-400/20 text-leaf-500',
  in_transit:  'bg-indigo-100 text-indigo-700',
  delivered:   'bg-leaf-100 text-leaf-700',
  closed:      'bg-ink-100 text-ink-700',
  cancelled:   'bg-red-100 text-red-700',
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
