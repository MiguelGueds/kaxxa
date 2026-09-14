'use client';

import { useState, useMemo, useEffect } from 'react';
import { thirdPartiesService } from '@/lib/services/thirdParties';
import { accountsService } from '@/lib/services/accounts';
import { cardsService } from '@/lib/services/cards';
import { transactionsService } from '@/lib/services/transactions';
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
  ChevronDown,
  Bike,
  Tag,
  Handshake,
  Receipt,
  Coins,
  Check,
  Calendar,
  Building2,
  ArrowDownLeft
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';
import { PortalModal } from '@/app/components/PortalModal';

export interface ThirdPartyDebt {
  id: string;
  personName: string;
  personAvatarColor?: string;
  description: string;
  originType: 'CARD' | 'ACCOUNT' | 'ASSET_SALE';
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
  const [debts, setDebts] = useState<ThirdPartyDebt[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = thirdPartiesService.getCachedDebts();
    if (!cached || cached.length === 0) return [];
    return cached.map(d => ({
      id: d.id,
      personName: d.person_name,
      personAvatarColor: 'from-blue-500 to-indigo-600',
      description: d.description,
      originType: d.origin_type as 'CARD' | 'ACCOUNT' | 'ASSET_SALE',
      originBankOrCard: d.origin_bank_or_card || (d.origin_type === 'ASSET_SALE' ? 'Venda de Bem' : 'Conta/Cartão'),
      totalAmount: d.total_amount,
      paidAmount: d.paid_amount,
      installmentsTotal: d.installments_total,
      currentInstallment: d.current_installment,
      dueDate: d.due_date || 'A combinar',
      status: d.status,
      notes: d.notes,
    }));
  });
  
  // Filtros de Lançamentos
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'CARD' | 'ACCOUNT' | 'ASSET_SALE' | 'PENDING' | 'PAID'>('ALL');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  // Modais Funcs
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formPersonName, setFormPersonName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOriginType, setFormOriginType] = useState<'CARD' | 'ACCOUNT' | 'ASSET_SALE'>('CARD');
  const [formBankOrCard, setFormBankOrCard] = useState('Nubank');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formInstallments, setFormInstallments] = useState('1');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Baixa / Registrar Recebimento Ampliado
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPersonName, setPaymentPersonName] = useState('');
  const [paymentDebtId, setPaymentDebtId] = useState<string>('ALL');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CASH' | 'BARTER_ASSET' | 'CARD'>('PIX');
  const [paymentAssetNote, setPaymentAssetNote] = useState('');
  const [paymentTargetAccountId, setPaymentTargetAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentToast, setPaymentToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Mantido para compatibilidade com qualquer trigger legado
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<ThirdPartyDebt | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<'PIX' | 'CASH' | 'BARTER_ASSET' | 'CARD'>('PIX');
  const [settleAssetNote, setSettleAssetNote] = useState('');

  // Contas, Cartões e Pessoas registradas do usuário (Carregamento instantâneo via cache)
  const [userAccounts, setUserAccounts] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return accountsService.getCachedAccounts().map(a => ({ id: a.id, name: a.name }));
    } catch {
      return [];
    }
  });
  const [userCards, setUserCards] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return cardsService.getCachedCards().map(c => ({ id: c.id, name: c.name }));
    } catch {
      return [];
    }
  });
  const [registeredPeople, setRegisteredPeople] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return thirdPartiesService.getCachedPeople().map(p => p.name);
    } catch {
      return [];
    }
  });
  const [isCustomPersonName, setIsCustomPersonName] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dbDebts, dbAccounts, dbCards, dbPeople] = await Promise.all([
          thirdPartiesService.fetchDebts(),
          accountsService.fetchAccounts(),
          cardsService.fetchCards(),
          thirdPartiesService.fetchPeople()
        ]);

        if (dbAccounts && dbAccounts.length > 0) {
          setUserAccounts(dbAccounts.map(a => ({ id: a.id, name: a.name })));
        }
        if (dbCards && dbCards.length > 0) {
          setUserCards(dbCards.map(c => ({ id: c.id, name: c.name })));
        }
        if (dbPeople && dbPeople.length > 0) {
          setRegisteredPeople(dbPeople.map(p => p.name));
        }

        if (dbDebts && dbDebts.length > 0) {
          setDebts(dbDebts.map(d => ({
            id: d.id,
            personName: d.person_name,
            personAvatarColor: 'from-blue-500 to-indigo-600',
            description: d.description,
            originType: d.origin_type as 'CARD' | 'ACCOUNT' | 'ASSET_SALE',
            originBankOrCard: d.origin_bank_or_card || (d.origin_type === 'ASSET_SALE' ? 'Venda de Bem' : 'Conta/Cartão'),
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

  const handleOpenNewModal = () => {
    setIsCustomPersonName(false);
    if (availablePeopleList.length > 0) {
      setFormPersonName(availablePeopleList[0]);
    } else {
      setFormPersonName('');
    }
    setFormDesc('');
    setFormTotalAmount('');
    setFormInstallments('');
    setFormDueDate('');
    setFormNotes('');
    if (userCards.length > 0) {
      setFormOriginType('CARD');
      setFormBankOrCard(userCards[0].name);
    } else if (userAccounts.length > 0) {
      setFormOriginType('ACCOUNT');
      setFormBankOrCard(userAccounts[0].name);
    } else {
      setFormOriginType('CARD');
      setFormBankOrCard('');
    }
    setIsNewModalOpen(true);
  };

  const handleSaveDebt = async () => {
    const parsedAmount = parseFloat(formTotalAmount.replace(',', '.')) || 0;
    const installments = parseInt(formInstallments, 10) > 0 ? parseInt(formInstallments, 10) : 1;
    const trimmedPersonName = formPersonName.trim();
    if (!trimmedPersonName || !formDesc.trim() || parsedAmount <= 0) return;

    if (isCustomPersonName && trimmedPersonName) {
      thirdPartiesService.createPerson(trimmedPersonName).catch(e => console.error('Erro ao salvar nova pessoa:', e));
      if (!registeredPeople.includes(trimmedPersonName)) {
        setRegisteredPeople(prev => [...prev, trimmedPersonName]);
      }
    }

    let createdId = 'tp-' + Date.now();
    const finalOriginBank = formOriginType === 'ASSET_SALE' 
      ? 'Venda de Bem'
      : (formBankOrCard.trim() || 'Conta/Cartão');

    try {
      const created = await thirdPartiesService.createDebt({
        person_name: trimmedPersonName,
        description: formDesc.trim(),
        origin_type: formOriginType,
        origin_bank_or_card: finalOriginBank,
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
      originBankOrCard: finalOriginBank,
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
    setFormInstallments('');
    setFormDueDate('');
    setFormNotes('');
  };

  const handleOpenPayDebtModal = (debt: ThirdPartyDebt) => {
    setPaymentPersonName(debt.personName);
    setPaymentDebtId(debt.id);
    const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
    setPaymentAmount(remaining.toString());
    setPaymentMethod('PIX');
    setPaymentAssetNote('');
    setPaymentTargetAccountId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const handleOpenSettleModal = (debt: ThirdPartyDebt) => {
    handleOpenPayDebtModal(debt);
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

  // Lista de pessoas disponíveis para seleção
  const availablePeopleList = useMemo(() => {
    const set = new Set<string>();
    registeredPeople.forEach(name => {
      if (name && name.trim()) set.add(name.trim());
    });
    debts.forEach(d => {
      if (d.personName && d.personName.trim()) set.add(d.personName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [registeredPeople, debts]);

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

  // Lista de devedores com saldo em aberto
  const peopleWithPendingBalance = useMemo(() => {
    return peopleList.filter(p => p.totalRemaining > 0);
  }, [peopleList]);

  // Lista de dívidas abertas da pessoa selecionada no modal de pagamento
  const selectedPersonPendingDebts = useMemo(() => {
    if (!paymentPersonName) return [];
    return debts.filter(d => d.personName === paymentPersonName && d.status !== 'PAID');
  }, [debts, paymentPersonName]);

  const handleOpenGlobalPaymentModal = () => {
    const defaultPerson = selectedPersonFilter 
      ? peopleList.find(p => p.name === selectedPersonFilter)
      : (peopleWithPendingBalance[0] || peopleList[0]);
    
    const personName = defaultPerson ? defaultPerson.name : (availablePeopleList[0] || '');
    setPaymentPersonName(personName);
    setPaymentDebtId('ALL');
    setPaymentAmount(defaultPerson ? Math.max(0, defaultPerson.totalRemaining).toString() : '');
    setPaymentMethod('PIX');
    setPaymentAssetNote('');
    setPaymentTargetAccountId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPayPersonModal = (person: { name: string; totalRemaining: number }) => {
    setPaymentPersonName(person.name);
    setPaymentDebtId('ALL');
    setPaymentAmount(Math.max(0, person.totalRemaining).toString());
    setPaymentMethod('PIX');
    setPaymentAssetNote('');
    setPaymentTargetAccountId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const handleSelectPaymentPerson = (name: string) => {
    setPaymentPersonName(name);
    setPaymentDebtId('ALL');
    const p = peopleList.find(item => item.name === name);
    setPaymentAmount(p ? Math.max(0, p.totalRemaining).toString() : '');
  };

  const handleSelectPaymentDebt = (debtId: string) => {
    setPaymentDebtId(debtId);
    if (debtId === 'ALL') {
      const p = peopleList.find(item => item.name === paymentPersonName);
      setPaymentAmount(p ? Math.max(0, p.totalRemaining).toString() : '');
    } else {
      const d = debts.find(item => item.id === debtId);
      if (d) {
        setPaymentAmount(Math.max(0, d.totalAmount - d.paidAmount).toString());
      }
    }
  };

  const handleConfirmPayment = async () => {
    const amountVal = parseFloat(paymentAmount.replace(',', '.')) || 0;
    if (amountVal <= 0 || !paymentPersonName.trim()) return;

    const methodLabels: Record<string, string> = {
      PIX: 'PIX/Transferência',
      CASH: 'Dinheiro Vivo',
      BARTER_ASSET: `Abatimento por Bem (${paymentAssetNote.trim() || 'Objeto em troca'})`,
      CARD: 'Cartão/Outros'
    };
    const methodText = methodLabels[paymentMethod] || 'PIX';
    const nowStr = paymentDate ? new Date(paymentDate + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const paymentLog = `[Baixa R$ ${amountVal.toFixed(2)} via ${methodText} em ${nowStr}]`;

    try {
      if (paymentDebtId !== 'ALL') {
        const debt = debts.find(d => d.id === paymentDebtId);
        if (debt) {
          const newPaidAmount = Math.min(debt.totalAmount, debt.paidAmount + amountVal);
          const isFullPaid = newPaidAmount >= debt.totalAmount;
          const newStatus: 'PAID' | 'PARTIAL' = isFullPaid ? 'PAID' : 'PARTIAL';
          const updatedNotes = debt.notes ? `${debt.notes}\n${paymentLog}` : paymentLog;

          await thirdPartiesService.updateDebt(debt.id, {
            paid_amount: newPaidAmount,
            status: newStatus,
            notes: updatedNotes,
          });

          setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, paidAmount: newPaidAmount, status: newStatus, notes: updatedNotes } : d));
        }
      } else {
        // Amortização distribuída
        let remainingToDistribute = amountVal;
        const personPendingDebts = debts
          .filter(d => d.personName === paymentPersonName && d.status !== 'PAID')
          .sort((a, b) => (b.totalAmount - b.paidAmount) - (a.totalAmount - a.paidAmount));

        const updatedDebtIds: { id: string; paid: number; status: 'PAID' | 'PARTIAL'; notes: string }[] = [];

        for (const debt of personPendingDebts) {
          if (remainingToDistribute <= 0) break;
          const debtRem = Math.max(0, debt.totalAmount - debt.paidAmount);
          const applyVal = Math.min(debtRem, remainingToDistribute);
          const newPaid = debt.paidAmount + applyVal;
          const newStatus: 'PAID' | 'PARTIAL' = newPaid >= debt.totalAmount ? 'PAID' : 'PARTIAL';
          const updatedNotes = debt.notes ? `${debt.notes}\n${paymentLog}` : paymentLog;

          await thirdPartiesService.updateDebt(debt.id, {
            paid_amount: newPaid,
            status: newStatus,
            notes: updatedNotes,
          });

          updatedDebtIds.push({ id: debt.id, paid: newPaid, status: newStatus, notes: updatedNotes });
          remainingToDistribute -= applyVal;
        }

        if (updatedDebtIds.length > 0) {
          setDebts(prev => prev.map(d => {
            const found = updatedDebtIds.find(u => u.id === d.id);
            return found ? { ...d, paidAmount: found.paid, status: found.status, notes: found.notes } : d;
          }));
        }
      }

      // Credita na conta bancária/carteira selecionada pelo usuário
      if (paymentTargetAccountId) {
        try {
          await accountsService.updateBalance(paymentTargetAccountId, amountVal);
          await transactionsService.createTransaction({
            description: `Recebimento de Terceiro - ${paymentPersonName}`,
            amount: amountVal,
            type: 'INCOME',
            date: paymentDate || new Date().toISOString().split('T')[0],
            account_id: paymentTargetAccountId,
            is_paid: true,
            notes: `Forma: ${methodText}`,
          });
        } catch (accErr) {
          console.warn('Erro ao creditar recebimento na conta:', accErr);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kaxxa_refresh_data'));
      }

      setPaymentToast({
        message: `Recebimento de R$ ${amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cadastrado com sucesso!`,
        type: 'success'
      });
      setTimeout(() => setPaymentToast(null), 4000);
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      setPaymentToast({
        message: 'Falha ao registrar pagamento. Tente novamente.',
        type: 'error'
      });
      setTimeout(() => setPaymentToast(null), 4000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 space-y-4">
      
      {/* TOAST DE FEEDBACK DE PAGAMENTO */}
      {paymentToast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-fade-in-down shadow-md ${
          paymentToast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={paymentToast.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
            <span>{paymentToast.message}</span>
          </div>
          <button onClick={() => setPaymentToast(null)} className="opacity-70 hover:opacity-100 p-1"><X size={14}/></button>
        </div>
      )}

      {/* ALERTA / HEADER */}
      <div className="flex items-center justify-between gap-4 mb-2 card-luxury-float rounded-xl p-3 px-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 relative z-10 min-w-0">
          <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Evite empréstimos a terceiros
          </span>
          <span className="hidden sm:block text-slate-300 dark:text-zinc-700 text-xs">|</span>
          <div className="text-slate-500 dark:text-zinc-400 text-[10.5px] leading-tight flex flex-col gap-0.5">
            <span>Comprometer seu limite ou dinheiro pessoal reduz sua capacidade financeira e aumenta o risco de inadimplência.</span>
            <span>O Cenário ideal é manter esta seção em <strong className="text-slate-900 dark:text-white font-bold">R$ 0,00</strong>.</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 relative z-10 shrink-0 border-l border-slate-200 dark:border-white/[0.08] pl-4 ml-2">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">Status da carteira:</span>
          <span className="text-[10px] font-semibold text-[#0047FF] bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 flex items-center gap-1">
            Gestão Ativa
          </span>
        </div>
      </div>

      {/* 1. KPIs E GRÁFICOS FLUTUANTES (LUXURY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Main KPI */}
        <div className="card-luxury-float rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="z-10 relative space-y-4">
            <div>
              <h3 className="text-slate-400 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Total a Receber</h3>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                <span className="text-[#0047FF] text-sm mr-1 font-bold">R$</span> 
                {formatCurrency(totalReceivable)}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-500"/> Já Recebido</span>
                <span className="text-slate-900 dark:text-white font-bold">R$ {formatCurrency(totalSettled)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1.5"><Layers size={11} className="text-slate-400 dark:text-zinc-500"/> Devedores Ativos</span>
                <span className="text-slate-900 dark:text-white font-bold">{peopleList.filter(p => p.totalRemaining > 0).length} pessoas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Origem da Dívida */}
        <div className="card-luxury-float rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-4">
            <BarChart3 size={13} className="text-[#0047FF]" />
            Origem da Dívida
          </h3>
          
          <div className="space-y-4">
            {/* Cartão */}
            <div className="group">
              <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1"><CreditCard size={11}/> Comprometido Cartão</span>
                <span className="text-slate-900 dark:text-white font-bold">R$ {formatCurrency(cardReceivable)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-slate-200/80 dark:border-white/[0.06]">
                <div className="bg-[#0047FF] h-full rounded-full transition-all duration-1000" style={{ width: `${originData.card.pct}%` }}></div>
              </div>
            </div>

            {/* PIX/Conta */}
            <div className="group">
              <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1"><Wallet size={11}/> PIX / Conta Corrente</span>
                <span className="text-slate-900 dark:text-white font-bold">R$ {formatCurrency(accountReceivable)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-slate-200/80 dark:border-white/[0.06]">
                <div className="bg-[#00A3FF] h-full rounded-full transition-all duration-1000" style={{ width: `${originData.account.pct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Maiores Devedores */}
        <div className="card-luxury-float rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
            Maiores Devedores
            <span className="text-[9px] text-[#0047FF] font-semibold">Por saldo</span>
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {donutData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-[10.5px] group cursor-pointer" onClick={() => setSelectedPersonPopup(d.name)}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#0047FF] transition-colors">{d.name}</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-[#0047FF] transition-colors">R$ {formatCurrency(d.totalRemaining)}</span>
              </div>
            ))}
            {donutData.length === 0 && <span className="text-slate-400 dark:text-zinc-500 text-xs font-medium">Nenhum devedor ativo.</span>}
          </div>
        </div>

        {/* Gráfico de Projeção de Quitação */}
        <div className="card-luxury-float rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between mb-2 border-b border-slate-100 dark:border-white/[0.06] pb-2">
            <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#0047FF]" /> Previsão</span>
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">Fim dos empréstimos</span>
          </h3>
          
          <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-1 relative">
            {(() => {
              const zeroMonth = projectionData.find(m => m.isZero) || projectionData[projectionData.length - 1];
              if (!zeroMonth) return null;
              
              const isFar = projectionData.findIndex(m => m.isZero) > 3;

              return (
                <div className="text-center relative z-10">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Zera completamente em</span>
                  <div className={`text-2xl font-extrabold tracking-tight ${isFar ? 'text-amber-600 dark:text-amber-400' : 'text-[#0047FF]'}`}>
                    {zeroMonth.label.toUpperCase()}
                  </div>
                  <div className="mt-2 text-[9.5px] text-slate-500 dark:text-zinc-400 px-3 py-1 bg-slate-100 dark:bg-white/[0.05] rounded-lg border border-slate-200/80 dark:border-white/[0.08] inline-block font-medium">
                    Manter o fluxo atual de pagamentos
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 2. CARDS COMPACTOS DOS DEVEDORES */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-white pt-2 ml-1 flex items-center gap-1.5">
        <UsersIcon /> Visualização por Pessoa
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {peopleList.map(person => {
          const isCleared = person.totalRemaining <= 0;

          return (
            <div 
              key={person.name}
              onClick={() => setSelectedPersonPopup(person.name)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden card-luxury-float ${
                isCleared 
                  ? 'opacity-60 hover:opacity-100'
                  : 'hover:border-[#0047FF]/50'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0031B8] to-[#00A3FF] flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#0047FF] transition-colors truncate">
                    {person.name}
                  </h4>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate font-medium">
                    {person.debts.length} registros
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex justify-between items-center gap-1.5">
                <div className="min-w-0">
                  <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-bold block leading-none mb-0.5">Saldo:</span>
                  <span className={`text-[11px] font-extrabold truncate block ${isCleared ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-900 dark:text-white'}`}>
                    {isCleared ? 'Quitado' : `R$ ${formatCurrency(person.totalRemaining)}`}
                  </span>
                </div>
                {!isCleared && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPayPersonModal(person);
                    }}
                    className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#0031B8] to-[#0047FF] hover:from-[#002796] hover:to-[#003FE6] text-white text-[9.5px] font-medium transition-all shadow-xs flex items-center gap-1 active:scale-95 shrink-0"
                    title="Registrar pagamento desta pessoa"
                  >
                    <Coins size={10} />
                    Receber
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. EXTRATO / LANÇAMENTOS */}
      <div className="card-luxury-float rounded-2xl p-4 sm:p-5 shadow-sm mt-4">
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.06] mb-3.5">
          
          <div className="flex items-center relative">
            <div className="flex items-center bg-slate-100/70 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  activeFilterTab !== 'ALL'
                    ? 'bg-blue-500/15 text-[#0047FF] shadow-2xs border border-blue-500/20'
                    : 'bg-white dark:bg-[#0C1018] text-slate-800 dark:text-white shadow-2xs'
                }`}
              >
                <span>{getFilterTabLabel()}</span>
                <ChevronDown size={11} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-white dark:bg-[#0C1018] border border-slate-200/90 dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50 py-1 flex flex-col">
                  {(['ALL', 'CARD', 'ACCOUNT', 'PENDING', 'PAID'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveFilterTab(tab); setIsFilterDropdownOpen(false); }}
                      className={`text-left px-3 py-2 text-[11px] font-medium transition-colors ${
                        activeFilterTab === tab ? 'bg-blue-500/10 text-[#0047FF] font-semibold' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
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
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar responsável ou desc..."
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0047FF] transition-colors font-normal"
              />
            </div>

            {/* Botão Registrar Pagamento */}
            <button 
              type="button"
              onClick={handleOpenGlobalPaymentModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0031B8] via-[#0047FF] to-[#0055FF] hover:from-[#002796] hover:to-[#003FE6] text-white font-medium text-xs transition-all shadow-sm shadow-blue-600/25 active:scale-95 whitespace-nowrap"
              title="Registrar pagamento recebido de terceiro"
            >
              <Coins size={13} className="text-white" />
              <span>Registrar Pagamento</span>
            </button>

            {/* Botão Novo Lançamento */}
            <button 
              type="button"
              onClick={handleOpenNewModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-normal text-xs transition-all shadow-2xs active:scale-95 whitespace-nowrap"
            >
              <Plus size={13} />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-[9.5px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Falta Pagar</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs font-light">
              {filteredDebts.length > 0 ? (
                filteredDebts.map(item => {
                  const remaining = Math.max(0, item.totalAmount - item.paidAmount);
                  const isPaid = remaining <= 0 || item.status === 'PAID';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-2.5 px-3">
                        <span 
                          onClick={() => setSelectedPersonPopup(item.personName)}
                          className="font-medium text-slate-900 dark:text-white hover:text-[#0047FF] cursor-pointer transition-colors"
                        >
                          {item.personName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 font-normal">{item.description}</td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium text-[11px]">
                          <BankLogo name={item.originBankOrCard} size="xs" />
                          {item.originBankOrCard}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isPaid ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Quitado</span>
                        ) : item.installmentsTotal > 1 ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Parc. {item.currentInstallment}/{item.installmentsTotal}</span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 font-medium">Pendente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-white">
                        R$ {formatCurrency(remaining)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-medium text-[10px]"><Check size={12} className="text-emerald-500"/> Liquidado</span>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleOpenPayDebtModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0031B8] to-[#0047FF] hover:from-[#002796] hover:to-[#003FE6] text-white transition-all font-medium text-[9.5px] shadow-xs flex items-center gap-1 active:scale-95"
                            >
                              <Coins size={10} />
                              Dar Baixa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDebt(item.id)}
                            className="p-1 rounded-lg text-slate-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
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
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setSelectedPersonPopup(null)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="relative bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[88vh] m-auto animate-scale-in-center shrink-0"
            >
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
                          <h4 className="text-[11px] font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-100 dark:border-white/[0.06] pb-1">Desmembramento das Dívidas</h4>
                          <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                            {person.debts.map(d => {
                              const rem = Math.max(0, d.totalAmount - d.paidAmount);
                              const remainingInst = d.installmentsTotal - d.currentInstallment;
                              return (
                                <div key={d.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] p-2.5 rounded-xl flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{d.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9.5px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                      <span>{d.originBankOrCard}</span>
                                      <span>•</span>
                                      <span>{d.installmentsTotal > 1 ? `${remainingInst} parc. restantes` : 'Saldo em aberto'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      R$ {formatCurrency(rem)}
                                    </span>
                                    {rem > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPayDebtModal(d)}
                                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0031B8] to-[#0047FF] hover:from-[#002796] hover:to-[#003FE6] text-white text-[9.5px] font-medium transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                        title="Dar baixa neste lançamento"
                                      >
                                        <Coins size={10} />
                                        Dar Baixa
                                      </button>
                                    ) : (
                                      <span className="text-emerald-600 dark:text-emerald-400 text-[9.5px] font-medium flex items-center gap-1">
                                        <Check size={11} /> Quitado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 p-3 rounded-xl flex items-center justify-between mt-auto">
                          <div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block">Quitação Total em Aberto:</span>
                            <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">R$ {formatCurrency(totalRemaining)}</span>
                          </div>
                          {totalRemaining > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayPersonModal(person)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Coins size={13} />
                              Quitar Tudo
                            </button>
                          )}
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
        </PortalModal>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {isNewModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsNewModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="relative bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[88vh] m-auto animate-scale-in-center shrink-0"
            >
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <Plus size={16} className="text-[#1A44C8]" />
                Novo Lançamento com Terceiro
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#94A3B8] hover:text-[#181B22] transition-colors"><X size={16}/></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Nome do Devedor/Responsável</label>
                {!isCustomPersonName ? (
                  <select
                    value={formPersonName}
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomPersonName(true);
                        setFormPersonName('');
                      } else {
                        setFormPersonName(e.target.value);
                      }
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-bold"
                  >
                    {availablePeopleList.length === 0 && (
                      <option value="" disabled>Selecione ou cadastre...</option>
                    )}
                    {availablePeopleList.map((personName, idx) => (
                      <option key={idx} value={personName}>{personName}</option>
                    ))}
                    <option value="__NEW__">+ Digitar Novo Nome / Cadastrar Pessoa...</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Ex: Lucas Ferreira, Irmão, etc."
                      value={formPersonName}
                      onChange={e => setFormPersonName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPersonName(false);
                        setFormPersonName(availablePeopleList[0] || '');
                      }}
                      className="text-[10px] text-[#1A44C8] font-semibold hover:underline block"
                    >
                      ← Selecionar da lista suspensa
                    </button>
                  </div>
                )}
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

              {formOriginType === 'ASSET_SALE' ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Tipo / Origem da Negociação</label>
                  <select
                    value={formOriginType}
                    onChange={e => {
                      const val = e.target.value as 'CARD' | 'ACCOUNT' | 'ASSET_SALE';
                      setFormOriginType(val);
                      if (val === 'CARD' && userCards.length > 0) setFormBankOrCard(userCards[0].name);
                      else if (val === 'ACCOUNT' && userAccounts.length > 0) setFormBankOrCard(userAccounts[0].name);
                      else if (val === 'ASSET_SALE') setFormBankOrCard('Venda de Bem');
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-bold cursor-pointer"
                  >
                    <option value="CARD">💳 Cartão de Crédito</option>
                    <option value="ACCOUNT">🏦 Conta Bancária / PIX</option>
                    <option value="ASSET_SALE">🏍️ Venda de Bem</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] mb-1">Tipo / Origem da Negociação</label>
                    <select
                      value={formOriginType}
                      onChange={e => {
                        const val = e.target.value as 'CARD' | 'ACCOUNT' | 'ASSET_SALE';
                        setFormOriginType(val);
                        if (val === 'CARD' && userCards.length > 0) setFormBankOrCard(userCards[0].name);
                        else if (val === 'ACCOUNT' && userAccounts.length > 0) setFormBankOrCard(userAccounts[0].name);
                        else if (val === 'ASSET_SALE') setFormBankOrCard('Venda de Bem');
                      }}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-bold cursor-pointer"
                    >
                      <option value="CARD">💳 Cartão de Crédito</option>
                      <option value="ACCOUNT">🏦 Conta Bancária / PIX</option>
                      <option value="ASSET_SALE">🏍️ Venda de Bem</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                      {formOriginType === 'CARD' ? 'Cartão Usado' : 'Conta Usada'}
                    </label>
                    {formOriginType === 'CARD' ? (
                      userCards.length > 0 ? (
                        <select
                          value={formBankOrCard}
                          onChange={e => setFormBankOrCard(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium cursor-pointer"
                        >
                          {userCards.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nenhum cartão cadastrado"
                          value={formBankOrCard}
                          onChange={e => setFormBankOrCard(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                        />
                      )
                    ) : (
                      userAccounts.length > 0 ? (
                        <select
                          value={formBankOrCard}
                          onChange={e => setFormBankOrCard(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium cursor-pointer"
                        >
                          {userAccounts.map(a => (
                            <option key={a.id} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nenhuma conta cadastrada"
                          value={formBankOrCard}
                          onChange={e => setFormBankOrCard(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formTotalAmount}
                    onChange={e => setFormTotalAmount(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] font-bold focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    Qtd. Parcelas <span className="text-[#94A3B8] font-normal text-[9px]">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Sem parcelas (valor aberto)"
                    value={formInstallments}
                    onChange={e => setFormInstallments(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Vencimento / Prazo <span className="text-[#94A3B8] font-normal text-[9px]">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Todo dia 10, 25/08/2026 (ou deixe vazio se a combinar)"
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
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#F1F3F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDebt}
                className="flex-1 py-2 px-3 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-xs shadow-md"
              >
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      </PortalModal>
    )}

      {/* MODAL PRINCIPAL: REGISTRAR PAGAMENTO / BAIXA DE TERCEIROS */}
      {isPaymentModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsPaymentModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="relative bg-[#FFFFFF] dark:bg-[#0C1018] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[88dvh] m-auto animate-scale-in-center shrink-0"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0047FF]">
                    <Coins size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Registrar Pagamento / Baixa
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal">
                      Abata dívidas de terceiros e atualize seus saldos
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={16}/>
                </button>
              </div>

              {/* Corpo do Formulário */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* 1. Selecionar Pessoa */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                    Pessoa Devedora
                  </label>
                  <select
                    value={paymentPersonName}
                    onChange={e => handleSelectPaymentPerson(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0047FF] transition-colors cursor-pointer"
                  >
                    {availablePeopleList.map(name => {
                      const p = peopleList.find(item => item.name === name);
                      const rem = p ? p.totalRemaining : 0;
                      return (
                        <option key={name} value={name}>
                          {name} {rem > 0 ? `(Em aberto: R$ ${rem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : '(Quitado)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Selecionar Dívida Específica ou Quitação Geral */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                    Qual lançamento abater?
                  </label>
                  <select
                    value={paymentDebtId}
                    onChange={e => handleSelectPaymentDebt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0047FF] transition-colors cursor-pointer"
                  >
                    <option value="ALL">
                      ⭐ Amortização / Quitação Geral (Saldo Total)
                    </option>
                    {selectedPersonPendingDebts.map(d => {
                      const rem = Math.max(0, d.totalAmount - d.paidAmount);
                      return (
                        <option key={d.id} value={d.id}>
                          {d.description} - {d.originBankOrCard} (Resta: R$ {rem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 3. Valor Recebido */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                    Valor Recebido / Abatido (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-zinc-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-[#0047FF] transition-colors"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                    Você pode registrar qualquer valor parcial ou a liquidação total.
                  </span>
                </div>

                {/* 4. Forma de Pagamento e Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Forma de Recebimento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0047FF] font-medium cursor-pointer"
                    >
                      <option value="PIX">⚡ PIX / Transferência</option>
                      <option value="CASH">💵 Dinheiro Vivo (Espécie)</option>
                      <option value="BARTER_ASSET">🔄 Entrega de Bem / Troca</option>
                      <option value="CARD">💳 Cartão / Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Data do Pagamento
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0047FF] font-medium"
                    />
                  </div>
                </div>

                {/* Descrição do Bem (Se troca) */}
                {paymentMethod === 'BARTER_ASSET' && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      Descrição do Bem Entregue no Abatimento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Celular iPhone, Moto 125, Televisão 55..."
                      value={paymentAssetNote}
                      onChange={e => setPaymentAssetNote(e.target.value)}
                      className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl px-3 py-2 text-xs text-amber-900 dark:text-amber-200 font-medium outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* 5. Destino do Dinheiro (Opcional: Creditar em Conta) */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                    Creditar este valor na minha conta? (Opcional)
                  </label>
                  <select
                    value={paymentTargetAccountId}
                    onChange={e => setPaymentTargetAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0047FF] transition-colors cursor-pointer"
                  >
                    <option value="">Apenas dar baixa (Não alterar saldo de contas)</option>
                    {userAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        💳 Creditar em: {acc.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 mt-1 block">
                    Ao selecionar uma conta, o valor é somado ao saldo e lançado no seu fluxo de caixa.
                  </span>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] flex gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0031B8] via-[#0047FF] to-[#0055FF] hover:from-[#002796] hover:to-[#003FE6] text-white font-medium text-xs shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  <span>Confirmar Recebimento</span>
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  );
}

function UsersIcon() {
  return <UserCheck size={11} className="text-[#1A44C8]" />;
}
