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
  Landmark
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';

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
  'Alimentação': { color: 'text-[#1A44C8]', hex: '#1A44C8', bg: 'bg-[#1A44C8]' },
  'Lazer & Assinaturas': { color: 'text-[#60A5FA]', hex: '#60A5FA', bg: 'bg-[#60A5FA]' },
  'Transporte': { color: 'text-indigo-600', hex: '#4F46E5', bg: 'bg-indigo-600' },
  'Moradia': { color: 'text-sky-500', hex: '#0EA5E9', bg: 'bg-sky-500' },
  'Saúde & Bem-estar': { color: 'text-rose-500', hex: '#F43F5E', bg: 'bg-rose-500' },
  'Educação': { color: 'text-amber-500', hex: '#F59E0B', bg: 'bg-amber-500' },
  'Compras Pessoais': { color: 'text-purple-600', hex: '#9333EA', bg: 'bg-purple-600' }
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

  // Dados consolidados da visão geral - inicializados com 0 para novos usuários
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

        if (dbAccounts && dbAccounts.length > 0) {
          const totalSaldo = dbAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);
          setSaldoEmContas(totalSaldo);
        } else {
          setSaldoEmContas(0);
        }

        if (dbDebts && dbDebts.length > 0) {
          const totalDebts = dbDebts.reduce((acc, d) => acc + (d.current_balance || 0), 0);
          setDividasAtivas(totalDebts);
        } else {
          setDividasAtivas(0);
        }

        if (dbInvestments && dbInvestments.length > 0) {
          const totalInvest = dbInvestments.reduce((acc, i) => acc + (i.current_value || 0), 0);
          setPatrimonio(totalInvest);

          const fixed = dbInvestments.filter(i => i.macro_type === 'FIXA').reduce((acc, i) => acc + i.current_value, 0);
          const acoes = dbInvestments.filter(i => i.category === 'ACOES').reduce((acc, i) => acc + i.current_value, 0);
          const fiis = dbInvestments.filter(i => i.category === 'FIIS').reduce((acc, i) => acc + i.current_value, 0);
          const inter = dbInvestments.filter(i => i.category === 'BDRS_STOCKS' || i.category === 'ETFS').reduce((acc, i) => acc + i.current_value, 0);
          const cripto = dbInvestments.filter(i => i.category === 'CRIPTO').reduce((acc, i) => acc + i.current_value, 0);

          setInvestmentBreakdown([
            { label: 'Renda fixa', value: fixed, color: '#1A44C8' },
            { label: 'Ações', value: acoes, color: '#60A5FA' },
            { label: 'FIIs', value: fiis, color: '#0EA5E9' },
            { label: 'Internacional', value: inter, color: '#8B5CF6' },
            { label: 'Cripto', value: cripto, color: '#F59E0B' },
          ].filter(item => item.value > 0));
        } else {
          setPatrimonio(0);
          setInvestmentBreakdown([]);
        }

        if (dbTransactions && dbTransactions.length > 0) {
          const totalExp = dbTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
          const totalInc = dbTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
          setDespesasMes(totalExp);
          setAportesMes(totalInc);
        } else {
          setDespesasMes(0);
          setAportesMes(0);
        }

        // Cartões reais
        if (dbCards && dbCards.length > 0) {
          const totalLimit = dbCards.reduce((acc, c) => acc + (c.credit_limit || 0), 0);
          setTotalLimiteCartoes(totalLimit);
          setQtdCartoes(dbCards.length);

          const totalCardExpenses = (dbCardExpenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);
          const explicitUsed = dbCards.reduce((acc, c) => acc + (c.limit_used || 0), 0);
          setLimiteComprometido(totalCardExpenses > 0 ? totalCardExpenses : explicitUsed);
        } else {
          setTotalLimiteCartoes(0);
          setLimiteComprometido(0);
          setQtdCartoes(0);
        }
      } catch (err) {
        console.error('Erro ao carregar métricas consolidadas do Supabase:', err);
      }
    }
    loadDashboardData();
  }, []);

  const investmentBreakdownTotal = investmentBreakdown.reduce((acc, item) => acc + item.value, 0);

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Dados da Evolução Anual de Gastos (zerados para novos usuários)
  const annualSpendingData = useMemo(() => {
    const months = [
      { month: 'Jan', amount: 0 },
      { month: 'Fev', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Abr', amount: 0 },
      { month: 'Mai', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Ago', amount: 0 },
      { month: 'Set', amount: 0 },
      { month: 'Out', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dez', amount: 0 },
    ];

    return months;
  }, []);

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

  // Dados de Gastos por Categoria (zerados para novos usuários)
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

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-4">
      
      {/* =========================================================================
          1. BENTO GRID KPIS (#FFFFFF & Royal Blue)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <Link href="/dashboard/investimentos" className="lg:col-span-2 bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#1A44C8]/[0.03] blur-3xl pointer-events-none rounded-full" />
          
          <div className="flex justify-between items-start mb-3 z-10">
            <div>
              <p className="text-[10px] text-[#94A3B8] font-bold mb-1 uppercase tracking-wider">Patrimônio Geral</p>
              <h3 className="text-xs text-[#64748B] font-semibold">Patrimônio Líquido Total</h3>
            </div>
            
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 text-[10px] font-bold text-[#1A44C8]">
              Consolidado
            </div>
          </div>

          <div className="z-10 mb-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#181B22] tracking-tight flex items-baseline">
              <span className="text-lg text-[#94A3B8] mr-1.5 font-bold">R$</span>
              {formatCurrency(patrimonio)}
            </h2>
          </div>

          {/* Rodapé com micro-alocação e curva */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB] z-10">
            
            {/* Tag de Alocação */}
            <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8]"></span> 74% Ativos</span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]"></span> 26% Caixa</span>
            </div>

            {/* Curva Ascendente de Acúmulo de Patrimônio */}
            <div className="w-36 h-8 relative">
              <svg viewBox="0 0 160 50" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="patrimonioGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(16,53,229,0.2)" />
                    <stop offset="100%" stopColor="rgba(16,53,229,0.0)" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,45 Q30,42 60,32 T120,18 T160,6 L160,50 L0,50 Z" 
                  fill="url(#patrimonioGlow)" 
                />
                <path 
                  d="M0,45 Q30,42 60,32 T120,18 T160,6" 
                  fill="none" 
                  stroke="#1A44C8" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
                <circle cx="160" cy="6" r="3.5" fill="#1A44C8" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>

          </div>
        </Link>

        {/* Card 2: Ganho de Capital */}
        <Link href="/dashboard/investimentos" className="bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Investimentos</p>
              <span className="text-[9px] font-bold text-[#1A44C8] bg-[#1A44C8]/10 border border-[#1A44C8]/20 px-2 py-0.5 rounded-full">
                Ativos
              </span>
            </div>
            
            <h3 className="text-xs text-[#64748B] font-semibold mt-1">Ganho de Capital</h3>
            
            <h2 className="text-2xl font-bold text-[#181B22] mt-1 mb-1 flex items-baseline">
              <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
              {formatCurrency(ganhoCapital)}
            </h2>
            
            <p className="text-[10px] text-[#64748B]">Rendimentos e dividendos</p>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="w-full h-8 pt-2">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,22 L15,18 L35,12 L55,16 L75,5 L100,7" fill="none" stroke="#1A44C8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>

        {/* Card 3: Aportes Semanais */}
        <Link href="/dashboard/transacoes" className="bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#60A5FA]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Últimos 7 dias</p>
              <span className="text-[9px] font-bold text-[#0284C7] bg-[#0284C7]/10 border border-[#0284C7]/20 px-2 py-0.5 rounded-full">
                Fluxo
              </span>
            </div>
            
            <h3 className="text-xs text-[#64748B] font-semibold mt-1">Aportes Recentes</h3>
            
            <h2 className="text-2xl font-bold text-[#181B22] mt-1 mb-1 flex items-baseline">
              <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
              {formatCurrency(aportesMes)}
            </h2>
            
            <p className="text-[10px] text-[#64748B]">Fluxo acumulado no ciclo</p>
          </div>

          {/* Micro-Barras dos Dias da Semana */}
          <div className="flex items-end justify-between h-7 w-full px-1 pt-1">
            {[3, 5, 4, 8, 10, 6, 7].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-1.5 rounded-full ${i === 4 ? 'bg-[#1A44C8] shadow-[0_0_8px_rgba(16,53,229,0.5)]' : 'bg-[#E2E8F0]'}`} style={{ height: `${h * 2.2}px` }}></div>
                <span className="text-[7.5px] text-[#94A3B8] font-medium">{['S','T','Q','Q','S','S','D'][i]}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Card 4: Total de Despesas */}
        <Link href="/dashboard/transacoes" className="bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Despesas</p>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                Mensal
              </span>
            </div>
            
            <h3 className="text-xs text-[#64748B] font-semibold mt-1">Total Despesas</h3>
            
            <h2 className="text-2xl font-bold text-[#181B22] mt-1 mb-1 flex items-baseline">
              <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
              {formatCurrency(despesasMes)}
            </h2>
            
            <p className="text-[10px] text-[#64748B]">Total mensal controlado</p>
          </div>

          <div className="relative pt-2">
            <div className="w-full h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden flex">
              <div className="h-full bg-rose-500 w-[45%] rounded-full relative z-10 shadow-sm"></div>
              <div className="h-full bg-rose-500/20 w-[15%]"></div>
            </div>
            <div className="flex justify-between text-[7.5px] text-[#94A3B8] mt-1">
              <span>Sáb</span><span>Dom</span><span>Seg</span><span className="text-rose-500 font-bold">Ter</span><span>Qua</span><span>Qui</span><span>Sex</span>
            </div>
          </div>
        </Link>

        {/* Card 5: Controle de Cartões Real */}
        {(() => {
          const pctComprometido = totalLimiteCartoes > 0 ? (limiteComprometido / totalLimiteCartoes) * 100 : 0;
          return (
            <Link href="/dashboard/cartoes" className="bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Cartões</p>
                  {qtdCartoes > 0 ? (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20">
                      {qtdCartoes} {qtdCartoes === 1 ? 'cartão' : 'cartões'}
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                      Sem cartões
                    </span>
                  )}
                </div>
                
                <h3 className="text-xs text-[#64748B] font-semibold mt-1">Limite Comprometido</h3>
                
                <h2 className="text-2xl font-bold text-[#181B22] mt-1 mb-0.5 flex items-baseline">
                  <span className="text-2xl font-bold text-[#1A44C8] mr-1.5">{pctComprometido.toFixed(0)}%</span>
                  <span className="text-xs text-[#94A3B8]">(R$ {formatCurrency(limiteComprometido)})</span>
                </h2>
                
                <p className="text-[9.5px] text-[#64748B] flex items-center gap-1 mt-1 font-medium truncate">
                  {totalLimiteCartoes > 0 ? (
                    <span>R$ {formatCurrency(Math.max(0, totalLimiteCartoes - limiteComprometido))} disponível de R$ {formatCurrency(totalLimiteCartoes)}</span>
                  ) : (
                    <span>Cadastre cartões em Minhas Faturas</span>
                  )}
                </p>
              </div>

              <div className="w-full pt-2">
                <div className="w-full h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-[#1A44C8] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pctComprometido)}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Card 6: Balanço Mensal Líquido (Substitui Taxa de Poupança Líquida) */}
        {(() => {
          const saldoMes = aportesMes - despesasMes;
          const isPositivo = saldoMes >= 0;
          const taxaSobra = aportesMes > 0 ? (saldoMes / aportesMes) * 100 : 0;

          return (
            <Link href="/dashboard/transacoes" className="lg:col-span-2 bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                    isPositivo 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {isPositivo ? 'Superávit no Mês' : 'Déficit no Mês'}
                  </span>
                  {aportesMes > 0 && (
                    <span className="text-[9px] text-[#64748B] font-medium hidden sm:inline">
                      ({taxaSobra.toFixed(0)}% da receita livre)
                    </span>
                  )}
                </div>
                <h3 className="text-xs text-[#64748B] font-semibold mt-1">Balanço Mensal Líquido</h3>
                
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold ${isPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositivo ? '+' : ''}R$ {formatCurrency(saldoMes)}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1 truncate">
                  Receitas R$ {formatCurrency(aportesMes)} − Despesas R$ {formatCurrency(despesasMes)}
                </p>
              </div>

              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                  isPositivo ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {isPositivo ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
              </div>
            </Link>
          );
        })()}

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-3.5">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness size={14} className="text-[#1A44C8]" />
              <h3 className="text-xs font-bold text-[#181B22]">Patrimônio Líquido Total</h3>
            </div>
            <Link href="/dashboard/investimentos" className="text-[10px] font-bold text-[#1A44C8]">
              Ver ativos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-end justify-between gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] p-3">
              <div>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Consolidado</p>
                <h4 className="text-2xl font-extrabold text-[#181B22] mt-1">R$ {formatCurrency(patrimonioLiquidoTotal)}</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20">
                Patrimônio
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="text-[#64748B]">Investimentos</p>
                <p className="mt-1 font-bold text-[#181B22]">R$ {formatCurrency(patrimonio)}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="text-[#64748B]">Saldo em contas</p>
                <p className="mt-1 font-bold text-[#181B22]">R$ {formatCurrency(saldoEmContas)}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="text-[#64748B]">Dívidas</p>
                <p className="mt-1 font-bold text-rose-600">R$ {formatCurrency(dividasAtivas)}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="text-[#64748B]">Patrimônio líquido</p>
                <p className="mt-1 font-bold text-[#1A44C8]">R$ {formatCurrency(patrimonioLiquidoTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#1A44C8]" />
              <h3 className="text-xs font-bold text-[#181B22]">Resumo de investimentos</h3>
            </div>
            <Link href="/dashboard/investimentos" className="text-[10px] font-bold text-[#1A44C8]">
              Detalhar
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {investmentBreakdown.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                Nenhum investimento registrado.
                <Link href="/dashboard/investimentos" className="block mt-1 text-[#1A44C8] font-bold hover:underline">
                  + Cadastrar primeiro ativo
                </Link>
              </div>
            ) : (
              investmentBreakdown.map((segment) => {
                const segmentPct = investmentBreakdownTotal > 0 ? (segment.value / investmentBreakdownTotal) * 100 : 0;
                return (
                  <div key={segment.label}>
                    <div className="flex justify-between items-center text-[10px] text-[#64748B] mb-1">
                      <span>{segment.label}</span>
                      <span className="font-bold text-[#181B22]">{segmentPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${segmentPct}%`, background: segment.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <PieChart size={14} className="text-[#1A44C8]" />
              <h3 className="text-xs font-bold text-[#181B22]">Maiores gastos por categoria</h3>
            </div>
            <Link href="/dashboard/transacoes" className="text-[10px] font-bold text-[#1A44C8]">
              Registrar gastos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {categoryData.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                Nenhum gasto registrado neste período.
                <Link href="/dashboard/transacoes" className="block mt-1 text-[#1A44C8] font-bold hover:underline">
                  + Registrar primeira despesa
                </Link>
              </div>
            ) : (
              categoryData.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center text-[10px] text-[#64748B] mb-1">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.palette.bg}`} />
                      {cat.category}
                    </span>
                    <span className="font-bold text-[#181B22]">R$ {formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.palette.bg}`} style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Landmark size={14} className="text-[#1A44C8]" />
              <h3 className="text-xs font-bold text-[#181B22]">Aportes recentes e evolução</h3>
            </div>
            <Link href="/dashboard/investimentos" className="text-[10px] font-bold text-[#1A44C8]">
              Ver aportes
            </Link>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Últimos 7 dias</p>
                <h4 className="text-2xl font-extrabold text-[#181B22]">R$ {formatCurrency(aportesMes)}</h4>
              </div>
              <span className="text-[10px] font-bold text-[#1A44C8] bg-[#1A44C8]/10 border border-[#1A44C8]/20 px-2 py-1 rounded-full">+12.4%</span>
            </div>

            <svg viewBox="0 0 300 120" className="w-full h-28">
              <defs>
                <linearGradient id="recentContributionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(26,68,200,0.25)" />
                  <stop offset="100%" stopColor="rgba(26,68,200,0.02)" />
                </linearGradient>
              </defs>
              <path d="M0,84 C30,76 58,62 92,70 S170,50 210,32 S268,18 300,20 L300,120 L0,120 Z" fill="url(#recentContributionGrad)" />
              <path d="M0,84 C30,76 58,62 92,70 S170,50 210,32 S268,18 300,20" fill="none" stroke="#1A44C8" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SEÇÃO MACRO: EVOLUÇÃO ANUAL DE GASTOS + GASTO POR CATEGORIA
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
        
        {/* Gráfico 1: Evolução Anual de Gastos (3 Colunas) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm lg:col-span-3 flex flex-col justify-between">
          
          {/* Header com os Controles Integrados */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
            <div>
              <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                <Activity size={14} className="text-[#1A44C8]" />
                Evolução Anual de Gastos
              </h3>
              <p className="text-[10px] text-[#64748B]">Histórico de despesas e variação percentual mês a mês</p>
            </div>

            {/* Controles de Ano e Exportação Integrados */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-[11px] text-[#181B22] shadow-sm">
                <Calendar size={12} className="text-[#1A44C8]" />
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-[#181B22] font-semibold focus:outline-none cursor-pointer text-[11px]"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <button className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[11px] font-medium text-[#181B22] hover:bg-[#EAEAEA] transition-all shadow-sm">
                <Download size={11} className="text-[#64748B]" />
                Exportar
              </button>
            </div>
          </div>

          {/* SVG Line & Area Chart */}
          <div className="w-full relative pt-4">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="overviewGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16,53,229,0.18)" />
                  <stop offset="60%" stopColor="rgba(0,163,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="overviewStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1A44C8" />
                  <stop offset="60%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>

              {/* Grid Lines Horizontais */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = svgHeight - paddingY - (ratio * (svgHeight - (paddingY * 2)));
                return (
                  <line 
                    key={i} 
                    x1={paddingX} 
                    y1={y} 
                    x2={svgWidth - paddingX} 
                    y2={y} 
                    stroke="#E5E7EB" 
                    strokeDasharray="4 4" 
                  />
                );
              })}

              {/* Área Preenchida */}
              <path d={areaD} fill="url(#overviewGrad)" />

              {/* Linha Principal da Curva */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="url(#overviewStroke)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Pontos Interativos com Labels de Variação */}
              {points.map((pt, idx) => {
                const isCurrent = idx === 6; // Julho
                return (
                  <g key={pt.month} className="group cursor-pointer">
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isCurrent ? 5.5 : 4} 
                      fill={isCurrent ? '#1A44C8' : '#FFFFFF'} 
                      stroke="#1A44C8" 
                      strokeWidth={isCurrent ? 2 : 1.5}
                      className="transition-all duration-200 group-hover:r-6 shadow-sm" 
                    />
                    
                    {/* Tooltip Hover no Ponto */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect 
                        x={pt.x - 45} 
                        y={pt.y - 32} 
                        width="90" 
                        height="24" 
                        rx="6" 
                        fill="#181B22" 
                        stroke="#E5E7EB" 
                        className="shadow-lg"
                      />
                      <text 
                        x={pt.x} 
                        y={pt.y - 17} 
                        textAnchor="middle" 
                        fill="#FFFFFF" 
                        fontSize="9.5" 
                        fontWeight="bold"
                      >
                        R$ {formatCurrency(pt.amount)}
                      </text>
                    </g>

                    {/* Mês no Eixo X */}
                    <text 
                      x={pt.x} 
                      y={svgHeight - 8} 
                      textAnchor="middle" 
                      fill={isCurrent ? '#1A44C8' : '#64748B'} 
                      fontSize="9.5" 
                      fontWeight={isCurrent ? 'bold' : 'normal'}
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria (2 Colunas) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5 mt-1">
                  <PieChart size={14} className="text-[#1A44C8]" />
                  Despesas por Categoria
                </h3>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium">Total: R$ {formatCurrency(totalDespesasGerais)}</span>
            </div>

            {/* Lista de Categorias com Barra de Progresso e Clique p/ Detalhamento */}
            <div className="space-y-2.5 mt-4">
              {categoryData.map((cat) => (
                <div 
                  key={cat.category}
                  onClick={() => setActiveCategoryModal(cat)}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#1A44C8]/40 hover:bg-[#F1F3F7] cursor-pointer transition-all group shadow-sm"
                >
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.palette.bg}`}></span>
                      <span className="font-semibold text-[#181B22] group-hover:text-[#1A44C8] transition-colors">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#181B22] font-bold">R$ {formatCurrency(cat.total)}</span>
                      <span className="text-[10px] text-[#64748B]">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${cat.palette.bg}`} 
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] text-center">
            <span className="text-[10px] text-[#94A3B8]">Clique em qualquer categoria para ver as subcategorias</span>
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL DE SUBCATEGORIAS
      ========================================================================= */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeCategoryModal.palette.bg}`}></span>
                <h2 className="text-sm font-bold text-[#181B22]">{activeCategoryModal.category}</h2>
              </div>
              <span className="text-[11px] text-[#1A44C8] font-bold">
                R$ {formatCurrency(activeCategoryModal.total)}
              </span>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider mb-2 font-semibold">Desmembramento por Item</p>
              
              {activeCategoryModal.subcategories.map((sub) => (
                <div key={sub.name} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#181B22] block">{sub.name}</span>
                    <span className="text-[10px] text-[#64748B]">{sub.pct.toFixed(1)}% do total da categoria</span>
                  </div>
                  <span className="font-bold text-[#1A44C8] text-sm">
                    R$ {formatCurrency(sub.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setActiveCategoryModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1A44C8] hover:bg-[#1538A5] text-white shadow-md transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
