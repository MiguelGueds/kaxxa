'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { cardsService } from '@/lib/services/cards';
import { categoriesService } from '@/lib/services/categories';
import { 
  CreditCard, 
  Plus, 
  Upload, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  FileSpreadsheet, 
  Trash2, 
  CheckCheck, 
  Receipt, 
  Activity,
  Pencil,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  ChevronDown
} from 'lucide-react';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';

// Categorias Limpas e Padronizadas
const CATEGORIES_FLAT_LIST = [
  'Alimentação e Supermercado',
  'Restaurante e Delivery',
  'Transporte e Combustível',
  'Lazer e Assinaturas (Streaming)',
  'Moradia e Casa',
  'Saúde e Farmácia',
  'Vestuário e Moda',
  'Educação e Livros',
  'Compras Pessoais e Outros'
];

interface CardItem {
  id: string;
  name: string;
  brand: string;
  bank: string;
  lastDigits: string;
  limitTotal: number;
  limitUsed: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

interface CardExpense {
  id: string;
  cardId: string;
  cardName: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  month: string; // YYYY-MM
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  isThirdParty?: boolean;
  thirdPartyName?: string;
}

interface ImportItem {
  id: string;
  checked: boolean;
  date: string;
  description: string;
  amount: number;
  category: string;
  thirdPartyName?: string;
  installmentText?: string;
}

interface CardPaymentRecord {
  cardId: string;
  month: string;
  amountPaid: number;
}

const MONTH_NAMES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function MinhasFaturasPage() {
  const { isConcealed } = usePrivacy();

  // Competência selecionada
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonthNum, setSelectedMonthNum] = useState('07');
  const selectedMonth = `${selectedYear}-${selectedMonthNum}`;

  // Filtros
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('ALL');
  const [cardGridFilter, setCardGridFilter] = useState<'ALL' | 'FECHADAS' | 'ABERTAS'>('ALL');
  const [cardPage, setCardPage] = useState(0);
  const [selectedResponsibleFilter, setSelectedResponsibleFilter] = useState<string>('ALL');
  const [isResponsibleDropdownOpen, setIsResponsibleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredProjectionMonth, setHoveredProjectionMonth] = useState<number | null>(null);

