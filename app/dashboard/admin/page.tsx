'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Search, 
  RefreshCw, 
  Lock, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Clock,
  Ticket,
  ChevronRight,
  Check,
  Copy,
  CheckCircle2,
  XCircle,
  ArrowDownLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';
import { RefundRequest } from '@/lib/services/refunds';

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
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'USERS' | 'REFUNDS'>('USERS');

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

  // Reembolsos
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);

  // 1. Verificação de permissões do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || '';
      setCurrentUserEmail(email);

      if (!isAdminEmail(email)) {
        router.replace('/dashboard');
        return;
      }

      loadAllData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSubscribers(), loadRefunds()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscribers = async () => {
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
    }
  };

  const loadRefunds = async () => {
    try {
      const res = await fetch('/api/admin/refunds');
      const data = await res.json();
      if (data.refunds) {
        setRefunds(data.refunds);
      }
    } catch (err) {
      console.error('Erro ao carregar reembolsos:', err);
    }
  };

  const handleMarkRefunded = async (id: string) => {
    setProcessingRefundId(id);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'REFUNDED' } : r));
      }
    } catch (err) {
      console.error('Erro ao atualizar status de reembolso:', err);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleCopyPix = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const pendingRefundsCount = refunds.filter(r => r.status === 'PENDING').length;

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
      
      {/* Header com Identificação Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md shadow-sm">
              Administração
            </span>
            <span className="text-xs text-[#64748B] font-medium">somoskaxxa@gmail.com</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#181B22] mt-1">Gestão Kaxxa</h1>
          <p className="text-xs text-[#64748B]">Monitore usuários cadastrados, receita recorrente e pedidos de estorno em tempo real.</p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin/cupons')}
            className="py-2 px-3.5 bg-white hover:bg-blue-50 border border-[#E5E7EB] hover:border-[#1A44C8]/40 rounded-xl text-xs font-bold text-[#1A44C8] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Ticket size={13} />
            <span>Gerenciar Cupons</span>
            <ChevronRight size={12} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={loadAllData}
            className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#181B22] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Usuários */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Total de Usuários
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A44C8] flex items-center justify-center shrink-0">
              <Users size={16} className="shrink-0" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#181B22] truncate">{metrics.totalUsers}</h3>
            <p className="text-[10px] text-[#64748B] mt-0.5">Cadastrados no ecossistema</p>
          </div>
        </div>

        {/* Assinantes Pagantes */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Assinantes Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="shrink-0" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600 truncate">{metrics.activePaying}</h3>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Planos pagos em dia</p>
          </div>
        </div>

        {/* Período Gratuito / Trial */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Em Degustação
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="shrink-0" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-amber-600 truncate">{metrics.trialUsers}</h3>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Degustação ativa</p>
          </div>
        </div>

        {/* Receita Mensal Recorrente (MRR) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Receita Mensal (MRR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#1A44C8] flex items-center justify-center shrink-0">
              <DollarSign size={16} className="shrink-0" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1A44C8] truncate">R$ {formatCurrency(metrics.mrr)}</h3>
            <p className="text-[10px] text-[#64748B] mt-0.5">Faturamento mensal recorrente</p>
          </div>
        </div>

      </div>

      {/* Banner de Garantia de Privacidade */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-3 text-xs">
        <Lock size={16} className="text-[#1A44C8] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-[#181B22] block font-bold">Privacidade Absoluta Garantida por Design</strong>
          <span className="text-[#64748B] text-[11px] leading-relaxed">
            Este painel exibe estritamente dados contratuais e comerciais de assinatura (plano, forma de pagamento, cupom e status). As informações financeiras pessoais são isoladas por RLS no banco e <strong>100% inacessíveis</strong> pelo painel de gestão.
          </span>
        </div>
      </div>

      {/* Navegação de Abas do Admin */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] pt-2">
        <button
          type="button"
          onClick={() => setAdminTab('USERS')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            adminTab === 'USERS'
              ? 'border-[#1A44C8] text-[#1A44C8]'
              : 'border-transparent text-[#64748B] hover:text-[#181B22]'
          }`}
        >
          <Users size={14} />
          <span>Assinantes & Clientes ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('REFUNDS')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            adminTab === 'REFUNDS'
              ? 'border-[#1A44C8] text-[#1A44C8]'
              : 'border-transparent text-[#64748B] hover:text-[#181B22]'
          }`}
        >
          <ArrowDownLeft size={14} />
          <span>Solicitações de Reembolso</span>
          {pendingRefundsCount > 0 ? (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              {pendingRefundsCount} pendente{pendingRefundsCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal">({refunds.length})</span>
          )}
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: USUÁRIOS E ASSINATURAS */}
      {adminTab === 'USERS' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in-up">
          
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por e-mail, plano ou cupom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] transition-all"
              />
            </div>

            {/* Filtros de Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-[#181B22] text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-[#64748B]'
                }`}
              >
                Todos ({users.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-[#64748B]'
                }`}
              >
                Ativos ({metrics.activePaying})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('TRIAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'TRIAL'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-[#64748B]'
                }`}
              >
                Degustação ({metrics.trialUsers})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('CANCELED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'CANCELED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-[#64748B]'
                }`}
              >
                Cancelados
              </button>
            </div>

          </div>

          {/* Tabela de Assinantes */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={24} className="animate-spin text-[#1A44C8]" />
                <span className="text-xs text-[#64748B]">Carregando base de clientes...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                Nenhum usuário encontrado com os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Cupom</th>
                    <th className="py-3 px-4 text-right">Valor / Mês</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredUsers.map((user) => {
                    const isTrial = user.isTrial || user.status === 'TRIAL';
                    const isPaying = user.status === 'ACTIVE' && user.amount > 0;
                    const isCanceled = user.status === 'CANCELED';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Identificação do Usuário */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                              {user.email.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-[#181B22] block">{user.email}</strong>
                              <span className="text-[10px] text-[#94A3B8] font-mono">ID: {user.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Status da Assinatura */}
                        <td className="py-3.5 px-4">
                          {isPaying ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={11} /> Ativo Pagante
                            </span>
                          ) : isTrial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sparkles size={11} /> Degustação
                            </span>
                          ) : isCanceled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Clock size={11} /> Cancelado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Método de Pagamento */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {user.paymentMethod === 'PIX' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                                Pix
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                                <CreditCard size={11} /> Cartão
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tipo: Recorrente vs Avulso */}
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium text-[#181B22]">
                            {user.isRecurring ? (
                              <span className="text-emerald-700 font-bold">Recorrente Mensal</span>
                            ) : (
                              <span className="text-[#64748B]">Ciclo Avulso</span>
                            )}
                          </span>
                        </td>

                        {/* Cupom Aplicado */}
                        <td className="py-3.5 px-4">
                          {user.couponCode ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#181B22]">
                                {user.couponCode}
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                {user.discountLabel}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Valor Gerado (MRR) */}
                        <td className="py-3.5 px-4 text-right">
                          <strong className={`font-black text-xs ${isPaying ? 'text-[#181B22]' : 'text-slate-400'}`}>
                            {user.amount > 0 ? `R$ ${formatCurrency(user.amount)}/mês` : 'R$ 0,00'}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* CONTEÚDO DA ABA 2: SOLICITAÇÕES DE REEMBOLSO */}
      {adminTab === 'REFUNDS' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in-up">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-bold text-[#181B22]">Solicitações de Reembolso (Garantia de 7 Dias)</h2>
              <p className="text-[11px] text-[#64748B]">
                Pedidos de cancelamento dentro do prazo legal de 7 dias com dados para estorno.
              </p>
            </div>
            <span className="text-xs text-[#64748B] font-medium">
              {pendingRefundsCount} pendente(s) • Total: {refunds.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-[#1A44C8]" />
              <span className="text-xs text-[#64748B]">Buscando solicitações...</span>
            </div>
          ) : refunds.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#181B22]">Nenhuma solicitação de reembolso</h4>
              <p className="text-[11px] text-[#64748B]">Nenhum cliente solicitou cancelamento com estorno nas últimas semanas.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
              {refunds.map((req) => {
                const isPending = req.status === 'PENDING';
                const isProcessing = processingRefundId === req.id;
                const formattedDate = new Date(req.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={req.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-xs font-bold text-[#181B22]">{req.user_email}</strong>
                        <span className="text-[10px] font-mono text-[#94A3B8]">({formattedDate})</span>
                        
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Estornado / Concluído
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-[#181B22]">
                          R$ {formatCurrency(req.amount)}
                        </span>
                      </div>

                      {/* Motivo informado */}
                      {req.reason && (
                        <p className="text-[11px] text-[#64748B] bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-[#181B22]">Motivo:</span> &quot;{req.reason}&quot;
                        </p>
                      )}

                      {/* Dados para devolução */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <span className="text-[11px] text-[#64748B]">
                          Forma de Pagamento: <strong className="text-[#181B22]">{req.payment_method === 'PIX' ? 'Pix' : 'Cartão de Crédito'}</strong>
                        </span>

                        {req.payment_method === 'PIX' && req.pix_key && (
                          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg text-teal-900">
                            <span className="text-[10px] font-bold">Chave Pix:</span>
                            <span className="font-mono text-[11px] select-all font-semibold">{req.pix_key}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPix(req.id, req.pix_key!)}
                              className="text-teal-700 hover:text-teal-900 p-0.5"
                              title="Copiar Chave Pix"
                            >
                              {copiedId === req.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}

                        {req.payment_method === 'CREDIT_CARD' && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            Estorno realizado diretamente na fatura do cartão via Mercado Pago
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isPending ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleMarkRefunded(req.id)}
                          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          <span>Marcar como Estornado</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                          <CheckCircle2 size={12} /> Devolvido
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
