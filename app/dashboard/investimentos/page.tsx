'use client';

import { useState, useMemo, useEffect } from 'react';
import { investmentsService } from '@/lib/services/investments';
import { 
  TrendingUp, 
  Plus, 
  Briefcase, 
  Activity, 
  X, 
  Search, 
  PieChart, 
  Sparkles, 
  Trash2, 
  PiggyBank, 
  Landmark, 
  Building2, 
  Shield, 
  Layers, 
  ArrowUpRight,
  DollarSign,
  Coins,
  Pencil,
  BarChart3,
  ListFilter,
  LayoutGrid
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';

// Banco de dados de ativos da Bolsa de Valores (B3, FIIs, BDRs, ETFs e Cripto)
const ASSET_DATABASE: Record<string, string[]> = {
  'Ações': [
    'PETR4 - Petrobras PN', 'PETR3 - Petrobras ON', 'VALE3 - Vale ON', 'ITUB4 - Itaú Unibanco PN', 'ITUB3 - Itaú Unibanco ON',
    'BBDC4 - Bradesco PN', 'BBDC3 - Bradesco ON', 'BBAS3 - Banco do Brasil ON', 'SANB11 - Banco Santander Unit', 'BPAC11 - BTG Pactual Unit',
    'ITSA4 - Itaúsa PN', 'ITSA3 - Itaúsa ON', 'B3SA3 - B3 Brasil Bolsa Balcão', 'BBSE3 - BB Seguridade ON', 'CXSE3 - Caixa Seguridade ON', 'PSSA3 - Porto Seguro ON',
    'TAEE11 - Taesa Unit', 'TAEE4 - Taesa PN', 'TAEE3 - Taesa ON', 'EGIE3 - Engie Brasil ON', 'ELET3 - Eletrobras ON', 'ELET6 - Eletrobras PNB',
    'CPFE3 - CPFL Energia ON', 'CMIG4 - Cemig PN', 'CMIG3 - Cemig ON', 'CPLE6 - Copel PNB', 'CPLE3 - Copel ON', 'EQTL3 - Equatorial ON',
    'TRPL4 - Isa Cteep PN', 'TRPL3 - Isa Cteep ON', 'NEOE3 - Neoenergia ON', 'SBSP3 - Sabesp ON', 'SAPR11 - Sanepar Unit', 'SAPR4 - Sanepar PN', 'CSMG3 - Copasa ON',
    'WEGE3 - WEG ON', 'ABEV3 - Ambev ON', 'RENT3 - Localiza ON', 'SUZB3 - Suzano ON', 'KLBN11 - Klabin Unit', 'KLBN4 - Klabin PN',
    'GGBR4 - Gerdau PN', 'GOAU4 - Metalúrgica Gerdau PN', 'CSNA3 - CSN ON', 'USIM5 - Usiminas PNA', 'CMIN3 - CSN Mineração ON',
    'PRIO3 - Prio ON', 'RECV3 - PetroReconcavo ON', 'BRAV3 - Brava Energia ON', 'CSAN3 - Cosan ON', 'UGPA3 - Ultrapar ON', 'VBBR3 - Vibra Energia ON',
    'RAIL3 - Rumo ON', 'CCRO3 - CCR ON', 'STBP3 - Santos Brasil ON', 'EMBR3 - Embraer ON', 'AZUL4 - Azul PN', 'GOLL4 - Gol PN', 'CVCB3 - CVC Brasil ON',
    'MGLU3 - Magazine Luiza ON', 'BHIA3 - Casas Bahia ON', 'LREN3 - Lojas Renner ON', 'AZZA3 - Azzas 2154 ON', 'ALOS3 - Allos ON', 'MULT3 - Multiplan ON', 'IGTI11 - Iguatemi Unit',
    'RADL3 - Raia Drogasil ON', 'HYPE3 - Hypera ON', 'FLRY3 - Fleury ON', 'RDOR3 - Rede D\'Or ON', 'HAPV3 - Hapvida ON',
    'ASAI3 - Assaí ON', 'CRFB3 - Carrefour Brasil ON', 'JBSS3 - JBS ON', 'BRFS3 - BRF ON', 'MRFG3 - Marfrig ON', 'BEEF3 - Minerva ON', 'MDIA3 - M. Dias Branco ON',
    'SMTO3 - São Martinho ON', 'SLCE3 - SLC Agrícola ON', 'CYRE3 - Cyrela ON', 'EZTC3 - Eztec ON', 'MRVE3 - MRV ON', 'DIRR3 - Direcional ON', 'CURY3 - Cury ON',
    'TOTS3 - Totvs ON', 'LWSA3 - Locaweb ON', 'INTB3 - Intelbras ON', 'POSI3 - Positivo ON', 'COGN3 - Cogna ON', 'YDUQ3 - Yduqs ON'
  ],
  'FIIs': [
    'MXRF11 - Maxi Renda', 'HGLG11 - CSHG Logística', 'XPML11 - XP Malls', 'BTLG11 - BTG Logística', 'VISC11 - Vinci Shopping', 
    'KNRI11 - Kinea Renda', 'IRDM11 - Iridium Recebíveis', 'CPTS11 - Capitânia Securities', 'VILG11 - Vinci Logística', 'HGRU11 - CSHG Renda Urbana',
    'XPLG11 - XP Log', 'BCFF11 - BTG Fundo de Fundos', 'KNHY11 - Kinea High Yield', 'RBRR11 - RBR Rendimento', 'TGAR11 - TG Ativo Real',
    'VGIR11 - Valora RE III', 'VGIP11 - Valora CRI', 'HGCR11 - CSHG Recebíveis', 'RECR11 - REC Recebíveis', 'DEVA11 - Devant Recebíveis',
    'VINO11 - Vinci Offices', 'BRCR11 - BC Fund', 'PVBI11 - VBI Prime Properties', 'JSRE11 - JS Real Estate', 'GALG11 - Guardian Logística',
    'KNSC11 - Kinea Securities', 'TRXF11 - TRX Real Estate', 'ALZR11 - Alianza Trust', 'GGRC11 - GGR COVEPI', 'HFOF11 - Hedge Top FOFII',
    'RBRF11 - RBR Alpha', 'URPR11 - Urca Prime', 'KNCA11 - Kinea Crédito Agro', 'VGIA11 - Valora CRA', 'RURA11 - Itaú Asset Rural', 'RZTR11 - Riza Terrax'
  ],
  'BDRs': [
    'AAPL34 - Apple Inc', 'MSFT34 - Microsoft Corp', 'GOGL34 - Alphabet Inc (Google)', 'AMZO34 - Amazon.com Inc', 'TSLA34 - Tesla Inc',
    'NVDC34 - NVIDIA Corp', 'META34 - Meta Platforms (Facebook)', 'NFLX34 - Netflix Inc', 'DISB34 - The Walt Disney Co', 'COCA34 - Coca-Cola Co',
    'WALM34 - Walmart Inc', 'BERK34 - Berkshire Hathaway', 'JNJB34 - Johnson & Johnson', 'PGCO34 - Procter & Gamble', 'VISA34 - Visa Inc',
    'MSCD34 - Mastercard Inc', 'MELI34 - MercadoLibre Inc', 'ROXO34 - Nu Holdings (Nubank)', 'INTC34 - Intel Corp', 'A1MD34 - AMD Advanced Micro Devices'
  ],
  'ETFs': [
    'BOVA11 - iShares Ibovespa ETF', 'IVVB11 - iShares S&P 500 ETF', 'SMAL11 - iShares Small Cap ETF', 'HASH11 - Hashdex Nasdaq Crypto',
    'QBTC11 - QR CME CF Bitcoin ETF', 'QETH11 - QR CME CF Ether ETF', 'GOLD11 - Trend ETF LBMA Ouro', 'XINA11 - Trend ETF MSCI China',
    'NASD11 - Trend ETF Nasdaq 100', 'SPXI11 - It Now S&P 500', 'WRLD11 - Investo MSCI World', 'DIVO11 - It Now IDIV Dividendos', 'NDIV11 - Nubank Ibov Smart Dividendos'
  ],
  'Criptomoedas': [
    'BTC - Bitcoin', 'ETH - Ethereum', 'SOL - Solana', 'USDT - Tether USD', 'BNB - Binance Coin', 'XRP - Ripple',
    'ADA - Cardano', 'AVAX - Avalanche', 'LINK - Chainlink', 'DOGE - Dogecoin', 'POL - Polygon Ecosystem', 'DOT - Polkadot', 'NEAR - Near Protocol'
  ],
  'Stocks': [
    'AAPL - Apple Inc', 'MSFT - Microsoft Corporation', 'GOOGL - Alphabet Inc', 'AMZN - Amazon.com Inc', 'TSLA - Tesla Inc',
    'NVDA - NVIDIA Corporation', 'META - Meta Platforms Inc', 'NFLX - Netflix Inc', 'DIS - The Walt Disney Company', 'KO - The Coca-Cola Company',
    'WMT - Walmart Inc', 'BRK.B - Berkshire Hathaway Class B', 'V - Visa Inc', 'MA - Mastercard Inc', 'MELI - MercadoLibre Inc', 'NU - Nu Holdings Ltd'
  ]
};

export type AssetCategory = 
  | 'CAIXINHA_PORQUINHO' 
  | 'TESOURO_DIRETO' 
  | 'CDB_LCI_LCA' 
  | 'ACOES' 
  | 'FIIS' 
  | 'BDRS_STOCKS' 
  | 'CRIPTO' 
  | 'ETFS';

export interface InvestmentItem {
  id: string;
  macroType: 'FIXA' | 'VARIAVEL';
  category: AssetCategory;
  name: string;
  ticker?: string;
  institution: string;
  rateOrYield?: string;
  liquidity?: 'DIARIA' | 'D+1' | 'VENCIMENTO';
  dueDate?: string;
  quantity?: number;
  averagePrice?: number;
  currentPrice?: number;
  totalInvested: number;
  currentBalance: number;
  monthlyEstimatedYield?: number;
  totalDividendsReceived?: number;
  isFgcProtected?: boolean;
  createdAt?: string;
}

const INITIAL_INVESTMENTS: InvestmentItem[] = [
  // ==================== RENDA FIXA ====================
  {
    id: 'rf-1',
    macroType: 'FIXA',
    category: 'CAIXINHA_PORQUINHO',
    name: 'Caixinha Reserva de Emergência',
    institution: 'Nubank',
    rateOrYield: '100% do CDI',
    liquidity: 'DIARIA',
    dueDate: 'Liquidez Imediata (D+0)',
    totalInvested: 20000.00,
    currentBalance: 21450.00,
    monthlyEstimatedYield: 185.00,
    totalDividendsReceived: 1450.00,
    isFgcProtected: true
  },
  {
    id: 'rf-2',
    macroType: 'FIXA',
    category: 'CAIXINHA_PORQUINHO',
    name: 'Porquinho Reserva de Viagem',
    institution: 'Banco Inter',
    rateOrYield: '102% do CDI',
    liquidity: 'DIARIA',
    dueDate: 'Liquidez Imediata (D+0)',
    totalInvested: 6000.00,
    currentBalance: 6380.00,
    monthlyEstimatedYield: 55.00,
    totalDividendsReceived: 380.00,
    isFgcProtected: true
  },
  {
    id: 'rf-3',
    macroType: 'FIXA',
    category: 'TESOURO_DIRETO',
    name: 'Tesouro IPCA+ 2035',
    institution: 'Tesouro Direto',
    rateOrYield: 'IPCA + 6.35% a.a.',
    liquidity: 'VENCIMENTO',
    dueDate: '15/05/2035',
    totalInvested: 15000.00,
    currentBalance: 16820.00,
    monthlyEstimatedYield: 145.00,
    totalDividendsReceived: 0.00,
    isFgcProtected: false
  },
  {
    id: 'rf-4',
    macroType: 'FIXA',
    category: 'CDB_LCI_LCA',
    name: 'CDB Pós-Fixado 110% CDI',
    institution: 'C6 Bank',
    rateOrYield: '110% do CDI',
    liquidity: 'VENCIMENTO',
    dueDate: '20/12/2026',
    totalInvested: 10000.00,
    currentBalance: 11150.00,
    monthlyEstimatedYield: 98.00,
    totalDividendsReceived: 1150.00,
    isFgcProtected: true
  },
  {
    id: 'rf-5',
    macroType: 'FIXA',
    category: 'CDB_LCI_LCA',
    name: 'LCI Imobiliária 94% CDI Isenta',
    institution: 'Caixa Econômica',
    rateOrYield: '94% CDI (Isento)',
    liquidity: 'VENCIMENTO',
    dueDate: '10/08/2027',
    totalInvested: 8000.00,
    currentBalance: 8740.00,
    monthlyEstimatedYield: 72.00,
    totalDividendsReceived: 740.00,
    isFgcProtected: true
  },

  // ==================== RENDA VARIÁVEL ====================
  {
    id: 'rv-1',
    macroType: 'VARIAVEL',
    category: 'ACOES',
    name: 'Petrobras PN',
    ticker: 'PETR4',
    institution: 'XP Investimentos',
    rateOrYield: 'DY 14.5% a.a.',
    quantity: 250,
    averagePrice: 32.50,
    currentPrice: 38.40,
    totalInvested: 8125.00,
    currentBalance: 9600.00,
    monthlyEstimatedYield: 115.00,
    totalDividendsReceived: 1180.00
  },
  {
    id: 'rv-2',
    macroType: 'VARIAVEL',
    category: 'ACOES',
    name: 'Banco do Brasil ON',
    ticker: 'BBAS3',
    institution: 'BTG Pactual',
    rateOrYield: 'DY 9.8% a.a.',
    quantity: 300,
    averagePrice: 24.20,
    currentPrice: 27.80,
    totalInvested: 7260.00,
    currentBalance: 8340.00,
    monthlyEstimatedYield: 68.00,
    totalDividendsReceived: 710.00
  },
  {
    id: 'rv-3a',
    macroType: 'VARIAVEL',
    category: 'FIIS',
    name: 'Maxi Renda FII',
    ticker: 'MXRF11',
    institution: 'XP Investimentos',
    rateOrYield: 'DY 12.2% a.a.',
    quantity: 700,
    averagePrice: 10.00,
    currentPrice: 10.45,
    totalInvested: 7000.00,
    currentBalance: 7315.00,
    monthlyEstimatedYield: 77.00,
    totalDividendsReceived: 756.00
  },
  {
    id: 'rv-3b',
    macroType: 'VARIAVEL',
    category: 'FIIS',
    name: 'Maxi Renda FII',
    ticker: 'MXRF11',
    institution: 'Nubank',
    rateOrYield: 'DY 12.2% a.a.',
    quantity: 500,
    averagePrice: 10.24,
    currentPrice: 10.45,
    totalInvested: 5120.00,
    currentBalance: 5225.00,
    monthlyEstimatedYield: 55.00,
    totalDividendsReceived: 540.00
  },
  {
    id: 'rv-4',
    macroType: 'VARIAVEL',
    category: 'FIIS',
    name: 'CSHG Logística FII',
    ticker: 'HGLG11',
    institution: 'Itaú Corretora',
    rateOrYield: 'DY 8.9% a.a.',
    quantity: 60,
    averagePrice: 158.00,
    currentPrice: 164.50,
    totalInvested: 9480.00,
    currentBalance: 9870.00,
    monthlyEstimatedYield: 73.00,
    totalDividendsReceived: 657.00
  },
  {
    id: 'rv-5',
    macroType: 'VARIAVEL',
    category: 'BDRS_STOCKS',
    name: 'Apple Inc BDR',
    ticker: 'AAPL34',
    institution: 'XP Investimentos',
    rateOrYield: 'Global Tech',
    quantity: 70,
    averagePrice: 48.00,
    currentPrice: 59.20,
    totalInvested: 3360.00,
    currentBalance: 4144.00,
    monthlyEstimatedYield: 12.00,
    totalDividendsReceived: 95.00
  },
  {
    id: 'rv-6',
    macroType: 'VARIAVEL',
    category: 'CRIPTO',
    name: 'Bitcoin',
    ticker: 'BTC',
    institution: 'Mercado Bitcoin',
    rateOrYield: 'Reserva Digital',
    quantity: 0.035,
    averagePrice: 290000.00,
    currentPrice: 345000.00,
    totalInvested: 10150.00,
    currentBalance: 12075.00,
    monthlyEstimatedYield: 0.00,
    totalDividendsReceived: 0.00
  }
];

export default function InvestimentosPage() {
  const { isConcealed } = usePrivacy();
  // Lista de Investimentos (inicia vazio para novos usuários)
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [viewMode, setViewMode] = useState<'CONSOLIDADO' | 'LANCAMENTOS'>('CONSOLIDADO');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [consolidatedFilter, setConsolidatedFilter] = useState<'ALL' | 'FIIS' | 'ACOES' | 'FIXA' | 'BDRS' | 'CRIPTO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dbInvestments = await investmentsService.fetchInvestments();
        if (dbInvestments && dbInvestments.length > 0) {
          setInvestments(dbInvestments.map(inv => ({
            id: inv.id,
            macroType: inv.macro_type,
            category: inv.category as AssetCategory,
            name: inv.name,
            ticker: inv.ticker,
            institution: inv.institution,
            rateOrYield: inv.rate_or_yield,
            liquidity: (inv.liquidity as 'DIARIA' | 'D+1' | 'VENCIMENTO') || 'DIARIA',
            dueDate: inv.due_date,
            quantity: inv.quantity,
            averagePrice: inv.average_price,
            currentPrice: inv.average_price,
            totalInvested: inv.invested_amount,
            currentBalance: inv.current_value,
            monthlyEstimatedYield: inv.macro_type === 'FIXA' ? inv.current_value * 0.0092 : (inv.category === 'FIIS' ? inv.current_value * 0.0085 : inv.current_value * 0.006),
            totalDividendsReceived: 0,
            isFgcProtected: inv.category !== 'TESOURO_DIRETO',
            createdAt: inv.created_at || new Date().toISOString()
          })));
        } else {
          setInvestments([]);
        }
      } catch (e) {
        console.error('Erro ao carregar investimentos do Supabase:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Hover states para os gráficos Donut
  const [hoveredMacroIndex, setHoveredMacroIndex] = useState<number | null>(null);
  const [hoveredClassIndex, setHoveredClassIndex] = useState<number | null>(null);
  const [hoveredConsolidatedIdx, setHoveredConsolidatedIdx] = useState<number | null>(null);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'FIXA' | 'VARIAVEL'>('FIXA');
  const [editingInvestment, setEditingInvestment] = useState<InvestmentItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<InvestmentItem | null>(null);

  // States Modal Renda Fixa
  const [rfCategory, setRfCategory] = useState<AssetCategory>('CAIXINHA_PORQUINHO');
  const [rfName, setRfName] = useState('');
  const [rfInstitution, setRfInstitution] = useState('Nubank');
  const [rfRate, setRfRate] = useState('100% do CDI');
  const [rfLiquidity, setRfLiquidity] = useState<'DIARIA' | 'D+1' | 'VENCIMENTO'>('DIARIA');
  const [rfDueDate, setRfDueDate] = useState('');
  const [rfAmount, setRfAmount] = useState('');

  // States Modal Renda Variável
  const [rvCategory, setRvCategory] = useState<'Ações' | 'FIIs' | 'BDRs' | 'ETFs' | 'Criptomoedas' | 'Stocks'>('Ações');
  const [rvSearchTicker, setRvSearchTicker] = useState('');
  const [rvInstitution, setRvInstitution] = useState('XP Investimentos');
  const [rvQuantity, setRvQuantity] = useState('');
  const [rvPrice, setRvPrice] = useState('');
  const [rvYieldRate, setRvYieldRate] = useState('');

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cálculos Globais
  const totalInvestedGlobal = useMemo(() => investments.reduce((acc, i) => acc + i.totalInvested, 0), [investments]);
  const currentBalanceGlobal = useMemo(() => investments.reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  
  // Lucro por Ganho de Capital & Lucro por Dividendos Recebidos
  const capitalGainTotal = currentBalanceGlobal - totalInvestedGlobal;
  const dividendsReceivedTotal = useMemo(() => investments.reduce((acc, i) => acc + (i.totalDividendsReceived || 0), 0), [investments]);
  const totalProfitConsolidated = capitalGainTotal + dividendsReceivedTotal;
  const profitPctTotal = totalInvestedGlobal > 0 ? (totalProfitConsolidated / totalInvestedGlobal) * 100 : 0;

  // Subtotais por Macro e Classe
  const totalFixed = useMemo(() => investments.filter(i => i.macroType === 'FIXA').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  const totalVariable = useMemo(() => investments.filter(i => i.macroType === 'VARIAVEL').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  
  const totalAcoes = useMemo(() => investments.filter(i => i.category === 'ACOES').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  const totalFIIs = useMemo(() => investments.filter(i => i.category === 'FIIS').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  const totalBDRs = useMemo(() => investments.filter(i => i.category === 'BDRS_STOCKS' || i.category === 'ETFS').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);
  const totalCripto = useMemo(() => investments.filter(i => i.category === 'CRIPTO').reduce((acc, i) => acc + i.currentBalance, 0), [investments]);

  const pctFixed = currentBalanceGlobal > 0 ? (totalFixed / currentBalanceGlobal) * 100 : 0;
  const pctVariable = currentBalanceGlobal > 0 ? (totalVariable / currentBalanceGlobal) * 100 : 0;
  const pctAcoes = currentBalanceGlobal > 0 ? (totalAcoes / currentBalanceGlobal) * 100 : 0;
  const pctFIIs = currentBalanceGlobal > 0 ? (totalFIIs / currentBalanceGlobal) * 100 : 0;
  const pctBDRs = currentBalanceGlobal > 0 ? (totalBDRs / currentBalanceGlobal) * 100 : 0;
  const pctCripto = currentBalanceGlobal > 0 ? (totalCripto / currentBalanceGlobal) * 100 : 0;

  // Segmentos Macro (Renda Fixa vs Renda Variável)
  const macroSegments = useMemo(() => [
    { label: 'Renda Fixa', value: totalFixed, pct: pctFixed, color: '#3B6CF0' },
    { label: 'Renda Variável', value: totalVariable, pct: pctVariable, color: '#38BDF8' }
  ], [totalFixed, totalVariable, pctFixed, pctVariable]);

  // Segmentos por Classe de Ativos
  const classSegments = useMemo(() => [
    { label: 'Renda Fixa', value: totalFixed, pct: pctFixed, color: '#3B6CF0' },
    { label: 'FIIs', value: totalFIIs, pct: pctFIIs, color: '#14B8A6' },
    { label: 'Ações B3', value: totalAcoes, pct: pctAcoes, color: '#38BDF8' },
    { label: 'Internacional / BDRs', value: totalBDRs, pct: pctBDRs, color: '#818CF8' },
    { label: 'Criptomoedas', value: totalCripto, pct: pctCripto, color: '#F59E0B' }
  ], [totalFixed, totalFIIs, totalAcoes, totalBDRs, totalCripto, pctFixed, pctFIIs, pctAcoes, pctBDRs, pctCripto]);

  // Histórico de Aportes com cálculo dinâmico real dos 12 últimos meses baseado nos lançamentos do usuário
  const historyAportes = useMemo(() => {
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result: { month: string; monthKey: string; aportes: number; total: number; h: string }[] = [];

    // Gerar os últimos 12 meses cronológicos (do mais antigo para o mês atual)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = monthsNames[monthIdx];

      // Filtrar todos os aportes e compras de investimentos realizados neste mês
      const investmentsInMonth = investments.filter(inv => {
        const itemDateStr = inv.createdAt;
        if (!itemDateStr) return false;
        try {
          const invDate = new Date(itemDateStr);
          if (isNaN(invDate.getTime())) return false;
          const invKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
          return invKey === monthKey;
        } catch {
          return false;
        }
      });

      // Total aportado no mês (soma de todas as ações, CDBs, fundos, criptos, etc.)
      const totalAportadoMes = investmentsInMonth.reduce((acc, inv) => acc + (inv.totalInvested || 0), 0);

      result.push({
        month: label,
        monthKey,
        aportes: totalAportadoMes,
        total: totalAportadoMes,
        h: '6px'
      });
    }

    // Altura relativa das barras com base no mês de maior aporte
    const maxAporte = Math.max(...result.map(r => r.aportes), 0);

    return result.map(item => {
      if (item.aportes <= 0 || maxAporte === 0) {
        return { ...item, h: '6px' };
      }
      const pct = Math.max(14, Math.round((item.aportes / maxAporte) * 100));
      return { ...item, h: `${pct}%` };
    });
  }, [investments]);

  const monthsWithAportes = historyAportes.filter(h => h.aportes > 0);
  const avgMonthlyAporte = monthsWithAportes.length > 0 
    ? Math.round(monthsWithAportes.reduce((acc, h) => acc + h.aportes, 0) / monthsWithAportes.length)
    : 0;

  // Agrupamento e Consolidação por Ativo / Ticker
  const consolidatedAssets = useMemo(() => {
    const map: { [key: string]: {
      ticker?: string;
      name: string;
      category: AssetCategory;
      macroType: 'FIXA' | 'VARIAVEL';
      institutions: Set<string>;
      totalQuantity: number;
      totalInvested: number;
      currentBalance: number;
      rateOrYield?: string;
      totalDividends: number;
      latestPrice: number;
      liquidity?: 'DIARIA' | 'D+1' | 'VENCIMENTO';
      dueDate?: string;
      itemsCount: number;
    }} = {};

    const palette = [
      '#3B6CF0', '#38BDF8', '#818CF8', '#F59E0B', '#EC4899', 
      '#14B8A6', '#6366F1', '#F43F5E', '#EAB308', '#06B6D4',
      '#A855F7', '#84CC16', '#22C55E'
    ];

    investments.forEach(item => {
      const key = (item.ticker || item.name).trim().toUpperCase();
      if (!map[key]) {
        map[key] = {
          ticker: item.ticker,
          name: item.name,
          category: item.category,
          macroType: item.macroType,
          institutions: new Set([item.institution]),
          totalQuantity: item.quantity || 0,
          totalInvested: item.totalInvested || 0,
          currentBalance: item.currentBalance || 0,
          rateOrYield: item.rateOrYield,
          liquidity: item.liquidity,
          dueDate: item.dueDate,
          totalDividends: item.totalDividendsReceived || 0,
          latestPrice: item.currentPrice || item.averagePrice || 0,
          itemsCount: 1
        };
      } else {
        map[key].institutions.add(item.institution);
        map[key].totalQuantity += (item.quantity || 0);
        map[key].totalInvested += item.totalInvested;
        map[key].currentBalance += item.currentBalance;
        map[key].totalDividends += (item.totalDividendsReceived || 0);
        if (item.currentPrice) map[key].latestPrice = item.currentPrice;
        if (!map[key].liquidity && item.liquidity) map[key].liquidity = item.liquidity;
        if (!map[key].dueDate && item.dueDate) map[key].dueDate = item.dueDate;
        map[key].itemsCount += 1;
      }
    });

    return Object.keys(map).map((k, index) => {
      const data = map[k];
      const avgPrice = data.totalQuantity > 0 ? data.totalInvested / data.totalQuantity : 0;
      const profit = data.currentBalance - data.totalInvested;
      const profitPct = data.totalInvested > 0 ? (profit / data.totalInvested) * 100 : 0;
      const portfolioPct = currentBalanceGlobal > 0 ? (data.currentBalance / currentBalanceGlobal) * 100 : 0;

      return {
        key: k,
        ticker: data.ticker,
        name: data.name,
        category: data.category,
        macroType: data.macroType,
        institutions: Array.from(data.institutions),
        totalQuantity: data.totalQuantity,
        totalInvested: data.totalInvested,
        currentBalance: data.currentBalance,
        averagePrice: avgPrice,
        latestPrice: data.latestPrice,
        rateOrYield: data.rateOrYield,
        liquidity: data.liquidity,
        dueDate: data.dueDate,
        totalDividends: data.totalDividends,
        itemsCount: data.itemsCount,
        profit,
        profitPct,
        portfolioPct,
        color: palette[index % palette.length]
      };
    }).sort((a, b) => b.currentBalance - a.currentBalance);
  }, [investments, currentBalanceGlobal]);

  // Filtragem dos ativos consolidados
  const filteredConsolidated = useMemo(() => {
    return consolidatedAssets.filter(asset => {
      if (consolidatedFilter === 'FIIS' && asset.category !== 'FIIS') return false;
      if (consolidatedFilter === 'ACOES' && asset.category !== 'ACOES') return false;
      if (consolidatedFilter === 'FIXA' && asset.macroType !== 'FIXA') return false;
      if (consolidatedFilter === 'BDRS' && asset.category !== 'BDRS_STOCKS' && asset.category !== 'ETFS') return false;
      if (consolidatedFilter === 'CRIPTO' && asset.category !== 'CRIPTO') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          asset.name.toLowerCase().includes(q) ||
          (asset.ticker && asset.ticker.toLowerCase().includes(q)) ||
          asset.institutions.some(i => i.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [consolidatedAssets, consolidatedFilter, searchQuery]);

  // Total do filtro consolidado selecionado
  const filteredConsolidatedTotal = useMemo(() => {
    return filteredConsolidated.reduce((acc, a) => acc + a.currentBalance, 0);
  }, [filteredConsolidated]);

  // Donut de segmentos da classe selecionada
  const consolidatedDonutSegments = useMemo(() => {
    let accumulated = 0;
    return filteredConsolidated.map((item) => {
      const pct = filteredConsolidatedTotal > 0 ? (item.currentBalance / filteredConsolidatedTotal) * 100 : 0;
      const offset = accumulated;
      accumulated += pct;
      return {
        ...item,
        relativePct: pct,
        strokeDasharray: `${pct} ${Math.max(0, 100 - pct)}`,
        strokeDashoffset: -offset
      };
    });
  }, [filteredConsolidated, filteredConsolidatedTotal]);

  // Total de cotas/ações da classe selecionada
  const totalQuantityFiltered = useMemo(() => {
    return filteredConsolidated.reduce((acc, a) => acc + a.totalQuantity, 0);
  }, [filteredConsolidated]);

  // Estruturação das Visões Agrupadas por Classe
  const groupedClasses = useMemo(() => {
    const classes = [
      {
        id: 'FIIS' as const,
        title: 'Fundos Imobiliários (FIIs)',
        subtitle: 'Renda passiva mensal e portfólio imobiliário',
        icon: Building2,
        color: '#14B8A6',
        items: filteredConsolidated.filter(a => a.category === 'FIIS'),
        subtotal: totalFIIs,
        pct: pctFIIs
      },
      {
        id: 'ACOES' as const,
        title: 'Ações B3 (Bolsa de Valores)',
        subtitle: 'Participação em empresas brasileiras',
        icon: Activity,
        color: '#38BDF8',
        items: filteredConsolidated.filter(a => a.category === 'ACOES'),
        subtotal: totalAcoes,
        pct: pctAcoes
      },
      {
        id: 'FIXA' as const,
        title: 'Renda Fixa e Reservas',
        subtitle: 'Tesouro Direto, CDBs, LCIs e Caixinhas',
        icon: Shield,
        color: '#3B6CF0',
        items: filteredConsolidated.filter(a => a.macroType === 'FIXA'),
        subtotal: totalFixed,
        pct: pctFixed
      },
      {
        id: 'BDRS' as const,
        title: 'Internacional e ETFs',
        subtitle: 'BDRs, Ações Globais e Fundos de Índice',
        icon: Coins,
        color: '#818CF8',
        items: filteredConsolidated.filter(a => a.category === 'BDRS_STOCKS' || a.category === 'ETFS'),
        subtotal: totalBDRs,
        pct: pctBDRs
      },
      {
        id: 'CRIPTO' as const,
        title: 'Criptomoedas e Ativos Digitais',
        subtitle: 'Bitcoin, Ethereum e Ativos Blockchain',
        icon: Sparkles,
        color: '#F59E0B',
        items: filteredConsolidated.filter(a => a.category === 'CRIPTO'),
        subtotal: totalCripto,
        pct: pctCripto
      }
    ];

    if (consolidatedFilter === 'ALL') {
      return classes.filter(c => c.items.length > 0);
    }
    return classes.filter(c => c.id === consolidatedFilter && c.items.length > 0);
  }, [filteredConsolidated, consolidatedFilter, totalFIIs, totalAcoes, totalFixed, totalBDRs, totalCripto, pctFIIs, pctAcoes, pctFixed, pctBDRs, pctCripto]);

  // Filtragem da Tabela de Lançamentos
  const filteredInvestments = useMemo(() => {
    return investments.filter(item => {
      if (selectedFilter === 'FIXA' && item.macroType !== 'FIXA') return false;
      if (selectedFilter === 'VARIAVEL' && item.macroType !== 'VARIAVEL') return false;
      if (selectedFilter === 'CAIXINHA_PORQUINHO' && item.category !== 'CAIXINHA_PORQUINHO') return false;
      if (selectedFilter === 'TESOURO_DIRETO' && item.category !== 'TESOURO_DIRETO') return false;
      if (selectedFilter === 'ACOES' && item.category !== 'ACOES') return false;
      if (selectedFilter === 'FIIS' && item.category !== 'FIIS') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.ticker && item.ticker.toLowerCase().includes(q)) ||
          item.institution.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [investments, selectedFilter, searchQuery]);

  // Autocomplete Renda Variável
  const filteredAutocomplete = useMemo(() => {
    const list = ASSET_DATABASE[rvCategory] || [];
    if (!rvSearchTicker) return list.slice(0, 12);
    const q = rvSearchTicker.toLowerCase().trim();
    return list.filter(a => a.toLowerCase().includes(q));
  }, [rvCategory, rvSearchTicker]);

  // Abrir Modal para Novo Aporte
  const handleOpenNewInvestment = () => {
    setEditingInvestment(null);
    setRfCategory('CAIXINHA_PORQUINHO');
    setRfName('');
    setRfInstitution('Nubank');
    setRfRate('100% do CDI');
    setRfLiquidity('DIARIA');
    setRfDueDate('');
    setRfAmount('');
    setRvCategory('Ações');
    setRvSearchTicker('');
    setRvInstitution('XP Investimentos');
    setRvQuantity('');
    setRvPrice('');
    setRvYieldRate('');
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar Investimento
  const handleEditInvestment = (item: InvestmentItem) => {
    setEditingInvestment(item);
    if (item.macroType === 'FIXA') {
      setModalTab('FIXA');
      setRfCategory(item.category);
      setRfName(item.name);
      setRfInstitution(item.institution);
      setRfRate(item.rateOrYield || '100% do CDI');
      setRfLiquidity(item.liquidity || 'DIARIA');
      setRfDueDate(item.dueDate || '');
      setRfAmount(item.totalInvested.toString());
    } else {
      setModalTab('VARIAVEL');
      let cat: 'Ações' | 'FIIs' | 'BDRs' | 'ETFs' | 'Criptomoedas' | 'Stocks' = 'Ações';
      if (item.category === 'FIIS') cat = 'FIIs';
      else if (item.category === 'BDRS_STOCKS') cat = 'BDRs';
      else if (item.category === 'CRIPTO') cat = 'Criptomoedas';
      else if (item.category === 'ETFS') cat = 'ETFs';
      setRvCategory(cat);
      setRvSearchTicker(item.ticker ? `${item.ticker} - ${item.name}` : item.name);
      setRvInstitution(item.institution);
      setRvQuantity(item.quantity?.toString() || '');
      setRvPrice(item.averagePrice?.toString() || '');
      setRvYieldRate(item.rateOrYield || '');
    }
    setIsModalOpen(true);
  };

  // Salvar Aporte (Criação ou Edição)
  const handleSaveInvestment = async () => {
    if (modalTab === 'FIXA') {
      const amt = parseFloat(rfAmount.replace(',', '.')) || 0;
      if (!rfName || amt <= 0) return;

      const monthlyEst = amt * 0.0092;

      if (editingInvestment) {
        try {
          await investmentsService.updateInvestment(editingInvestment.id, {
            category: rfCategory,
            name: rfName,
            institution: rfInstitution,
            rate_or_yield: rfRate || '100% do CDI',
            liquidity: rfLiquidity,
            due_date: rfLiquidity === 'DIARIA' ? 'Liquidez Imediata (D+0)' : (rfDueDate || 'No Vencimento'),
            invested_amount: amt,
            current_value: amt,
          });
        } catch (e) {
          console.error('Erro ao atualizar investimento no Supabase:', e);
        }

        setInvestments(prev => prev.map(inv => {
          if (inv.id !== editingInvestment.id) return inv;
          const diff = amt - inv.totalInvested;
          return {
            ...inv,
            category: rfCategory,
            name: rfName,
            institution: rfInstitution,
            rateOrYield: rfRate || '100% do CDI',
            liquidity: rfLiquidity,
            dueDate: rfLiquidity === 'DIARIA' ? 'Liquidez Imediata (D+0)' : (rfDueDate || 'No Vencimento'),
            totalInvested: amt,
            currentBalance: Math.max(0, inv.currentBalance + diff),
            monthlyEstimatedYield: monthlyEst,
            isFgcProtected: rfCategory !== 'TESOURO_DIRETO'
          };
        }));
      } else {
        let createdId = 'rf-' + Date.now();
        let createdAtIso = new Date().toISOString();
        try {
          const created = await investmentsService.createInvestment({
            macro_type: 'FIXA',
            category: rfCategory,
            name: rfName,
            institution: rfInstitution,
            rate_or_yield: rfRate || '100% do CDI',
            liquidity: rfLiquidity,
            due_date: rfLiquidity === 'DIARIA' ? 'Liquidez Imediata (D+0)' : (rfDueDate || 'No Vencimento'),
            quantity: 1,
            average_price: amt,
            invested_amount: amt,
            current_value: amt,
            profitability_pct: 0,
          });
          if (created) {
            createdId = created.id;
            if (created.created_at) createdAtIso = created.created_at;
          }
        } catch (e) {
          console.error('Erro ao cadastrar investimento no Supabase:', e);
        }

        const newItem: InvestmentItem = {
          id: createdId,
          macroType: 'FIXA',
          category: rfCategory,
          name: rfName,
          institution: rfInstitution,
          rateOrYield: rfRate || '100% do CDI',
          liquidity: rfLiquidity,
          dueDate: rfLiquidity === 'DIARIA' ? 'Liquidez Imediata (D+0)' : (rfDueDate || 'No Vencimento'),
          totalInvested: amt,
          currentBalance: amt,
          monthlyEstimatedYield: monthlyEst,
          totalDividendsReceived: 0,
          isFgcProtected: rfCategory !== 'TESOURO_DIRETO',
          createdAt: createdAtIso
        };
        setInvestments([newItem, ...investments]);
      }
    } else {
      const q = parseFloat(rvQuantity.replace(',', '.')) || 0;
      const p = parseFloat(rvPrice.replace(',', '.')) || 0;
      if (!rvSearchTicker || q <= 0 || p <= 0) return;

      const tickerSymbol = rvSearchTicker.split(' - ')[0].trim().toUpperCase();
      const assetFullName = rvSearchTicker.split(' - ')[1] || tickerSymbol;
      const totalInv = q * p;
      const curBal = q * p * 1.02;

      let cat: AssetCategory = 'ACOES';
      if (rvCategory === 'FIIs') cat = 'FIIS';
      else if (rvCategory === 'BDRs' || rvCategory === 'Stocks') cat = 'BDRS_STOCKS';
      else if (rvCategory === 'Criptomoedas') cat = 'CRIPTO';
      else if (rvCategory === 'ETFs') cat = 'ETFS';

      const estDividends = cat === 'FIIS' ? curBal * 0.0085 : cat === 'ACOES' ? curBal * 0.006 : 0;

      if (editingInvestment) {
        try {
          await investmentsService.updateInvestment(editingInvestment.id, {
            category: cat,
            name: assetFullName,
            ticker: tickerSymbol,
            institution: rvInstitution,
            rate_or_yield: rvYieldRate || (cat === 'FIIS' ? 'DY ~10.5% a.a.' : 'Ganho de Capital'),
            quantity: q,
            average_price: p,
            invested_amount: totalInv,
            current_value: curBal,
            profitability_pct: 2.0,
          });
        } catch (e) {
          console.error('Erro ao atualizar investimento no Supabase:', e);
        }

        setInvestments(prev => prev.map(inv => {
          if (inv.id !== editingInvestment.id) return inv;
          return {
            ...inv,
            category: cat,
            name: assetFullName,
            ticker: tickerSymbol,
            institution: rvInstitution,
            rateOrYield: rvYieldRate || (cat === 'FIIS' ? 'DY ~10.5% a.a.' : 'Ganho de Capital'),
            quantity: q,
            averagePrice: p,
            currentPrice: p,
            totalInvested: totalInv,
            currentBalance: curBal,
            monthlyEstimatedYield: estDividends
          };
        }));
      } else {
        let createdId = 'rv-' + Date.now();
        let createdAtIso = new Date().toISOString();
        try {
          const created = await investmentsService.createInvestment({
            macro_type: 'VARIAVEL',
            category: cat,
            name: assetFullName,
            ticker: tickerSymbol,
            institution: rvInstitution,
            rate_or_yield: rvYieldRate || (cat === 'FIIS' ? 'DY ~10.5% a.a.' : 'Ganho de Capital'),
            quantity: q,
            average_price: p,
            invested_amount: totalInv,
            current_value: curBal,
            profitability_pct: 2.0,
          });
          if (created) {
            createdId = created.id;
            if (created.created_at) createdAtIso = created.created_at;
          }
        } catch (e) {
          console.error('Erro ao cadastrar investimento no Supabase:', e);
        }

        const newItem: InvestmentItem = {
          id: createdId,
          macroType: 'VARIAVEL',
          category: cat,
          name: assetFullName,
          ticker: tickerSymbol,
          institution: rvInstitution,
          rateOrYield: rvYieldRate || (cat === 'FIIS' ? 'DY ~10.5% a.a.' : 'Ganho de Capital'),
          quantity: q,
          averagePrice: p,
          currentPrice: p,
          totalInvested: totalInv,
          currentBalance: curBal,
          monthlyEstimatedYield: estDividends,
          totalDividendsReceived: 0,
          createdAt: createdAtIso
        };
        setInvestments([newItem, ...investments]);
      }
    }

    setIsModalOpen(false);
    setEditingInvestment(null);
    setRfName('');
    setRfAmount('');
    setRvSearchTicker('');
    setRvQuantity('');
    setRvPrice('');
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await investmentsService.deleteInvestment(id);
    } catch (e) {
      console.error('Erro ao excluir investimento do Supabase:', e);
    }
    setInvestments(prev => prev.filter(i => i.id !== id));
    setDeleteCandidate(null);
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pb-12 space-y-3.5">

        {/* =========================================================================
            1. BENTO GRID KPIS (COMPACTOS & PADRÃO VISÃO GERAL #FFFFFF)
        ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Patrimônio Total */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Briefcase size={11} className="text-[#1A44C8]" /> Patrimônio Total
              </p>
              <h3 className="text-xl font-extrabold text-[#181B22] mb-0.5 flex items-baseline">
                <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
                {formatCurrency(currentBalanceGlobal)}
              </h3>
              <p className="text-[9.5px] text-[#64748B]">
                Aportado: <span className="text-[#181B22] font-semibold">R$ {formatCurrency(totalInvestedGlobal)}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Lucro Total */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-[#1A44C8]" /> Lucro Total
                </p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                  totalProfitConsolidated >= 0 
                    ? 'text-[#1A44C8] bg-[#1A44C8]/10 border-[#1A44C8]/20' 
                    : 'text-rose-600 bg-rose-50 border-rose-200'
                }`}>
                  {profitPctTotal >= 0 ? '+' : ''}{profitPctTotal.toFixed(1)}%
                </span>
              </div>
              <h3 className={`text-xl font-extrabold mb-1 flex items-baseline ${
                totalProfitConsolidated >= 0 ? 'text-[#1A44C8]' : 'text-rose-600'
              }`}>
                <span className="text-sm opacity-80 mr-1 font-semibold">
                  {totalProfitConsolidated >= 0 ? '+R$' : '-R$'}
                </span>
                {formatCurrency(Math.abs(totalProfitConsolidated))}
              </h3>
              <div className="space-y-0.5 text-[9.5px] pt-1 border-t border-[#E5E7EB]">
                <p className="text-[#64748B] flex justify-between">
                  <span>Ganho de Capital:</span>
                  <span className="text-[#181B22] font-semibold">{capitalGainTotal >= 0 ? '+' : ''}R$ {formatCurrency(capitalGainTotal)}</span>
                </p>
                <p className="text-[#64748B] flex justify-between">
                  <span>Proventos:</span>
                  <span className="text-[#1A44C8] font-bold">+R$ {formatCurrency(dividendsReceivedTotal)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Renda Fixa */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={11} className="text-[#00A3FF]" /> Renda Fixa
                </p>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#F1F3F7] text-[#181B22] font-bold border border-[#E5E7EB]">
                  {pctFixed.toFixed(0)}%
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#181B22] mb-0.5 flex items-baseline">
                <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
                {formatCurrency(totalFixed)}
              </h3>
              <p className="text-[9.5px] text-[#64748B]">
                Tesouro Direto, CDBs e Caixinhas
              </p>
            </div>
          </div>

          {/* Card 4: Renda Variável */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={11} className="text-[#1A44C8]" /> Renda Variável
                </p>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#F1F3F7] text-[#181B22] font-bold border border-[#E5E7EB]">
                  {pctVariable.toFixed(0)}%
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#181B22] mb-0.5 flex items-baseline">
                <span className="text-sm text-[#94A3B8] mr-1 font-semibold">R$</span>
                {formatCurrency(totalVariable)}
              </h3>
              <p className="text-[9.5px] text-[#64748B]">
                Ações, FIIs, BDRs
              </p>
            </div>
          </div>

        </div>

        {/* =========================================================================
            2. ÁREA DE GRÁFICOS: MACRO, CLASSES & EVOLUÇÃO (12 MESES)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Gráfico 1: Macro Alocação */}
          <div className="lg:col-span-3 bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                <PieChart size={13} className="text-[#1A44C8]" />
                Macro Alocação
              </h3>
              <span className="text-[9.5px] text-[#64748B] font-medium">Fixa vs Variável</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 py-2.5 my-auto">
              
              {/* Donut Interativo */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                  
                  {/* Renda Fixa */}
                  <circle
                    cx="18" cy="18" r="15.915"
                    fill="transparent"
                    stroke="#1A44C8"
                    strokeWidth={hoveredMacroIndex === 0 ? 5.5 : 4}
                    strokeDasharray={`${pctFixed} ${100 - pctFixed}`}
                    strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-300 hover:opacity-100"
                    onMouseEnter={() => setHoveredMacroIndex(0)}
                    onMouseLeave={() => setHoveredMacroIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('FIXA'); }}
                  />
                  {/* Renda Variável */}
                  <circle
                    cx="18" cy="18" r="15.915"
                    fill="transparent"
                    stroke="#00A3FF"
                    strokeWidth={hoveredMacroIndex === 1 ? 5.5 : 4}
                    strokeDasharray={`${pctVariable} ${100 - pctVariable}`}
                    strokeDashoffset={`-${pctFixed}`}
                    className="cursor-pointer transition-all duration-300 hover:opacity-100"
                    onMouseEnter={() => setHoveredMacroIndex(1)}
                    onMouseLeave={() => setHoveredMacroIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('ALL'); }}
                  />
                </svg>

                {/* Centro Dinâmico */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                  {hoveredMacroIndex !== null ? (
                    <>
                      <span className="text-[7.5px] text-[#64748B] truncate max-w-[50px] font-bold">
                        {macroSegments[hoveredMacroIndex].label}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#181B22] leading-tight">
                        R$ {formatCurrency(macroSegments[hoveredMacroIndex].value)}
                      </span>
                      <span className="text-[7.5px] text-[#1A44C8] font-bold">
                        {macroSegments[hoveredMacroIndex].pct.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[7.5px] text-[#94A3B8] uppercase tracking-wider font-bold">Divisão</span>
                      <span className="text-[10.5px] font-extrabold text-[#181B22]">{pctFixed.toFixed(0)}% / {pctVariable.toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legenda com Interação de Clique para Filtrar */}
              <div className="flex-1 w-full space-y-1 text-[10px]">
                {macroSegments.map((seg, idx) => {
                  const isHovered = hoveredMacroIndex === idx;
                  const color = idx === 0 ? '#1A44C8' : '#00A3FF';
                  return (
                    <div 
                      key={idx} 
                      onMouseEnter={() => setHoveredMacroIndex(idx)}
                      onMouseLeave={() => setHoveredMacroIndex(null)}
                      onClick={() => {
                        setViewMode('CONSOLIDADO');
                        setConsolidatedFilter(idx === 0 ? 'FIXA' : 'ALL');
                      }}
                      className={`flex items-center justify-between cursor-pointer p-1 rounded-lg border transition-all ${
                        isHovered ? 'bg-[#F1F3F7] border-[#E5E7EB]' : 'bg-transparent border-transparent hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <span className={`font-bold ${isHovered ? 'text-[#1A44C8]' : 'text-[#181B22]'}`}>{seg.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#181B22]">{seg.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Gráfico 2: Alocação Detalhada por Classe */}
          <div className="lg:col-span-3 bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                <Layers size={13} className="text-[#00A3FF]" />
                Alocação por Classe
              </h3>
              <span className="text-[9.5px] text-[#64748B] font-medium">Diversificação</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 py-2.5 my-auto">
              
              {/* Donut Interativo */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />

                  {/* 1. Renda Fixa */}
                  <circle
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#1A44C8"
                    strokeWidth={hoveredClassIndex === 0 ? 5.5 : 4}
                    strokeDasharray={`${pctFixed} ${100 - pctFixed}`}
                    strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredClassIndex(0)}
                    onMouseLeave={() => setHoveredClassIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('FIXA'); }}
                  />
                  {/* 2. FIIs */}
                  <circle
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#00A3FF"
                    strokeWidth={hoveredClassIndex === 1 ? 5.5 : 4}
                    strokeDasharray={`${pctFIIs} ${100 - pctFIIs}`}
                    strokeDashoffset={`-${pctFixed}`}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredClassIndex(1)}
                    onMouseLeave={() => setHoveredClassIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('FIIS'); }}
                  />
                  {/* 3. Ações */}
                  <circle
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#38BDF8"
                    strokeWidth={hoveredClassIndex === 2 ? 5.5 : 4}
                    strokeDasharray={`${pctAcoes} ${100 - pctAcoes}`}
                    strokeDashoffset={`-${pctFixed + pctFIIs}`}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredClassIndex(2)}
                    onMouseLeave={() => setHoveredClassIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('ACOES'); }}
                  />
                  {/* 4. Internacional */}
                  <circle
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#818CF8"
                    strokeWidth={hoveredClassIndex === 3 ? 5.5 : 4}
                    strokeDasharray={`${pctBDRs} ${100 - pctBDRs}`}
                    strokeDashoffset={`-${pctFixed + pctFIIs + pctAcoes}`}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredClassIndex(3)}
                    onMouseLeave={() => setHoveredClassIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('BDRS'); }}
                  />
                  {/* 5. Cripto */}
                  <circle
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#F59E0B"
                    strokeWidth={hoveredClassIndex === 4 ? 5.5 : 4}
                    strokeDasharray={`${pctCripto} ${100 - pctCripto}`}
                    strokeDashoffset={`-${pctFixed + pctFIIs + pctAcoes + pctBDRs}`}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredClassIndex(4)}
                    onMouseLeave={() => setHoveredClassIndex(null)}
                    onClick={() => { setViewMode('CONSOLIDADO'); setConsolidatedFilter('CRIPTO'); }}
                  />
                </svg>

                {/* Centro Dinâmico */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                  {hoveredClassIndex !== null ? (
                    <>
                      <span className="text-[7.5px] text-[#64748B] truncate max-w-[50px] font-bold">
                        {classSegments[hoveredClassIndex].label.split(' ')[0]}
                      </span>
                      <span className="text-[9.5px] font-extrabold text-[#181B22] leading-tight">
                        R$ {formatCurrency(classSegments[hoveredClassIndex].value)}
                      </span>
                      <span className="text-[7.5px] text-[#1A44C8] font-bold">
                        {classSegments[hoveredClassIndex].pct.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[7.5px] text-[#94A3B8] uppercase tracking-wider font-bold">Ativos</span>
                      <span className="text-[10.5px] font-extrabold text-[#181B22]">{classSegments.filter(c => c.value > 0).length} classes</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legenda com Clique para Filtrar */}
              <div className="flex-1 w-full space-y-0.5 text-[9.5px]">
                {classSegments.map((seg, idx) => {
                  const isHovered = hoveredClassIndex === idx;
                  const filterKeys: Array<'FIXA' | 'FIIS' | 'ACOES' | 'BDRS' | 'CRIPTO'> = ['FIXA', 'FIIS', 'ACOES', 'BDRS', 'CRIPTO'];
                  return (
                    <div 
                      key={idx} 
                      onMouseEnter={() => setHoveredClassIndex(idx)}
                      onMouseLeave={() => setHoveredClassIndex(null)}
                      onClick={() => {
                        setViewMode('CONSOLIDADO');
                        setConsolidatedFilter(filterKeys[idx]);
                      }}
                      className={`flex items-center justify-between cursor-pointer px-1 py-0.5 rounded-lg border transition-all ${
                        isHovered ? 'bg-[#F1F3F7] border-[#E5E7EB]' : 'bg-transparent border-transparent hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                        <span className={`truncate font-bold ${isHovered ? 'text-[#1A44C8]' : 'text-[#181B22]'}`}>
                          {seg.label.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-[#181B22]">{seg.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Gráfico 3: Evolução dos Aportes (12 Meses) */}
          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-4 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                  <Activity size={13} className="text-[#1A44C8]" />
                  Evolução dos Aportes (12 Meses)
                </h3>
              </div>
              <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-[#F1F3F7] text-[#181B22] border border-[#E5E7EB] font-bold">
                Média R$ {formatCurrency(avgMonthlyAporte)}/mês
              </span>
            </div>

            {/* Barras Elegantes e Ampliadas */}
            <div className="h-44 flex items-end justify-between gap-2.5 pt-4 pb-1 px-2 my-auto">
              {historyAportes.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                  <span className="text-[9px] font-bold text-[#1A44C8] opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1 whitespace-nowrap">
                    {bar.aportes > 0 ? `R$ ${formatCurrency(bar.aportes)}` : '-'}
                  </span>
                  <div className="w-full bg-[#F1F3F7] rounded-t-md relative flex items-end overflow-hidden" style={{ height: bar.h }}>
                    {bar.aportes > 0 ? (
                      <div className="w-full h-full bg-gradient-to-t from-[#1A44C8] to-[#00A3FF] opacity-90 group-hover:opacity-100 transition-all duration-300 rounded-t-md shadow-sm"></div>
                    ) : (
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-t-md"></div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748B] font-bold group-hover:text-[#181B22] transition-colors">{bar.month}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] text-[10px] text-[#64748B] flex justify-between items-center font-medium">
              <span>Meses com aporte realizado</span>
              <span className="text-[#1A44C8] font-bold">{monthsWithAportes.length} de 12 meses</span>
            </div>
          </div>

        </div>

        {/* =========================================================================
            2. BARRA DE AÇÕES RÁPIDAS COM SELETOR DE VISÃO (CONSOLIDADO / HISTÓRICO) & NOVO APORTE
        ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8]"></span>
            <span>Ações Rápidas:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Seletor Consolidado / Histórico */}
            <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-full border border-[#E5E7EB] shadow-sm">
              <button 
                onClick={() => setViewMode('CONSOLIDADO')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  viewMode === 'CONSOLIDADO' ? 'bg-[#1A44C8]/10 text-[#1A44C8] shadow-sm border border-[#1A44C8]/20' : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <PieChart size={11} className={viewMode === 'CONSOLIDADO' ? 'text-[#1A44C8]' : ''} />
                <span>Consolidado</span>
              </button>
              <button 
                onClick={() => setViewMode('LANCAMENTOS')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  viewMode === 'LANCAMENTOS' ? 'bg-[#1A44C8]/10 text-[#1A44C8] shadow-sm border border-[#1A44C8]/20' : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <ListFilter size={11} className={viewMode === 'LANCAMENTOS' ? 'text-[#1A44C8]' : ''} />
                <span>Histórico</span>
              </button>
            </div>

            {/* Botão Novo Aporte */}
            <button 
              onClick={handleOpenNewInvestment}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A44C8] hover:bg-[#0C2BC0] text-white font-semibold text-[10.5px] transition-all shadow-md active:scale-95"
            >
              <Plus size={11} className="text-white" />
              Novo Aporte
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. TERMINAL DE ANÁLISE DE INVESTIMENTOS & LANÇAMENTOS
        ========================================================================= */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm space-y-4">
          
          {/* Header com Filtros de Classe/Lançamentos e Busca */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            
            {/* Filtros em Pílulas Arredondadas */}
            {viewMode === 'CONSOLIDADO' ? (
              <div className="flex items-center gap-1 bg-[#F1F3F7] p-1 rounded-full border border-[#E5E7EB] overflow-x-auto max-w-full">
                <button 
                  onClick={() => setConsolidatedFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'ALL' 
                      ? 'bg-[#FFFFFF] text-[#1A44C8] shadow-sm' 
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  Todas as Classes
                </button>

                <button 
                  onClick={() => setConsolidatedFilter('FIIS')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'FIIS' 
                      ? 'bg-[#00A3FF]/15 text-[#00A3FF] border border-[#00A3FF]/30' 
                      : 'text-[#64748B] hover:text-[#00A3FF]'
                  }`}
                >
                  <Building2 size={11} />
                  FIIs
                </button>

                <button 
                  onClick={() => setConsolidatedFilter('ACOES')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'ACOES' 
                      ? 'bg-[#1A44C8]/15 text-[#1A44C8] border border-[#1A44C8]/30' 
                      : 'text-[#64748B] hover:text-[#1A44C8]'
                  }`}
                >
                  <Activity size={11} />
                  Ações B3
                </button>

                <button 
                  onClick={() => setConsolidatedFilter('FIXA')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'FIXA' 
                      ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' 
                      : 'text-[#64748B] hover:text-[#1A44C8]'
                  }`}
                >
                  <Shield size={11} />
                  Renda Fixa
                </button>

                <button 
                  onClick={() => setConsolidatedFilter('BDRS')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'BDRS' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'text-[#64748B] hover:text-indigo-700'
                  }`}
                >
                  <Coins size={11} />
                  Internacional
                </button>

                <button 
                  onClick={() => setConsolidatedFilter('CRIPTO')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    consolidatedFilter === 'CRIPTO' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'text-[#64748B] hover:text-amber-700'
                  }`}
                >
                  <Sparkles size={11} />
                  Criptomoedas
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#F1F3F7] p-1 rounded-full border border-[#E5E7EB] overflow-x-auto max-w-full">
                <button 
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === 'ALL' 
                      ? 'bg-[#FFFFFF] text-[#1A44C8] shadow-sm' 
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  Todos os Lançamentos
                </button>

                <button 
                  onClick={() => setSelectedFilter('FIXA')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === 'FIXA' 
                      ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' 
                      : 'text-[#64748B] hover:text-[#1A44C8]'
                  }`}
                >
                  <Shield size={11} />
                  Renda Fixa
                </button>

                <button 
                  onClick={() => setSelectedFilter('VARIAVEL')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === 'VARIAVEL' 
                      ? 'bg-[#00A3FF]/15 text-[#00A3FF] border border-[#00A3FF]/30' 
                      : 'text-[#64748B] hover:text-[#00A3FF]'
                  }`}
                >
                  <TrendingUp size={11} />
                  Renda Variável
                </button>

                <button 
                  onClick={() => setSelectedFilter('FIIS')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === 'FIIS' 
                      ? 'bg-[#00A3FF]/15 text-[#00A3FF] border border-[#00A3FF]/30' 
                      : 'text-[#64748B] hover:text-[#00A3FF]'
                  }`}
                >
                  <Building2 size={11} />
                  FIIs
                </button>

                <button 
                  onClick={() => setSelectedFilter('ACOES')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === 'ACOES' 
                      ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' 
                      : 'text-[#64748B] hover:text-[#1A44C8]'
                  }`}
                >
                  <Activity size={11} />
                  Ações
                </button>
              </div>
            )}

            {/* Busca */}
            <div className="relative w-full lg:w-56">
              <Search size={12} className="absolute left-3 top-2.5 text-[#94A3B8]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ativo ou banco..."
                className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-full pl-8 pr-3 py-1.5 text-[10.5px] text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
              />
            </div>

          </div>

          {/* =========================================================================
              CONTEÚDO DA VISÃO 1: POSIÇÃO CONSOLIDADA (TABELAS DIRETAS POR CLASSE)
          ========================================================================= */}
          {viewMode === 'CONSOLIDADO' ? (
            <div className="space-y-6">
              {groupedClasses.length > 0 ? (
                groupedClasses.map(classGroup => {
                  const ClassIcon = classGroup.icon;
                  const isFixedIncome = classGroup.id === 'FIXA';

                  return (
                    <div key={classGroup.id} className="space-y-2.5 pt-1">
                      
                      {/* Header da Classe */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <ClassIcon size={14} className="text-[#1A44C8]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-[#181B22]">{classGroup.title}</h4>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F1F3F7] text-[#64748B] font-bold">
                                {classGroup.items.length} ativos
                              </span>
                            </div>
                            <p className="text-[9.5px] text-[#64748B]">{classGroup.subtitle}</p>
                          </div>
                        </div>

                        {/* Subtotal da Classe */}
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-extrabold text-[#181B22]">R$ {formatCurrency(classGroup.subtotal)}</p>
                          <p className="text-[9px] text-[#64748B] font-medium">{classGroup.pct.toFixed(1)}% do patrimônio</p>
                        </div>
                      </div>

                      {/* Tabela de Ativos da Classe */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E5E7EB] text-[9px] uppercase tracking-wider text-[#94A3B8] font-bold">
                              <th className="pb-2 px-2">Ativo / Código</th>
                              <th className="pb-2 px-2">Instituição</th>
                              {isFixedIncome ? (
                                <>
                                  <th className="pb-2 px-2">Taxa / Indexador</th>
                                  <th className="pb-2 px-2">Liquidez / Vencimento</th>
                                </>
                              ) : (
                                <>
                                  <th className="pb-2 px-2 text-right">Qtd</th>
                                  <th className="pb-2 px-2 text-right">Preço Médio</th>
                                  <th className="pb-2 px-2 text-right">Preço Atual</th>
                                </>
                              )}
                              <th className="pb-2 px-2 text-right">Total Aportado</th>
                              <th className="pb-2 px-2 text-right">Saldo Atual</th>
                              <th className="pb-2 px-2 text-right">Resultado</th>
                              <th className="pb-2 px-2 text-right">% Cart</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#E5E7EB] text-[10.5px]">
                            {classGroup.items.map(asset => {
                              const isPositive = asset.profit >= 0;

                              return (
                                <tr key={asset.key} className="hover:bg-[#F8FAFC] transition-colors group">
                                  
                                  {/* Ativo */}
                                  <td className="py-2.5 px-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-lg bg-[#F1F3F7] border border-[#E5E7EB] flex items-center justify-center font-bold text-[9px] text-[#1A44C8] shrink-0">
                                        {asset.ticker ? asset.ticker.slice(0, 3) : asset.name.slice(0, 3).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                                          {asset.ticker ? `${asset.ticker} - ${asset.name}` : asset.name}
                                        </p>
                                        <p className="text-[8.5px] text-[#64748B]">
                                          {asset.itemsCount > 1 ? `${asset.itemsCount} aportes combinados` : 'Posição única'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Instituição / Banco */}
                                  <td className="py-2.5 px-2">
                                    <div className="flex items-center gap-1.5">
                                      <BankLogo name={asset.institutions[0]} size="xs" />
                                      <span className="text-[#181B22] font-semibold truncate max-w-[100px] text-[10px]">
                                        {asset.institutions.join(', ')}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Colunas específicas Fixa vs Variável */}
                                  {isFixedIncome ? (
                                    <>
                                      <td className="py-2.5 px-2">
                                        <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20 font-bold">
                                          {asset.rateOrYield || '100% CDI'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-2 text-[#64748B] text-[10px] font-medium">
                                        {asset.dueDate || 'Imediata (D+0)'}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-2.5 px-2 text-right font-bold text-[#181B22]">
                                        {asset.totalQuantity}
                                      </td>
                                      <td className="py-2.5 px-2 text-right text-[#64748B] font-mono">
                                        R$ {formatCurrency(asset.averagePrice)}
                                      </td>
                                      <td className="py-2.5 px-2 text-right text-[#181B22] font-bold font-mono">
                                        R$ {formatCurrency(asset.latestPrice || asset.averagePrice)}
                                      </td>
                                    </>
                                  )}

                                  {/* Total Aportado */}
                                  <td className="py-2.5 px-2 text-right text-[#64748B] font-mono">
                                    R$ {formatCurrency(asset.totalInvested)}
                                  </td>

                                  {/* Saldo Atual */}
                                  <td className="py-2.5 px-2 text-right font-extrabold text-[#181B22] font-mono">
                                    R$ {formatCurrency(asset.currentBalance)}
                                  </td>

                                  {/* Resultado (Lucro/Prejuízo) */}
                                  <td className="py-2.5 px-2 text-right font-bold font-mono">
                                    <span className={isPositive ? 'text-[#1A44C8]' : 'text-rose-600'}>
                                      {isPositive ? '+' : ''}R$ {formatCurrency(asset.profit)} ({isPositive ? '+' : ''}{asset.profitPct.toFixed(1)}%)
                                    </span>
                                  </td>

                                  {/* % da Carteira Global */}
                                  <td className="py-2.5 px-2 text-right font-bold text-[#64748B] text-[10px]">
                                    {asset.portfolioPct.toFixed(1)}%
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-[#94A3B8] text-xs font-medium">
                  Nenhum ativo encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          ) : (
            
            /* =========================================================================
                CONTEÚDO DA VISÃO 2: HISTÓRICO DE LANÇAMENTOS
            ========================================================================= */
            <div className="space-y-4">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[9px] uppercase tracking-wider text-[#94A3B8] font-bold">
                      <th className="pb-2 px-2">Ativo / Investimento</th>
                      <th className="pb-2 px-2">Tipo / Classe</th>
                      <th className="pb-2 px-2">Instituição</th>
                      <th className="pb-2 px-2">Taxa / Condição</th>
                      <th className="pb-2 px-2 text-right">Qtd / Preço</th>
                      <th className="pb-2 px-2 text-right">Total Aportado</th>
                      <th className="pb-2 px-2 text-right">Saldo Atual</th>
                      <th className="pb-2 px-2 text-right">Lucro Est.</th>
                      <th className="pb-2 px-2 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E5E7EB] text-[10.5px]">
                    {filteredInvestments.length > 0 ? (
                      filteredInvestments.map(item => {
                        const isVar = item.macroType === 'VARIAVEL';
                        const profit = item.currentBalance - item.totalInvested;
                        const isPositive = profit >= 0;

                        return (
                          <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors group">
                            
                            {/* Nome / Ticker */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#F1F3F7] border border-[#E5E7EB] flex items-center justify-center font-bold text-[9px] text-[#1A44C8] shrink-0">
                                  {item.ticker ? item.ticker.slice(0, 3) : item.name.slice(0, 3).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors">
                                    {item.ticker ? `${item.ticker} - ${item.name}` : item.name}
                                  </p>
                                  <p className="text-[8.5px] text-[#64748B]">{item.dueDate || 'Sem vencimento'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Categoria / Classe */}
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F1F3F7] border border-[#E5E7EB] text-[#181B22] font-bold">
                                {item.category.replace('_', ' ')}
                              </span>
                            </td>

                            {/* Instituição */}
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <BankLogo name={item.institution} size="xs" />
                                <span className="text-[#181B22] font-semibold text-[10px]">{item.institution}</span>
                              </div>
                            </td>

                            {/* Taxa */}
                            <td className="py-2.5 px-2 text-[#64748B] text-[10px] font-medium whitespace-nowrap">
                              {item.rateOrYield || '-'}
                            </td>

                            {/* Quantidade / Preço */}
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">
                              {isVar && item.quantity ? (
                                <div>
                                  <span className="font-bold text-[#181B22]">{item.quantity} cotas</span>
                                  <p className="text-[8.5px] text-[#64748B]">R$ {formatCurrency(item.averagePrice || 0)}/un</p>
                                </div>
                              ) : (
                                <span className="text-[#94A3B8] text-[10px]">-</span>
                              )}
                            </td>

                            {/* Total Aportado */}
                            <td className="py-2.5 px-2 text-right font-mono text-[#64748B] whitespace-nowrap">
                              R$ {formatCurrency(item.totalInvested)}
                            </td>

                            {/* Saldo Atual */}
                            <td className="py-2.5 px-2 text-right font-extrabold text-[#181B22] font-mono whitespace-nowrap">
                              R$ {formatCurrency(item.currentBalance)}
                            </td>

                            {/* Lucro Estimado */}
                            <td className="py-2.5 px-2 text-right font-bold font-mono whitespace-nowrap">
                              <span className={isPositive ? 'text-[#1A44C8]' : 'text-rose-600'}>
                                {isPositive ? '+' : ''}R$ {formatCurrency(profit)}
                              </span>
                            </td>

                            {/* Ações: Editar e Excluir */}
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => handleEditInvestment(item)}
                                  className="p-1 rounded-full hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] transition-colors"
                                  title="Editar lançamento"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button 
                                  onClick={() => setDeleteCandidate(item)}
                                  className="p-1 rounded-full hover:bg-rose-50 text-[#64748B] hover:text-rose-600 transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#94A3B8] text-xs font-medium">
                          Nenhum lançamento encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* =========================================================================
          MODAL UNIFICADO: NOVO APORTE / EDIÇÃO DE INVESTIMENTO
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-lg bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            {/* Header com Abas Macro */}
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setModalTab('FIXA')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'FIXA' 
                      ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' 
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  <Shield size={12} />
                  Renda Fixa
                </button>

                <button 
                  type="button"
                  onClick={() => setModalTab('VARIAVEL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'VARIAVEL' 
                      ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' 
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  <TrendingUp size={12} />
                  Renda Variável (Bolsa)
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
              
              {modalTab === 'FIXA' ? (
                <>
                  <div>
                    <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Categoria de Renda Fixa</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button 
                        type="button"
                        onClick={() => { setRfCategory('CAIXINHA_PORQUINHO'); setRfLiquidity('DIARIA'); setRfRate('100% do CDI'); }}
                        className={`py-2 px-2 rounded-xl border text-[10.5px] font-bold flex flex-col items-center gap-1 transition-all ${
                          rfCategory === 'CAIXINHA_PORQUINHO' ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]' : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                        }`}
                      >
                        <PiggyBank size={15} />
                        <span>Porquinho / Caixinha</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => { setRfCategory('TESOURO_DIRETO'); setRfLiquidity('VENCIMENTO'); setRfRate('Tesouro Selic'); }}
                        className={`py-2 px-2 rounded-xl border text-[10.5px] font-bold flex flex-col items-center gap-1 transition-all ${
                          rfCategory === 'TESOURO_DIRETO' ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]' : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                        }`}
                      >
                        <Landmark size={15} />
                        <span>Tesouro Direto</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => { setRfCategory('CDB_LCI_LCA'); setRfLiquidity('VENCIMENTO'); setRfRate('110% do CDI'); }}
                        className={`py-2 px-2 rounded-xl border text-[10.5px] font-bold flex flex-col items-center gap-1 transition-all ${
                          rfCategory === 'CDB_LCI_LCA' ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]' : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                        }`}
                      >
                        <Shield size={15} />
                        <span>CDB / LCI</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Nome / Identificação</label>
                    <input 
                      type="text" 
                      value={rfName}
                      onChange={(e) => setRfName(e.target.value)}
                      placeholder="Ex: Caixinha Reserva Nubank, CDB 110% CDI..."
                      className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Instituição</label>
                      <select 
                        value={rfInstitution}
                        onChange={(e) => setRfInstitution(e.target.value)}
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="Nubank">Nubank</option>
                        <option value="Banco Inter">Banco Inter</option>
                        <option value="Itaú">Itaú</option>
                        <option value="Bradesco">Bradesco</option>
                        <option value="Santander">Santander</option>
                        <option value="C6 Bank">C6 Bank</option>
                        <option value="XP Investimentos">XP</option>
                        <option value="Tesouro Direto">Tesouro Nacional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Taxa / Indexador</label>
                      <input 
                        type="text" 
                        value={rfRate}
                        onChange={(e) => setRfRate(e.target.value)}
                        placeholder="Ex: 100% do CDI, IPCA + 6.2%"
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Liquidez</label>
                      <select 
                        value={rfLiquidity}
                        onChange={(e) => setRfLiquidity(e.target.value as any)}
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="DIARIA">Imediata / Diária (D+0)</option>
                        <option value="D+1">D+1 Útil</option>
                        <option value="VENCIMENTO">No Vencimento</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Valor Aportado (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rfAmount}
                        onChange={(e) => setRfAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-[#F1F3F7] border border-[#1A44C8] rounded-xl py-1.5 px-3 text-xs text-[#1A44C8] font-extrabold focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Tipo</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Ações', 'FIIs', 'BDRs', 'ETFs', 'Criptomoedas', 'Stocks'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setRvCategory(type); setRvSearchTicker(''); }}
                          className={`py-1.5 px-2 rounded-xl border text-[10.5px] font-bold transition-all ${
                            rvCategory === type ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]' : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Código / Ticker</label>
                    <input 
                      type="text" 
                      value={rvSearchTicker}
                      onChange={(e) => setRvSearchTicker(e.target.value)}
                      placeholder="Ex: PETR4, MXRF11, AAPL34, BTC..."
                      className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none uppercase font-extrabold"
                    />

                    {filteredAutocomplete.length > 0 && !rvSearchTicker.includes(' - ') && (
                      <div className="mt-1 p-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl max-h-28 overflow-y-auto space-y-0.5 custom-scrollbar shadow-lg">
                        {filteredAutocomplete.map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setRvSearchTicker(item)}
                            className="px-2 py-1 rounded hover:bg-[#F1F3F7] cursor-pointer text-[11px] text-[#64748B] hover:text-[#181B22] flex justify-between items-center"
                          >
                            <span className="font-bold text-[#181B22]">{item.split(' - ')[0]}</span>
                            <span className="text-[9.5px] text-[#94A3B8] truncate max-w-[180px]">{item.split(' - ')[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Quantidade</label>
                      <input 
                        type="number" 
                        step="any"
                        value={rvQuantity}
                        onChange={(e) => setRvQuantity(e.target.value)}
                        placeholder="Ex: 100"
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Preço Médio (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rvPrice}
                        onChange={(e) => setRvPrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSaveInvestment}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A44C8] text-white font-semibold text-xs hover:bg-[#1538A5] transition-all shadow-md active:scale-95"
              >
                {editingInvestment ? 'Salvar Alterações' : 'Salvar Aporte'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE EXCLUSÃO
      ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl p-5 text-center space-y-3 my-auto animate-scale-in-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 size={18} />
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#181B22] mb-1">Excluir Investimento?</h3>
              <p className="text-[11px] text-[#64748B]">
                Remover <strong>&quot;{deleteCandidate.name}&quot;</strong> da sua carteira?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-1.5 px-3 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#F1F3F7]"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteInvestment(deleteCandidate.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
