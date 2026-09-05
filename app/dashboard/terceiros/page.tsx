'use client';

import { useState, useMemo, useEffect } from 'react';
import { thirdPartiesService } from '@/lib/services/thirdParties';
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Search, 
  UserCheck, 
  Trash2, 
  X, 
  DollarSign,
  Layers,
  ArrowRight,
  PieChart,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';

export interface ThirdPartyDebt {
  id: string;
  personName: string;
  personAvatarColor?: string;
  description: string;
  originType: 'CARD' | 'ACCOUNT';
  originBankOrCard: string;
  totalAmount: number;
  paidAmount: number;
  installmentsTotal: number;
  currentInstallment: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  notes?: string;
}

const PERSON_THEMES: Record<string, { bg: string; border: string; glow: string; accent: string; hex: string }> = {
  'Lucas Ferreira': { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200 hover:border-blue-400', 
    glow: 'hover:shadow-md',
    accent: 'text-[#1A44C8]',
    hex: '#1A44C8'
  },
  'Mariana Costa': { 
    bg: 'bg-pink-50', 
    border: 'border-pink-200 hover:border-pink-400', 
    glow: 'hover:shadow-md',
    accent: 'text-pink-600',
    hex: '#EC4899'
  },
  'Rodrigo (Irmão)': { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200 hover:border-blue-400', 
    glow: 'hover:shadow-md',
    accent: 'text-blue-600',
    hex: '#3B6CF0'
  },
  'Carlos Eduardo': { 
    bg: 'bg-purple-50', 
    border: 'border-purple-200 hover:border-purple-400', 
    glow: 'hover:shadow-md',
    accent: 'text-purple-600',
    hex: '#A855F7'
  }
};

const DEFAULT_THEME = {
  bg: 'bg-[#FFFFFF]',
  border: 'border-[#E5E7EB] hover:border-[#1A44C8]/40',
  glow: 'hover:shadow-md',
  accent: 'text-[#1A44C8]',
  hex: '#1A44C8'
};

