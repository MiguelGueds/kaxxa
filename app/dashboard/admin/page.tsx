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
  ChevronRight
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
    });
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
      
      {/* Header com Identificação Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md shadow-sm">
              Administração
            </span>
            <span className="text-xs text-[#64748B] font-medium">somoskaxxa@gmail.com</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#181B22] mt-1">Gestão</h1>
          <p className="text-xs text-[#64748B]">Monitore usuários cadastrados, receita recorrente e status de assinaturas em tempo real.</p>
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
            onClick={loadSubscribers}
            className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#181B22] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* 4 Cards de Métricas Principais (Totalmente Proporcionados e Responsivos) */}
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
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Degustação de 2 dias ativa</p>
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
            Este painel exibe estritamente dados contratuais e comerciais de assinatura (plano, forma de pagamento, cupom e status). As informações financeiras pessoais (transações, saldos bancários, dívidas e cartões) são isoladas por RLS no banco e <strong>100% inacessíveis</strong> pelo painel de gestão.
          </span>
        </div>
      </div>

      {/* Tabela de Usuários e Assinaturas */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
        
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
                  ? 'bg-amber-500 text-white shadow-sm'
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
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw size={18} className="mx-auto animate-spin text-[#1A44C8]" />
              <p>Carregando assinantes do Kaxxa...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-1">
              <AlertCircle size={20} className="mx-auto text-slate-300" />
              <p className="font-bold text-[#181B22]">Nenhum usuário encontrado</p>
              <p className="text-[11px]">Tente ajustar os filtros ou a busca acima.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Plano e Pagamento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Cupom / Benefício</th>
                  <th className="py-3 px-4 text-right">Mensalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredUsers.map((user) => {
                  const isPaying = user.status === 'ACTIVE' && user.amount > 0;
                  const isTrial = user.isTrial || user.status === 'TRIAL';
                  const isCanceled = user.status === 'CANCELED';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Usuário / E-mail */}
                      <td className="py-3.5 px-4 font-semibold text-[#181B22]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-[#1A44C8] font-black text-[10px] flex items-center justify-center shrink-0">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-mono text-[11px] truncate max-w-[220px]">
                            {user.email}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPaying ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo (Pagante)
                          </span>
                        ) : isTrial ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            <Clock size={10} />
                            Degustação
                          </span>
                        ) : isCanceled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Plano e Forma */}
                      <td className="py-3.5 px-4 text-[#64748B]">
                        <div className="flex items-center gap-1.5 font-medium text-[11px]">
                          {user.paymentMethod === 'PIX' ? (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px] border border-emerald-200">
                              PIX
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-[#1A44C8] font-bold rounded text-[9px] border border-blue-200 flex items-center gap-1">
                              <CreditCard size={10} />
                              Cartão
                            </span>
                          )}
                          <span>{user.planType}</span>
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

    </div>
  );
}
