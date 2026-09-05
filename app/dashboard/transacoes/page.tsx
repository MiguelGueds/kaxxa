'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Upload, 
  Wallet, 
  X, 
  Trash2, 
  FileSpreadsheet,
  ArrowRightLeft,
  CreditCard,
  UserCheck,
  Landmark,
  Pencil
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';
import { transactionsService } from '@/lib/services/transactions';
import { accountsService } from '@/lib/services/accounts';
import { categoriesService } from '@/lib/services/categories';

const AVAILABLE_RESPONSIBLES = [
  'Lucas Ferreira',
  'Mariana Costa',
  'Rodrigo (Irmão)',
  'Carlos Eduardo'
];

// Categorias Diretas para Entradas e Saídas
const EXPENSE_CATEGORIES = [
  'Alimentação & Supermercado',
  'Moradia & Contas',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Lazer & Assinaturas',
  'Educação',
  'Pagamento de Cartão / Fatura',
  'Empréstimo a Terceiro',
  'Outras Saídas'
];

const INCOME_CATEGORIES = [
  'Salário & Remuneração',
  'Dividendos & Rendimentos',
  'Vendas / Freelance',
  'Pix / Transferência Recebida',
  'Recebimento de Terceiro',
  'Reembolso',
  'Outras Entradas'
];

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

interface TransactionItem {
  id: string | number;
  name: string;
  date: string;
  rawDate: string;
  amount: number;
  bank: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  isThirdParty?: boolean;
  thirdPartyName?: string;
}

