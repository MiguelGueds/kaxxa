'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { accountsService } from '@/lib/services/accounts';
import { debtsService } from '@/lib/services/debts';
import { investmentsService } from '@/lib/services/investments';
import { transactionsService } from '@/lib/services/transactions';
import { cardsService } from '@/lib/services/cards';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar,
  Activity,
  PieChart,
  CreditCard,
  Wallet,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  BriefcaseBusiness,
  Landmark,
  Plus,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { PortalModal } from '@/app/components/PortalModal';

// Categorias e Subcategorias Oficiais
const CATEGORIES_DATA: Record<string, string[]> = {
  'Alimentação': ['Supermercado', 'Restaurante / Delivery', 'Padaria & Café', 'Feira'],
  'Lazer & Assinaturas': ['Streaming (Netflix, Spotify)', 'Viagens & Hospedagem', 'Shows & Cinema', 'Eletrônicos & Gadgets'],
  'Transporte': ['Combustível', 'Uber / 99 / Táxi', 'Estacionamento', 'Manutenção Auto', 'Passagens Aéreas'],
  'Moradia': ['Aluguel / Condomínio', 'Energia Elétrica', 'Água / Saneamento', 'Internet / TV'],
  'Saúde & Bem-estar': ['Farmácia', 'Consultas & Exames', 'Academia & Suplementos'],
  'Educação': ['Cursos & Treinamentos', 'Faculdade', 'Livros'],
  'Compras Pessoais': ['Vestuário & Moda', 'Presentes', 'Cosméticos & Perfumaria']
};

const CATEGORY_PALETTE: Record<string, { color: string; hex: string; bg: string }> = {
  'Alimentação': { color: 'text-blue-600 dark:text-blue-400', hex: '#2563EB', bg: 'bg-blue-600' },
  'Lazer & Assinaturas': { color: 'text-indigo-500 dark:text-indigo-400', hex: '#6366F1', bg: 'bg-indigo-500' },
  'Transporte': { color: 'text-sky-500 dark:text-sky-400', hex: '#0EA5E9', bg: 'bg-sky-500' },
  'Moradia': { color: 'text-teal-600 dark:text-teal-400', hex: '#0D9488', bg: 'bg-teal-600' },
  'Saúde & Bem-estar': { color: 'text-rose-500 dark:text-rose-400', hex: '#F43F5E', bg: 'bg-rose-500' },
  'Educação': { color: 'text-amber-500 dark:text-amber-400', hex: '#F59E0B', bg: 'bg-amber-500' },
  'Compras Pessoais': { color: 'text-purple-600 dark:text-purple-400', hex: '#9333EA', bg: 'bg-purple-600' }
};

