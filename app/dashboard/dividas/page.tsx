'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Landmark, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  AlertTriangle,
  X, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  PieChart, 
  Activity, 
  DollarSign, 
  Zap, 
  Clock, 
  CheckCheck,
  Percent,
  Layers,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Sliders,
  Flame,
  Award,
  User,
  Users,
  Handshake,
  Search,
  LayoutGrid,
  ListFilter,
  Pencil,
  History
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';
import { debtsService } from '@/lib/services/debts';

interface AmortizationRecord {
  id: string;
  date: string;
  type: 'REGULAR' | 'EXTRAORDINARY';
  amountPaid: number;
  discountOrSavedInterest: number;
  notes?: string;
}

export interface DebtItem {
  id: string;
  name: string;
  creditorType: 'BANK' | 'PERSON';
  bank: string;
  category: 'IMOBILIARIO' | 'VEICULO' | 'EMPRESTIMO' | 'CONSIGNADO' | 'RENEGOCIACAO' | 'OUTROS';
  originalAmount: number;
  currentBalance: number;
  totalPaid: number;
  totalDiscounts: number;
  monthlyPayment: number;
  interestRate: string;
  interestNumeric: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDay: number;
  startDate: string;
  estimatedEndDate: string;
  status: 'ACTIVE' | 'PAID_OFF';
  isThirdPartyResponsibility?: boolean;
  thirdPartyDebtorName?: string;
  amortizations: AmortizationRecord[];
}

const INITIAL_DEBTS: DebtItem[] = [
  {
    id: 'debt-1',
    name: 'Financiamento Imobiliário Residencial',
    creditorType: 'BANK',
    bank: 'Caixa Econômica',
    category: 'IMOBILIARIO',
    originalAmount: 320000,
    currentBalance: 195400,
    totalPaid: 124600,
    totalDiscounts: 18500,
    monthlyPayment: 2650,
    interestRate: '9.4% a.a. + TR',
    interestNumeric: 9.4,
    totalInstallments: 360,
    paidInstallments: 84,
    dueDay: 10,
    startDate: '2019-05-10',
    estimatedEndDate: '2039-05-10',
    status: 'ACTIVE',
    amortizations: [
      { id: 'am-1', date: '15/01/2026', type: 'EXTRAORDINARY', amountPaid: 15000, discountOrSavedInterest: 12000, notes: 'Pagamento com saldo FGTS' },
      { id: 'am-2', date: '20/11/2025', type: 'EXTRAORDINARY', amountPaid: 8000, discountOrSavedInterest: 6500, notes: 'Aporte de 13º Salário' }
    ]
  },
  {
    id: 'debt-2',
    name: 'Financiamento Veicular - Honda Civic',
    creditorType: 'BANK',
    bank: 'Banco Santander',
    category: 'VEICULO',
    originalAmount: 96000,
    currentBalance: 24300,
    totalPaid: 71700,
    totalDiscounts: 4200,
    monthlyPayment: 2000,
    interestRate: '1.45% a.m.',
    interestNumeric: 18.8,
    totalInstallments: 48,
    paidInstallments: 36,
    dueDay: 22,
    startDate: '2023-08-22',
    estimatedEndDate: '2027-08-22',
    status: 'ACTIVE',
    amortizations: [
      { id: 'am-civic-1', date: '22/02/2026', type: 'REGULAR', amountPaid: 1200, discountOrSavedInterest: 800, notes: 'Desconto por amortização antecipada' },
      { id: 'am-civic-2', date: '22/01/2026', type: 'REGULAR', amountPaid: 2000, discountOrSavedInterest: 0, notes: 'Parcela regular paga' },
      { id: 'am-civic-3', date: '10/12/2025', type: 'EXTRAORDINARY', amountPaid: 5000, discountOrSavedInterest: 1800, notes: 'Quitação extraordinária de saldo devedor' }
    ]
  },
  {
    id: 'debt-3',
    name: 'Empréstimo Pessoal (Reforma)',
    creditorType: 'PERSON',
    bank: 'Lucas Ferreira (Amigo)',
    category: 'EMPRESTIMO',
    originalAmount: 15000,
    currentBalance: 4000,
    totalPaid: 11000,
    totalDiscounts: 0,
    monthlyPayment: 1000,
    interestRate: 'Sem Juros (0%)',
    interestNumeric: 0,
    totalInstallments: 15,
    paidInstallments: 11,
    dueDay: 5,
    startDate: '2025-04-05',
    estimatedEndDate: '2026-07-05',
    status: 'ACTIVE',
    amortizations: []
  },
  {
    id: 'debt-4',
    name: 'Consignado Folha de Pagamento',
    creditorType: 'BANK',
    bank: 'Banco do Brasil',
    category: 'CONSIGNADO',
    originalAmount: 25000,
    currentBalance: 0,
    totalPaid: 25000,
    totalDiscounts: 3800,
    monthlyPayment: 0,
    interestRate: '1.20% a.m.',
    interestNumeric: 15.3,
    totalInstallments: 36,
    paidInstallments: 36,
    dueDay: 1,
    startDate: '2022-02-01',
    estimatedEndDate: '2025-02-01',
    status: 'PAID_OFF',
    amortizations: [
      { id: 'am-4', date: '05/01/2025', type: 'EXTRAORDINARY', amountPaid: 6500, discountOrSavedInterest: 1200, notes: 'Quitação total do saldo residual' }
    ]
  },
  {
    id: 'debt-5',
    name: 'Empréstimo Familiar',
    creditorType: 'BANK',
    bank: 'Nubank',
    category: 'EMPRESTIMO',
    originalAmount: 12000,
    currentBalance: 8200,
    totalPaid: 3800,
    totalDiscounts: 0,
    monthlyPayment: 680,
    interestRate: '1.95% a.m.',
    interestNumeric: 26.1,
    totalInstallments: 24,
    paidInstallments: 10,
    dueDay: 15,
    startDate: '2025-10-15',
    estimatedEndDate: '2027-10-15',
    status: 'ACTIVE',
    isThirdPartyResponsibility: true,
    thirdPartyDebtorName: 'Rodrigo (Irmão)',
    amortizations: []
  }
];

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  'IMOBILIARIO': { label: 'Imobiliário', color: 'text-indigo-400' },
  'VEICULO': { label: 'Veicular', color: 'text-cyan-400' },
  'EMPRESTIMO': { label: 'Empréstimo Pessoal', color: 'text-amber-400' },
  'CONSIGNADO': { label: 'Consignado', color: 'text-blue-400' },
  'RENEGOCIACAO': { label: 'Renegociação', color: 'text-pink-400' },
  'OUTROS': { label: 'Outros Passivos', color: 'text-purple-400' }
};