  // Modais
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CardExpense | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [importCardId, setImportCardId] = useState<string>('card-1');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetCard, setPaymentTargetCard] = useState<CardItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<'TOTAL' | 'PARTIAL'>('TOTAL');
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CardExpense | null>(null);
  const [isLimitPopupOpen, setIsLimitPopupOpen] = useState(false);

  // Cartões Cadastrados
  // Lista de Cartões (inicia vazio para novos usuários)
  const [cards, setCards] = useState<CardItem[]>([]);

  // Registro de Pagamentos
  const [payments, setPayments] = useState<CardPaymentRecord[]>([]);

  // Lançamentos das Faturas (inicia vazio para novos usuários)
  const [expenses, setExpenses] = useState<CardExpense[]>([]);

  // Form Manual de Compra
  const [formCardId, setFormCardId] = useState('card-1');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('2026-07-10');
  const [formCategory, setFormCategory] = useState(CATEGORIES_FLAT_LIST[0]);
  const [formIsInstallment, setFormIsInstallment] = useState(false);
  const [formInstallments, setFormInstallments] = useState('3');
  const [formIsThirdParty, setFormIsThirdParty] = useState(false);
  const [formThirdPartyName, setFormThirdPartyName] = useState('');

  // Form Novo Cartão
  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState('Nubank');
  const [newCardBrand, setNewCardBrand] = useState('Mastercard Black');
  const [newCardLastDigits, setNewCardLastDigits] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardClosingDay, setNewCardClosingDay] = useState('15');
  const [newCardDueDay, setNewCardDueDay] = useState('22');

  const [registeredThirdParties, setRegisteredThirdParties] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  // Dados Extraídos no Modal de Importação
  const [extractedImports, setExtractedImports] = useState<ImportItem[]>([
    { id: 'imp-1', checked: true, date: '2026-07-12', description: 'Uber Viagens', amount: 38.50, category: 'Transporte e Combustível', thirdPartyName: 'Titular (Você)' },
    { id: 'imp-2', checked: true, date: '2026-07-11', description: 'Mercado Livre - Fones', amount: 189.90, category: 'Lazer e Assinaturas (Streaming)', installmentText: '1/3', thirdPartyName: 'Titular (Você)' },
    { id: 'imp-3', checked: true, date: '2026-07-10', description: 'Restaurante Outback', amount: 215.00, category: 'Restaurante e Delivery', thirdPartyName: 'Titular (Você)' },
    { id: 'imp-4', checked: true, date: '2026-07-09', description: 'Droga Raia Farmácia', amount: 84.20, category: 'Saúde e Farmácia', thirdPartyName: 'Titular (Você)' },
    { id: 'imp-5', checked: true, date: '2026-07-08', description: 'Posto Ipiranga Gasolina', amount: 220.00, category: 'Transporte e Combustível', thirdPartyName: 'Titular (Você)' }
  ]);

  const [categoriesList, setCategoriesList] = useState<string[]>(CATEGORIES_FLAT_LIST);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dbCards, dbExpenses, dbCategories] = await Promise.all([
          cardsService.fetchCards(),
          cardsService.fetchCardExpenses(),
          categoriesService.fetchCategories(),
        ]);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: tpData } = await supabase
            .from('third_parties')
            .select('name')
            .eq('user_id', session.user.id)
            .order('name');
          if (tpData && tpData.length > 0) {
            setRegisteredThirdParties(tpData.map(t => t.name));
          }
        }

        if (dbCategories && dbCategories.length > 0) {
          const customCats = dbCategories.map(c => c.name);
          setCategoriesList(Array.from(new Set([...customCats, ...CATEGORIES_FLAT_LIST])));
        }

        if (dbCards && dbCards.length > 0) {
          setCards(dbCards.map(c => ({
            id: c.id,
            name: c.name,
            brand: c.brand || 'Mastercard Black',
            bank: c.bank,
            lastDigits: c.last_digits || '0000',
            limitTotal: c.credit_limit,
            limitUsed: c.limit_used,
            closingDay: c.closing_day,
            dueDay: c.due_day,
            color: c.color || '#3B6CF0'
          })));
        } else {
          setCards([]);
        }

        if (dbExpenses && dbExpenses.length > 0) {
          const cardMap = new Map((dbCards || []).map(c => [c.id, c.name]));
          setExpenses(dbExpenses.map(e => ({
            id: e.id,
            cardId: e.credit_card_id,
            cardName: cardMap.get(e.credit_card_id) || 'Cartão',
            description: e.description,
            amount: e.amount,
            date: e.date,
            category: e.category_name || CATEGORIES_FLAT_LIST[0],
            month: e.date.substring(0, 7),
            isInstallment: (e.installments || 1) > 1,
            currentInstallment: e.current_installment,
            totalInstallments: e.installments,
            isThirdParty: !!e.third_party_name,
            thirdPartyName: e.third_party_name
          })));
        } else {
          setExpenses([]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const autoCategorize = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('uber') || d.includes('99') || d.includes('posto') || d.includes('shell') || d.includes('ipiranga') || d.includes('combustivel') || d.includes('gasolina') || d.includes('estacionamento') || d.includes('pedagio')) {
      return 'Transporte e Combustível';
    }
    if (d.includes('mercado') || d.includes('supermercado') || d.includes('carrefour') || d.includes('pao de acucar') || d.includes('assai') || d.includes('atacadao') || d.includes('hortifruti') || d.includes('padaria')) {
      return 'Alimentação e Supermercado';
    }
    if (d.includes('outback') || d.includes('ifood') || d.includes('restaurante') || d.includes('mcdonalds') || d.includes('burger') || d.includes('pizza') || d.includes('bistro') || d.includes('bar ') || d.includes('lanchonete')) {
      return 'Restaurante e Delivery';
    }
    if (d.includes('droga') || d.includes('raia') || d.includes('farmacia') || d.includes('drogasil') || d.includes('pague menos') || d.includes('hospital') || d.includes('consulta') || d.includes('lab') || d.includes('exame')) {
      return 'Saúde e Farmácia';
    }
    if (d.includes('netflix') || d.includes('spotify') || d.includes('amazon') || d.includes('prime') || d.includes('hbo') || d.includes('disney') || d.includes('mercado livre') || d.includes('shopee') || d.includes('cinema') || d.includes('steam')) {
      return 'Lazer e Assinaturas (Streaming)';
    }
    if (d.includes('zara') || d.includes('renner') || d.includes('c&a') || d.includes('riachuelo') || d.includes('roupa') || d.includes('calcados') || d.includes('nike') || d.includes('adidas')) {
      return 'Vestuário e Moda';
    }
    if (d.includes('escola') || d.includes('faculdade') || d.includes('curso') || d.includes('udemy') || d.includes('livraria') || d.includes('livro')) {
      return 'Educação e Livros';
    }
    return 'Compras Pessoais e Outros';
  };

  const handleProcessFile = (file: File) => {
    setIsParsingFile(true);
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || '';
      const parsedItems: ImportItem[] = [];

      if (text.includes('<STMTTRN>') || text.includes('<OFX>')) {
        const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
        let match;
        let idx = 1;

        while ((match = trnRegex.exec(text)) !== null) {
          const block = match[1];
          const dtMatch = block.match(/<DTPOSTED>(\d{8})/);
          const amtMatch = block.match(/<TRNAMT>([-\d\.]+)/);
          const memoMatch = block.match(/<MEMO>([^<\r\n]+)/) || block.match(/<NAME>([^<\r\n]+)/);

          if (dtMatch && amtMatch) {
            const rawDate = dtMatch[1];
            const formattedDate = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
            const rawAmt = Math.abs(parseFloat(amtMatch[1]));
            const desc = memoMatch ? memoMatch[1].trim() : 'Compra Cartão';

            parsedItems.push({
              id: `imp-ofx-${Date.now()}-${idx++}`,
              checked: true,
              date: formattedDate,
              description: desc,
              amount: rawAmt,
              category: autoCategorize(desc),
              thirdPartyName: 'Titular (Você)',
            });
          }
        }
      }

      if (parsedItems.length === 0) {
        const lines = text.split(/\r?\n/);
        let idx = 1;

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          const dateMatch = trimmed.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/) || trimmed.match(/(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
          const amountMatch = trimmed.match(/R?\$\s*([\d\.\,]+)/) || trimmed.match(/([-\d\.\,]{3,12})/);

          if (dateMatch) {
            let dateStr = '2026-07-10';
            if (dateMatch[1].length === 4) {
              dateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            } else {
              const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
              dateStr = `${year}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
            }

            let descStr = trimmed
              .replace(dateMatch[0], '')
              .replace(/R?\$\s*[\d\.\,]+/, '')
              .replace(/\s+/g, ' ')
              .trim();

            let amountVal = 0;
            if (amountMatch) {
              const cleanVal = amountMatch[1].replace(/\./g, '').replace(',', '.');
              const num = parseFloat(cleanVal);
              if (!isNaN(num)) amountVal = Math.abs(num);
            }

            if (descStr.length > 2 && amountVal > 0) {
              parsedItems.push({
                id: `imp-txt-${Date.now()}-${idx++}`,
                checked: true,
                date: dateStr,
                description: descStr,
                amount: amountVal,
                category: autoCategorize(descStr),
                thirdPartyName: 'Titular (Você)',
              });
            }
          }
        });
      }

      if (parsedItems.length === 0) {
        setExtractedImports([
          { id: `imp-1`, checked: true, date: `${selectedYear}-${selectedMonthNum}-12`, description: `Fatura ${file.name.replace(/\.[^/.]+$/, "")} - Item 1`, amount: 150.00, category: 'Alimentação e Supermercado', thirdPartyName: 'Titular (Você)' },
          { id: `imp-2`, checked: true, date: `${selectedYear}-${selectedMonthNum}-11`, description: `Fatura ${file.name.replace(/\.[^/.]+$/, "")} - Item 2`, amount: 89.90, category: 'Lazer e Assinaturas (Streaming)', thirdPartyName: 'Titular (Você)' },
          { id: `imp-3`, checked: true, date: `${selectedYear}-${selectedMonthNum}-10`, description: `Fatura ${file.name.replace(/\.[^/.]+$/, "")} - Item 3`, amount: 230.00, category: 'Transporte e Combustível', thirdPartyName: 'Titular (Você)' },
        ]);
      } else {
        setExtractedImports(parsedItems);
      }

      setIsParsingFile(false);
      setImportStep(2);
    };

    reader.onerror = () => {
      setIsParsingFile(false);
      setImportStep(2);
    };

    reader.readAsText(file);
  };

  const formatCurrency = (val: number) => {
    if (isConcealed) return '•••••';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const responsiblesList = useMemo(() => {
    const list = expenses
      .filter(e => e.isThirdParty && e.thirdPartyName)
      .map(e => e.thirdPartyName!.trim());
    return ['ALL', 'EU', ...Array.from(new Set([...list, ...registeredThirdParties]))];
  }, [expenses, registeredThirdParties]);

  const monthExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.month !== selectedMonth) return false;
      if (selectedResponsibleFilter === 'EU' && e.isThirdParty) return false;
      if (selectedResponsibleFilter !== 'ALL' && selectedResponsibleFilter !== 'EU') {
        if (!e.isThirdParty || e.thirdPartyName?.trim() !== selectedResponsibleFilter) return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedResponsibleFilter]);

  const totalInvoiceMonth = useMemo(() => {
    return monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [monthExpenses]);

  const totalPaidMonth = useMemo(() => {
    return payments
      .filter(p => p.month === selectedMonth)
      .reduce((acc, curr) => acc + curr.amountPaid, 0);
  }, [payments, selectedMonth]);

  const totalRemainingMonth = Math.max(0, totalInvoiceMonth - totalPaidMonth);
  const isMonthFullyPaid = totalInvoiceMonth > 0 && totalRemainingMonth <= 0;

  // Despesas acumuladas por cartão
  const cardExpensesSum = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.cardId] = (map[e.cardId] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const getCardLimitUsed = useCallback((card: CardItem) => {
    const expTotal = cardExpensesSum[card.id] || 0;
    return expTotal > 0 ? expTotal : (card.limitUsed || 0);
  }, [cardExpensesSum]);

  const totalLimitGlobal = useMemo(() => cards.reduce((acc, c) => acc + c.limitTotal, 0), [cards]);
  const totalLimitUsedGlobal = useMemo(() => cards.reduce((acc, c) => acc + getCardLimitUsed(c), 0), [cards, getCardLimitUsed]);
  const totalLimitAvailable = Math.max(0, totalLimitGlobal - totalLimitUsedGlobal);
  const limitUsagePct = totalLimitGlobal > 0 ? (totalLimitUsedGlobal / totalLimitGlobal) * 100 : 0;

  const getCardStatusData = (card: CardItem) => {
    const cardMonthExpenses = monthExpenses.filter(e => e.cardId === card.id);
    const cardTotalDue = cardMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const payment = payments.find(p => p.cardId === card.id && p.month === selectedMonth);
    const paidAmount = payment ? payment.amountPaid : 0;
    const remaining = Math.max(0, cardTotalDue - paidAmount);

    let statusKey: 'PAGA' | 'PARCIAL' | 'ABERTA' = 'ABERTA';
    let statusLabel = 'Em Aberto';
    let statusBadgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/25';

    if (cardTotalDue > 0) {
      if (remaining <= 0) {
        statusKey = 'PAGA';
        statusLabel = 'Quitada';
        statusBadgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/25';
      } else if (paidAmount > 0) {
        statusKey = 'PARCIAL';
        statusLabel = `Pago R$ ${formatCurrency(paidAmount)}`;
        statusBadgeColor = 'bg-blue-500/15 text-blue-300 border-blue-500/25';
      }
    } else {
      statusLabel = 'Sem Gastos';
      statusBadgeColor = 'bg-white/5 text-gray-400 border-white/5';
    }

    return {
      cardTotalDue,
      paidAmount,
      remaining,
      statusKey,
      statusLabel,
      statusBadgeColor,
      isOpen: statusKey !== 'PAGA'
    };
  };

  const futureProjectionData = useMemo(() => {
    const months = MONTH_NAMES.map(m => {
      const key = `${selectedYear}-${m.value}`;
      return { 
        key, 
        label: m.label.substring(0, 3), 
        monthName: m.label, 
        current: key === selectedMonth 
      };
    });

    const mapped = months.map(m => {
      const filteredByMonthAndResponsible = expenses.filter(e => {
        if (e.month !== m.key) return false;
        if (selectedResponsibleFilter === 'EU' && e.isThirdParty) return false;
        if (selectedResponsibleFilter !== 'ALL' && selectedResponsibleFilter !== 'EU') {
          if (!e.isThirdParty || e.thirdPartyName?.trim() !== selectedResponsibleFilter) return false;
        }
        return true;
      });
      const monthTotal = filteredByMonthAndResponsible.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        ...m,
        amount: monthTotal
      };
    });

    return mapped.map((m, idx) => {
      let variation = 0;
      if (idx > 0) {
        const prevAmount = mapped[idx - 1].amount;
        if (prevAmount > 0) {
          variation = ((m.amount - prevAmount) / prevAmount) * 100;
        } else if (m.amount > 0) {
          variation = 100;
        }
      }
      return {
        ...m,
        variation
      };
    });
  }, [expenses, selectedYear, selectedMonth, selectedResponsibleFilter]);

  const maxProjectionVal = Math.max(...futureProjectionData.map(d => d.amount), 6000);

  const projectionCoordinates = useMemo(() => {
    const width = 600;
    const height = 120;
    const paddingY = 20;

    const availableH = height - paddingY * 2;
    const colWidth = width / 12;

    const points = futureProjectionData.map((d, index) => {
      const x = (index * colWidth) + (colWidth / 2);
      const y = height - paddingY - (d.amount / maxProjectionVal) * availableH;
      return { x, y, data: d };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { points, pathD, areaD, width, height };
  }, [futureProjectionData, maxProjectionVal]);

  // Abertura para Novo Lançamento
  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setFormCardId(cards[0]?.id || 'card-1');
    setFormDesc('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(CATEGORIES_FLAT_LIST[0]);
    setFormIsInstallment(false);
    setFormInstallments('3');
    setFormIsThirdParty(false);
    setFormThirdPartyName('');
    setIsNewExpenseModalOpen(true);
  };

  // Abertura para Edição de Lançamento
  const handleEditExpense = (exp: CardExpense) => {
    setEditingExpense(exp);
    setFormCardId(exp.cardId);
    setFormDesc(exp.description);
    setFormAmount(exp.amount.toString());
    setFormDate(exp.date);
    setFormCategory(exp.category);
    setFormIsInstallment(exp.isInstallment);
    setFormInstallments(exp.totalInstallments ? exp.totalInstallments.toString() : '1');
    setFormIsThirdParty(!!exp.isThirdParty);
    setFormThirdPartyName(exp.thirdPartyName || '');
    setIsNewExpenseModalOpen(true);
  };

  // Salvar Compra / Edição
  const handleSaveExpense = async () => {
    const parsedAmount = parseFloat(formAmount.replace(',', '.')) || 0;
    if (!formDesc.trim() || parsedAmount <= 0) return;

    const targetCard = cards.find(c => c.id === formCardId) || cards[0];
    const instCount = parseInt(formInstallments, 10) || 1;

    if (editingExpense) {
      try {
        await cardsService.updateCardExpense(editingExpense.id, {
          credit_card_id: targetCard.id,
          description: formDesc.trim(),
          amount: parsedAmount,
          date: formDate,
          category_name: formCategory,
          third_party_name: formIsThirdParty ? formThirdPartyName : undefined,
        });
      } catch (e) {
        console.error('Erro ao atualizar despesa no Supabase:', e);
      }

      setExpenses(prev => prev.map(e => {
        if (e.id === editingExpense.id) {
          return {
            ...e,
            cardId: targetCard.id,
            cardName: targetCard.name,
            description: formDesc.trim(),
            amount: parsedAmount,
            date: formDate,
            category: formCategory,
            month: formDate.substring(0, 7),
            isThirdParty: formIsThirdParty,
            thirdPartyName: formIsThirdParty ? formThirdPartyName : undefined
          };
        }
        return e;
      }));
    } else {
      if (formIsInstallment && instCount > 1) {
        const baseDate = new Date(formDate);
        const newItems: CardExpense[] = [];
        const instAmount = parsedAmount / instCount;

        for (let i = 0; i < instCount; i++) {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');

          newItems.push({
            id: `exp-${Date.now()}-${i}`,
            cardId: targetCard.id,
            cardName: targetCard.name,
            description: formDesc.trim(),
            amount: instAmount,
            date: `${y}-${m}-${day}`,
            category: formCategory,
            month: `${y}-${m}`,
            isInstallment: true,
            currentInstallment: i + 1,
            totalInstallments: instCount,
            isThirdParty: formIsThirdParty,
            thirdPartyName: formIsThirdParty ? formThirdPartyName : undefined
          });
        }

        try {
          await cardsService.createCardExpenseBatch(newItems.map(item => ({
            credit_card_id: item.cardId,
            description: item.description,
            amount: item.amount,
            date: item.date,
            category_name: item.category,
            installments: item.totalInstallments,
            current_installment: item.currentInstallment,
            third_party_name: item.thirdPartyName,
          })));
        } catch (e) {
          console.error('Erro ao salvar parcelas no Supabase:', e);
        }

        setExpenses(prev => [...newItems, ...prev]);
      } else {
        let createdId = `exp-${Date.now()}`;
        try {
          const created = await cardsService.createCardExpense({
            credit_card_id: targetCard.id,
            description: formDesc.trim(),
            amount: parsedAmount,
            date: formDate,
            category_name: formCategory,
            installments: 1,
            current_installment: 1,
            third_party_name: formIsThirdParty ? formThirdPartyName : undefined,
          });
          if (created) createdId = created.id;
        } catch (e) {
          console.error('Erro ao registrar despesa no Supabase:', e);
        }

        const newExp: CardExpense = {
          id: createdId,
          cardId: targetCard.id,
          cardName: targetCard.name,
          description: formDesc.trim(),
          amount: parsedAmount,
          date: formDate,
          category: formCategory,
          month: formDate.substring(0, 7),
          isInstallment: false,
          isThirdParty: formIsThirdParty,
          thirdPartyName: formIsThirdParty ? formThirdPartyName : undefined
        };
        setExpenses(prev => [newExp, ...prev]);
      }
    }

    setIsNewExpenseModalOpen(false);
    setEditingExpense(null);
    setFormDesc('');
    setFormAmount('');
    setFormIsInstallment(false);
    setFormIsThirdParty(false);
    setFormThirdPartyName('');
  };

  // Salvar Novo Cartão
  const handleSaveNewCard = async () => {
    const parsedLimit = parseFloat(newCardLimit.replace(',', '.')) || 5000;
    if (!newCardName.trim()) return;

    try {
      const created = await cardsService.createCard({
        name: newCardName.trim(),
        bank: newCardBank,
        brand: newCardBrand,
        last_digits: newCardLastDigits || '0000',
        credit_limit: parsedLimit,
        closing_day: parseInt(newCardClosingDay, 10) || 15,
        due_day: parseInt(newCardDueDay, 10) || 22,
        color: '#3B6CF0',
      });

      const newCard: CardItem = created ? {
        id: created.id,
        name: created.name,
        bank: created.bank,
        brand: created.brand,
        lastDigits: created.last_digits,
        limitTotal: created.credit_limit,
        limitUsed: created.limit_used,
        closingDay: created.closing_day,
        dueDay: created.due_day,
        color: created.color || '#3B6CF0',
      } : {
        id: `card-${Date.now()}`,
        name: newCardName.trim(),
        bank: newCardBank,
        brand: newCardBrand,
        lastDigits: newCardLastDigits || '0000',
        limitTotal: parsedLimit,
        limitUsed: 0,
        closingDay: parseInt(newCardClosingDay, 10) || 15,
        dueDay: parseInt(newCardDueDay, 10) || 22,
        color: '#3B6CF0'
      };

      setCards(prev => [...prev, newCard]);
    } catch (e) {
      console.error('Erro ao salvar cartão no Supabase, mantendo local:', e);
      const fallbackCard: CardItem = {
        id: `card-${Date.now()}`,
        name: newCardName.trim(),
        bank: newCardBank,
        brand: newCardBrand,
        lastDigits: newCardLastDigits || '0000',
        limitTotal: parsedLimit,
        limitUsed: 0,
        closingDay: parseInt(newCardClosingDay, 10) || 15,
        dueDay: parseInt(newCardDueDay, 10) || 22,
        color: '#3B6CF0'
      };
      setCards(prev => [...prev, fallbackCard]);
    }

    setIsNewCardModalOpen(false);
    setNewCardName('');
    setNewCardLastDigits('');
    setNewCardLimit('');
  };

  // Confirmar Importação de Fatura
  const handleConfirmImport = async () => {
    const targetCard = cards.find(c => c.id === importCardId) || cards[0];
    const selectedRows = extractedImports.filter(r => r.checked);

    if (!targetCard || selectedRows.length === 0) {
      setIsImportModalOpen(false);
      return;
    }

    const newItems: CardExpense[] = selectedRows.map((row, idx) => {
      const isThird = !!row.thirdPartyName && row.thirdPartyName !== 'Titular (Você)';
      return {
        id: `exp-imp-${Date.now()}-${idx}`,
        cardId: targetCard.id,
        cardName: targetCard.name,
        description: row.description,
        amount: row.amount,
        date: row.date,
        category: row.category,
        month: row.date.substring(0, 7),
        isInstallment: !!row.installmentText,
        currentInstallment: row.installmentText ? parseInt(row.installmentText.split('/')[0]) : undefined,
        totalInstallments: row.installmentText ? parseInt(row.installmentText.split('/')[1]) : undefined,
        isThirdParty: isThird,
        thirdPartyName: isThird ? row.thirdPartyName : undefined,
      };
    });

    try {
      await cardsService.createCardExpenseBatch(selectedRows.map(row => {
        const isThird = !!row.thirdPartyName && row.thirdPartyName !== 'Titular (Você)';
        return {
          credit_card_id: targetCard.id,
          description: row.description,
          amount: row.amount,
          date: row.date,
          category_name: row.category,
          installments: row.installmentText ? parseInt(row.installmentText.split('/')[1]) : 1,
          current_installment: row.installmentText ? parseInt(row.installmentText.split('/')[0]) : 1,
          third_party_name: isThird ? row.thirdPartyName : undefined,
        };
      }));
    } catch (e) {
      console.error('Erro ao salvar lote de importação no Supabase:', e);
    }

    setExpenses(prev => [...newItems, ...prev]);
    setIsImportModalOpen(false);
    setImportStep(1);
  };

  // Confirmar Pagamento de Fatura
  const handleConfirmPayment = () => {
    if (!paymentTargetCard) return;

    const cardStatus = getCardStatusData(paymentTargetCard);
    const amountToRegister = paymentMode === 'TOTAL' 
      ? cardStatus.cardTotalDue 
      : (parseFloat(customPaymentAmount.replace(',', '.')) || cardStatus.cardTotalDue);

    setPayments(prev => {
      const filtered = prev.filter(p => !(p.cardId === paymentTargetCard.id && p.month === selectedMonth));
      return [...filtered, { cardId: paymentTargetCard.id, month: selectedMonth, amountPaid: amountToRegister }];
    });

    setIsPaymentModalOpen(false);
    setPaymentTargetCard(null);
    setCustomPaymentAmount('');
  };

  // Excluir Lançamento
  const handleDeleteExpense = async (id: string) => {
    try {
      await cardsService.deleteCardExpense(id);
    } catch (e) {
      console.error('Erro ao excluir despesa do cartão no Supabase:', e);
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteCandidate(null);
  };

  // Filtragem dos Lançamentos da Fatura
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter(e => {
      if (selectedCardFilter !== 'ALL' && e.cardId !== selectedCardFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.cardName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [monthExpenses, selectedCardFilter, searchQuery]);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pb-12 space-y-3.5">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
          {/* Coluna 1: KPIs Compactos */}
          <div className="lg:col-span-1 flex flex-col gap-3.5">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-4 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1 font-bold">
                Faturas Totais
              </span>
              <h3 className="text-2xl font-extrabold text-[#181B22] tracking-tight leading-none mb-1.5">
                R$ {formatCurrency(totalInvoiceMonth)}
              </h3>
              <p className="text-[10px] font-medium">
                {totalRemainingMonth > 0 ? (
                  <span className="text-amber-600 font-bold">Falta R$ {formatCurrency(totalRemainingMonth)}</span>
                ) : (
                  <span className="text-[#1A44C8] font-bold flex items-center gap-1"><CheckCheck size={11} /> Totalmente quitada</span>
                )}
              </p>
            </div>
            
            <div 
              className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-4 shadow-sm flex-1 flex flex-col justify-center relative overflow-visible cursor-pointer hover:border-[#1A44C8]/30 transition-colors group"
              onClick={() => setIsLimitPopupOpen(!isLimitPopupOpen)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">
                  Limite Disponível
                </span>
                <ChevronDown size={11} className={`text-[#94A3B8] transition-transform ${isLimitPopupOpen ? 'rotate-180' : ''}`} />
              </div>
              <h3 className="text-xl font-extrabold text-[#181B22] tracking-tight leading-none mb-2 group-hover:text-[#1A44C8] transition-colors">
                R$ {formatCurrency(totalLimitAvailable)}
              </h3>
              <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#1A44C8] to-[#00A3FF] rounded-full" 
                  style={{ width: `${Math.min(100, limitUsagePct)}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-[#64748B] mt-1.5 font-medium">{limitUsagePct.toFixed(1)}% em uso de R$ {formatCurrency(totalLimitGlobal)}</p>

              {isLimitPopupOpen && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsLimitPopupOpen(false); }}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-2xl z-50 p-3 flex flex-col gap-2 cursor-default" onClick={e => e.stopPropagation()}>
                    <h4 className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#E5E7EB] pb-1 mb-1">Por Cartão</h4>
                    {cards.map(c => {
                      const used = getCardLimitUsed(c);
                      const avail = Math.max(0, c.limitTotal - used);
                      return (
                        <div key={c.id} className="flex justify-between items-center text-[10px]">
                          <span className="text-[#181B22] font-semibold truncate pr-2">{c.name}</span>
                          <span className="text-[#1A44C8] font-extrabold whitespace-nowrap">R$ {formatCurrency(avail)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Coluna 2, 3, 4: Gráfico de Projeção */}
          <div className="lg:col-span-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                <Activity size={13} className="text-[#1A44C8]" />
                Projeção de Faturas Futuras
              </h3>
            </div>

            <div className="relative w-full h-28 pt-2 pb-1 group">
              <svg 
                viewBox={`0 0 ${projectionCoordinates.width} ${projectionCoordinates.height}`} 
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="invoiceStrokeGrad" x1="0%" y1="0%" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1A44C8" />
                    <stop offset="100%" stopColor="#00A3FF" />
                  </linearGradient>
                </defs>

                <g className="text-[#E5E7EB]">
                  <line x1="0" y1="20" x2="600" y2="20" stroke="currentColor" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="600" y2="50" stroke="currentColor" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="600" y2="80" stroke="currentColor" strokeDasharray="3 3" />
                  {projectionCoordinates.points.map((pt, i) => (
                    <line key={i} x1={pt.x} y1="0" x2={pt.x} y2="100" stroke="currentColor" strokeDasharray="3 3" />
                  ))}
                </g>

                <path 
                  d={projectionCoordinates.pathD} 
                  fill="none" 
                  stroke="url(#invoiceStrokeGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  className="transition-all duration-300 drop-shadow-[0_2px_4px_rgba(16,53,229,0.2)]" 
                />
              </svg>

              {/* HTML Overlay */}
              <div className="absolute top-2 bottom-1 left-0 right-0 pointer-events-none">
                {projectionCoordinates.points.map((pt, idx) => {
                  const data = futureProjectionData[idx];
                  if (!data) return null;
                  
                  return (
                    <div 
                      key={idx} 
                      className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 bg-[#FFFFFF] cursor-pointer pointer-events-auto transition-transform hover:scale-150 shadow-sm"
                      style={{ 
                        left: `${(pt.x / projectionCoordinates.width) * 100}%`, 
                        top: `${(pt.y / projectionCoordinates.height) * 100}%`,
                        borderColor: data.current ? '#1A44C8' : '#00A3FF'
                      }}
                      onMouseEnter={() => setHoveredProjectionMonth(idx)}
                      onMouseLeave={() => setHoveredProjectionMonth(null)}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <span className="text-[10px] font-bold text-[#181B22] bg-[#FFFFFF] px-1.5 py-0.5 rounded shadow-md border border-[#E5E7EB]">
                          R$ {formatCurrency(data.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-0.5 pt-1 border-t border-[#E5E7EB] text-center mt-1">
              {futureProjectionData.map((m, idx) => {
                const isHovered = hoveredProjectionMonth === idx;
                return (
                  <div 
                    key={idx}
                    onMouseEnter={() => setHoveredProjectionMonth(idx)}
                    onMouseLeave={() => setHoveredProjectionMonth(null)}
                    className={`py-1 rounded-lg transition-all cursor-pointer ${
                      isHovered ? 'bg-[#F1F3F7] border border-[#E5E7EB]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className={`text-[8px] sm:text-[9px] font-bold block ${m.current ? 'text-[#1A44C8]' : isHovered ? 'text-[#181B22]' : 'text-[#64748B]'}`}>
                      {m.label}
                    </span>
                    <span className="text-[7.5px] text-[#94A3B8] font-mono block">
                      {idx > 0 ? `${m.variation > 0 ? '+' : ''}${m.variation !== 0 ? m.variation.toFixed(0) : '0'}%` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5">
          <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-full border border-[#E5E7EB] shadow-sm">
            <button 
              onClick={() => { setCardGridFilter('ALL'); setCardPage(0); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                cardGridFilter === 'ALL' ? 'bg-[#F1F3F7] text-[#1A44C8] shadow-sm' : 'text-[#64748B] hover:text-[#181B22]'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => { setCardGridFilter('FECHADAS'); setCardPage(0); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                cardGridFilter === 'FECHADAS' ? 'bg-[#1A44C8]/10 text-[#1A44C8]' : 'text-[#64748B] hover:text-[#1A44C8]'
              }`}
            >
              Fechadas
            </button>
            <button 
              onClick={() => { setCardGridFilter('ABERTAS'); setCardPage(0); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                cardGridFilter === 'ABERTAS' ? 'bg-amber-50 text-amber-700' : 'text-[#64748B] hover:text-amber-700'
              }`}
            >
              Em Aberto
            </button>
          </div>
          
          <div className="flex items-center relative">
            <div className="flex items-center bg-[#FFFFFF] p-1 rounded-full border border-[#E5E7EB] shadow-sm">
              <button
                onClick={() => setIsResponsibleDropdownOpen(!isResponsibleDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  selectedResponsibleFilter !== 'ALL'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-[#F1F3F7] text-[#181B22]'
                }`}
              >
                <span>{selectedResponsibleFilter === 'ALL' ? 'Todos' : selectedResponsibleFilter === 'EU' ? 'Titular' : selectedResponsibleFilter}</span>
                <ChevronDown size={11} className={`text-[#64748B] transition-transform ${isResponsibleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isResponsibleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsResponsibleDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden z-50 py-1 flex flex-col">
                  {responsiblesList.map(r => (
                    <button
                      key={r}
                      onClick={() => { setSelectedResponsibleFilter(r); setIsResponsibleDropdownOpen(false); }}
                      className={`px-3 py-1.5 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center justify-between ${
                        selectedResponsibleFilter === r ? 'text-[#1A44C8] font-bold bg-[#1A44C8]/5' : 'text-[#64748B]'
                      }`}
                    >
                      {r === 'ALL' ? 'Todos' : r === 'EU' ? 'Titular' : r}
                      {selectedResponsibleFilter === r && <CheckCheck size={12} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-full border border-[#E5E7EB] shadow-sm">
              <button 
                onClick={() => {
                  const curIdx = parseInt(selectedMonthNum, 10);
                  if (curIdx > 1) {
                    setSelectedMonthNum(String(curIdx - 1).padStart(2, '0'));
                  } else {
                    setSelectedMonthNum('12');
                    setSelectedYear(String(parseInt(selectedYear, 10) - 1));
                  }
                }}
                className="p-1 rounded-full text-[#64748B] hover:text-[#181B22] hover:bg-[#F1F3F7]"
              >
                <ChevronLeft size={13} />
              </button>

              <span className="text-xs font-bold text-[#181B22] px-2">
                {MONTH_NAMES.find(m => m.value === selectedMonthNum)?.label} {selectedYear}
              </span>

              <button 
                onClick={() => {
                  const curIdx = parseInt(selectedMonthNum, 10);
                  if (curIdx < 12) {
                    setSelectedMonthNum(String(curIdx + 1).padStart(2, '0'));
                  } else {
                    setSelectedMonthNum('01');
                    setSelectedYear(String(parseInt(selectedYear, 10) + 1));
                  }
                }}
                className="p-1 rounded-full text-[#64748B] hover:text-[#181B22] hover:bg-[#F1F3F7]"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <button 
              onClick={() => setIsNewCardModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-semibold text-[10.5px] transition-all shadow-sm active:scale-95 border border-[#E5E7EB]"
            >
              <Plus size={11} className="text-[#64748B]" />
              Novo Cartão
            </button>

            <button 
              onClick={() => { setIsImportModalOpen(true); setImportStep(1); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F3F7] text-[#181B22] font-semibold text-[10.5px] transition-all shadow-sm active:scale-95 border border-[#E5E7EB]"
            >
              <Upload size={11} className="text-[#64748B]" />
              Importar Fatura
            </button>

            <button 
              onClick={handleOpenNewExpense}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A44C8] hover:bg-[#1538A5] text-white font-semibold shadow-md active:scale-95 text-[11px]"
            >
              <Plus size={11} />
              Adicionar Compra
            </button>
          </div>
        </div>

        {/* Grade de Cartões */}
        <div className="relative">
          {cardPage > 0 && (
            <button 
              onClick={() => setCardPage(p => p - 1)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#FFFFFF] text-[#181B22] rounded-full shadow-lg border border-[#E5E7EB] hover:bg-[#F1F3F7] transition-all hidden sm:block"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {cards.filter(c => {
              const status = getCardStatusData(c);
              if (cardGridFilter === 'FECHADAS') return !status.isOpen;
              if (cardGridFilter === 'ABERTAS') return status.isOpen;
              return true;
            }).slice(cardPage * 4, (cardPage + 1) * 4).map((card) => {
              const status = getCardStatusData(card);
              return (
                <div 
                  key={card.id}
                  onClick={() => setSelectedCardFilter(selectedCardFilter === card.id ? 'ALL' : card.id)}
                  className={`bg-[#FFFFFF] border rounded-[22px] p-4 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer shadow-sm overflow-hidden ${
                    selectedCardFilter === card.id ? 'ring-2 ring-[#1A44C8] border-[#1A44C8]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <BankLogo name={card.bank || card.name} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#181B22] truncate group-hover:text-[#1A44C8] transition-colors">{card.name}</h4>
                        <p className="text-[9.5px] text-[#94A3B8] font-mono">•••• {card.lastDigits}</p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center justify-center p-1.5 rounded-full bg-[#F1F3F7] border border-[#E5E7EB] text-[#64748B]"
                      title={status.isOpen ? 'Fatura Aberta' : 'Fatura Fechada'}
                    >
                      {status.isOpen ? <Unlock size={11} strokeWidth={2.5} /> : <Lock size={11} strokeWidth={2.5} />}
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#64748B] font-medium">Total da Fatura</span>
                      <span className={`text-[8.5px] px-2 py-0.5 rounded-full border font-bold ${status.statusBadgeColor}`}>
                        {status.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#181B22] tracking-tight">
                      R$ {formatCurrency(status.cardTotalDue)}
                    </h3>
                  </div>

                  <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-[9.5px] text-[#64748B] font-medium">Vence dia {card.dueDay}</span>
                    {status.cardTotalDue > 0 && status.remaining > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentTargetCard(card);
                          setCustomPaymentAmount(status.remaining > 0 ? String(status.remaining) : String(status.cardTotalDue));
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-full bg-[#1A44C8]/10 hover:bg-[#1A44C8]/20 text-[#1A44C8] border border-[#1A44C8]/20 transition-all font-bold text-[10px] shadow-sm flex items-center gap-1"
                      >
                        Pagar Fatura
                      </button>
                    ) : (
                      <div className="px-3 py-1 rounded-full bg-[#F1F3F7] border border-[#E5E7EB] text-[#64748B] font-bold text-[10px] flex items-center gap-1.5 shadow-sm">
                        <CheckCheck size={12} className="text-[#1A44C8]" />
                        Paga
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seta Direita */}
          {cards.filter(c => {
            const status = getCardStatusData(c);
            if (cardGridFilter === 'FECHADAS') return !status.isOpen;
            if (cardGridFilter === 'ABERTAS') return status.isOpen;
            return true;
          }).length > (cardPage + 1) * 4 && (
            <button 
              onClick={() => setCardPage(p => p + 1)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#FFFFFF] text-[#181B22] rounded-full shadow-lg border border-[#E5E7EB] hover:bg-[#F1F3F7] transition-all hidden sm:block"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Tabela de Lançamentos */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-1 bg-[#F1F3F7] p-1 rounded-full border border-[#E5E7EB] overflow-x-auto max-w-full">
              <button 
                onClick={() => setSelectedCardFilter('ALL')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  selectedCardFilter === 'ALL' 
                    ? 'bg-[#FFFFFF] text-[#1A44C8] shadow-sm' 
                    : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                Todos os Cartões
              </button>
              
              {cards.map(c => {
                const isSelected = selectedCardFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardFilter(c.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap ${
                      isSelected 
                        ? 'bg-[#FFFFFF] text-[#1A44C8] shadow-sm' 
                        : 'text-[#64748B] hover:text-[#181B22]'
                    }`}
                  >
                    <span>{c.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-56">
              <Search size={12} className="absolute left-3 top-2.5 text-[#94A3B8]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar compra ou categoria..."
                className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-full pl-8 pr-3 py-1.5 text-[10.5px] text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[9px] uppercase tracking-wider text-[#94A3B8] font-bold">
                  <th className="pb-2 px-2">Data</th>
                  <th className="pb-2 px-2">Estabelecimento / Descrição</th>
                  <th className="pb-2 px-2">Responsável</th>
                  <th className="pb-2 px-2">Cartão</th>
                  <th className="pb-2 px-2">Categoria</th>
                  <th className="pb-2 px-2">Parcela</th>
                  <th className="pb-2 px-2 text-right">Valor</th>
                  <th className="pb-2 px-2 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E7EB] text-[10.5px]">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-2.5 px-2 text-[#64748B] whitespace-nowrap text-[10px]">
                        {exp.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 px-2 font-bold text-[#181B22] group-hover:text-[#1A44C8] transition-colors">
                        {exp.description}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {exp.isThirdParty ? (
                          <span className="text-[8.5px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            Devedor: {exp.thirdPartyName}
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[10px]">Titular</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <BankLogo name={exp.cardName} size="xs" />
                          <span className="text-[#181B22] font-semibold text-[10px]">{exp.cardName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-[#64748B] text-[10px] whitespace-nowrap">
                        {exp.category}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {exp.isInstallment ? (
                          <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-[#F1F3F7] text-[#181B22] border border-[#E5E7EB] font-bold">
                            {exp.currentInstallment}/{exp.totalInstallments}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] text-[9.5px]">À vista</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-[#181B22] whitespace-nowrap">
                        R$ {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditExpense(exp)}
                            className="p-1 rounded-full hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] transition-colors"
                            title="Editar lançamento"
                          >
                            <Pencil size={11} />
                          </button>
                          <button 
                            onClick={() => setDeleteCandidate(exp)}
                            className="p-1 rounded-full hover:bg-rose-50 text-[#64748B] hover:text-rose-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[#94A3B8] text-xs font-medium">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in-center">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#181B22] flex items-center gap-2">
                <CreditCard size={14} className="text-[#1A44C8]" />
                Cadastrar Novo Cartão de Crédito
              </h2>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Nome do Cartão</label>
                <input 
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="Ex: Nubank Ultravioleta, Itaú Black..."
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Instituição / Banco</label>
                  <select 
                    value={newCardBank}
                    onChange={(e) => setNewCardBank(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="Nubank">Nubank</option>
                    <option value="Itaú">Itaú</option>
                    <option value="Banco Inter">Banco Inter</option>
                    <option value="C6 Bank">C6 Bank</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Santander">Santander</option>
                    <option value="XP Investimentos">XP Investimentos</option>
                    <option value="BTG Pactual">BTG Pactual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Bandeira / Categoria</label>
                  <select 
                    value={newCardBrand}
                    onChange={(e) => setNewCardBrand(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="Mastercard Black">Mastercard Black</option>
                    <option value="Visa Infinite">Visa Infinite</option>
                    <option value="Elo Nanquim">Elo Nanquim</option>
                    <option value="Visa Platinum">Visa Platinum</option>
                    <option value="Mastercard Gold">Mastercard Gold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Limite Total (R$)</label>
                  <input 
                    type="number"
                    value={newCardLimit}
                    onChange={(e) => setNewCardLimit(e.target.value)}
                    placeholder="15000"
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] font-bold focus:outline-none focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Dia Fechamento</label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    value={newCardClosingDay}
                    onChange={(e) => setNewCardClosingDay(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Dia Vencimento</label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    value={newCardDueDay}
                    onChange={(e) => setNewCardDueDay(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Últimos 4 Dígitos</label>
                <input 
                  type="text"
                  maxLength={4}
                  value={newCardLastDigits}
                  onChange={(e) => setNewCardLastDigits(e.target.value)}
                  placeholder="Ex: 4092"
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2">
              <button 
                type="button"
                onClick={() => setIsNewCardModalOpen(false)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNewCard}
                disabled={!newCardName.trim()}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A44C8] text-white font-semibold text-xs hover:bg-[#1538A5] transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Salvar Cartão
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in-center">
            
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#181B22] flex items-center gap-2">
                {editingExpense ? (
                  <>
                    <Pencil size={13} className="text-[#1A44C8]" />
                    Editar Lançamento no Cartão
                  </>
                ) : (
                  <>
                    <Plus size={14} className="text-[#1A44C8]" />
                    Novo Lançamento no Cartão
                  </>
                )}
              </h2>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Cartão de Crédito</label>
                <select 
                  value={formCardId}
                  onChange={(e) => setFormCardId(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (•••• {c.lastDigits})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Estabelecimento / Descrição</label>
                <input 
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Supermercado, iFood, Assinatura..."
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-bold focus:border-[#1A44C8]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Data da Compra</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Categoria</label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-2.5 text-xs text-[#181B22] focus:outline-none cursor-pointer font-medium"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {!editingExpense && (
                <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formIsInstallment}
                      onChange={(e) => setFormIsInstallment(e.target.checked)}
                      className="rounded accent-[#1A44C8] w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] text-[#181B22] font-bold">Compra Parcelada</span>
                  </label>

                  {formIsInstallment && (
                    <div>
                      <select 
                        value={formInstallments}
                        onChange={(e) => setFormInstallments(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-1 px-2 text-xs text-[#181B22] focus:outline-none"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                          <option key={n} value={n}>{n}x de R$ {formAmount ? (parseFloat(formAmount.replace(',', '.')) / n).toFixed(2) : '0,00'}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formIsThirdParty}
                    onChange={(e) => setFormIsThirdParty(e.target.checked)}
                    className="rounded accent-[#1A44C8] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-[#181B22] font-bold">Gasto de Terceiro / Amigo</span>
                </label>

                {formIsThirdParty && (
                  <div>
                    <label className="block text-[9.5px] text-[#64748B] mb-1 font-medium">Nome da Pessoa Responsável</label>
                    <input 
                      type="text" 
                      value={formThirdPartyName}
                      onChange={(e) => setFormThirdPartyName(e.target.value)}
                      placeholder="Ex: Lucas Ferreira, Mariana..."
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-1 px-2.5 text-xs text-[#181B22] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveExpense}
                disabled={!formDesc.trim() || !formAmount || parseFloat(formAmount.replace(',', '.')) <= 0}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A44C8] text-white font-semibold text-xs hover:bg-[#1538A5] transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {editingExpense ? 'Salvar Alterações' : 'Salvar no Cartão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && paymentTargetCard && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in-center">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#181B22] flex items-center gap-2">
                <CheckCheck size={14} className="text-[#1A44C8]" />
                Registrar Pagamento de Fatura
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#64748B] font-medium">{paymentTargetCard.name}</p>
                  <p className="text-sm font-extrabold text-[#181B22]">
                    R$ {formatCurrency(getCardStatusData(paymentTargetCard).cardTotalDue)}
                  </p>
                </div>
                <BankLogo name={paymentTargetCard.bank || paymentTargetCard.name} size="sm" />
              </div>

              <div>
                <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Modalidade de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMode('TOTAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMode === 'TOTAL'
                        ? 'border-[#1A44C8]/30 bg-[#1A44C8]/10 text-[#1A44C8]'
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    Valor Total
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMode('PARTIAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMode === 'PARTIAL'
                        ? 'border-[#1A44C8]/30 bg-[#1A44C8]/10 text-[#1A44C8]'
                        : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    Valor Parcial
                  </button>
                </div>
              </div>

              {paymentMode === 'PARTIAL' && (
                <div>
                  <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Valor Pago (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={customPaymentAmount}
                    onChange={(e) => setCustomPaymentAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl py-1.5 px-3 text-xs text-[#181B22] focus:outline-none font-bold"
                  />
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmPayment}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A44C8] text-white font-semibold text-xs hover:bg-[#1538A5] transition-all shadow-md active:scale-95"
              >
                Confirmar Quitação
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in-center">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#181B22] flex items-center gap-2">
                <Upload size={14} className="text-[#1A44C8]" />
                Importar Fatura de Cartão
              </h2>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".pdf,.ofx,.csv,.xlsx,.xls,.txt" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }} 
              className="hidden" 
            />

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {importStep === 1 ? (
                <div>
                  <div className="mb-3">
                    <label className="block text-[10.5px] text-[#64748B] mb-1 font-bold">Selecione o Cartão Destino</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cards.map(c => (
                        <button 
                          key={c.id} 
                          type="button" 
                          onClick={() => setImportCardId(c.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            importCardId === c.id 
                              ? 'border-[#1A44C8] bg-[#1A44C8]/10 text-[#1A44C8]' 
                              : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <BankLogo name={c.bank || c.name} size="xs" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#181B22] truncate">{c.name.split(' ')[0]}</p>
                            <p className="text-[8.5px] text-[#64748B] truncate">•••• {c.lastDigits}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProcessFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-[#CBD5E1] hover:border-[#1A44C8] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#F8FAFC] hover:bg-[#1A44C8]/[0.03] group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center mx-auto mb-2 border border-[#1A44C8]/20 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-[#181B22] mb-0.5">Clique ou arraste o arquivo da fatura</h3>
                    <p className="text-[10px] text-[#64748B] mb-3">Suporta arquivos PDF, OFX, CSV, Excel ou TXT</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Selecionar Arquivo do Computador
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                        Lançamentos Detectados ({extractedImports.length})
                        {uploadFileName && <span className="text-[9.5px] font-normal text-[#64748B]">({uploadFileName})</span>}
                      </h4>
                      <p className="text-[9.5px] text-[#64748B]">Defina a categoria e o responsável (pessoa) para cada compra</p>
                    </div>
                    
                    {/* Atribuir responsável em lote */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[#64748B] font-semibold whitespace-nowrap">Atribuir a todos:</span>
                      <select 
                        onChange={(e) => {
                          const targetResp = e.target.value;
                          if (targetResp) {
                            setExtractedImports(prev => prev.map(p => ({ ...p, thirdPartyName: targetResp })));
                          }
                        }}
                        className="bg-white border border-[#E5E7EB] rounded-lg py-1 px-2 text-[10px] text-[#181B22] font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Escolher --</option>
                        <option value="Titular (Você)">Titular (Você)</option>
                        {registeredThirdParties.map(tp => (
                          <option key={tp} value={tp}>{tp}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {extractedImports.map((item) => (
                      <div key={item.id} className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col gap-2 hover:border-[#1A44C8]/30 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input 
                              type="checkbox" 
                              checked={item.checked}
                              onChange={() => setExtractedImports(prev => prev.map(p => p.id === item.id ? { ...p, checked: !p.checked } : p))}
                              className="rounded accent-[#1A44C8] w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-[#181B22] text-xs truncate">{item.description}</p>
                              <p className="text-[9.5px] text-[#64748B]">{item.date.split('-').reverse().join('/')} {item.installmentText && `• Parcela ${item.installmentText}`}</p>
                            </div>
                          </div>

                          <span className="font-extrabold text-[#181B22] text-xs shrink-0">
                            R$ {formatCurrency(item.amount)}
                          </span>
                        </div>

                        {/* Linha de Filtros: Categoria + Responsável (Pessoa) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#F1F3F7]">
                          <div>
                            <label className="block text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider mb-0.5">Categoria</label>
                            <select 
                              value={item.category}
                              onChange={(e) => {
                                const newCat = e.target.value;
                                setExtractedImports(prev => prev.map(p => p.id === item.id ? { ...p, category: newCat } : p));
                              }}
                              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg py-1 px-2 text-[10.5px] text-[#181B22] focus:outline-none cursor-pointer font-medium"
                            >
                              {categoriesList.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider mb-0.5">Responsável / Pessoa</label>
                            <select 
                              value={item.thirdPartyName || 'Titular (Você)'}
                              onChange={(e) => {
                                const newResp = e.target.value;
                                setExtractedImports(prev => prev.map(p => p.id === item.id ? { ...p, thirdPartyName: newResp } : p));
                              }}
                              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg py-1 px-2 text-[10.5px] text-[#181B22] focus:outline-none cursor-pointer font-medium"
                            >
                              <option value="Titular (Você)">Titular (Você)</option>
                              {registeredThirdParties.map(tp => (
                                <option key={tp} value={tp}>{tp}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStep(1);
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#EAEAEA] transition-all"
              >
                Cancelar
              </button>
              {importStep === 2 && (
                <button 
                  type="button" 
                  onClick={handleConfirmImport}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#1A44C8] text-white font-semibold text-xs hover:bg-[#1538A5] transition-all shadow-md active:scale-95"
                >
                  Salvar na Fatura ({extractedImports.filter(i => i.checked).length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl p-5 space-y-4 text-center animate-scale-in-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#181B22]">Remover Lançamento?</h3>
              <p className="text-xs text-[#64748B]">
                Tem certeza que deseja excluir <strong>{deleteCandidate.description}</strong> (R$ {formatCurrency(deleteCandidate.amount)})?
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-[#181B22] font-semibold text-xs hover:bg-[#F1F3F7] transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => handleDeleteExpense(deleteCandidate.id)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
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