export default function TerceirosPage() {
  const { isConcealed } = usePrivacy();
  const [debts, setDebts] = useState<ThirdPartyDebt[]>([]);
  
  // Filtros de Lançamentos
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'CARD' | 'ACCOUNT' | 'PENDING' | 'PAID'>('ALL');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  // Modais Funcs
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formPersonName, setFormPersonName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOriginType, setFormOriginType] = useState<'CARD' | 'ACCOUNT'>('CARD');
  const [formBankOrCard, setFormBankOrCard] = useState('Nubank');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formInstallments, setFormInstallments] = useState('1');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dbDebts = await thirdPartiesService.fetchDebts();
        if (dbDebts && dbDebts.length > 0) {
          setDebts(dbDebts.map(d => ({
            id: d.id,
            personName: d.person_name,
            personAvatarColor: 'from-blue-500 to-indigo-600',
            description: d.description,
            originType: d.origin_type,
            originBankOrCard: d.origin_bank_or_card || 'Conta/Cartão',
            totalAmount: d.total_amount,
            paidAmount: d.paid_amount,
            installmentsTotal: d.installments_total,
            currentInstallment: d.current_installment,
            dueDate: d.due_date || 'A combinar',
            status: d.status,
            notes: d.notes,
          })));
        } else {
          setDebts([]);
        }
      } catch (e) {
        console.error('Erro ao buscar dívidas de terceiros do Supabase:', e);
        setDebts([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveDebt = async () => {
    const parsedAmount = parseFloat(formTotalAmount.replace(',', '.')) || 0;
    const installments = parseInt(formInstallments, 10) || 1;
    if (!formPersonName.trim() || !formDesc.trim() || parsedAmount <= 0) return;

    let createdId = 'tp-' + Date.now();
    try {
      const created = await thirdPartiesService.createDebt({
        person_name: formPersonName.trim(),
        description: formDesc.trim(),
        origin_type: formOriginType,
        origin_bank_or_card: formBankOrCard.trim() || 'Conta/Cartão',
        total_amount: parsedAmount,
        paid_amount: 0,
        installments_total: installments,
        current_installment: 0,
        due_date: formDueDate || 'A combinar',
        status: 'PENDING',
        notes: formNotes.trim() || undefined,
      });
      if (created) createdId = created.id;
    } catch (e) {
      console.error('Erro ao cadastrar débito de terceiro no Supabase:', e);
    }

    const newDebt: ThirdPartyDebt = {
      id: createdId,
      personName: formPersonName.trim(),
      personAvatarColor: 'from-blue-500 to-indigo-600',
      description: formDesc.trim(),
      originType: formOriginType,
      originBankOrCard: formBankOrCard.trim() || 'Conta/Cartão',
      totalAmount: parsedAmount,
      paidAmount: 0,
      installmentsTotal: installments,
      currentInstallment: 0,
      dueDate: formDueDate || 'A combinar',
      status: 'PENDING',
      notes: formNotes.trim() || undefined,
    };

    setDebts(prev => [newDebt, ...prev]);
    setIsNewModalOpen(false);
    setFormPersonName('');
    setFormDesc('');
    setFormTotalAmount('');
    setFormInstallments('1');
    setFormDueDate('');
    setFormNotes('');
  };

  const handleSettleDebt = async (debtId: string) => {
    const target = debts.find(d => d.id === debtId);
    if (!target) return;

    try {
      await thirdPartiesService.updateDebt(debtId, {
        paid_amount: target.totalAmount,
        status: 'PAID',
        current_installment: target.installmentsTotal,
      });
    } catch (e) {
      console.error('Erro ao dar baixa no Supabase:', e);
    }

    setDebts(prev => prev.map(d => {
      if (d.id === debtId) {
        return {
          ...d,
          paidAmount: d.totalAmount,
          status: 'PAID',
          currentInstallment: d.installmentsTotal,
        };
      }
      return d;
    }));
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await thirdPartiesService.deleteDebt(debtId);
    } catch (e) {
      console.error('Erro ao excluir débito do Supabase:', e);
    }
    setDebts(prev => prev.filter(d => d.id !== debtId));
  };

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cálculos Globais
  const totalReceivable = useMemo(() => {
    return debts.reduce((acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount), 0);
  }, [debts]);

  const totalSettled = useMemo(() => {
    return debts.reduce((acc, d) => acc + d.paidAmount, 0);
  }, [debts]);

  const cardReceivable = useMemo(() => {
    return debts.filter(d => d.originType === 'CARD').reduce((acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount), 0);
  }, [debts]);

  const accountReceivable = useMemo(() => {
    return debts.filter(d => d.originType === 'ACCOUNT').reduce((acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount), 0);
  }, [debts]);

  // Agrupamento por Pessoa
  const peopleList = useMemo(() => {
    const map = new Map<string, {
      name: string;
      avatarColor: string;
      totalBorrowed: number;
      totalPaid: number;
      totalRemaining: number;
      pendingDebtsCount: number;
      debts: ThirdPartyDebt[];
    }>();

    debts.forEach(d => {
      const remaining = Math.max(0, d.totalAmount - d.paidAmount);
      if (!map.has(d.personName)) {
        map.set(d.personName, {
          name: d.personName,
          avatarColor: d.personAvatarColor || 'from-[#1A44C8] to-[#00A3FF]',
          totalBorrowed: 0,
          totalPaid: 0,
          totalRemaining: 0,
          pendingDebtsCount: 0,
          debts: []
        });
      }

      const p = map.get(d.personName)!;
      p.totalBorrowed += d.totalAmount;
      p.totalPaid += d.paidAmount;
      p.totalRemaining += remaining;
      if (remaining > 0) p.pendingDebtsCount += 1;
      p.debts.push(d);
    });

    return Array.from(map.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [debts]);

  // SVG Donut Chart Logic (Distribuição por Devedor)
  const donutData = useMemo(() => {
    const active = peopleList.filter(p => p.totalRemaining > 0);
    const total = active.reduce((acc, p) => acc + p.totalRemaining, 0) || 1;
    let currentOffset = 0;
    
    return active.map((p, i) => {
      const percentage = p.totalRemaining / total;
      const strokeDasharray = `${percentage * 100} 100`;
      const strokeDashoffset = -currentOffset;
      currentOffset += percentage * 100;
      
      return {
        ...p,
        percentage: percentage * 100,
        strokeDasharray,
        strokeDashoffset,
        color: PERSON_THEMES[p.name]?.hex || DEFAULT_THEME.hex
      };
    });
  }, [peopleList]);

  const [selectedPersonPopup, setSelectedPersonPopup] = useState<string | null>(null);

  // SVG Bar Chart Logic (Por Origem)
  const originData = useMemo(() => {
    const total = cardReceivable + accountReceivable || 1;
    return {
      card: { amount: cardReceivable, pct: (cardReceivable / total) * 100 },
      account: { amount: accountReceivable, pct: (accountReceivable / total) * 100 }
    };
  }, [cardReceivable, accountReceivable]);

  // Lógica de Projeção (Quando a dívida zera)
  const projectionData = useMemo(() => {
    let currentTotal = totalReceivable;
    const months: { label: string; amount: number; isZero?: boolean }[] = [];
    const date = new Date();
    
    // Projeta próximos 6 meses baseados no pagamento das parcelas atuais
    for (let i = 0; i < 7; i++) {
      months.push({
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        amount: currentTotal
      });
      
      // Simula decréscimo baseado nas parcelas ativas (simplificado)
      const monthlyDrop = debts.reduce((acc, d) => {
        if (d.status === 'PAID') return acc;
        const remainingInst = d.installmentsTotal - d.currentInstallment;
        if (remainingInst > i) {
          return acc + ((d.totalAmount - d.paidAmount) / remainingInst);
        }
        return acc;
      }, 0);
      
      currentTotal = Math.max(0, currentTotal - monthlyDrop);
      if (currentTotal === 0) {
        months.push({
          label: new Date(date.setMonth(date.getMonth() + 1)).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          amount: 0,
          isZero: true
        });
        break;
      }
      date.setMonth(date.getMonth() + 1);
    }
    
    return months;
  }, [totalReceivable, debts]);

  // Filtragem da Lista de Lançamentos
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (selectedPersonFilter && d.personName !== selectedPersonFilter) return false;
      if (activeFilterTab === 'CARD' && d.originType !== 'CARD') return false;
      if (activeFilterTab === 'ACCOUNT' && d.originType !== 'ACCOUNT') return false;
      if (activeFilterTab === 'PENDING' && d.status === 'PAID') return false;
      if (activeFilterTab === 'PAID' && d.status === 'PAID') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return d.personName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.originBankOrCard.toLowerCase().includes(q);
      }
      return true;
    });
  }, [debts, activeFilterTab, selectedPersonFilter, searchQuery]);

  const getFilterTabLabel = () => {
    switch (activeFilterTab) {
      case 'ALL': return `Todos (${debts.length})`;
      case 'CARD': return `Cartões`;
      case 'ACCOUNT': return `PIX/Conta`;
      case 'PENDING': return `Abertos`;
      case 'PAID': return `Quitados`;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 space-y-3.5">
      
      {/* ALERTA / HEADER */}
      <div className="flex items-center justify-between gap-4 mb-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-2.5 px-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 relative z-10 min-w-0">
          <span className="text-rose-600 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Evite empréstimos a terceiros
          </span>
          <span className="hidden sm:block text-[#E5E7EB] text-xs">|</span>
          <div className="text-[#64748B] text-[10px] leading-tight flex flex-col gap-0.5">
            <span>Comprometer seu limite ou dinheiro pessoal reduz sua capacidade financeira e aumenta o risco de inadimplência.</span>
            <span>O Cenário ideal é manter esta seção em <strong className="text-[#181B22] font-bold">R$ 0,00</strong>.</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 relative z-10 shrink-0 border-l border-[#E5E7EB] pl-4 ml-2">
          <span className="text-[9px] text-[#94A3B8]">Volume vs. passado:</span>
          <span className="text-[10px] font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-2 py-0.5 rounded border border-[#1A44C8]/20 flex items-center gap-1">
            ↓ 50% <span className="font-semibold text-[#1A44C8]">Redução</span>
          </span>
        </div>
      </div>

      {/* 1. KPIs E GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Main KPI */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="z-10 relative space-y-4">
            <div>
              <h3 className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-1">Total a Receber</h3>
              <div className="text-2xl font-extrabold text-[#181B22] tracking-tight leading-none">
                <span className="text-[#1A44C8] text-sm mr-1">R$</span> 
                {formatCurrency(totalReceivable)}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#64748B] font-medium flex items-center gap-1.5"><CheckCircle2 size={10} className="text-[#1A44C8]"/> Já Recebido</span>
                <span className="text-[#181B22] font-bold">R$ {formatCurrency(totalSettled)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#64748B] font-medium flex items-center gap-1.5"><Layers size={10} className="text-[#94A3B8]"/> Devedores Ativos</span>
                <span className="text-[#181B22] font-bold">{peopleList.filter(p => p.totalRemaining > 0).length} pessoas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Origem da Dívida */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5 mb-4">
            <BarChart3 size={13} className="text-[#1A44C8]" />
            Origem
          </h3>
          
          <div className="space-y-4">
            {/* Cartão */}
            <div className="group">
              <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                <span className="text-[#64748B] flex items-center gap-1"><CreditCard size={10}/> Comprometido Cartão</span>
                <span className="text-[#181B22] font-bold">R$ {formatCurrency(cardReceivable)}</span>
              </div>
              <div className="w-full bg-[#F1F3F7] rounded-full h-1.5 overflow-hidden border border-[#E5E7EB]">
                <div className="bg-[#1A44C8] h-full rounded-full transition-all duration-1000" style={{ width: `${originData.card.pct}%` }}></div>
              </div>
            </div>

            {/* PIX/Conta */}
            <div className="group">
              <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                <span className="text-[#64748B] flex items-center gap-1"><Wallet size={10}/> PIX / Conta Corrente</span>
                <span className="text-[#181B22] font-bold">R$ {formatCurrency(accountReceivable)}</span>
              </div>
              <div className="w-full bg-[#F1F3F7] rounded-full h-1.5 overflow-hidden border border-[#E5E7EB]">
                <div className="bg-[#00A3FF] h-full rounded-full transition-all duration-1000" style={{ width: `${originData.account.pct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Maiores Devedores */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-5 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold text-[#181B22] flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            Maiores Devedores
            <span className="text-[9px] text-[#1A44C8] font-bold">Por saldo</span>
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {donutData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-[10.5px] group cursor-pointer" onClick={() => setSelectedPersonPopup(d.name)}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                  <span className="font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors">{d.name}</span>
                </div>
                <span className="font-extrabold text-[#181B22] group-hover:text-[#1A44C8] transition-colors">R$ {formatCurrency(d.totalRemaining)}</span>
              </div>
            ))}
            {donutData.length === 0 && <span className="text-[#94A3B8] text-xs font-medium">Nenhum devedor ativo.</span>}
          </div>
        </div>

        {/* Gráfico de Projeção de Quitação */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#181B22] flex items-center justify-between mb-2 border-b border-[#E5E7EB] pb-2">
            <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#1A44C8]" /> Previsão</span>
            <span className="text-[9px] text-[#64748B] font-medium">Fim dos empréstimos</span>
          </h3>
          
          <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-1 relative">
            {(() => {
              const zeroMonth = projectionData.find(m => m.isZero) || projectionData[projectionData.length - 1];
              if (!zeroMonth) return null;
              
              const isFar = projectionData.findIndex(m => m.isZero) > 3;

              return (
                <div className="text-center relative z-10">
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1 block font-bold">Zera completamente em</span>
                  <div className={`text-2xl font-extrabold tracking-tight ${isFar ? 'text-amber-600' : 'text-[#1A44C8]'}`}>
                    {zeroMonth.label.toUpperCase()}
                  </div>
                  <div className="mt-2 text-[9px] text-[#64748B] px-3 py-1 bg-[#F1F3F7] rounded-full border border-[#E5E7EB] inline-block font-medium">
                    Manter o fluxo atual de pagamentos
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 2. CARDS COMPACTOS DOS DEVEDORES */}
      <h3 className="text-xs font-bold text-[#181B22] pt-3 ml-1 flex items-center gap-1.5">
        <UsersIcon /> Visualização por Pessoa
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {peopleList.map(person => {
          const isCleared = person.totalRemaining <= 0;

          return (
            <div 
              key={person.name}
              onClick={() => setSelectedPersonPopup(person.name)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group shadow-sm relative overflow-hidden bg-[#FFFFFF] ${
                isCleared 
                  ? 'opacity-60 hover:opacity-100 border-[#E5E7EB]'
                  : 'border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/40'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1A44C8] to-[#00A3FF] flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-inner">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors truncate">
                    {person.name}
                  </h4>
                  <span className="text-[9px] text-[#94A3B8] block truncate font-medium">
                    {person.debts.length} registros
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-baseline">
                <span className="text-[9px] text-[#94A3B8] font-bold">Saldo:</span>
                <span className={`text-[11px] font-extrabold ${isCleared ? 'text-[#94A3B8]' : 'text-[#181B22]'}`}>
                  {isCleared ? 'Quitado' : `R$ ${formatCurrency(person.totalRemaining)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. EXTRATO / LANÇAMENTOS */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-sm mt-4">
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#E5E7EB] mb-3">
          
          <div className="flex items-center relative">
            <div className="flex items-center bg-[#F1F3F7] p-1 rounded-full border border-[#E5E7EB] shadow-sm">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  activeFilterTab !== 'ALL'
                    ? 'bg-[#1A44C8]/10 text-[#1A44C8] shadow-sm border border-[#1A44C8]/20'
                    : 'bg-[#FFFFFF] text-[#181B22] shadow-sm'
                }`}
              >
                <span>{getFilterTabLabel()}</span>
                <ChevronDown size={10} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1.5 w-32 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden z-50 py-1 flex flex-col">
                  {(['ALL', 'CARD', 'ACCOUNT', 'PENDING', 'PAID'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveFilterTab(tab); setIsFilterDropdownOpen(false); }}
                      className={`text-left px-3 py-2 text-[10px] font-bold transition-colors ${
                        activeFilterTab === tab ? 'bg-[#1A44C8]/10 text-[#1A44C8]' : 'text-[#181B22] hover:bg-[#F1F3F7]'
                      }`}
                    >
                      {tab === 'ALL' && 'Todos'}
                      {tab === 'CARD' && 'Cartões'}
                      {tab === 'ACCOUNT' && 'PIX/Conta'}
                      {tab === 'PENDING' && 'Em Aberto'}
                      {tab === 'PAID' && 'Quitados'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Busca Rápida */}
            <div className="relative flex-1 sm:w-56">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar responsável ou desc..."
                className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-full pl-8 pr-3 py-1.5 text-[10px] text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] transition-colors font-medium"
              />
            </div>

            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-[10px] transition-all shadow-md whitespace-nowrap"
            >
              <Plus size={12} className="text-white" />
              Novo Lançamento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[9px] uppercase tracking-wider text-[#94A3B8] font-bold bg-[#F8FAFC]">
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Falta Pagar</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[10.5px]">
              {filteredDebts.length > 0 ? (
                filteredDebts.map(item => {
                  const remaining = Math.max(0, item.totalAmount - item.paidAmount);
                  const isPaid = remaining <= 0 || item.status === 'PAID';

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-2.5 px-3">
                        <span 
                          onClick={() => setSelectedPersonPopup(item.personName)}
                          className="font-bold text-[#181B22] hover:text-[#1A44C8] cursor-pointer transition-colors"
                        >
                          {item.personName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] font-medium">{item.description}</td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-[#181B22] font-semibold text-[10px]">
                          <BankLogo name={item.originBankOrCard} size="xs" />
                          {item.originBankOrCard}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isPaid ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#1A44C8]/20 bg-[#1A44C8]/10 text-[#1A44C8] font-bold">Quitado</span>
                        ) : item.installmentsTotal > 1 ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-bold">Parc. {item.currentInstallment}/{item.installmentsTotal}</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-[#F1F3F7] text-[#64748B] font-bold">Pendente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#181B22]">
                        R$ {formatCurrency(remaining)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <span className="text-[#94A3B8] flex items-center justify-end gap-1 font-bold text-[9px]"><CheckCircle2 size={10} className="text-[#1A44C8]"/> Ok</span>
                          ) : (
                            <button 
                              onClick={() => handleSettleDebt(item.id)}
                              className="px-3 py-1 rounded-full bg-[#1A44C8] hover:bg-[#1538A5] text-white transition-all font-semibold text-[9px] shadow-sm"
                            >
                              Dar Baixa
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDebt(item.id)}
                            className="p-1 rounded text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#94A3B8] text-[11px] font-medium">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHES DO DEVEDOR */}
      {selectedPersonPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPersonPopup(null)}></div>
          <div className="relative bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <UserCheck size={16} className="text-[#1A44C8]" />
                Resumo: {selectedPersonPopup}
              </h3>
              <button onClick={() => setSelectedPersonPopup(null)} className="text-[#94A3B8] hover:text-[#181B22] transition-colors"><X size={16}/></button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {(() => {
                const person = peopleList.find(p => p.name === selectedPersonPopup);
                if (!person) return null;
                const totalPaid = person.totalPaid;
                const totalRemaining = person.totalRemaining;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna Esquerda */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB]">
                          <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Já Pago</span>
                          <div className="text-sm font-extrabold text-[#181B22] mt-1">R$ {formatCurrency(totalPaid)}</div>
                        </div>
                        <div className="bg-[#1A44C8]/5 p-3 rounded-xl border border-[#1A44C8]/20">
                          <span className="text-[10px] text-[#1A44C8] uppercase font-bold">Falta Pagar</span>
                          <div className="text-sm font-extrabold text-[#1A44C8] mt-1">R$ {formatCurrency(totalRemaining)}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[11px] font-bold text-[#181B22] mb-2 border-b border-[#E5E7EB] pb-1">Desmembramento das Dívidas</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {person.debts.map(d => {
                            const rem = Math.max(0, d.totalAmount - d.paidAmount);
                            const remainingInst = d.installmentsTotal - d.currentInstallment;
                            return (
                              <div key={d.id} className="bg-[#F8FAFC] border border-[#E5E7EB] p-2 rounded-lg flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] font-bold text-[#181B22]">{d.description}</span>
                                  <span className="text-[10px] font-extrabold text-[#1A44C8]">R$ {formatCurrency(rem)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] text-[#64748B]">
                                  <span>{d.originBankOrCard} • {d.installmentsTotal > 1 ? `${remainingInst} parc. restantes` : 'À vista'}</span>
                                  {rem === 0 ? <span className="text-[#1A44C8] font-bold">Quitado</span> : <span>Total original: R$ {formatCurrency(d.totalAmount)}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-amber-700 font-bold">Quitação Antecipada (Total):</span>
                        <span className="text-sm font-extrabold text-amber-700">R$ {formatCurrency(totalRemaining)}</span>
                      </div>
                    </div>

                    {/* Coluna Direita: Cronograma */}
                    <div>
                      <h4 className="text-[11px] font-bold text-[#181B22] mb-2 border-b border-[#E5E7EB] pb-1">Cronograma de Pagamentos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                        {(() => {
                          const schedule = [];
                          const today = new Date();
                          let maxInst = 0;
                          person.debts.forEach(d => {
                            if (d.status !== 'PAID') {
                              const rem = d.installmentsTotal - d.currentInstallment;
                              if (rem > maxInst) maxInst = rem;
                            }
                          });
                          
                          for (let i = 0; i < maxInst; i++) {
                            let monthTotal = 0;
                            const monthDate = new Date(today.getFullYear(), today.getMonth() + 1 + i, 1);
                            const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                            
                            const items: string[] = [];
                            person.debts.forEach(d => {
                              if (d.status !== 'PAID') {
                                const rem = d.installmentsTotal - d.currentInstallment;
                                if (rem > i) {
                                  const val = (d.totalAmount - d.paidAmount) / rem;
                                  monthTotal += val;
                                  items.push(`${d.originBankOrCard.split(' ')[0]} (${d.currentInstallment + i + 1}/${d.installmentsTotal})`);
                                }
                              }
                            });
                            
                            if (monthTotal > 0) {
                              schedule.push(
                                <div key={i} className="flex flex-col bg-[#F8FAFC] border border-[#E5E7EB] p-2.5 rounded-lg group hover:bg-[#F1F3F7] transition-colors relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-0.5 h-full bg-[#1A44C8]"></div>
                                  <div className="flex justify-between items-start mb-1.5 pl-1">
                                    <span className="text-[10px] font-bold text-[#181B22] capitalize">{monthLabel}</span>
                                    <span className="text-[10px] font-extrabold text-[#1A44C8] whitespace-nowrap">R$ {formatCurrency(monthTotal)}</span>
                                  </div>
                                  <span className="text-[8px] text-[#64748B] pl-1 leading-snug line-clamp-2" title={items.join(' • ')}>{items.join(' • ')}</span>
                                </div>
                              );
                            }
                          }
                          return schedule.length > 0 ? schedule : <span className="text-[10px] text-[#94A3B8] block py-2 col-span-2 font-medium">Sem pagamentos futuros.</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNewModalOpen(false)}></div>
          <div className="relative bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <Plus size={16} className="text-[#1A44C8]" />
                Novo Lançamento com Terceiro
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#94A3B8] hover:text-[#181B22] transition-colors"><X size={16}/></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Nome do Devedor/Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Lucas Ferreira, Irmão, etc."
                  value={formPersonName}
                  onChange={e => setFormPersonName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Passagem Aérea, Empréstimo PIX"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Tipo de Origem</label>
                  <select
                    value={formOriginType}
                    onChange={e => setFormOriginType(e.target.value as 'CARD' | 'ACCOUNT')}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                  >
                    <option value="CARD">Cartão de Crédito</option>
                    <option value="ACCOUNT">Conta / PIX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Banco ou Cartão</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú"
                    value={formBankOrCard}
                    onChange={e => setFormBankOrCard(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formTotalAmount}
                    onChange={e => setFormTotalAmount(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Qtd. Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={formInstallments}
                    onChange={e => setFormInstallments(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Vencimento / Prazo</label>
                <input
                  type="text"
                  placeholder="Ex: Todo dia 10, 25/08/2026"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="Anotações sobre a combinação"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDebt}
                  className="flex-1 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-bold transition-all shadow-md"
                >
                  Salvar Lançamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return <UserCheck size={11} className="text-[#1A44C8]" />;
}