export default function DividasPage() {
  const { isConcealed } = usePrivacy();

  const [debts, setDebts] = useState<DebtItem[]>(INITIAL_DEBTS);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAID_OFF' | 'THIRD_PARTY'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  
  // Modais
  const [isNewDebtModalOpen, setIsNewDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [isAmortizeModalOpen, setIsAmortizeModalOpen] = useState(false);
  const [selectedDebtForAmortize, setSelectedDebtForAmortize] = useState<DebtItem | null>(null);
  const [viewingHistoryDebt, setViewingHistoryDebt] = useState<DebtItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DebtItem | null>(null);

  // Form Nova Dívida / Edição
  const [formName, setFormName] = useState('');
  const [formCreditorType, setFormCreditorType] = useState<'BANK' | 'PERSON'>('PERSON');
  const [formCreditorName, setFormCreditorName] = useState('');
  const [formCategory, setFormCategory] = useState<DebtItem['category']>('EMPRESTIMO');
  const [formOriginalAmount, setFormOriginalAmount] = useState('');
  const [formCurrentBalance, setFormCurrentBalance] = useState('');
  const [formMonthlyPayment, setFormMonthlyPayment] = useState('');
  const [formIsZeroInterest, setFormIsZeroInterest] = useState(true);
  const [formInterestRate, setFormInterestRate] = useState('');
  const [formTotalInstallments, setFormTotalInstallments] = useState('');
  const [formPaidInstallments, setFormPaidInstallments] = useState('');
  const [formDueDay, setFormDueDay] = useState('10');
  const [formIsThirdPartyResponsibility, setFormIsThirdPartyResponsibility] = useState(false);
  const [formThirdPartyDebtorName, setFormThirdPartyDebtorName] = useState('');

  // Form Pagamento
  const [amortizeAmount, setAmortizeAmount] = useState('');
  const [amortizeDiscount, setAmortizeDiscount] = useState('');
  const [amortizeType, setAmortizeType] = useState<'EXTRAORDINARY' | 'REGULAR'>('EXTRAORDINARY');
  const [amortizeNotes, setAmortizeNotes] = useState('');

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // KPIs Totais
  const totalOriginal = useMemo(() => debts.reduce((acc, d) => acc + d.originalAmount, 0), [debts]);
  const totalActiveBalance = useMemo(() => debts.filter(d => d.status === 'ACTIVE').reduce((acc, d) => acc + d.currentBalance, 0), [debts]);
  const totalActiveDebt = totalActiveBalance;
  const totalThirdPartyDebt = useMemo(() => debts.filter(d => d.status === 'ACTIVE' && d.isThirdPartyResponsibility).reduce((acc, d) => acc + d.currentBalance, 0), [debts]);
  const totalMyOwnDebt = Math.max(0, totalActiveBalance - totalThirdPartyDebt);
  const totalPaidSum = useMemo(() => debts.reduce((acc, d) => acc + d.totalPaid, 0), [debts]);
  const totalDiscountsSum = useMemo(() => debts.reduce((acc, d) => acc + d.totalDiscounts, 0), [debts]);
  const totalMonthlyCommitment = useMemo(() => debts.filter(d => d.status === 'ACTIVE').reduce((acc, d) => acc + d.monthlyPayment, 0), [debts]);
  const overallProgressPct = totalOriginal > 0 ? (totalPaidSum / totalOriginal) * 100 : 0;

  // Curva de Evolução & Queda das Dívidas
  const debtDeclineProjection = useMemo(() => {
    return [
      { label: 'Jan/25', balance: 395000, paid: 18000, event: 'Início' },
      { label: 'Jul/25', balance: 352000, paid: 61000, event: '' },
      { label: 'Jan/26', balance: 298000, paid: 115000, event: 'Aporte FGTS' },
      { label: 'Jul/26 (Hoje)', balance: totalActiveBalance, paid: totalPaidSum, event: 'Atual' },
      { label: 'Jan/27', balance: 142000, paid: 271000, event: 'Proj.' },
      { label: 'Jul/27', balance: 98000, paid: 315000, event: 'Quitação Veículo' },
      { label: 'Jan/28', balance: 45000, paid: 368000, event: 'Proj.' },
      { label: 'Jul/28', balance: 0, paid: 413000, event: '100% Livre' },
    ];
  }, [totalActiveBalance, totalPaidSum]);

  const maxProjectionVal = Math.max(...debtDeclineProjection.map(p => p.balance), 400000);
  const svgW = 800;
  const svgH = 85;
  const padX = 35;
  const padY = 16;

  const declinePoints = debtDeclineProjection.map((item, index) => {
    const x = padX + (index * ((svgW - (padX * 2)) / (debtDeclineProjection.length - 1)));
    const y = svgH - padY - ((item.balance / maxProjectionVal) * (svgH - (padY * 2)));
    return { x, y, ...item };
  });

  const pathDecline = declinePoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaDecline = `${pathDecline} L ${declinePoints[declinePoints.length - 1].x},${svgH - padY} L ${declinePoints[0].x},${svgH - padY} Z`;

  // Filtragem da Lista de Dívidas
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (filterStatus === 'ACTIVE' && d.status !== 'ACTIVE') return false;
      if (filterStatus === 'PAID_OFF' && d.status !== 'PAID_OFF') return false;
      if (filterStatus === 'THIRD_PARTY' && !d.isThirdPartyResponsibility) return false;
      if (filterCategory !== 'ALL' && d.category !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          d.name.toLowerCase().includes(q) ||
          d.bank.toLowerCase().includes(q) ||
          (d.thirdPartyDebtorName && d.thirdPartyDebtorName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [debts, filterStatus, filterCategory, searchQuery]);

  // Abertura Modal Nova Dívida
  const handleOpenNewDebt = () => {
    setEditingDebt(null);
    setFormName('');
    setFormCreditorType('BANK');
    setFormCreditorName('');
    setFormCategory('EMPRESTIMO');
    setFormOriginalAmount('');
    setFormCurrentBalance('');
    setFormMonthlyPayment('');
    setFormIsZeroInterest(true);
    setFormInterestRate('');
    setFormTotalInstallments('');
    setFormPaidInstallments('');
    setFormDueDay('10');
    setFormIsThirdPartyResponsibility(false);
    setFormThirdPartyDebtorName('');
    setIsNewDebtModalOpen(true);
  };

  // Abertura Modal Edição
  const handleOpenEditDebt = (d: DebtItem) => {
    setEditingDebt(d);
    setFormName(d.name);
    setFormCreditorType(d.creditorType);
    setFormCreditorName(d.bank);
    setFormCategory(d.category);
    setFormOriginalAmount(d.originalAmount.toString());
    setFormCurrentBalance(d.currentBalance.toString());
    setFormMonthlyPayment(d.monthlyPayment.toString());
    setFormIsZeroInterest(d.interestNumeric === 0);
    setFormInterestRate(d.interestRate);
    setFormTotalInstallments(d.totalInstallments.toString());
    setFormPaidInstallments(d.paidInstallments.toString());
    setFormDueDay(d.dueDay.toString());
    setFormIsThirdPartyResponsibility(!!d.isThirdPartyResponsibility);
    setFormThirdPartyDebtorName(d.thirdPartyDebtorName || '');
    setIsNewDebtModalOpen(true);
  };

  // Salvar Dívida
  const handleSaveDebt = async () => {
    const orig = parseFloat(formOriginalAmount.replace(',', '.')) || 0;
    const cur = parseFloat(formCurrentBalance.replace(',', '.')) || orig;
    const monthly = parseFloat(formMonthlyPayment.replace(',', '.')) || 0;
    const totalInst = parseInt(formTotalInstallments) || 12;
    const paidInst = parseInt(formPaidInstallments) || 0;
    const due = parseInt(formDueDay) || 10;

    if (!formName.trim() || orig <= 0) return;

    const rateStr = formIsZeroInterest ? 'Sem Juros (0%)' : (formInterestRate.trim() || '1.5% a.m.');
    const rateNum = formIsZeroInterest ? 0 : (parseFloat(formInterestRate.replace(',', '.')) || 1.5);
    const isPaid = cur <= 0 || paidInst >= totalInst;

    if (editingDebt) {
      // Salvar no Supabase em segundo plano
      debtsService.updateDebt(editingDebt.id, {
        name: formName.trim(),
        creditor_type: formCreditorType,
        bank: formCreditorName.trim() || (formCreditorType === 'PERSON' ? 'Pessoa Física' : 'Banco'),
        category: formCategory,
        original_amount: orig,
        current_balance: cur,
        monthly_payment: monthly,
        interest_rate: rateStr,
        interest_numeric: rateNum,
        total_installments: totalInst,
        paid_installments: paidInst,
        due_day: due,
        status: isPaid ? 'PAID_OFF' : 'ACTIVE',
        is_third_party_responsibility: formIsThirdPartyResponsibility,
        third_party_debtor_name: formIsThirdPartyResponsibility ? formThirdPartyDebtorName.trim() : undefined
      }).catch(err => console.error('Erro ao atualizar no banco:', err));

      setDebts(prev => prev.map(d => {
        if (d.id !== editingDebt.id) return d;
        return {
          ...d,
          name: formName.trim(),
          creditorType: formCreditorType,
          bank: formCreditorName.trim() || (formCreditorType === 'PERSON' ? 'Pessoa Física' : 'Banco'),
          category: formCategory,
          originalAmount: orig,
          currentBalance: cur,
          monthlyPayment: monthly,
          interestRate: rateStr,
          interestNumeric: rateNum,
          totalInstallments: totalInst,
          paidInstallments: paidInst,
          dueDay: due,
          status: isPaid ? 'PAID_OFF' : 'ACTIVE',
          isThirdPartyResponsibility: formIsThirdPartyResponsibility,
          thirdPartyDebtorName: formIsThirdPartyResponsibility ? formThirdPartyDebtorName.trim() : undefined
        };
      }));
    } else {
      let createdId = 'debt-' + Date.now();
      try {
        const created = await debtsService.createDebt({
          name: formName.trim(),
          creditor_type: formCreditorType,
          bank: formCreditorName.trim() || (formCreditorType === 'PERSON' ? 'Pessoa Física' : 'Banco'),
          category: formCategory,
          original_amount: orig,
          current_balance: cur,
          monthly_payment: monthly,
          total_paid: orig - cur > 0 ? orig - cur : 0,
          total_discounts: 0,
          total_installments: totalInst,
          paid_installments: paidInst,
          interest_rate: rateStr,
          interest_numeric: rateNum,
          due_day: due,
          status: isPaid ? 'PAID_OFF' : 'ACTIVE',
          is_third_party_responsibility: formIsThirdPartyResponsibility,
          third_party_debtor_name: formIsThirdPartyResponsibility ? formThirdPartyDebtorName.trim() : undefined,
          start_date: new Date().toISOString().split('T')[0],
          estimated_end_date: new Date(Date.now() + totalInst * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        });
        if (created) {
          createdId = created.id;
        }
      } catch (err) {
        console.warn('Operando com ID local:', err);
      }

      const newDebt: DebtItem = {
        id: createdId,
        name: formName.trim(),
        creditorType: formCreditorType,
        bank: formCreditorName.trim() || (formCreditorType === 'PERSON' ? 'Pessoa Física' : 'Banco'),
        category: formCategory,
        originalAmount: orig,
        currentBalance: cur,
        totalPaid: orig - cur > 0 ? orig - cur : 0,
        totalDiscounts: 0,
        monthlyPayment: monthly,
        interestRate: rateStr,
        interestNumeric: rateNum,
        totalInstallments: totalInst,
        paidInstallments: paidInst,
        dueDay: due,
        startDate: new Date().toISOString().split('T')[0],
        estimatedEndDate: new Date(Date.now() + totalInst * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: isPaid ? 'PAID_OFF' : 'ACTIVE',
        isThirdPartyResponsibility: formIsThirdPartyResponsibility,
        thirdPartyDebtorName: formIsThirdPartyResponsibility ? formThirdPartyDebtorName.trim() : undefined,
        amortizations: []
      };
      setDebts(prev => [newDebt, ...prev]);
    }

    setIsNewDebtModalOpen(false);
    setEditingDebt(null);
  };

  // Registrar Pagamento
  const handleConfirmAmortization = async () => {
    if (!selectedDebtForAmortize) return;

    const paidVal = parseFloat(amortizeAmount.replace(',', '.')) || 0;
    const discVal = parseFloat(amortizeDiscount.replace(',', '.')) || 0;

    if (paidVal <= 0) return;

    const totalReduction = paidVal + discVal;
    const newBalance = Math.max(0, selectedDebtForAmortize.currentBalance - totalReduction);
    const isNowPaidOff = newBalance <= 0;

    // Persistir no Supabase em segundo plano
    debtsService.addAmortization(selectedDebtForAmortize.id, {
      date: new Date().toLocaleDateString('pt-BR'),
      amountPaid: paidVal,
      discountOrSavedInterest: discVal,
      type: amortizeType,
      notes: amortizeNotes.trim() || (amortizeType === 'EXTRAORDINARY' ? 'Pagamento Extra' : 'Parcela do Mês')
    }).catch(err => console.error('Erro ao salvar amortização:', err));

    const newAmortRecord: AmortizationRecord = {
      id: 'am-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      type: amortizeType,
      amountPaid: paidVal,
      discountOrSavedInterest: discVal,
      notes: amortizeNotes.trim() || (amortizeType === 'EXTRAORDINARY' ? 'Pagamento Extra' : 'Parcela do Mês')
    };

    setDebts(prev => prev.map(d => {
      if (d.id !== selectedDebtForAmortize.id) return d;
      return {
        ...d,
        currentBalance: newBalance,
        totalPaid: d.totalPaid + paidVal,
        totalDiscounts: d.totalDiscounts + discVal,
        status: isNowPaidOff ? 'PAID_OFF' : d.status,
        amortizations: [newAmortRecord, ...d.amortizations]
      };
    }));

    setIsAmortizeModalOpen(false);
    setSelectedDebtForAmortize(null);
    setAmortizeAmount('');
    setAmortizeDiscount('');
    setAmortizeNotes('');
  };

  // Excluir Dívida
  const handleDeleteDebt = (id: string) => {
    debtsService.deleteDebt(id).catch(err => console.error('Erro ao excluir dívida:', err));
    setDebts(prev => prev.filter(d => d.id !== id));
    setDeleteCandidate(null);
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pb-12 space-y-3.5">

        {/* =========================================================================
            1. BENTO GRID KPIS (ORGANIZADOS, COM PADDING E SEM OVERFLOW)
        ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Card 1: Passivo Restante */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1A44C8]/30 hover:shadow-md transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group min-w-0">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider truncate">
                    Passivo Restante
                  </span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                  Saldo Devedor
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#181B22] my-2 tracking-tight truncate flex items-baseline" title={`R$ ${formatCurrency(totalActiveDebt)}`}>
                <span className="text-xs text-[#94A3B8] font-bold mr-1">R$</span>
                {formatCurrency(totalActiveDebt)}
              </h3>
            </div>
            <div className="pt-2.5 border-t border-[#F1F3F7] space-y-1 text-xs">
              <p className="text-[#64748B] flex justify-between gap-2">
                <span className="truncate text-[11px]">Meu Passivo Direto:</span>
                <span className="text-[#181B22] font-bold shrink-0 text-[11px]">R$ {formatCurrency(totalMyOwnDebt)}</span>
              </p>
              {totalThirdPartyDebt > 0 && (
                <p className="text-[#64748B] flex justify-between gap-2">
                  <span className="truncate text-[11px]">De Terceiros:</span>
                  <span className="text-amber-600 font-bold shrink-0 text-[11px]">R$ {formatCurrency(totalThirdPartyDebt)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Total Já Quitado */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1A44C8]/30 hover:shadow-md transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group min-w-0">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8] shadow-sm shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider truncate">
                    Total Já Quitado
                  </span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20 shrink-0">
                  {overallProgressPct.toFixed(0)}% Pago
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1A44C8] my-2 tracking-tight truncate flex items-baseline" title={`+R$ ${formatCurrency(totalPaidSum)}`}>
                <span className="text-xs opacity-75 font-bold mr-1">+R$</span>
                {formatCurrency(totalPaidSum)}
              </h3>
            </div>
            <div className="pt-2.5 border-t border-[#F1F3F7] text-xs text-[#64748B] flex justify-between gap-2">
              <span className="truncate text-[11px]">Original acumulado:</span>
              <span className="text-[#181B22] font-bold shrink-0 text-[11px]">R$ {formatCurrency(totalOriginal)}</span>
            </div>
          </div>

          {/* Card 3: Descontos Obtidos */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1A44C8]/30 hover:shadow-md transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group min-w-0">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/20 flex items-center justify-center text-[#00A3FF] shadow-sm shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider truncate">
                    Descontos Obtidos
                  </span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#00A3FF]/10 text-[#00A3FF] border border-[#00A3FF]/20 shrink-0">
                  Juros Poupados
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#00A3FF] my-2 tracking-tight truncate flex items-baseline" title={`R$ ${formatCurrency(totalDiscountsSum)}`}>
                <span className="text-xs opacity-75 font-bold mr-1">R$</span>
                {formatCurrency(totalDiscountsSum)}
              </h3>
            </div>
            <div className="pt-2.5 border-t border-[#F1F3F7] text-[11px] text-[#64748B] truncate">
              <span>Economia em pagamentos antecipados</span>
            </div>
          </div>

          {/* Card 4: Parcelas no Mês */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1A44C8]/30 hover:shadow-md transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group min-w-0">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm shrink-0">
                    <Clock size={15} />
                  </div>
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider truncate">
                    Parcelas no Mês
                  </span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#F1F3F7] text-[#181B22] border border-[#E5E7EB] shrink-0">
                  Fixo Mensal
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#181B22] my-2 tracking-tight truncate flex items-baseline" title={`R$ ${formatCurrency(totalMonthlyCommitment)}`}>
                <span className="text-xs text-[#94A3B8] font-bold mr-1">R$</span>
                {formatCurrency(totalMonthlyCommitment)}
              </h3>
            </div>
            <div className="pt-2.5 border-t border-[#F1F3F7] text-xs text-[#64748B] flex justify-between gap-2">
              <span className="truncate text-[11px]">Contratos ativos:</span>
              <span className="text-[#181B22] font-bold shrink-0 text-[11px]">{debts.filter(d => d.status === 'ACTIVE').length} em aberto</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TRAJETÓRIA DE QUEDA DO PASSIVO (COMPACTA & ELEGANTE)
        ========================================================================= */}
        <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1A44C8]/30 transition-all duration-300 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#F1F3F7] gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center shrink-0">
                <Activity size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#181B22]">
                    Trajetória de Queda do Passivo
                  </h3>
                  <span className="text-[10px] text-[#64748B] hidden md:inline">• Projeção até zerar</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-[#64748B] font-medium hidden sm:inline">
                Redução: <strong className="text-[#1A44C8] font-bold">-R$ {formatCurrency(totalPaidSum)}</strong>
              </span>
              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20 flex items-center gap-1 shrink-0">
                <ShieldCheck size={11} />
                Quitação: Jul/2028
              </span>
            </div>
          </div>

          <div className="w-full relative pt-2">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-20 sm:h-24 overflow-visible">
              <defs>
                <linearGradient id="declineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.12)" />
                  <stop offset="50%" stopColor="rgba(26,68,200,0.04)" />
                  <stop offset="100%" stopColor="rgba(26,68,200,0)" />
                </linearGradient>
                <linearGradient id="declineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#1A44C8" />
                </linearGradient>
              </defs>

              <line x1={padX} y1={padY} x2={svgW - padX} y2={padY} stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1={padX} y1={svgH / 2} x2={svgW - padX} y2={svgH / 2} stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY} stroke="#E2E8F0" />

              <path d={areaDecline} fill="url(#declineGrad)" />
              <path d={pathDecline} fill="none" stroke="url(#declineStroke)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

              {declinePoints.map((pt, i) => {
                const isCurrent = pt.label.includes('Hoje');
                const isFinal = pt.balance === 0;

                return (
                  <g key={i} className="group cursor-pointer">
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isCurrent ? 5 : isFinal ? 4.5 : 3.5} 
                      fill={isFinal ? '#1A44C8' : isCurrent ? '#F59E0B' : '#FFFFFF'} 
                      stroke={isFinal ? '#FFFFFF' : isCurrent ? '#FFFFFF' : '#EF4444'} 
                      strokeWidth={isCurrent || isFinal ? 2 : 1.5}
                      className="transition-all duration-200 group-hover:r-6 shadow-sm"
                    />
                    
                    {/* Tooltip Hover */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect 
                        x={Math.max(10, Math.min(svgW - 110, pt.x - 50))} 
                        y={Math.max(2, pt.y - 28)} 
                        width="100" 
                        height="20" 
                        rx="5" 
                        fill="#FFFFFF" 
                        stroke="#E2E8F0" 
                        className="shadow-md"
                      />
                      <text 
                        x={Math.max(60, Math.min(svgW - 60, pt.x))} 
                        y={Math.max(15, pt.y - 15)} 
                        textAnchor="middle" 
                        fill="#181B22" 
                        fontSize="9" 
                        fontWeight="bold"
                      >
                        R$ {formatCurrency(pt.balance)}
                      </text>
                    </g>

                    <text 
                      x={pt.x} 
                      y={svgH - 3} 
                      textAnchor="middle" 
                      fill={isCurrent ? '#B45309' : isFinal ? '#1A44C8' : '#94A3B8'} 
                      fontSize="8.5" 
                      fontWeight={isCurrent || isFinal ? 'bold' : 'normal'}
                    >
                      {pt.label.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* =========================================================================
            3. BARRA DE FILTROS & FERRAMENTAS
        ========================================================================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-1">
          
          {/* Segmented Controls / Filtros de Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full md:w-auto pb-1 md:pb-0">
            <div className="flex items-center bg-[#FFFFFF] p-1 rounded-xl border border-[#E5E7EB] shadow-sm shrink-0">
              {(['ALL', 'ACTIVE', 'PAID_OFF', 'THIRD_PARTY'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === tab 
                      ? 'bg-[#1A44C8] text-white shadow-sm' 
                      : 'text-[#64748B] hover:text-[#181B22] hover:bg-[#F1F3F7]'
                  }`}
                >
                  {tab === 'ALL' && 'Todas'}
                  {tab === 'ACTIVE' && 'Ativas'}
                  {tab === 'PAID_OFF' && 'Quitadas'}
                  {tab === 'THIRD_PARTY' && 'Terceiros'}
                </button>
              ))}
            </div>
          </div>

          {/* Busca, Alternador Grid/Tabela & Botão de Nova Dívida */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            
            {/* Campo de Busca */}
            <div className="relative flex-1 md:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar contrato ou credor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] transition-colors shadow-sm font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#181B22]">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Alternador de Visualização (Grid vs Tabela) */}
            <div className="flex items-center bg-[#FFFFFF] p-1 rounded-xl border border-[#E5E7EB] shadow-sm shrink-0">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'GRID' ? 'bg-[#1A44C8]/10 text-[#1A44C8]' : 'text-[#94A3B8] hover:text-[#181B22]'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'TABLE' ? 'bg-[#1A44C8]/10 text-[#1A44C8]' : 'text-[#94A3B8] hover:text-[#181B22]'}`}
                title="Visualização em Tabela"
              >
                <FileSpreadsheet size={14} />
              </button>
            </div>

            {/* Botão de Nova Dívida */}
            <button
              onClick={handleOpenNewDebt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Nova Dívida</span>
            </button>

          </div>

        </div>

        {/* =========================================================================
            4. LISTAGEM COMPLETA DAS DÍVIDAS (CARDS COMPACTOS & MODERNOS)
        ========================================================================= */}
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDebts.map(debt => {
              const progress = debt.originalAmount > 0 ? (debt.totalPaid / debt.originalAmount) * 100 : 0;
              const isPaidOff = debt.status === 'PAID_OFF';
              const isHighPriority = debt.interestNumeric >= 15 && !isPaidOff;
              const isPerson = debt.creditorType === 'PERSON';

              return (
                <div 
                  key={debt.id} 
                  onClick={() => setViewingHistoryDebt(debt)}
                  className={`bg-[#FFFFFF] border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-[#1A44C8]/40 shadow-sm relative overflow-hidden group cursor-pointer min-w-0 ${
                    isPaidOff 
                      ? 'border-[#1A44C8]/20 bg-gradient-to-b from-[#FFFFFF] to-[#1A44C8]/[0.02]' 
                      : isHighPriority 
                        ? 'border-amber-500/30' 
                        : 'border-[#E5E7EB]'
                  }`}
                >
                  <div className="space-y-2.5 min-w-0">
                    {/* Topo do Card: Logo + Título + Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isPerson ? (
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <User size={13} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0 p-0.5">
                            <BankLogo name={debt.bank} size="xs" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors truncate">
                            {debt.name}
                          </h4>
                          <p className="text-[9.5px] text-[#64748B] truncate">
                            {debt.bank} • <span className="font-medium text-slate-500">{CATEGORY_MAP[debt.category]?.label || debt.category}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                        isPaidOff 
                          ? 'bg-[#1A44C8]/10 text-[#1A44C8] border-[#1A44C8]/20' 
                          : isHighPriority
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {isPaidOff ? 'Quitada' : 'Ativa'}
                      </span>
                    </div>

                    {/* Destaque Compacto: Saldo Devedor & Barra */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-xs text-[#64748B]">
                          Saldo: <strong className="text-sm font-extrabold text-[#181B22]">R$ {formatCurrency(debt.currentBalance)}</strong>
                        </span>
                        <span className="text-[9px] font-bold text-[#1A44C8]">
                          {progress.toFixed(0)}% pago
                        </span>
                      </div>

                      {/* Barra de Progresso Fina */}
                      <div className="w-full h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPaidOff 
                              ? 'bg-[#1A44C8]' 
                              : 'bg-gradient-to-r from-[#1A44C8] to-[#00A3FF]'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-[#64748B]">
                        <span>Pago: R$ {formatCurrency(debt.totalPaid)}</span>
                        <span>{debt.paidInstallments}/{debt.totalInstallments} parc.</span>
                      </div>
                    </div>

                    {/* Métricas em Linha Única Compacta */}
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#F1F3F7]">
                      <span className="truncate">Parc: <strong className="text-[#181B22] font-semibold">{debt.monthlyPayment > 0 ? `R$ ${formatCurrency(debt.monthlyPayment)}` : 'Quitada'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Dia {debt.dueDay}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`font-semibold ${debt.interestNumeric === 0 ? 'text-[#1A44C8]' : 'text-amber-700'}`}>{debt.interestRate}</span>
                    </div>
                  </div>

                  {/* Rodapé Compacto */}
                  <div className="pt-2 mt-2 flex items-center justify-between border-t border-[#F1F3F7]">
                    {!isPaidOff ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDebtForAmortize(debt);
                          setIsAmortizeModalOpen(true);
                        }}
                        className="py-0.5 px-2 rounded-lg bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-[10.5px] transition-all flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
                      >
                        <Zap size={10} strokeWidth={2.5} />
                        Pagar
                      </button>
                    ) : (
                      <span className="text-[9.5px] text-[#1A44C8] font-bold flex items-center gap-0.5">
                        <CheckCheck size={11} /> Quitado
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#64748B] group-hover:text-[#1A44C8] transition-colors flex items-center gap-0.5 font-semibold mr-0.5">
                        <FileSpreadsheet size={10} />
                        Planilha
                      </span>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDebt(debt);
                        }}
                        className="p-1 rounded border border-[#E5E7EB] hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] transition-colors bg-[#FFFFFF]"
                        title="Editar"
                      >
                        <Pencil size={10} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCandidate(debt);
                        }}
                        className="p-1 rounded border border-[#E5E7EB] hover:bg-rose-50 text-[#64748B] hover:text-rose-600 transition-colors bg-[#FFFFFF]"
                        title="Excluir"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODO TABELA */
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[9.5px] uppercase tracking-wider text-[#94A3B8] bg-[#F8FAFC]">
                    <th className="py-3 px-4 font-bold">Contrato / Credor</th>
                    <th className="py-3 px-4 font-bold">Categoria</th>
                    <th className="py-3 px-4 font-bold">Taxa de Juros</th>
                    <th className="py-3 px-4 font-bold">Parcelas</th>
                    <th className="py-3 px-4 font-bold text-right">Saldo Restante</th>
                    <th className="py-3 px-4 font-bold text-right">Total Pago</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredDebts.map(debt => {
                    const isPaidOff = debt.status === 'PAID_OFF';
                    const isPerson = debt.creditorType === 'PERSON';

                    return (
                      <tr key={debt.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {isPerson ? (
                              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                                <User size={12} />
                              </div>
                            ) : (
                              <BankLogo name={debt.bank} size="xs" />
                            )}
                            <div>
                              <p className="font-bold text-[#181B22]">{debt.name}</p>
                              <p className="text-[10px] text-[#64748B]">{debt.bank}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#181B22] font-medium">
                          {CATEGORY_MAP[debt.category]?.label || debt.category}
                        </td>
                        <td className="py-3 px-4">
                          <span className={debt.interestNumeric === 0 ? 'text-[#1A44C8] font-bold' : 'text-amber-700 font-bold'}>
                            {debt.interestRate}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B] font-medium">
                          {debt.paidInstallments} / {debt.totalInstallments}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#181B22]">
                          R$ {formatCurrency(debt.currentBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#1A44C8]">
                          R$ {formatCurrency(debt.totalPaid)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border ${
                            isPaidOff 
                              ? 'bg-[#1A44C8]/10 text-[#1A44C8] border-[#1A44C8]/20' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isPaidOff ? 'Quitado' : 'Ativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaidOff && (
                              <button
                                onClick={() => {
                                  setSelectedDebtForAmortize(debt);
                                  setIsAmortizeModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1A44C8] hover:bg-[#1538A5] text-white text-[10px] font-semibold transition-all shadow-sm"
                              >
                                Pagar
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditDebt(debt)}
                              className="p-1 rounded-lg text-[#64748B] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(debt)}
                              className="p-1 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL 1: CADASTRAR OU EDITAR DÍVIDA (SEM BOTÃO X)
      ========================================================================= */}
      {isNewDebtModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <Landmark size={15} className="text-[#1A44C8]" />
                {editingDebt ? 'Editar Contrato de Dívida' : 'Cadastrar Dívida ou Empréstimo Pessoal'}
              </h2>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
              
              {/* Tipo de Credor */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1.5 font-bold">Origem do Empréstimo / Credor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setFormCreditorType('PERSON');
                      setFormIsZeroInterest(true);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formCreditorType === 'PERSON'
                        ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]'
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#1A44C8]/40'
                    }`}
                  >
                    <User size={14} />
                    Pessoa Física (Amigo / Familiar)
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setFormCreditorType('BANK');
                      setFormIsZeroInterest(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formCreditorType === 'BANK'
                        ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]'
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#1A44C8]/40'
                    }`}
                  >
                    <Landmark size={14} />
                    Instituição Financeira / Banco
                  </button>
                </div>
              </div>

              {/* Nome do Contrato */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Título da Dívida / Motivo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Empréstimo Reforma, Financiamento Carro..." 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] transition-colors font-medium"
                />
              </div>

              {/* Nome do Credor ou Banco */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">
                  {formCreditorType === 'PERSON' ? 'Nome da Pessoa (Credor)' : 'Banco ou Financeira'}
                </label>
                <input 
                  type="text" 
                  placeholder={formCreditorType === 'PERSON' ? 'Ex: Lucas Ferreira (Amigo), Tio Carlos...' : 'Ex: Caixa Econômica, Santander, Nubank...'} 
                  value={formCreditorName}
                  onChange={(e) => setFormCreditorName(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] transition-colors font-medium"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Categoria</label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                >
                  <option value="EMPRESTIMO">Empréstimo Pessoal</option>
                  <option value="IMOBILIARIO">Financiamento Imobiliário</option>
                  <option value="VEICULO">Financiamento Veicular</option>
                  <option value="CONSIGNADO">Crédito Consignado</option>
                  <option value="RENEGOCIACAO">Renegociação de Dívida</option>
                  <option value="OUTROS">Outros Passivos</option>
                </select>
              </div>

              {/* Valores: Original e Atual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Valor Original (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0,00" 
                    value={formOriginalAmount}
                    onChange={(e) => {
                      setFormOriginalAmount(e.target.value);
                      if (!formCurrentBalance) setFormCurrentBalance(e.target.value);
                    }}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Saldo Restante Atual (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0,00" 
                    value={formCurrentBalance}
                    onChange={(e) => setFormCurrentBalance(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#1A44C8] rounded-xl px-3 py-2 text-xs text-[#1A44C8] font-extrabold focus:outline-none"
                  />
                </div>
              </div>

              {/* Parcelas e Valor Mensal */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Parcela (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0,00" 
                    value={formMonthlyPayment}
                    onChange={(e) => setFormMonthlyPayment(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Total Parcelas</label>
                  <input 
                    type="number" 
                    placeholder="12" 
                    value={formTotalInstallments}
                    onChange={(e) => setFormTotalInstallments(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Pagas</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={formPaidInstallments}
                    onChange={(e) => setFormPaidInstallments(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                  />
                </div>
              </div>

              {/* Taxa de Juros */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#64748B] font-bold">Taxa de Juros</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#64748B] font-semibold">
                    <input 
                      type="checkbox" 
                      checked={formIsZeroInterest} 
                      onChange={(e) => setFormIsZeroInterest(e.target.checked)}
                      className="rounded bg-[#F1F3F7] border-[#E5E7EB] accent-[#1A44C8]"
                    />
                    <span>Sem Juros (0%)</span>
                  </label>
                </div>
                {!formIsZeroInterest && (
                  <input 
                    type="text" 
                    placeholder="Ex: 1.5% a.m. ou 9.4% a.a." 
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                  />
                )}
              </div>

              {/* Dívida de Terceiro */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#181B22] font-bold">
                  <input 
                    type="checkbox" 
                    checked={formIsThirdPartyResponsibility} 
                    onChange={(e) => setFormIsThirdPartyResponsibility(e.target.checked)}
                    className="rounded bg-[#FFFFFF] border-[#E5E7EB] accent-amber-600"
                  />
                  <span>Esta dívida está no meu nome, mas é paga por outra pessoa</span>
                </label>

                {formIsThirdPartyResponsibility && (
                  <div>
                    <input 
                      type="text" 
                      placeholder="Nome do responsável real (Ex: Irmão, Amigo, Sócio...)" 
                      value={formThirdPartyDebtorName}
                      onChange={(e) => setFormThirdPartyDebtorName(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-amber-300 rounded-xl px-3 py-2 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none font-medium"
                    />
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsNewDebtModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#181B22] transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveDebt}
                className="px-5 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                {editingDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REGISTRAR PAGAMENTO (SEM BOTÃO X)
      ========================================================================= */}
      {isAmortizeModalOpen && selectedDebtForAmortize && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <div>
                <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                  <Zap size={15} className="text-[#1A44C8]" />
                  Registrar Pagamento
                </h2>
                <p className="text-[10px] text-[#64748B] mt-0.5 font-medium">{selectedDebtForAmortize.name}</p>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
              
              {/* Saldo Restante Atual */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-bold">Saldo Restante:</span>
                <span className="font-extrabold text-[#181B22]">R$ {formatCurrency(selectedDebtForAmortize.currentBalance)}</span>
              </div>

              {/* Tipo de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmortizeType('EXTRAORDINARY')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    amortizeType === 'EXTRAORDINARY'
                      ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]'
                      : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  <Sparkles size={13} />
                  Pagamento Extra
                </button>
                <button
                  type="button"
                  onClick={() => setAmortizeType('REGULAR')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    amortizeType === 'REGULAR'
                      ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]'
                      : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  <Clock size={13} />
                  Parcela do Mês
                </button>
              </div>

              {/* Valor Pago */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Valor Efetivamente Pago (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00" 
                  value={amortizeAmount}
                  onChange={(e) => setAmortizeAmount(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#1A44C8] rounded-xl px-3 py-2 text-xs text-[#1A44C8] font-extrabold focus:outline-none"
                />
              </div>

              {/* Desconto / Juros Economizados */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Desconto Obtido / Juros Abatidos (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00 (Opcional)" 
                  value={amortizeDiscount}
                  onChange={(e) => setAmortizeDiscount(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
                <span className="text-[9.5px] text-[#64748B] mt-1 block">O desconto somado ao valor pago reduz diretamente o saldo devedor principal.</span>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Anotação / Origem do Recurso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Pagamento com FGTS, 13º Salário, PIX direto..." 
                  value={amortizeNotes}
                  onChange={(e) => setAmortizeNotes(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
              </div>

            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsAmortizeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#181B22] transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmAmortization}
                className="px-5 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                Confirmar Pagamento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: HISTÓRICO DE PAGAMENTOS (COMPACTO, CLARO & DIRETO)
      ========================================================================= */}
      {viewingHistoryDebt && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-auto animate-scale-in-center">
            
            {/* Cabeçalho Compacto */}
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8] shrink-0 shadow-sm">
                  <FileSpreadsheet size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-xs font-bold text-[#181B22] truncate">
                      {viewingHistoryDebt.name}
                    </h2>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold shrink-0">
                      {CATEGORY_MAP[viewingHistoryDebt.category]?.label || viewingHistoryDebt.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] truncate">
                    {viewingHistoryDebt.bank} • Histórico de Pagamentos & Amortizações
                  </p>
                </div>
              </div>

              {/* Ações do Header */}
              <div className="flex items-center gap-1.5 shrink-0">
                {viewingHistoryDebt.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      const debtToAmortize = viewingHistoryDebt;
                      setViewingHistoryDebt(null);
                      setSelectedDebtForAmortize(debtToAmortize);
                      setIsAmortizeModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1A44C8] hover:bg-[#1538A5] text-white text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                  >
                    <Zap size={11} strokeWidth={2.5} />
                    Pagar
                  </button>
                )}
                <button
                  onClick={() => setViewingHistoryDebt(null)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#E2E8F0] transition-colors"
                  title="Fechar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Resumo Financeiro Claro & Imediato (O que foi pago, descontos e saldo) */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] shrink-0">
              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <span className="text-[9px] text-[#64748B] font-semibold uppercase block">Total Já Pago</span>
                <span className="text-sm font-extrabold text-[#1A44C8] tracking-tight block">
                  R$ {formatCurrency(viewingHistoryDebt.totalPaid)}
                </span>
                <span className="text-[9px] text-[#94A3B8] block mt-0.5">
                  {viewingHistoryDebt.paidInstallments} de {viewingHistoryDebt.totalInstallments} parcelas
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <span className="text-[9px] text-[#64748B] font-semibold uppercase block">Descontos Obtidos</span>
                <span className="text-sm font-extrabold text-[#00A3FF] tracking-tight block">
                  R$ {formatCurrency(viewingHistoryDebt.totalDiscounts)}
                </span>
                <span className="text-[9px] text-emerald-600 font-medium block mt-0.5">
                  Juros economizados
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <span className="text-[9px] text-[#64748B] font-semibold uppercase block">Saldo Restante</span>
                <span className="text-sm font-extrabold text-[#181B22] tracking-tight block">
                  R$ {formatCurrency(viewingHistoryDebt.currentBalance)}
                </span>
                <span className="text-[9px] text-[#94A3B8] block mt-0.5">
                  Valor em aberto
                </span>
              </div>
            </div>

            {/* Tabela de Lançamentos Compacta & Fácil de Ler */}
            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
              {viewingHistoryDebt.amortizations.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-[#E5E7EB] rounded-xl">
                  <FileSpreadsheet size={24} className="mx-auto text-[#94A3B8] mb-1.5" />
                  <p className="text-xs font-bold text-[#181B22]">Nenhum pagamento registrado ainda</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Clique em &quot;Pagar&quot; acima para registrar parcelas ou amortizações extraordinárias.</p>
                </div>
              ) : (
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[9.5px] uppercase tracking-wider text-[#64748B] select-none">
                        <th className="py-2 px-2.5 font-bold w-24">Data</th>
                        <th className="py-2 px-2.5 font-bold">Tipo</th>
                        <th className="py-2 px-2.5 font-bold text-right">Valor Pago</th>
                        <th className="py-2 px-2.5 font-bold text-right">Desconto</th>
                        <th className="py-2 px-2.5 font-bold">Anotação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-[11px]">
                      {viewingHistoryDebt.amortizations.map((am, index) => {
                        return (
                          <tr key={am.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-2 px-2.5 text-[#181B22] font-semibold whitespace-nowrap">
                              <span className="text-[9.5px] text-[#94A3B8] mr-1.5 font-normal">#{index + 1}</span>
                              {am.date}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                am.type === 'EXTRAORDINARY'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-[#1A44C8]/10 text-[#1A44C8] border-[#1A44C8]/20'
                              }`}>
                                {am.type === 'EXTRAORDINARY' ? 'Extra' : 'Parcela'}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-extrabold text-[#181B22] whitespace-nowrap">
                              R$ {formatCurrency(am.amountPaid)}
                            </td>
                            <td className="py-2 px-2.5 text-right whitespace-nowrap">
                              {am.discountOrSavedInterest > 0 ? (
                                <span className="text-[10px] font-bold text-[#00A3FF] bg-[#00A3FF]/10 px-1.5 py-0.5 rounded border border-[#00A3FF]/20">
                                  -R$ {formatCurrency(am.discountOrSavedInterest)}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-[#64748B] text-[10px] truncate max-w-[160px]">
                              {am.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#F8FAFC] border-t-2 border-[#CBD5E1] text-[11px] font-bold">
                        <td colSpan={2} className="py-2 px-2.5 text-right text-[10px] uppercase text-[#64748B]">
                          Totais:
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#181B22] font-black">
                          R$ {formatCurrency(viewingHistoryDebt.amortizations.reduce((acc, a) => acc + a.amountPaid, 0))}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#00A3FF] font-black">
                          -R$ {formatCurrency(viewingHistoryDebt.amortizations.reduce((acc, a) => acc + a.discountOrSavedInterest, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Rodapé Compacto */}
            <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center shrink-0">
              <span className="text-[10px] text-[#64748B]">
                {viewingHistoryDebt.amortizations.length} registro(s) arquivado(s)
              </span>
              <button 
                onClick={() => setViewingHistoryDebt(null)} 
                className="px-4 py-1 rounded-xl text-xs bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-semibold border border-[#E5E7EB] shadow-sm transition-all"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO (SEM BOTÃO X)
      ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 shadow-2xl space-y-4 my-auto animate-scale-in-center">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#181B22]">Excluir Dívida</h3>
                <p className="text-xs text-[#64748B]">Tem certeza que deseja remover?</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB]">
              O contrato <strong className="text-[#181B22]">{deleteCandidate.name}</strong> será excluído permanentemente do painel.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#181B22] font-semibold"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteDebt(deleteCandidate.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