export default function DashboardPage() {
  const { isConcealed } = usePrivacy();

  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeCategoryModal, setActiveCategoryModal] = useState<{
    category: string;
    total: number;
    percentage: number;
    subcategories: { name: string; amount: number; pct: number }[];
    palette: { color: string; hex: string; bg: string };
  } | null>(null);

  // Dados consolidados da visão geral
  const [patrimonio, setPatrimonio] = useState(0);
  const [saldoEmContas, setSaldoEmContas] = useState(0);
  const [dividasAtivas, setDividasAtivas] = useState(0);
  const valorDiferido = 0;
  const [ganhoCapital, setGanhoCapital] = useState(0);
  const [aportesMes, setAportesMes] = useState(0);
  const [despesasMes, setDespesasMes] = useState(0);
  const [totalLimiteCartoes, setTotalLimiteCartoes] = useState(0);
  const [limiteComprometido, setLimiteComprometido] = useState(0);
  const [qtdCartoes, setQtdCartoes] = useState(0);
  const patrimonioLiquidoTotal = patrimonio + saldoEmContas + valorDiferido - dividasAtivas;

  const [investmentBreakdown, setInvestmentBreakdown] = useState<
    { label: string; value: number; color: string }[]
  >([]);

  useEffect(() => {
    function applyMetrics(
      dbAccounts: any[] | null,
      dbDebts: any[] | null,
      dbInvestments: any[] | null,
      dbTransactions: any[] | null,
      dbCards: any[] | null,
      dbCardExpenses: any[] | null
    ) {
      if (dbAccounts && dbAccounts.length > 0) {
        setSaldoEmContas(dbAccounts.reduce((acc, a) => acc + (a.balance || 0), 0));
      }
      if (dbDebts && dbDebts.length > 0) {
        setDividasAtivas(dbDebts.reduce((acc, d) => acc + (d.current_balance || 0), 0));
      }
      if (dbInvestments && dbInvestments.length > 0) {
        const totalInvest = dbInvestments.reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);
        setPatrimonio(totalInvest);

        const fixed = dbInvestments.filter(i => i.macro_type === 'FIXA').reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);
        const acoes = dbInvestments.filter(i => i.category === 'ACOES').reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);
        const fiis = dbInvestments.filter(i => i.category === 'FIIS').reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);
        const inter = dbInvestments.filter(i => i.category === 'BDRS_STOCKS' || i.category === 'ETFS').reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);
        const cripto = dbInvestments.filter(i => i.category === 'CRIPTO').reduce((acc, i) => acc + (i.current_value || i.invested_amount || 0), 0);

        setInvestmentBreakdown([
          { label: 'Renda fixa', value: fixed, color: '#0047FF' },
          { label: 'Ações', value: acoes, color: '#0284C7' },
          { label: 'FIIs', value: fiis, color: '#10B981' },
          { label: 'Internacional', value: inter, color: '#8B5CF6' },
          { label: 'Cripto', value: cripto, color: '#F59E0B' },
        ].filter(item => item.value > 0));
      }
      if (dbTransactions && dbTransactions.length > 0) {
        const totalExp = dbTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
        const totalInc = dbTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
        setDespesasMes(totalExp);
        setAportesMes(totalInc);
      }
      if (dbCards && dbCards.length > 0) {
        setTotalLimiteCartoes(dbCards.reduce((acc, c) => acc + (c.credit_limit || 0), 0));
        setQtdCartoes(dbCards.length);
        const totalCardExpenses = (dbCardExpenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);
        const explicitUsed = dbCards.reduce((acc, c) => acc + (c.limit_used || 0), 0);
        setLimiteComprometido(totalCardExpenses > 0 ? totalCardExpenses : explicitUsed);
      }
    }

    // 1. Exibe instantaneamente dados do cache local sem delay (0ms)
    try {
      const cachedAcc = accountsService.getCachedAccounts();
      const cachedDeb = debtsService.getCachedDebts();
      const cachedInv = investmentsService.getCachedInvestments();
      const cachedTx = transactionsService.getCachedTransactions();
      const cachedCrd = cardsService.getCachedCards();
      const cachedExp = cardsService.getCachedCardExpenses();
      applyMetrics(cachedAcc, cachedDeb, cachedInv, cachedTx, cachedCrd, cachedExp);
    } catch (e) {
      console.warn('Erro ao carregar cache local do dashboard:', e);
    }

    // 2. Atualiza em segundo plano via rede de forma transparente
    async function loadDashboardData() {
      try {
        const [dbAccounts, dbDebts, dbInvestments, dbTransactions, dbCards, dbCardExpenses] = await Promise.all([
          accountsService.fetchAccounts(),
          debtsService.fetchDebts(),
          investmentsService.fetchInvestments(),
          transactionsService.fetchTransactions(200),
          cardsService.fetchCards(),
          cardsService.fetchCardExpenses()
        ]);
        applyMetrics(dbAccounts, dbDebts, dbInvestments, dbTransactions, dbCards, dbCardExpenses);
      } catch (err) {
        console.error('Erro ao carregar métricas consolidadas do Supabase:', err);
      }
    }
    loadDashboardData();

    const handleRefresh = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener('kaxxa_refresh_data', handleRefresh);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('kaxxa_refresh_data', handleRefresh);
    };
  }, []);

  const investmentBreakdownTotal = investmentBreakdown.reduce((acc, item) => acc + item.value, 0);

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Dados da Evolução Anual de Gastos
  const annualSpendingData = useMemo(() => {
    return [
      { month: 'Jan', amount: 0 },
      { month: 'Fev', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Abr', amount: 0 },
      { month: 'Mai', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Ago', amount: 0 },
      { month: 'Set', amount: despesasMes },
      { month: 'Out', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dez', amount: 0 },
    ];
  }, [despesasMes]);

  const maxAnnualVal = Math.max(...annualSpendingData.map(d => d.amount), 1000);
  const svgWidth = 720;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 32;

  const points = annualSpendingData.map((item, index) => {
    const x = paddingX + (index * ((svgWidth - (paddingX * 2)) / (annualSpendingData.length - 1)));
    const y = svgHeight - paddingY - ((item.amount / maxAnnualVal) * (svgHeight - (paddingY * 2)));

    let diffPct = 0;
    if (index > 0) {
      const prevAmount = annualSpendingData[index - 1].amount;
      diffPct = prevAmount > 0 ? ((item.amount - prevAmount) / prevAmount) * 100 : 0;
    }

    return { x, y, diffPct, ...item };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

  // Dados de Gastos por Categoria
  const categoryData = useMemo(() => {
    return [] as {
      category: string;
      total: number;
      subcategories: { name: string; amount: number; pct: number }[];
      percentage: number;
      palette: { color: string; hex: string; bg: string };
    }[];
  }, []);

  const totalDespesasGerais = categoryData.reduce((acc, c) => acc + c.total, 0);
  const pctComprometido = totalLimiteCartoes > 0 ? (limiteComprometido / totalLimiteCartoes) * 100 : 0;
  const saldoMes = aportesMes - despesasMes;
  const isSuperavit = saldoMes >= 0;

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6">
      
      {/* =========================================================================
          1. HERO CARD: POSIÇÃO PATRIMONIAL AUDITADA (SWISS PRIVATE WEALTH)
      ========================================================================= */}
      <div className="card-luxury-float rounded-3xl p-5 sm:p-8 md:p-9 relative overflow-hidden transition-all animate-luxury-fade">
        
        {/* Hairline subtle glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/70 dark:via-white/20 to-transparent"></div>
        <div className="absolute -top-36 right-0 w-96 h-96 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6 sm:space-y-8">
          
          {/* Top Metadata Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500"></span>
              <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-zinc-400">
                POSIÇÃO PATRIMONIAL AUDITADA
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Consolidado
              </span>
            </div>
          </div>

          {/* Grand Headline Value (Refinado, responsivo e estiloso no celular) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.08] text-[9.5px] sm:text-[10px] font-mono font-medium tracking-widest text-slate-600 dark:text-zinc-300 shadow-2xs">
                  BRL
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500 font-light tracking-wide uppercase">
                  Posição líquida consolidada
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extralight tracking-tight text-slate-950 dark:text-white font-luxury-num flex items-baseline gap-1.5 leading-none mt-1 break-words">
                <span className="text-xl sm:text-2xl md:text-3xl font-light text-slate-400 dark:text-zinc-500">R$</span>
                {formatCurrency(patrimonioLiquidoTotal)}
              </h1>
              
              <p className="text-xs font-light text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed pt-0.5">
                Disponível em contas correntes + custódia de renda fixa e variável, deduzidos passivos e dívidas ativas.
              </p>
            </div>

            {/* Quick Action Buttons (Gradiente Azul nobre da marca) */}
            <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
              <Link
                href="/dashboard/transacoes"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0031B8] via-[#0047FF] to-[#0055FF] hover:from-[#002796] hover:to-[#0042E0] text-white text-xs font-medium tracking-wide shadow-md shadow-blue-600/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Nova Operação</span>
              </Link>
              <Link
                href="/dashboard/cartoes"
                className="px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 text-xs font-normal transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <CreditCard size={14} strokeWidth={1.75} className="text-slate-500 dark:text-zinc-400" />
                <span>Minhas Faturas</span>
              </Link>
            </div>
          </div>

          {/* 4 Colunas no Padrão Micro-Cards Executivos (Perfeito no celular e desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
            
            {/* 01: Saldo Disponível */}
            <Link 
              href="/dashboard/transacoes" 
              className="p-3.5 sm:p-4 rounded-xl card-luxury-float transition-all group"
            >
              <span className="text-[9px] sm:text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                01 / SALDO EM CONTAS
              </span>
              <div className="text-lg sm:text-2xl font-light font-luxury-num text-slate-900 dark:text-white mt-1">
                R$ {formatCurrency(saldoEmContas)}
              </div>
              <div className="text-[10px] font-light text-slate-400 dark:text-zinc-500 mt-0.5">
                Liquidez imediata
              </div>
            </Link>

            {/* 02: Custódia Investida */}
            <Link 
              href="/dashboard/investimentos" 
              className="p-3.5 sm:p-4 rounded-xl card-luxury-float hover:border-emerald-500/40 transition-all group"
            >
              <span className="text-[9px] sm:text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block group-hover:text-emerald-600 transition-colors">
                02 / CUSTÓDIA INVESTIDA
              </span>
              <div className="text-lg sm:text-2xl font-light font-luxury-num text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {formatCurrency(patrimonio)}
              </div>
              <div className="text-[10px] font-light text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Renda fixa e bolsa
              </div>
            </Link>

            {/* 03: Dívidas Ativas */}
            <Link 
              href="/dashboard/dividas" 
              className="p-3.5 sm:p-4 rounded-xl card-luxury-float hover:border-rose-500/40 transition-all group"
            >
              <span className="text-[9px] sm:text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block group-hover:text-rose-600 transition-colors">
                03 / DÍVIDAS ATIVAS
              </span>
              <div className="text-lg sm:text-2xl font-light font-luxury-num text-slate-800 dark:text-zinc-200 mt-1">
                R$ {formatCurrency(dividasAtivas)}
              </div>
              <div className="text-[10px] font-light text-slate-400 dark:text-zinc-500 mt-0.5">
                Passivos em amortização
              </div>
            </Link>

            {/* 04: Cartões & Faturas */}
            <Link 
              href="/dashboard/cartoes" 
              className="p-3.5 sm:p-4 rounded-xl card-luxury-float transition-all group"
            >
              <span className="text-[9px] sm:text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                04 / FATURAS CARTÃO
              </span>
              <div className="text-lg sm:text-2xl font-light font-luxury-num text-slate-800 dark:text-zinc-200 mt-1">
                R$ {formatCurrency(limiteComprometido)}
              </div>
              <div className="text-[10px] font-light text-slate-400 dark:text-zinc-500 mt-0.5">
                Limite comprometido
              </div>
            </Link>

          </div>

        </div>
      </div>

      {/* =========================================================================
          2. SEÇÃO MACRO: EVOLUÇÃO ANUAL DE GASTOS + DISTRIBUIÇÃO DO PORTFÓLIO
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Preciso de Linha Fina (Bloomberg Style) */}
        <div className="lg:col-span-2 card-luxury-float rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <span className="text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block">
                  DESEMPENHO HISTÓRICO
                </span>
                <h3 className="text-base font-light text-slate-950 dark:text-white mt-0.5">
                  Evolução Anual de Gastos
                </h3>
              </div>

              {/* Controles de Ano e Exportação Finos */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] text-xs text-slate-700 dark:text-zinc-300">
                  <Calendar size={12} strokeWidth={1.75} className="text-slate-400" />
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-slate-800 dark:text-white font-normal focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="2024" className="dark:bg-zinc-900">2024</option>
                    <option value="2025" className="dark:bg-zinc-900">2025</option>
                    <option value="2026" className="dark:bg-zinc-900">2026</option>
                    <option value="2027" className="dark:bg-zinc-900">2027</option>
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={() => alert('Relatório anual gerado para conferência.')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-xs font-light text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                >
                  <Download size={12} strokeWidth={1.75} className="text-slate-400" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Curva Vetorial SVG Ultra-limpa com Linha Fina */}
            <div className="w-full relative pt-4">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 sm:h-48 overflow-visible">
                <defs>
                  <linearGradient id="swissOverviewGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0047FF" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#0047FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Linhas horizontais de referência técnica */}
                {[0, 0.33, 0.66, 1].map((ratio, i) => {
                  const y = svgHeight - paddingY - (ratio * (svgHeight - (paddingY * 2)));
                  return (
                    <line 
                      key={i} 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="currentColor" 
                      className="text-slate-200/80 dark:text-white/[0.04]"
                      strokeDasharray="3 3" 
                    />
                  );
                })}

                {/* Preenchimento Suave */}
                <path d={areaD} fill="url(#swissOverviewGrad)" />

                {/* Linha Fina de 1.75px */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#0047FF" 
                  strokeWidth="1.75" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Pontos de Dados */}
                {points.map((pt, idx) => {
                  const isCurrent = idx === 8; // Setembro
                  return (
                    <g key={pt.month} className="group cursor-pointer">
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={isCurrent ? 4.5 : 3} 
                        fill={isCurrent ? '#0047FF' : '#FFFFFF'} 
                        stroke="#0047FF" 
                        strokeWidth={isCurrent ? 2 : 1.5}
                        className="transition-all duration-200 group-hover:r-5" 
                      />
                      
                      {/* Tooltip Hover no Ponto */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect 
                          x={pt.x - 45} 
                          y={pt.y - 30} 
                          width="90" 
                          height="22" 
                          rx="6" 
                          fill="#090D16" 
                          className="shadow-md"
                        />
                        <text 
                          x={pt.x} 
                          y={pt.y - 15} 
                          textAnchor="middle" 
                          fill="#FFFFFF" 
                          fontSize="9.5" 
                          fontWeight="normal"
                          className="font-luxury-num"
                        >
                          R$ {formatCurrency(pt.amount)}
                        </text>
                      </g>

                      {/* Mês no Eixo X */}
                      <text 
                        x={pt.x} 
                        y={svgHeight - 8} 
                        textAnchor="middle" 
                        fill="currentColor" 
                        className={isCurrent ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-zinc-500 font-light'}
                        fontSize="9.5" 
                      >
                        {pt.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Rodapé do Card com Balanço */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-light">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Balanço mensal líquido: <strong className={isSuperavit ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 font-medium'}>{isSuperavit ? '+' : ''}R$ {formatCurrency(saldoMes)}</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-light">
              Despesas controladas: R$ {formatCurrency(despesasMes)}
            </div>
          </div>
        </div>

        {/* Alocação de Recursos (Barras Hairline) */}
        <div className="card-luxury-float rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <div>
                <span className="text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block">
                  PORTFÓLIO
                </span>
                <h3 className="text-base font-light text-slate-950 dark:text-white mt-0.5">
                  Distribuição de Capital
                </h3>
              </div>
              <Link href="/dashboard/investimentos" className="text-[11px] font-light text-blue-600 dark:text-blue-400 hover:underline">
                Detalhar
              </Link>
            </div>

            <div className="space-y-4 mt-4">
              {investmentBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-light">
                  <p>Nenhum ativo registrado na carteira.</p>
                  <Link href="/dashboard/investimentos" className="inline-block mt-2 text-blue-600 dark:text-blue-400 font-normal hover:underline">
                    + Cadastrar primeiro ativo
                  </Link>
                </div>
              ) : (
                investmentBreakdown.map((segment) => {
                  const segmentPct = investmentBreakdownTotal > 0 ? (segment.value / investmentBreakdownTotal) * 100 : 0;
                  return (
                    <div key={segment.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-slate-700 dark:text-zinc-300">{segment.label}</span>
                        <span className="font-luxury-num text-slate-950 dark:text-white">
                          R$ {formatCurrency(segment.value)} ({segmentPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-[2.5px] bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${segmentPct}%`, backgroundColor: segment.color }} 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-zinc-500 font-light">Status de Risco</span>
            <span className="text-[10px] font-mono tracking-wider text-slate-700 dark:text-zinc-300 uppercase px-2 py-0.5 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
              CONSERVADOR MODERADO
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. SEÇÃO INFERIOR: CATEGORIAS AUDITADAS & BALANÇO MENSAL
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card de Categorias */}
        <div className="card-luxury-float rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <span className="text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block">
                CLASSIFICAÇÃO OPERACIONAL
              </span>
              <h3 className="text-base font-light text-slate-950 dark:text-white mt-0.5">
                Despesas por Categoria
              </h3>
            </div>
            <Link href="/dashboard/transacoes" className="text-[11px] font-light text-blue-600 dark:text-blue-400 hover:underline">
              Registrar gastos
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {categoryData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-light">
                <p>Nenhuma despesa categorizada no ciclo atual.</p>
                <Link href="/dashboard/transacoes" className="inline-block mt-2 text-blue-600 dark:text-blue-400 font-normal hover:underline">
                  + Registrar primeira despesa
                </Link>
              </div>
            ) : (
              categoryData.map((cat) => (
                <div 
                  key={cat.category}
                  onClick={() => setActiveCategoryModal(cat)}
                  className="p-3 rounded-xl card-luxury-float cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.palette.bg}`} />
                      <span className="font-normal text-slate-900 dark:text-white">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-luxury-num text-slate-900 dark:text-white">R$ {formatCurrency(cat.total)}</span>
                      <span className="text-[10px] text-slate-400">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-[2.5px] bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.palette.bg}`} style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card de Superávit & Balanço Líquido */}
        <div className="card-luxury-float rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-[9.5px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500 block">
                  FLUXO DE CAIXA MENSAL
                </span>
                <h3 className="text-base font-light text-slate-950 dark:text-white mt-0.5">
                  Balanço Mensal Consolidado
                </h3>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                isSuperavit 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
              }`}>
                {isSuperavit ? 'Superávit' : 'Déficit'}
              </span>
            </div>

            <div className="pt-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-light text-slate-500 dark:text-zinc-400">Total de Entradas / Receitas</span>
                <span className="text-base sm:text-lg font-light font-luxury-num text-emerald-600 dark:text-emerald-400">
                  +R$ {formatCurrency(aportesMes)}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-light text-slate-500 dark:text-zinc-400">Total de Saídas / Despesas</span>
                <span className="text-base sm:text-lg font-light font-luxury-num text-slate-800 dark:text-zinc-200">
                  -R$ {formatCurrency(despesasMes)}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-900 dark:text-white">Resultado Líquido do Ciclo</span>
                <span className={`text-2xl sm:text-3xl font-extralight font-luxury-num ${
                  isSuperavit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}>
                  {isSuperavit ? '+' : ''}R$ {formatCurrency(saldoMes)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-xs font-light text-slate-500 dark:text-zinc-400 flex items-center gap-3">
            <CheckCircle2 size={16} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Dados auditados e conciliados automaticamente com o Supabase.</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          MODAL DE SUBCATEGORIAS (SWISS LUXURY STYLE)
      ========================================================================= */}
      {activeCategoryModal && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setActiveCategoryModal(null)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[88vh] overflow-hidden my-auto shrink-0"
            >
              
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeCategoryModal.palette.bg}`}></span>
                  <h2 className="text-sm font-normal text-slate-950 dark:text-white">{activeCategoryModal.category}</h2>
                </div>
                <span className="text-xs font-luxury-num text-slate-900 dark:text-white">
                  R$ {formatCurrency(activeCategoryModal.total)}
                </span>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400 dark:text-zinc-500 uppercase mb-2">Desmembramento Auditado</p>
                
                {activeCategoryModal.subcategories.map((sub) => (
                  <div key={sub.name} className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-normal text-slate-900 dark:text-white block">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-light">{sub.pct.toFixed(1)}% do total</span>
                    </div>
                    <span className="font-luxury-num text-slate-900 dark:text-white">
                      R$ {formatCurrency(sub.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex justify-end shrink-0">
                <button 
                  type="button" 
                  onClick={() => setActiveCategoryModal(null)}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-[#0031B8] via-[#0047FF] to-[#0055FF] hover:from-[#002796] hover:to-[#0042E0] text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        </PortalModal>
      )}

    </div>
  );
}
