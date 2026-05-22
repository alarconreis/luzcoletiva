import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, HandHeart, HelpingHand, BookOpen, Pencil, Music,
  Shirt, Baby, PawPrint, Lock, ArrowRight, Minus, Plus,
} from 'lucide-react';
import PageMeta from '../components/PageMeta.jsx';

// Categorias REAIS do sistema (constants.js). Valores ESTIMADOS (médias BR), só referência.
const CATEGORIAS = [
  { value: 'livros',                label: 'Livros',                Icon: BookOpen, preco: 25,  exemplo: 'didáticos, literatura, infantis' },
  { value: 'material_escolar',      label: 'Material escolar',      Icon: Pencil,   preco: 80,  exemplo: 'cadernos, mochila, kit geometria' },
  { value: 'instrumentos_musicais', label: 'Instrumentos musicais', Icon: Music,    preco: 200, exemplo: 'violão, flauta, teclado iniciante' },
  { value: 'roupas_calcados',       label: 'Roupas e calçados',     Icon: Shirt,    preco: 30,  exemplo: 'roupas em bom estado, calçados' },
  { value: 'itens_bebe',            label: 'Itens de bebê',         Icon: Baby,     preco: 60,  exemplo: 'carrinho, berço, roupinhas' },
  { value: 'racao_pets',            label: 'Ração e pets',          Icon: PawPrint, preco: 90,  exemplo: 'ração, caminha, acessórios' },
];

const BRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function Calculadora() {
  const [modo, setModo] = useState('doar'); // 'doar' | 'receber'
  const [qtds, setQtds] = useState(() => Object.fromEntries(CATEGORIAS.map((c) => [c.value, 0])));

  const setQtd = (value, delta) =>
    setQtds((prev) => ({ ...prev, [value]: Math.max(0, (prev[value] || 0) + delta) }));

  const total = useMemo(
    () => CATEGORIAS.reduce((acc, c) => acc + (qtds[c.value] || 0) * c.preco, 0),
    [qtds]
  );
  const totalItens = useMemo(
    () => CATEGORIAS.reduce((acc, c) => acc + (qtds[c.value] || 0), 0),
    [qtds]
  );
  const temItens = totalItens > 0;

  return (
    <>
      <PageMeta
        title="Calculadora de Impacto"
        description="Descubra quanto vale o que está parado na sua casa e pode virar ajuda real — ou veja o tipo de apoio disponível na Luz Coletiva. Doação segura, com verificação real."
        path="/calculadora"
      />

      <div className="bg-gradient-to-b from-white via-sun-50/30 to-white min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">

          {/* Hero */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-card mb-5">
              <Sun size={16} className="text-sun-600" />
              <span className="font-display font-medium text-sm text-ink-900">Calculadora de Impacto</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-ink-900 leading-[1.08]">
              Quanto vale ajudar <em className="not-italic text-sky-900">de verdade?</em>
            </h1>
            <p className="mt-5 font-body text-lg text-ink-700 max-w-xl mx-auto leading-relaxed">
              Itens parados na sua casa podem transformar a vida de uma família.
              Faça as contas e veja o impacto.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-10 bg-white rounded-2xl shadow-card p-3 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setModo('doar')}
              className={`flex-1 min-h-[60px] flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-display font-semibold text-sm leading-none transition-all ${
                modo === 'doar' ? 'bg-sunrise text-ink-900 shadow-glow' : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <HandHeart size={18} /> Quero doar
            </button>
            <button
              onClick={() => setModo('receber')}
              className={`flex-1 min-h-[60px] flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-display font-semibold text-sm leading-none transition-all ${
                modo === 'receber' ? 'bg-sky-500 text-white shadow-glow' : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <HelpingHand size={18} /> Preciso de ajuda
            </button>
          </div>

          {/* Pergunta-guia */}
          <p className="mt-8 font-body text-ink-700 text-center">
            {modo === 'doar'
              ? 'Some os itens que você poderia doar:'
              : 'Marque o tipo de ajuda que você precisaria:'}
          </p>

          {/* Lista */}
          <div className="mt-5 flex flex-col gap-3">
            {CATEGORIAS.map((c) => {
              const q = qtds[c.value] || 0;
              const ativo = q > 0;
              const { Icon } = c;
              return (
                <div
                  key={c.value}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white ${
                    ativo ? 'border-sky-300 bg-sky-50/40' : 'border-ink-100'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    ativo ? 'bg-sky-100 text-sky-600' : 'bg-ink-50 text-ink-400'
                  }`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-ink-900">{c.label}</div>
                    <div className="font-body text-xs text-ink-500 mt-0.5">{c.exemplo}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setQtd(c.value, -1)}
                      className="w-9 h-9 rounded-lg border border-ink-200 text-ink-600 flex items-center justify-center hover:bg-ink-50 transition-colors"
                      aria-label={`Menos ${c.label}`}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-7 text-center font-display font-bold text-ink-900">{q}</span>
                    <button
                      onClick={() => setQtd(c.value, +1)}
                      className="w-9 h-9 rounded-lg bg-sun-400 text-ink-900 flex items-center justify-center hover:bg-sun-500 transition-colors"
                      aria-label={`Mais ${c.label}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resultado */}
          <div className={`mt-8 rounded-2xl p-7 text-center transition-all ${
            temItens ? 'bg-gradient-to-br from-sun-50 to-sky-50 shadow-card' : 'bg-ink-50'
          }`}>
            {!temItens ? (
              <p className="font-body text-ink-400">Selecione itens acima para ver o impacto ✨</p>
            ) : modo === 'doar' ? (
              <>
                <p className="font-body text-lg text-ink-800 leading-relaxed">
                  Você tem cerca de{' '}
                  <span className="font-display font-extrabold text-3xl text-sun-600 block my-2">{BRL(total)}</span>
                  em itens parados que podem virar <strong>ajuda real</strong> para{' '}
                  {totalItens === 1 ? 'uma família' : 'famílias'}.
                </p>
                <p className="font-body text-xs text-ink-400 mt-2 mb-5">
                  * Valores estimados de mercado, apenas para referência.
                </p>
                <Link to="/register?type=helper" className="btn-primary inline-flex items-center gap-2">
                  Quero doar esses itens <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <>
                <p className="font-body text-lg text-ink-800 leading-relaxed">
                  Esses itens — somando cerca de{' '}
                  <span className="font-display font-extrabold text-3xl text-sky-600 block my-2">{BRL(total)}</span>
                  podem chegar até você por meio de <strong>doadores verificados</strong>, com segurança e dignidade.
                </p>
                <p className="font-body text-xs text-ink-400 mt-2 mb-5">
                  * Valores estimados de mercado, apenas para referência.
                </p>
                <Link to="/register?type=requester" className="btn-primary inline-flex items-center gap-2">
                  Quero pedir ajuda <ArrowRight size={18} />
                </Link>
              </>
            )}
          </div>

          {/* Selo de confiança */}
          <div className="mt-7 flex items-start gap-3 justify-center text-center max-w-md mx-auto">
            <Lock size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="font-body text-sm text-ink-500 leading-relaxed">
              Toda pessoa na Luz Coletiva passa por verificação real (documento + foto).
              Sem perfis falsos, sem golpe.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