export default function SaldoExtratoPage() {
  const { isConcealed } = usePrivacy();

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [selectedImportBank, setSelectedImportBank] = useState('Mercado Pago');
  const [deleteCandidate, setDeleteCandidate] = useState<TransactionItem | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'THIRD_PARTY' | 'TRANSFERS'>('ALL');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Novo Lançamento
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBank, setSelectedBank] = useState('Nubank');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState(AVAILABLE_RESPONSIBLES[0]);

  // Form Transferência entre Contas
  const [transferOrigin, setTransferOrigin] = useState('Nubank');
  const [transferDest, setTransferDest] = useState('Banco Inter');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  // Form Pagar Fatura com Saldo
  const [payCardName, setPayCardName] = useState('Nubank Ultravioleta');
  const [payOriginBank, setPayOriginBank] = useState('Nubank');
  const [payAmount, setPayAmount] = useState('2450.00');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Lista de Bancos (inicia vazio para novos usuários)
  const [banks, setBanks] = useState<BankAccount[]>([]);

  // Carrossel de Bancos
  const [bankCarouselIndex, setBankCarouselIndex] = useState(0);
  const visibleBanksCount = 3;
  const maxCarouselIndex = Math.max(0, banks.length - visibleBanksCount);

  const nextBankSlide = () => {
    setBankCarouselIndex(prev => Math.min(maxCarouselIndex, prev + visibleBanksCount));
  };

  const prevBankSlide = () => {
    setBankCarouselIndex(prev => Math.max(0, prev - visibleBanksCount));
  };

  // Lista de Transações (inicia vazio para novos usuários)
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(INCOME_CATEGORIES);

  // Carregar dados reais do Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [dbAccounts, dbTransactions, dbCategories] = await Promise.all([
          accountsService.fetchAccounts(),
          transactionsService.fetchTransactions(150),
          categoriesService.fetchCategories()
        ]);

        if (dbCategories && dbCategories.length > 0) {
          const customExpenses = dbCategories.filter(c => c.type === 'EXPENSE').map(c => c.name);
          const customIncomes = dbCategories.filter(c => c.type === 'INCOME').map(c => c.name);
          if (customExpenses.length > 0) {
            setExpenseCategories(Array.from(new Set([...customExpenses, ...EXPENSE_CATEGORIES])));
          }
          if (customIncomes.length > 0) {
            setIncomeCategories(Array.from(new Set([...customIncomes, ...INCOME_CATEGORIES])));
          }
        }

        if (dbAccounts && dbAccounts.length > 0) {
          setBanks(dbAccounts.map(a => ({
            id: a.id,
            name: a.name,
            balance: a.balance
          })));
        } else {
          setBanks([]);
        }

        if (dbTransactions && dbTransactions.length > 0) {
          setTransactions(dbTransactions.map(t => ({
            id: t.id,
            name: t.description,
            date: t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje',
            rawDate: t.date,
            amount: t.type === 'EXPENSE' ? -Math.abs(t.amount) : Math.abs(t.amount),
            bank: t.category_name || 'Conta Corrente',
            category: t.category_name || 'Geral',
            type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            isThirdParty: !!t.third_party_name,
            thirdPartyName: t.third_party_name
          })));
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      }
    }
    loadData();
  }, []);

  // Simulação de Importação
  const [extractedExtrato, setExtractedExtrato] = useState([
    { id: 'ex-1', checked: true, name: 'Recebimento de Cliente Pix', date: '2026-10-12', amount: 800.00, type: 'INCOME' as const, originBank: 'Mercado Pago', category: 'Vendas / Freelance' },
    { id: 'ex-2', checked: true, name: 'iFood Restaurante', date: '2026-10-11', amount: -76.50, type: 'EXPENSE' as const, originBank: 'Mercado Pago', category: 'Alimentação & Supermercado' },
    { id: 'ex-3', checked: true, name: 'Pagamento de Fatura', date: '2026-10-10', amount: -1450.00, type: 'EXPENSE' as const, originBank: 'Mercado Pago', category: 'Pagamento de Cartão / Fatura' },
    { id: 'ex-4', checked: true, name: 'Depósito em Conta', date: '2026-10-09', amount: 2400.00, type: 'INCOME' as const, originBank: 'Mercado Pago', category: 'Outras Entradas' },
  ]);

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalBalance = useMemo(() => banks.reduce((acc, curr) => acc + curr.balance, 0), [banks]);

  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  }, [transactions]);

  const netBalance = totalIncome - totalExpense;

  // Abertura para Novo Lançamento
  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTransactionType('EXPENSE');
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedBank('Nubank');
    setSelectedCategory(EXPENSE_CATEGORIES[0]);
    setIsThirdParty(false);
    setThirdPartyName(AVAILABLE_RESPONSIBLES[0]);
    setIsModalOpen(true);
  };

  // Abertura para Edição de Lançamento
  const handleEditTransaction = (tx: TransactionItem) => {
    setEditingTransaction(tx);
    setTransactionType(tx.type);
    setDescription(tx.name);
    setAmount(Math.abs(tx.amount).toString());
    setDate(tx.rawDate || new Date().toISOString().split('T')[0]);
    setSelectedBank(tx.bank);
    setSelectedCategory(tx.category);
    setIsThirdParty(!!tx.isThirdParty);
    setThirdPartyName(tx.thirdPartyName || AVAILABLE_RESPONSIBLES[0]);
    setIsModalOpen(true);
  };

  // Salvar Lançamento
  const handleSaveTransaction = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (parsedAmount <= 0) return;

    const finalAmount = transactionType === 'EXPENSE' ? -parsedAmount : parsedAmount;

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            name: description.trim() || (transactionType === 'INCOME' ? 'Entrada Avulsa' : 'Saída Avulsa'),
            rawDate: date,
            amount: finalAmount,
            bank: selectedBank,
            category: isThirdParty ? 'Empréstimo a Terceiro' : selectedCategory,
            type: transactionType,
            isThirdParty: isThirdParty,
            thirdPartyName: isThirdParty ? thirdPartyName : undefined
          };
        }
        return t;
      }));

      setBanks(prev => prev.map(b => {
        let newBal = b.balance;
        if (b.name === editingTransaction.bank) {
          if (editingTransaction.type === 'INCOME') {
            newBal -= editingTransaction.amount;
          } else {
            newBal += Math.abs(editingTransaction.amount);
          }
        }
        if (b.name === selectedBank) {
          if (transactionType === 'INCOME') {
            newBal += parsedAmount;
          } else {
            newBal -= parsedAmount;
          }
        }
        return { ...b, balance: Math.max(0, newBal) };
      }));
    } else {
      const bankAccount = banks.find(b => b.name === selectedBank);
      let newId: string | number = Date.now();

      // Salvar no Supabase de forma assíncrona
      transactionsService.createTransaction({
        description: description.trim() || (transactionType === 'INCOME' ? 'Entrada Avulsa' : 'Saída Avulsa'),
        amount: parsedAmount,
        date: date,
        type: transactionType,
        account_id: bankAccount?.id,
        category_name: isThirdParty ? 'Empréstimo a Terceiro' : selectedCategory,
        third_party_name: isThirdParty ? thirdPartyName : undefined,
        is_paid: true
      }).then(saved => {
        if (saved) {
          setTransactions(prev => prev.map(item => item.id === newId ? { ...item, id: saved.id } : item));
        }
      }).catch(err => console.error('Erro ao persistir transação no Supabase:', err));

      const newTx: TransactionItem = {
        id: newId,
        name: description.trim() || (transactionType === 'INCOME' ? 'Entrada Avulsa' : 'Saída Avulsa'),
        date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        rawDate: date,
        amount: finalAmount,
        bank: selectedBank,
        category: isThirdParty ? 'Empréstimo a Terceiro' : selectedCategory,
        type: transactionType,
        isThirdParty: isThirdParty,
        thirdPartyName: isThirdParty ? thirdPartyName : undefined
      };

      setBanks(prev => prev.map(b => {
        if (b.name === selectedBank) {
          return {
            ...b,
            balance: transactionType === 'INCOME' ? b.balance + parsedAmount : Math.max(0, b.balance - parsedAmount)
          };
        }
        return b;
      }));

      setTransactions(prev => [newTx, ...prev]);
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    setDescription('');
    setAmount('');
    setIsThirdParty(false);
    setThirdPartyName(AVAILABLE_RESPONSIBLES[0]);
    setSelectedCategory(transactionType === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  // Transferência entre Contas
  const handleConfirmTransfer = () => {
    const parsedAmount = parseFloat(transferAmount.replace(',', '.')) || 0;
    if (parsedAmount <= 0 || transferOrigin === transferDest) return;

    setBanks(prev => prev.map(b => {
      if (b.name === transferOrigin) {
        return { ...b, balance: Math.max(0, b.balance - parsedAmount) };
      }
      if (b.name === transferDest) {
        return { ...b, balance: b.balance + parsedAmount };
      }
      return b;
    }));

    const newTx: TransactionItem = {
      id: Date.now(),
      name: `Transferência: ${transferOrigin} → ${transferDest}`,
      date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      rawDate: transferDate,
      amount: -parsedAmount,
      bank: transferOrigin,
      category: 'Transferência entre Contas',
      type: 'EXPENSE'
    };

    setTransactions(prev => [newTx, ...prev]);
    setIsTransferModalOpen(false);
    setTransferAmount('');
  };

  // Pagar Fatura com Saldo
  const handleConfirmPayInvoice = () => {
    const parsedAmount = parseFloat(payAmount.replace(',', '.')) || 0;
    if (parsedAmount <= 0) return;

    setBanks(prev => prev.map(b => {
      if (b.name === payOriginBank) {
        return { ...b, balance: Math.max(0, b.balance - parsedAmount) };
      }
      return b;
    }));

    const newTx: TransactionItem = {
      id: Date.now(),
      name: `Pagamento de Fatura: ${payCardName}`,
      date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      rawDate: payDate,
      amount: -parsedAmount,
      bank: payOriginBank,
      category: 'Pagamento de Cartão / Fatura',
      type: 'EXPENSE'
    };

    setTransactions(prev => [newTx, ...prev]);
    setIsPayInvoiceModalOpen(false);
  };

  // Confirmar Importação
  const handleConfirmImport = () => {
    const selectedRows = extractedExtrato.filter(r => r.checked);
    if (selectedRows.length === 0) return;

    let deltaBal = 0;
    const newItems: TransactionItem[] = selectedRows.map((r, i) => {
      deltaBal += r.amount;
      return {
        id: Date.now() + i,
        name: r.name,
        date: r.date,
        rawDate: new Date().toISOString().split('T')[0],
        amount: r.amount,
        bank: selectedImportBank,
        category: r.category,
        type: r.type
      };
    });

    setBanks(prev => prev.map(b => {
      if (b.name === selectedImportBank) {
        return { ...b, balance: Math.max(0, b.balance + deltaBal) };
      }
      return b;
    }));

    setTransactions(prev => [...newItems, ...prev]);
    setIsImportModalOpen(false);
    setImportStep(1);
  };

  // Excluir Lançamento
  const handleDeleteTransaction = (id: string | number) => {
    // Excluir no Supabase
    transactionsService.deleteTransaction(id.toString()).catch(err => console.error('Erro ao excluir transação no Supabase:', err));

    const target = transactions.find(t => t.id === id);
    if (target) {
      setBanks(prev => prev.map(b => {
        if (b.name === target.bank) {
          const revert = target.type === 'INCOME' ? -target.amount : Math.abs(target.amount);
          return { ...b, balance: Math.max(0, b.balance + revert) };
        }
        return b;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    setDeleteCandidate(null);
  };

  // Filtragem
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (activeTab === 'INCOME' && t.type !== 'INCOME') return false;
      if (activeTab === 'EXPENSE' && t.type !== 'EXPENSE') return false;
      if (activeTab === 'THIRD_PARTY' && !t.isThirdParty) return false;
      if (activeTab === 'TRANSFERS' && !t.category.toLowerCase().includes('transferência') && !t.name.toLowerCase().includes('transferência')) return false;
      if (selectedBankFilter && t.bank !== selectedBankFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesBank = t.bank.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesThirdParty = t.thirdPartyName && t.thirdPartyName.toLowerCase().includes(q);
        return matchesName || matchesBank || matchesCategory || matchesThirdParty;
      }
      return true;
    });
  }, [transactions, activeTab, selectedBankFilter, searchQuery]);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pb-12 space-y-4">
        
        {/* =========================================================================
            1. HERO BENTO GRID: SALDO CONSOLIDADO & CARROSSEL DE CONTAS (#FFFFFF)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Card Principal: Saldo Total em Caixa */}
          <div className="lg:col-span-4 bg-[#FFFFFF] rounded-[24px] p-5 relative overflow-hidden group shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet size={12} className="text-[#1A44C8]" /> Saldo Total em Contas
                </p>
                <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20 font-bold">
                  {banks.length} Contas
                </span>
              </div>

              <h2 className="text-3xl font-extrabold text-[#181B22] tracking-tight mb-1 flex items-baseline">
                <span className="text-base text-[#94A3B8] mr-1 font-semibold">R$</span>
                {formatCurrency(totalBalance)}
              </h2>

              <p className="text-[10px] text-[#64748B]">
                Disponibilidade imediata em contas bancárias
              </p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] mt-3 flex justify-between items-center text-[10px]">
              <span className="text-[#64748B]">Balanço do Mês:</span>
              <span className={`font-bold ${netBalance >= 0 ? 'text-[#1A44C8]' : 'text-rose-500'}`}>
                {netBalance >= 0 ? '+' : ''}R$ {formatCurrency(netBalance)}
              </span>
            </div>
          </div>

          {/* Carrossel de Bancos */}
          <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E5E7EB] hover:shadow-md hover:border-[#1A44C8]/30 transition-all rounded-[24px] p-5 shadow-sm flex flex-col justify-between relative group">
            
            <div className="flex justify-between items-center mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={12} className="text-[#1A44C8]" /> Contas Bancárias
                </p>
                {selectedBankFilter && (
                  <button 
                    onClick={() => setSelectedBankFilter(null)}
                    className="text-[8.5px] px-2.5 py-0.5 rounded-full bg-[#F1F3F7] border border-[#E5E7EB] text-[#1A44C8] hover:bg-[#EAEAEA] transition-all flex items-center gap-1 font-bold shadow-sm"
                  >
                    Filtrado por: {selectedBankFilter} <X size={9} />
                  </button>
                )}
              </div>

              {/* Controles de Navegação */}
              <div className="flex items-center gap-1.5 bg-[#F1F3F7] px-2 py-1 rounded-full border border-[#E5E7EB] shadow-sm">
                <button 
                  onClick={prevBankSlide}
                  disabled={bankCarouselIndex === 0}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bankCarouselIndex === 0 
                      ? 'text-[#CBD5E1] cursor-not-allowed opacity-40' 
                      : 'hover:bg-white text-[#64748B] hover:text-[#1A44C8] active:scale-90 shadow-sm'
                  }`}
                  title="Página Anterior"
                >
                  <ChevronLeft size={13} />
                </button>
                
                <div className="flex items-center gap-1 px-0.5">
                  {Array.from({ length: Math.ceil(banks.length / visibleBanksCount) }).map((_, idx) => {
                    const isActive = Math.floor(bankCarouselIndex / visibleBanksCount) === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setBankCarouselIndex(idx * visibleBanksCount)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isActive 
                            ? 'w-3.5 bg-[#1A44C8] shadow-[0_0_8px_rgba(16,53,229,0.5)]' 
                            : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                        }`}
                        title={`Página ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                <button 
                  onClick={nextBankSlide}
                  disabled={bankCarouselIndex >= maxCarouselIndex}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bankCarouselIndex >= maxCarouselIndex 
                      ? 'text-[#CBD5E1] cursor-not-allowed opacity-40' 
                      : 'hover:bg-white text-[#64748B] hover:text-[#1A44C8] active:scale-90 shadow-sm'
                  }`}
                  title="Próxima Página"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Grid dos 3 Bancos */}
            {banks.length === 0 ? (
              <div className="rounded-2xl p-6 border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center">
                <p className="text-xs font-semibold text-[#64748B] mb-2">Nenhuma conta bancária conectada ainda.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Novo Lançamento</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {banks.slice(bankCarouselIndex, bankCarouselIndex + visibleBanksCount).map((bank) => {
                  const pct = totalBalance > 0 ? (bank.balance / totalBalance) * 100 : 0;
                  const isSelected = selectedBankFilter === bank.name;

                  return (
                    <div 
                      key={bank.id} 
                      onClick={() => setSelectedBankFilter(isSelected ? null : bank.name)}
                      className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm ${
                        isSelected 
                          ? 'ring-2 ring-[#1A44C8] border-[#1A44C8] bg-[#1A44C8]/[0.06]' 
                          : 'bg-[#F8FAFC] border-[#E5E7EB] hover:border-[#1A44C8]/30 hover:bg-[#F1F3F7]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <BankLogo name={bank.name} size="sm" />
                            <h4 className="text-xs font-bold text-[#181B22] leading-tight truncate">{bank.name}</h4>
                          </div>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-[#E2E8F0] text-[#64748B]">
                            {pct.toFixed(0)}%
                          </span>
                        </div>

                        <p className="text-[9px] text-[#64748B] mb-0.5 font-medium">Saldo Disponível</p>
                        <p className="text-sm font-extrabold text-[#181B22] tracking-tight">
                          R$ {formatCurrency(bank.balance)}
                        </p>
                      </div>

                      <div className="pt-2">
                        <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#1A44C8] rounded-full transition-all duration-500 shadow-sm" 
                            style={{ width: `${Math.min(100, pct)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* =========================================================================
            2. BARRA DE AÇÕES RÁPIDAS
        ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5">
          
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8]"></span>
            <span>Ações Rápidas:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botão Transferir entre Contas */}
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-medium text-[10.5px] transition-all shadow-sm active:scale-95 border border-[#E5E7EB]"
            >
              <ArrowRightLeft size={11} className="text-[#1A44C8]" />
              Transferir entre Contas
            </button>

            {/* Botão Pagar Fatura do Cartão */}
            <button 
              onClick={() => setIsPayInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-medium text-[10.5px] transition-all shadow-sm active:scale-95 border border-[#E5E7EB]"
            >
              <CreditCard size={11} className="text-[#00A3FF]" />
              Pagar Fatura com Saldo
            </button>

            {/* Botão Importar Extrato */}
            <button 
              onClick={() => { setIsImportModalOpen(true); setImportStep(1); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-medium text-[10.5px] transition-all shadow-sm active:scale-95 border border-[#E5E7EB]"
            >
              <Upload size={11} className="text-[#64748B]" />
              Importar Extrato
            </button>

            {/* Botão Novo Lançamento */}
            <button 
              onClick={handleOpenNewTransaction}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-xs transition-all shadow-md active:scale-95"
            >
              <Plus size={11} className="text-white" />
              Novo Lançamento
            </button>

          </div>

        </div>

        {/* =========================================================================
            3. EXTRATO DE ENTRADAS & SAÍDAS (#FFFFFF)
        ========================================================================= */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm space-y-3.5">
          
          {/* Header com Filtros e Ações */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            
            {/* Abas com Pílulas Arredondadas */}
            <div className="flex items-center gap-1 bg-[#F1F3F7] p-1 rounded-full border border-[#E5E7EB] overflow-x-auto max-w-full">
              <button 
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  activeTab === 'ALL' ? 'bg-[#FFFFFF] text-[#1A44C8] shadow-sm' : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveTab('INCOME')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  activeTab === 'INCOME' ? 'bg-[#1A44C8]/10 text-[#1A44C8] border border-[#1A44C8]/20' : 'text-[#64748B] hover:text-[#1A44C8]'
                }`}
              >
                <ArrowUp size={11} className="text-[#1A44C8]" /> Entradas
              </button>
              <button 
                onClick={() => setActiveTab('EXPENSE')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  activeTab === 'EXPENSE' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-[#64748B] hover:text-rose-600'
                }`}
              >
                <ArrowDown size={11} className="text-rose-500" /> Saídas
              </button>
              <button 
                onClick={() => setActiveTab('THIRD_PARTY')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  activeTab === 'THIRD_PARTY' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-[#64748B] hover:text-amber-700'
                }`}
              >
                <UserCheck size={11} className="text-amber-600" /> Terceiros
              </button>
              <button 
                onClick={() => setActiveTab('TRANSFERS')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  activeTab === 'TRANSFERS' ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'text-[#64748B] hover:text-sky-600'
                }`}
              >
                <ArrowRightLeft size={11} className="text-sky-500" /> Transferências
              </button>
            </div>

            {/* Busca Arredondada */}
            <div className="relative w-full lg:w-64">
              <Search size={11} className="absolute left-3 top-2 text-[#94A3B8]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, banco..."
                className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-full pl-8 pr-3 py-1.5 text-[10.5px] text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
              />
            </div>

          </div>

          {/* Lista de Transações */}
          <div className="divide-y divide-[#E5E7EB]">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.category.toLowerCase().includes('transferência') || tx.name.toLowerCase().includes('transferência');

                return (
                  <div 
                    key={tx.id} 
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-[#F8FAFC] rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      <div className="shrink-0 flex items-center justify-center w-5">
                        {isTransfer ? (
                          <ArrowRightLeft size={14} className="text-sky-500" />
                        ) : tx.isThirdParty ? (
                          <ArrowDown size={14} className="text-rose-500" />
                        ) : isIncome ? (
                          <ArrowUp size={14} className="text-[#1A44C8]" />
                        ) : (
                          <ArrowDown size={14} className="text-rose-500" />
                        )}
                      </div>

                      {/* Informações */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors truncate">
                            {tx.name}
                          </p>
                          {tx.isThirdParty && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1 shrink-0">
                              <UserCheck size={9} /> Devedor: {tx.thirdPartyName}
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-[#64748B] mt-0.5 flex items-center gap-1.5 truncate">
                          <span className="text-[#181B22] font-semibold flex items-center gap-1.5 shrink-0">
                            <BankLogo name={tx.bank} size="xs" className="w-[18px] h-[18px] text-[7.5px]" />
                            {tx.bank}
                          </span>
                          <span>•</span>
                          <span className="shrink-0">{tx.date}</span>
                        </p>
                      </div>

                    </div>

                    {/* Valor e Ações */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-xs font-extrabold tracking-wide ${isTransfer ? 'text-sky-600' : isIncome ? 'text-[#1A44C8]' : 'text-rose-600'}`}>
                          {isTransfer ? '' : isIncome ? '+' : '-'} R$ {formatCurrency(Math.abs(tx.amount))}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditTransaction(tx)}
                          className="p-1 rounded-lg hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] transition-colors"
                          title="Editar lançamento"
                        >
                          <Pencil size={12} />
                        </button>
                        <button 
                          onClick={() => setDeleteCandidate(tx)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-[#64748B] hover:text-rose-600 transition-colors"
                          title="Excluir lançamento"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-[#94A3B8] text-xs font-medium">
                Nenhum lançamento encontrado para os filtros selecionados.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL 1: NOVO OU EDITAR LANÇAMENTO
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <Wallet size={15} className="text-[#1A44C8]" />
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento no Saldo'}
              </h2>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Tipo de Transação */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Tipo de Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setTransactionType('EXPENSE');
                      setSelectedCategory(EXPENSE_CATEGORIES[0]);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transactionType === 'EXPENSE' 
                        ? 'border-rose-300 bg-rose-50 text-rose-600' 
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <ArrowDown size={13} />
                    Saída / Despesa
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setTransactionType('INCOME');
                      setSelectedCategory(INCOME_CATEGORIES[0]);
                      setIsThirdParty(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transactionType === 'INCOME' 
                        ? 'border-[#1A44C8]/30 bg-[#1A44C8]/10 text-[#1A44C8]' 
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <ArrowUp size={13} />
                    Entrada / Receita
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Descrição</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Supermercado, Salário, Freela..."
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] font-bold placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Data</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Conta / Origem do Recurso</label>
                <select 
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] cursor-pointer font-medium"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.name}>{b.name} (R$ {formatCurrency(b.balance)})</option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              {!isThirdParty && (
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Categoria</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] cursor-pointer font-medium"
                  >
                    {(transactionType === 'EXPENSE' ? expenseCategories : incomeCategories).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Gasto de Terceiro */}
              {transactionType === 'EXPENSE' && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isThirdParty}
                      onChange={(e) => setIsThirdParty(e.target.checked)}
                      className="rounded accent-[#1A44C8] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#181B22]">É um empréstimo ou gasto feito para outra pessoa?</span>
                  </label>

                  {isThirdParty && (
                    <div className="pt-1.5">
                      <label className="block text-[10px] text-[#64748B] mb-1 font-medium">Pessoa Responsável pelo Pagamento</label>
                      <select 
                        value={thirdPartyName}
                        onChange={(e) => setThirdPartyName(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none"
                      >
                        {AVAILABLE_RESPONSIBLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveTransaction}
                className="flex-1 px-3 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                Salvar Lançamento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TRANSFERIR ENTRE CONTAS
      ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <ArrowRightLeft size={15} className="text-[#1A44C8]" />
                Transferir entre Minhas Contas
              </h2>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Conta Origem (Sai)</label>
                  <select 
                    value={transferOrigin}
                    onChange={(e) => setTransferOrigin(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] cursor-pointer font-medium"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Conta Destino (Entra)</label>
                  <select 
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] cursor-pointer font-medium"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] font-bold focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Data</label>
                  <input 
                    type="date" 
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

            </div>

            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmTransfer}
                className="flex-1 px-3 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                Confirmar Transferência
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: PAGAR FATURA COM SALDO
      ========================================================================= */}
      {isPayInvoiceModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <CreditCard size={15} className="text-[#00A3FF]" />
                Pagar Fatura de Cartão com Saldo
              </h2>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
              
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Cartão / Fatura a Pagar</label>
                <select 
                  value={payCardName}
                  onChange={(e) => setPayCardName(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none font-medium"
                >
                  <option value="Nubank Ultravioleta">Nubank Ultravioleta (Fatura R$ 4.428,00)</option>
                  <option value="Inter Black">Inter Black (Fatura R$ 2.450,00)</option>
                  <option value="Santander Unique">Santander Unique (Fatura R$ 1.890,00)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Conta Bancária de Débito (De onde sai o dinheiro)</label>
                <select 
                  value={payOriginBank}
                  onChange={(e) => setPayOriginBank(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none font-medium"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.name}>{b.name} (Saldo: R$ {formatCurrency(b.balance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Valor Pago (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#00A3FF]/30 rounded-xl py-2 px-3 text-xs text-[#00A3FF] font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Data do Pagamento</label>
                  <input 
                    type="date" 
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

            </div>

            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsPayInvoiceModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmPayInvoice}
                className="flex-1 px-3 py-2 rounded-xl bg-[#00A3FF] hover:bg-[#0284C7] text-white font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                Confirmar Pagamento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: IMPORTAR EXTRATO
      ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in-center">
            
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
              <h2 className="text-sm font-bold text-[#181B22] flex items-center gap-2">
                <Upload size={15} className="text-[#1A44C8]" />
                Importar Extrato Bancário
              </h2>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {importStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1 font-bold">Banco do Extrato</label>
                    <select 
                      value={selectedImportBank}
                      onChange={(e) => setSelectedImportBank(e.target.value)}
                      className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] cursor-pointer font-medium"
                    >
                      {banks.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div 
                    onClick={() => setImportStep(2)}
                    className="border-2 border-dashed border-[#CBD5E1] hover:border-[#1A44C8] rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#F8FAFC] hover:bg-[#1A44C8]/[0.03]"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center mx-auto mb-3 border border-[#1A44C8]/20">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-[#181B22] mb-1">Arraste seu arquivo de extrato aqui</h3>
                    <p className="text-[10px] text-[#64748B] mb-3">Formatos aceitos: OFX, CSV, PDF ou XLS</p>
                    <button className="px-3.5 py-1.5 rounded-xl bg-[#F1F3F7] hover:bg-[#EAEAEA] text-[#181B22] text-xs font-semibold border border-[#E5E7EB] transition-all">
                      Selecionar Arquivo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#181B22]">Lançamentos Identificados ({extractedExtrato.length})</span>
                    <button 
                      onClick={() => setImportStep(1)}
                      className="text-[11px] text-[#1A44C8] font-bold hover:underline"
                    >
                      Trocar arquivo
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {extractedExtrato.map((row) => (
                      <div 
                        key={row.id} 
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          row.checked ? 'bg-[#F8FAFC] border-[#1A44C8]/30' : 'bg-[#FFFFFF] border-[#E5E7EB] opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={row.checked}
                            onChange={(e) => {
                              const chk = e.target.checked;
                              setExtractedExtrato(prev => prev.map(r => r.id === row.id ? { ...r, checked: chk } : r));
                            }}
                            className="rounded accent-[#1A44C8] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[#181B22] truncate">{row.name}</p>
                            <p className="text-[10px] text-[#64748B]">{row.date} • {row.category}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${row.type === 'INCOME' ? 'text-[#1A44C8]' : 'text-rose-500'}`}>
                          {row.type === 'INCOME' ? '+' : '-'} R$ {formatCurrency(Math.abs(row.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              {importStep === 2 && (
                <button 
                  type="button" 
                  onClick={handleConfirmImport}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  Importar ({extractedExtrato.filter(r => r.checked).length}) Lançamentos
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: CONFIRMAR EXCLUSÃO
      ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl p-5 space-y-4 my-auto animate-scale-in-center">
            <div>
              <h3 className="text-sm font-bold text-[#181B22] mb-1">Excluir Lançamento?</h3>
              <p className="text-xs text-[#64748B]">
                Tem certeza que deseja remover <strong>&quot;{deleteCandidate.name}&quot;</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#F1F3F7] transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteTransaction(deleteCandidate.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
