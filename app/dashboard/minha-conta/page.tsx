'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { 
  UserCircle2, 
  X, 
  AlertCircle, 
  User,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Calendar,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Ticket,
  Copy,
  Check,
  Sparkles,
  Share2,
  KeyRound,
  CreditCard
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { subscriptionService, DbSubscription } from '@/lib/services/subscription';
import { isAdminEmail } from '@/lib/admin';

function MinhaContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'PERFIL' | 'ASSINATURA'>('PERFIL');
  
  // Shared States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- PERFIL STATE ---
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ASSINATURA STATE ---
  const [subscription, setSubscription] = useState<DbSubscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundPixKey, setRefundPixKey] = useState('');

  const isAdmin = isAdminEmail(userEmail);

  useEffect(() => {
    fetchData();
  }, []);

  // Sincroniza a aba a partir da URL (?tab=perfil, ?tab=assinatura)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    const t = tabParam.toLowerCase();
    if (t === 'assinatura') {
      setActiveTab('ASSINATURA');
    } else {
      setActiveTab('PERFIL');
    }
  }, [searchParams]);

  const handleSelectTab = (newTab: 'PERFIL' | 'ASSINATURA') => {
    setActiveTab(newTab);
    router.replace(`/dashboard/minha-conta?tab=${newTab.toLowerCase()}`, { scroll: false });
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Perfil
    const u = session.user;
    setUserId(u.id);
    setUserEmail(u.email || '');
    setUserName(u.user_metadata?.full_name || u.email?.split('@')[0] || '');
    setUserPhone(u.user_metadata?.phone || '');
    setUserAvatar(u.user_metadata?.avatar_url || null);

    // Assinatura
    try {
      const sub = await subscriptionService.getSubscription();
      setSubscription(sub);
    } catch (e) {
      console.error('Erro ao buscar assinatura:', e);
    } finally {
      setLoadingSub(false);
    }
  };

  const resetMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  // --- PERFIL HANDLERS ---
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('A imagem selecionada deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUserAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: userName,
          phone: userPhone,
          avatar_url: userAvatar
        }
      });

      if (error) throw error;
      setSuccessMsg('Perfil atualizado com sucesso!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ASSINATURA HANDLERS ---
  const handleCancelRecurring = async () => {
    setIsSubmitting(true);
    resetMessages();

    try {
      if (userId) {
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'CANCELED',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        setSubscription(prev => prev ? { ...prev, status: 'CANCELED' } : null);
        setSuccessMsg('Renovação automática cancelada. Seu acesso permanecerá ativo até o fim do ciclo atual.');
        setIsCancelModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao cancelar renovação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysSinceCreated = () => {
    if (!subscription) return 999;
    if (!subscription.created_at) return 1;
    const created = new Date(subscription.created_at).getTime();
    if (isNaN(created)) return 1;
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  };
  const isWithin7Days = getDaysSinceCreated() <= 7;

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithin7Days) {
      setErrorMsg('O prazo de garantia de 7 dias expirou para esta assinatura.');
      setIsRefundModalOpen(false);
      return;
    }
    setIsSubmitting(true);
    resetMessages();

    try {
      const res = await fetch('/api/subscriptions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          pixKey: refundPixKey
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar solicitação de reembolso.');
      }

      setSubscription(prev => prev ? { ...prev, status: 'CANCELED' } : null);
      setSuccessMsg('Solicitação de cancelamento e estorno registrada! O reembolso será processado em até 24h úteis.');
      setIsRefundModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao solicitar reembolso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in-up w-full space-y-6">
      {/* 1. CABEÇALHO DEDICADO DE MINHA CONTA */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#E5E7EB]/80">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
            <span>Kaxxa</span>
            <span>/</span>
            <span className="text-[#1A44C8]">Minha Conta</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#181B22] tracking-tight">
            Minha Conta
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Gerencie seus dados de acesso, foto, informações pessoais e detalhes da sua assinatura.
          </p>
        </div>
      </header>

      {/* 2. SUB-ABAS EM FORMATO PILL MODERNO */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        <button 
          type="button"
          onClick={() => handleSelectTab('PERFIL')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeTab === 'PERFIL'
              ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
              : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
          }`}
        >
          <User size={14} />
          <span>Meu perfil</span>
        </button>

        <button 
          type="button"
          onClick={() => handleSelectTab('ASSINATURA')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeTab === 'ASSINATURA'
              ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
              : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Minha assinatura</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
        
        {/* --- ABA MEU PERFIL --- */}
        {activeTab === 'PERFIL' && (
          <div className="animate-fade-in-up space-y-6 max-w-xl">
            <div>
              <h2 className="text-sm font-bold text-[#181B22]">Dados Pessoais</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Atualize sua foto, nome e informações de contato.</p>
            </div>

            <Alerts error={errorMsg} success={successMsg} />

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Foto de Perfil / Avatar */}
              <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#1A44C8] to-[#1538A5] text-white flex items-center justify-center font-black text-xl shadow-sm border-2 border-white">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'K'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Alterar foto"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isTrial = subscription?.status === 'TRIAL' || (subscription?.amount === 0 && !isAdminEmail(userEmail));
                      return (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isTrial 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isTrial ? 'Período teste' : 'Acesso Pro'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#1A44C8] hover:text-[#1538A5] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      Alterar Foto
                    </button>
                    {userAvatar && (
                      <button
                        type="button"
                        onClick={() => setUserAvatar(null)}
                        className="text-xs font-medium text-rose-600 hover:underline px-2"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">PNG, JPG ou GIF até 2MB.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* E-mail (Somente leitura - vinculado à conta) */}
              <div>
                <div className="flex items-center justify-between mb-1 pl-1">
                  <label className="text-[9px] text-[#94A3B8] uppercase tracking-widest font-bold">E-mail da Conta</label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Verificado
                  </span>
                </div>
                <input
                  type="email"
                  readOnly
                  value={userEmail}
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#64748B] font-semibold cursor-not-allowed select-none"
                />
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 pl-1 font-bold">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-semibold transition-colors"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 pl-1 font-bold">Número de Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="(DDD) 99999-9999"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-semibold transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* --- ABA ASSINATURA --- */}
        {activeTab === 'ASSINATURA' && (
          <div className="animate-fade-in-up space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-bold text-[#181B22]">Minha Assinatura</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Gerencie seu plano ativo, método de pagamento e ciclo de renovação.</p>
            </div>

            <Alerts error={errorMsg} success={successMsg} />

            {loadingSub ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse space-y-3">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-48 h-3 bg-slate-200 rounded" />
              </div>
            ) : isAdmin ? (
              <div className="space-y-4">
                <div className="bg-white border border-blue-200/80 rounded-2xl divide-y divide-[#F1F5F9] shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1A44C8]">Nível de Acesso</span>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md">
                          Master Developer
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#181B22]">{userEmail}</h3>
                      <p className="text-xs text-[#64748B]">Acesso irrestrito de desenvolvimento e administração do Kaxxa.</p>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Vitalício Permanente
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Status de Cobrança</span>
                      <strong className="text-sm font-black text-emerald-600">Isento Permanente</strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Permissões</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <ShieldCheck size={14} className="text-[#1A44C8]" />
                        Acesso Total de Sistema
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Expiração</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <Sparkles size={14} className="text-[#059669]" />
                        100 Anos (Ativo)
                      </strong>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-[#64748B]">
                      Para testar os fluxos de clientes (checkout, limites e cupons), acesse via conta de teste.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/admin')}
                      className="py-2.5 px-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 active:scale-95"
                    >
                      <ShieldCheck size={14} />
                      <span>Ir para Gestão</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#F1F5F9] shadow-sm overflow-hidden">
                  
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFBFD]">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Plano Contratado</span>
                      <h3 className="text-lg font-black text-[#181B22] tracking-tight">Kaxxa Finanças Pro</h3>
                      <p className="text-xs text-[#64748B]">Acesso completo a todas as ferramentas e inteligência financeira.</p>
                    </div>

                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${
                        subscription?.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : subscription?.status === 'CANCELED' 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-blue-50 text-[#1A44C8] border border-blue-200'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {subscription?.status === 'ACTIVE' ? 'Assinatura Ativa' : subscription?.status === 'CANCELED' ? 'Cancelamento Agendado' : 'Ativa'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Valor do Plano</span>
                      <div className="text-base font-black text-[#181B22]">
                        R$ 39,90 <span className="text-xs font-normal text-[#64748B]">/ mês</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Forma de Pagamento</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#181B22]">
                        <CreditCard size={14} className="text-[#1A44C8]" />
                        <span>{subscription?.payment_method === 'PIX' ? 'PIX (Mensal Avulso)' : 'Cartão de Crédito (Recorrente)'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">Próxima Renovação</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#181B22]">
                        <Calendar size={14} className="text-[#059669]" />
                        <span>
                          {subscription?.current_period_end 
                            ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR') 
                            : 'Ativo por 30 dias'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 bg-[#FAFBFD] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-[#64748B] w-full sm:w-auto">
                      {subscription?.status === 'CANCELED' ? (
                        <span className="text-amber-800 font-medium">
                          Renovação cancelada. Seu acesso continuará liberado até o término do ciclo atual.
                        </span>
                      ) : subscription?.payment_method === 'PIX' ? (
                        <span>Cobrança avulsa via Pix a cada ciclo. Você pode migrar para cartão a qualquer momento.</span>
                      ) : (
                        <span>Renovação automática mensal. Você tem autonomia para alterar ou cancelar a qualquer momento.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => router.push('/planos?change_method=true')}
                        className="flex-1 sm:flex-none py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#E5E7EB] hover:border-[#1A44C8] text-[#181B22] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                      >
                        <RefreshCw size={13} className="text-[#1A44C8]" />
                        <span>Mudar Método</span>
                      </button>

                      {subscription?.status === 'ACTIVE' && subscription?.payment_method === 'CREDIT_CARD' && (
                        <button
                          type="button"
                          onClick={() => setIsCancelModalOpen(true)}
                          className="flex-1 sm:flex-none py-2.5 px-4 bg-white hover:bg-rose-50 border border-[#E5E7EB] hover:border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                          <X size={13} />
                          <span>Cancelar Renovação</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isWithin7Days && subscription?.status === 'ACTIVE' && (
                    <div className="pt-3.5 text-center border-t border-[#F1F5F9] mt-3">
                      <button
                        type="button"
                        onClick={() => setIsRefundModalOpen(true)}
                        className="text-[11px] text-[#94A3B8] hover:text-[#64748B] hover:underline transition-colors font-medium select-none"
                      >
                        Solicitar estorno/reembolso da assinatura
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODAL CANCELAR RENOVAÇÃO --- */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E5E7EB] animate-fade-in-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#181B22]">Cancelar Renovação Automática?</h3>
                <p className="text-xs text-[#64748B]">Sua assinatura não será renovada no próximo ciclo.</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB]">
              Ao confirmar o cancelamento da renovação, você continuará com acesso total ao Kaxxa até o final do seu período pago atual. Nenhuma cobrança futura será realizada.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#181B22] hover:bg-[#F1F5F9] transition-all"
              >
                Manter Assinatura
              </button>
              <button
                type="button"
                onClick={handleCancelRecurring}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REEMBOLSO --- */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E5E7EB] animate-fade-in-up">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#181B22]">Solicitar Estorno / Reembolso</h3>
                <p className="text-xs text-[#64748B]">Garantia incondicional de 7 dias.</p>
              </div>
            </div>

            <form onSubmit={handleRequestRefund} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Motivo da solicitação</label>
                <textarea
                  required
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Conte-nos brevemente o motivo..."
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] resize-none h-20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Chave Pix para estorno</label>
                <input
                  type="text"
                  required
                  value={refundPixKey}
                  onChange={e => setRefundPixKey(e.target.value)}
                  placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#181B22] hover:bg-[#F1F5F9] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function Alerts({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={
      <div className="p-6 text-center text-xs font-bold text-[#64748B]">
        Carregando Minha Conta...
      </div>
    }>
      <MinhaContaContent />
    </Suspense>
  );
}
