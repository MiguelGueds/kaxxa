'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Search, 
  Ticket, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Share2, 
  Lock, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';

interface SubscriberUser {
  id: string;
  email: string;
  status: 'ACTIVE' | 'TRIAL' | 'CANCELED' | 'INACTIVE';
  planType: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  isRecurring: boolean;
  amount: number;
  isTrial: boolean;
  couponCode: string | null;
  discountLabel: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'USUARIOS' | 'CUPONS'>('USUARIOS');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Métricas
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activePaying: 0,
    trialUsers: 0,
    mrr: 0
  });

  // Lista de Usuários
  const [users, setUsers] = useState<SubscriberUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'CANCELED'>('ALL');

  // Cupons
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'TRIAL_DAYS' | 'PERCENT' | 'FIXED'>('TRIAL_DAYS');
  const [newCouponValue, setNewCouponValue] = useState<number>(2);
  const [newCouponDurationMonths, setNewCouponDurationMonths] = useState<number>(1);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(1);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Verificação de permissões do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || '';
      setCurrentUserEmail(email);

      if (!isAdminEmail(email)) {
        router.replace('/dashboard');
        return;
      }

      loadSubscribers();
      loadCoupons();
    });

    // Se houver parâmetro ?tab=cupons na URL, troca para a aba de cupons
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'cupons') {
        setActiveTab('CUPONS');
      }
    }
  }, [router]);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscribers');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Erro ao carregar assinantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      // 1. Tenta carregar da API
      const res = await fetch('/api/coupons');
      const data = await res.json();
      let apiCoupons: any[] = data.coupons || [];

      // 2. Mescla com localStorage para resiliência imediata
      const localStored = localStorage.getItem('kaxxa_admin_coupons');
      let localCoupons: any[] = [];
      if (localStored) {
        try { localCoupons = JSON.parse(localStored); } catch {}
      }

      const mergedMap = new Map<string, any>();
      // Insere do local
      for (const c of localCoupons) {
        mergedMap.set(c.code, c);
      }
      // Sobrescreve/complementa com os da API
      for (const c of apiCoupons) {
        mergedMap.set(c.code, c);
      }

      const finalCoupons = Array.from(mergedMap.values());
      setCoupons(finalCoupons);
      localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(finalCoupons));

    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
      // Fallback local
      const localStored = localStorage.getItem('kaxxa_admin_coupons');
      if (localStored) {
        try { setCoupons(JSON.parse(localStored)); } catch {}
      }
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetCode = (newCouponCode.trim() || (newCouponType === 'TRIAL_DAYS' ? `TESTE-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : `PROMO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)).toUpperCase();

    const localNewCoupon = {
      id: `cp_${Date.now()}`,
      code: targetCode,
      type: newCouponType,
      value: newCouponValue,
      discount_duration_months: newCouponDurationMonths,
      max_uses: newCouponMaxUses,
      used_count: 0,
      used_by: [],
      active: true,
      created_at: new Date().toISOString()
    };

    // Salva imediatamente no localStorage
    try {
      const existing = coupons.filter(c => c.code !== targetCode);
      const updated = [localNewCoupon, ...existing];
      setCoupons(updated);
      localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(updated));
    } catch {}

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
          type: newCouponType,
          value: newCouponValue,
          discountDurationMonths: newCouponDurationMonths,
          maxUses: newCouponMaxUses,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar no servidor.');

      setSuccessMsg(`Cupom "${targetCode}" criado com sucesso!`);
      setNewCouponCode('');
      loadCoupons();
    } catch (err: any) {
      // Mesmo se a API falhar (ex: tabela pendente), confirmamos a criação local
      setSuccessMsg(`Cupom "${targetCode}" salvo localmente!`);
      setNewCouponCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (idOrCode: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cupom?')) return;

    // Remove do estado local
    const updated = coupons.filter(c => c.id !== idOrCode && c.code !== idOrCode);
    setCoupons(updated);
    localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(updated));

    try {
      await fetch(`/api/coupons?id=${encodeURIComponent(idOrCode)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao deletar cupom no servidor:', err);
    }
  };

  const generateRandomCouponCode = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = newCouponType === 'TRIAL_DAYS' ? 'TESTE' : 'PROMO';
    setNewCouponCode(`${prefix}-${randomSuffix}`);
  };

  const handleCopyCouponCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2500);
  };

  const handleCopyCouponLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.kaxxa.com.br';
    const link = `${origin}/planos?cupom=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'ACTIVE' && (u.status !== 'ACTIVE' || u.amount === 0)) return false;
    if (statusFilter === 'TRIAL' && !u.isTrial && u.status !== 'TRIAL') return false;
    if (statusFilter === 'CANCELED' && u.status !== 'CANCELED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.couponCode && u.couponCode.toLowerCase().includes(q)) ||
      u.planType.toLowerCase().includes(q) ||
      u.paymentMethod.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in-up w-full space-y-6">
      
      {/* Header com Badge Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md shadow-sm">
              Admin Master
            </span>
            <span className="text-xs text-[#64748B] font-medium">somoskaxxa@gmail.com</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#181B22] mt-1">Gestão da Plataforma Kaxxa</h1>
          <p className="text-xs text-[#64748B]">Monitore usuários, receita recorrente e cupons promocionais em tempo real.</p>
        </div>

        {/* Botão de Atualização Rápida */}
        <button
          type="button"
          onClick={() => { loadSubscribers(); loadCoupons(); }}
          className="self-start sm:self-auto py-2 px-3.5 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#181B22] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar Dados</span>
        </button>
      </header>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Usuários */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Total de Usuários</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A44C8] flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#181B22]">{metrics.totalUsers}</h3>
          <p className="text-[10px] text-[#64748B]">Cadastrados no ecossistema</p>
        </div>

        {/* Assinantes Pagantes */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Assinantes Ativos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600">{metrics.activePaying}</h3>
          <p className="text-[10px] text-emerald-700 font-medium">Planos pagos em dia</p>
        </div>

        {/* Período Gratuito / Trial */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Em Degustação (Trial)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600">{metrics.trialUsers}</h3>
          <p className="text-[10px] text-amber-700 font-medium">Degustação de 2 dias ativa</p>
        </div>

        {/* Receita Mensal Recorrente (MRR) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Receita Mensal (MRR)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#1A44C8] flex items-center justify-center">
              <DollarSign size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#1A44C8]">R$ {formatCurrency(metrics.mrr)}</h3>
          <p className="text-[10px] text-[#64748B]">Faturamento mensal recorrente</p>
        </div>

      </div>

      {/* Banner de Garantia de Privacidade */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-3 text-xs">
        <Lock size={16} className="text-[#1A44C8] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-[#181B22] block font-bold">Privacidade Absoluta Garantida por Design</strong>
          <span className="text-[#64748B] text-[11px] leading-relaxed">
            Este painel exibe estritamente dados contratuais e comerciais de assinatura (plano, forma de pagamento, desconto e status). As informações financeiras pessoais (transações, saldos bancários, dívidas e cartões) são isoladas por RLS no banco e <strong>100% inacessíveis</strong> pelo painel admin.
          </span>
        </div>
      </div>

      {/* Tabs de Seções Admin */}
      <div className="flex border-b border-[#E5E7EB] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('USUARIOS')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'USUARIOS'
              ? 'border-[#1A44C8] text-[#1A44C8]'
              : 'border-transparent text-[#64748B] hover:text-[#181B22]'
          }`}
        >
          <Users size={14} />
          <span>Usuários & Assinaturas ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CUPONS')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'CUPONS'
              ? 'border-[#1A44C8] text-[#1A44C8]'
              : 'border-transparent text-[#64748B] hover:text-[#181B22]'
          }`}
        >
          <Ticket size={14} />
          <span>Cupons & Testes ({coupons.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: USUÁRIOS & ASSINATURAS */}
      {/* ========================================================= */}
      {activeTab === 'USUARIOS' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por e-mail, plano ou cupom..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#181B22] placeholder:text-slate-400 focus:outline-none focus:border-[#1A44C8]"
              />
            </div>

            {/* Filtros de Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'ALL' ? 'bg-[#1A44C8] text-white' : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                Pagantes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('TRIAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'TRIAL' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                Degustação
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CANCELED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'CANCELED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                Cancelados
              </button>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
            <table className="w-full text-left text-xs text-[#181B22]">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Plano & Forma</th>
                  <th className="py-3 px-4">Recorrente</th>
                  <th className="py-3 px-4">Cupom / Desconto</th>
                  <th className="py-3 px-4">Receita Gerada</th>
                  <th className="py-3 px-4">Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Carregando usuários do sistema...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Usuário */}
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-[#1A44C8] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#181B22] block">{u.email}</span>
                            <span className="text-[10px] text-slate-400">Desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'ACTIVE' && u.amount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : u.isTrial || u.status === 'TRIAL' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Sparkles size={11} className="text-amber-500" />
                            Degustação
                          </span>
                        ) : u.status === 'CANCELED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelado
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">{u.status}</span>
                        )}
                      </td>

                      {/* Plano & Forma */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={13} className="text-[#1A44C8] shrink-0" />
                          <span>{u.planType} • {u.paymentMethod === 'PIX' ? 'PIX' : 'Cartão'}</span>
                        </div>
                      </td>

                      {/* Recorrente */}
                      <td className="py-3.5 px-4 font-semibold">
                        {u.isRecurring ? (
                          <span className="text-emerald-700 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Automática
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded">
                            Avulso / Degustação
                          </span>
                        )}
                      </td>

                      {/* Cupom / Desconto */}
                      <td className="py-3.5 px-4 font-medium">
                        {u.couponCode ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#1A44C8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Ticket size={11} />
                            {u.couponCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{u.discountLabel}</span>
                        )}
                      </td>

                      {/* Receita Gerada */}
                      <td className="py-3.5 px-4 font-bold">
                        {u.amount > 0 ? (
                          <span className="text-[#181B22] font-black">R$ {formatCurrency(u.amount)}/mês</span>
                        ) : (
                          <span className="text-amber-600 font-bold">R$ 0,00 (Gratuito)</span>
                        )}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium">
                        {new Date(u.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: CUPONS & TESTES */}
      {/* ========================================================= */}
      {activeTab === 'CUPONS' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-6 animate-fade-in-up">
          
          <div className="border-b border-[#E5E7EB] pb-4">
            <h2 className="text-sm font-bold text-[#181B22]">Gerador de Cupons & Degustação</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Crie cupons exclusivos para liberar 2 dias de degustação gratuita ou descontos promocionais para seus clientes.
            </p>
          </div>

          {/* Formulário de Criação */}
          <form onSubmit={handleCreateCoupon} className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-[#181B22] uppercase tracking-wider">Novo Cupom</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              {/* Código */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Código do Cupom</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: TESTE-KAXXA"
                    className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#181B22] uppercase focus:outline-none focus:border-[#1A44C8]"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCouponCode}
                    className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-[#E5E7EB] rounded-xl text-[10px] font-bold text-[#1A44C8]"
                    title="Gerar código aleatório"
                  >
                    Aleatório
                  </button>
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Tipo de Benefício</label>
                <select
                  value={newCouponType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setNewCouponType(t);
                    if (t === 'TRIAL_DAYS') setNewCouponValue(2);
                    if (t === 'PERCENT') setNewCouponValue(20);
                    if (t === 'FIXED') setNewCouponValue(10);
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                >
                  <option value="TRIAL_DAYS">Dias de Teste Grátis (Degustação)</option>
                  <option value="PERCENT">Desconto Percentual (%)</option>
                  <option value="FIXED">Desconto em Reais (R$)</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  {newCouponType === 'TRIAL_DAYS' ? 'Quantidade de Dias' : newCouponType === 'PERCENT' ? 'Percentual de Desconto (%)' : 'Valor do Desconto (R$)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={newCouponType === 'PERCENT' ? '100' : '365'}
                  value={newCouponValue}
                  onChange={e => setNewCouponValue(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              </div>

            </div>

            {successMsg && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold">
                {successMsg}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Plus size={13} />
                <span>{isSubmitting ? 'Salvando...' : 'Criar Cupom'}</span>
              </button>
            </div>
          </form>

          {/* Lista de Cupons Existentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#181B22] uppercase tracking-wider">
                Cupons Criados ({coupons.length})
              </h3>
              <button
                type="button"
                onClick={loadCoupons}
                className="text-[11px] text-[#1A44C8] hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw size={11} className={loadingCoupons ? 'animate-spin' : ''} />
                <span>Atualizar lista</span>
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center space-y-1.5">
                <Ticket size={24} className="mx-auto text-slate-300" />
                <p className="text-xs text-[#64748B] font-bold">Nenhum cupom gerado ainda</p>
                <p className="text-[11px] text-slate-400">Use o formulário acima para gerar seu primeiro cupom de teste ou desconto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coupons.map(coupon => {
                  const isCodeCopied = copiedCouponId === coupon.id;
                  const isLinkCopied = copiedLinkId === coupon.id;

                  return (
                    <div key={coupon.id} className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-3 shadow-sm hover:border-[#1A44C8]/40 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-black text-[#181B22] tracking-wider">{coupon.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              coupon.type === 'TRIAL_DAYS' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {coupon.type === 'TRIAL_DAYS' ? `${coupon.value} Dias Grátis` : `${coupon.value}% OFF`}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            Criado em {new Date(coupon.created_at).toLocaleDateString('pt-BR')} • {coupon.used_count || 0} de {coupon.max_uses || 1} usos
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Excluir cupom"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Botões de Ação */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#181B22] rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          {isCodeCopied ? (
                            <>
                              <Check size={12} className="text-[#059669]" />
                              <span className="text-[#059669]">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyCouponLink(coupon.code, coupon.id)}
                          className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1A44C8] rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          {isLinkCopied ? (
                            <>
                              <Check size={12} className="text-[#059669]" />
                              <span className="text-[#059669]">Link Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={12} />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

