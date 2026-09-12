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
  CreditCard,
  ZoomIn,
  ZoomOut,
  Move,
  Crop
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, performGlobalSignOut } from '@/lib/supabase';
import { subscriptionService, DbSubscription, getTrialRemainingText } from '@/lib/services/subscription';
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

  // --- EXCLUIR DADOS STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingData, setIsDeletingData] = useState(false);

  // --- CROP IMAGE MODAL STATE ---
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const cropImageRef = useRef<HTMLImageElement>(null);

  const isAdmin = isAdminEmail(userEmail);

  // Cálculo de Recorrência x Dias Restantes de Teste
  const isCreditCardRecurring = subscription?.payment_method === 'CREDIT_CARD' && subscription?.status === 'ACTIVE' && (subscription?.amount || 0) > 0;
  
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining(subscription?.current_period_end);

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
    const localAvatar = typeof window !== 'undefined' ? localStorage.getItem(`kaxxa_user_avatar_${u.id}`) : null;
    setUserAvatar(localAvatar || u.user_metadata?.avatar_url || null);

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

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem selecionada deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropScale(1);
      setCropOffset({ x: 0, y: 0 });
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCrop = () => {
    if (!cropImageSrc || !cropImageRef.current) return;

    const img = cropImageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);

    const viewportSize = 240;
    const outputSize = 256;
    const ratio = outputSize / viewportSize;

    const baseDim = Math.max(img.naturalWidth, img.naturalHeight);
    const drawWidth = (img.naturalWidth / baseDim) * viewportSize * cropScale;
    const drawHeight = (img.naturalHeight / baseDim) * viewportSize * cropScale;
    const drawX = ((viewportSize - drawWidth) / 2 + cropOffset.x) * ratio;
    const drawY = ((viewportSize - drawHeight) / 2 + cropOffset.y) * ratio;

    ctx.drawImage(img, drawX, drawY, drawWidth * ratio, drawHeight * ratio);

    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    setUserAvatar(compressedBase64);
    setIsCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();

    try {
      if (typeof window !== 'undefined' && userId) {
        if (userAvatar) {
          localStorage.setItem(`kaxxa_user_avatar_${userId}`, userAvatar);
        } else {
          localStorage.removeItem(`kaxxa_user_avatar_${userId}`);
        }
      }

      const updatePayload: any = {
        full_name: userName,
        phone: userPhone,
      };

      if (userAvatar && userAvatar.length < 50000) {
        updatePayload.avatar_url = userAvatar;
      }

      const { error } = await supabase.auth.updateUser({
        data: updatePayload
      });

      if (error) {
        console.warn('Sincronização de metadados remotos:', error);
      }
      setSuccessMsg('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.warn('Erro ao atualizar perfil no servidor, salvo localmente:', err);
      setSuccessMsg('Perfil atualizado com sucesso!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllUserData = async () => {
    if (deleteConfirmText.trim() !== 'CONFIRMAR') return;
    setIsDeletingData(true);
    resetMessages();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Sessão expirada. Faça login novamente.');

      const uid = session.user.id;

      // 1. Deleta todas as tabelas do usuário no Supabase
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', uid),
        supabase.from('investments').delete().eq('user_id', uid),
        supabase.from('debts').delete().eq('user_id', uid),
        supabase.from('amortizations').delete().eq('user_id', uid),
        supabase.from('third_party_debts').delete().eq('user_id', uid),
        supabase.from('third_parties').delete().eq('user_id', uid),
        supabase.from('credit_cards').delete().eq('user_id', uid),
        supabase.from('accounts').delete().eq('user_id', uid),
        supabase.from('categories').delete().eq('user_id', uid),
      ]);

      await performGlobalSignOut();
      router.replace('/login');
    } catch (err: any) {
      console.error('Erro ao excluir dados do usuário:', err);
      setErrorMsg(err?.message || 'Erro ao excluir dados.');
    } finally {
      setIsDeletingData(false);
      setIsDeleteModalOpen(false);
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
      {/* SUB-ABAS EM FORMATO PILL MODERNO */}
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

              {/* Zona de Perigo - Exclusão Definitiva de Dados */}
              <div className="pt-6 border-t border-[#F1F5F9] mt-6">
                <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>Zona de Perigo - Exclusão Definitiva de Dados</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 font-medium leading-relaxed">
                    Deseja zerar seu histórico? Essa ação apagará permanentemente todas as suas contas bancárias, cartões, lançamentos e investimentos do Kaxxa.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setDeleteConfirmText(''); setIsDeleteModalOpen(true); }}
                    className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <AlertTriangle size={13} />
                    <span>Excluir Meus Dados Permanentemente</span>
                  </button>
                </div>
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
                        isCreditCardRecurring 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : subscription?.status === 'CANCELED' 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {isCreditCardRecurring 
                          ? 'Plano Pro Ativado' 
                          : subscription?.status === 'CANCELED' 
                            ? 'Cancelamento Agendado' 
                            : getTrialRemainingText(subscription?.current_period_end).text
                        }
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
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-fade-in-up flex flex-col max-h-[88dvh] sm:max-h-[90vh] my-auto overflow-hidden shrink-0">
            <div className="flex items-center gap-3 text-rose-600 shrink-0 pb-3 border-b border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#181B22]">Cancelar Renovação Automática?</h3>
                <p className="text-xs text-[#64748B]">Sua assinatura não será renovada no próximo ciclo.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-3">
              <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB]">
                Ao confirmar o cancelamento da renovação, você continuará com acesso total ao Kaxxa até o final do seu período pago atual. Nenhuma cobrança futura será realizada.
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E7EB] shrink-0">
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
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-fade-in-up flex flex-col max-h-[88dvh] sm:max-h-[90vh] my-auto overflow-hidden shrink-0">
            <div className="flex items-center gap-3 text-amber-600 shrink-0 pb-3 border-b border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#181B22]">Solicitar Estorno / Reembolso</h3>
                <p className="text-xs text-[#64748B]">Garantia incondicional de 7 dias.</p>
              </div>
            </div>

            <form onSubmit={handleRequestRefund} className="flex flex-col flex-1 min-h-0 pt-3">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 pb-3">
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
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E5E7EB] shrink-0">
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

      {/* Modal de Confirmação para Exclusão Definitiva de Dados */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-rose-200 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[88dvh] sm:max-h-[90vh] my-auto overflow-hidden shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                <span>Confirmar Exclusão de Todos os Dados</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-medium leading-relaxed flex-1 overflow-y-auto custom-scrollbar pr-1 py-3">
              <p className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                ⚠️ ATENÇÃO: Esta ação é irreversível! Todos os seus lançamentos, contas, cartões, dívidas e investimentos serão apagados do Kaxxa para sempre.
              </p>
              <p>
                Para confirmar a exclusão definitiva, digite a palavra <strong className="text-rose-700 font-black">CONFIRMAR</strong> no campo abaixo:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Digite CONFIRMAR em maiúsculas"
                className="w-full bg-slate-50 border border-slate-300 focus:border-rose-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 outline-none uppercase"
              />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'CONFIRMAR' || isDeletingData}
                onClick={handleDeleteAllUserData}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isDeletingData ? (
                  <span>Excluindo...</span>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AJUSTAR / CORTAR FOTO DE PERFIL --- */}
      {isCropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 flex flex-col max-h-[88dvh] sm:max-h-[90vh] my-auto shrink-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crop size={18} className="text-[#1A44C8]" />
                <h3 className="text-sm font-bold text-slate-900">Ajustar Foto de Perfil</h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsCropModalOpen(false); setCropImageSrc(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Arraste a imagem para enquadrar ou use o zoom abaixo para ajustar o corte quadrado.
            </p>

            {/* Viewport Quadrado de Corte 240x240 com Overlay Circular/Quadrado */}
            <div 
              className="relative w-[240px] h-[240px] mx-auto rounded-2xl overflow-hidden bg-slate-900 shadow-inner border-2 border-[#1A44C8] cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                setIsDraggingCrop(true);
                setDragStartPos({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
              }}
              onMouseMove={(e) => {
                if (!isDraggingCrop) return;
                setCropOffset({
                  x: e.clientX - dragStartPos.x,
                  y: e.clientY - dragStartPos.y
                });
              }}
              onMouseUp={() => setIsDraggingCrop(false)}
              onMouseLeave={() => setIsDraggingCrop(false)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  setIsDraggingCrop(true);
                  setDragStartPos({ x: e.touches[0].clientX - cropOffset.x, y: e.touches[0].clientY - cropOffset.y });
                }
              }}
              onTouchMove={(e) => {
                if (!isDraggingCrop || e.touches.length !== 1) return;
                setCropOffset({
                  x: e.touches[0].clientX - dragStartPos.x,
                  y: e.touches[0].clientY - dragStartPos.y
                });
              }}
              onTouchEnd={() => setIsDraggingCrop(false)}
            >
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                  transition: isDraggingCrop ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <img
                  ref={cropImageRef}
                  src={cropImageSrc}
                  alt="Crop Preview"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>

              {/* Guia Visual Quadrada Transparente */}
              <div className="absolute inset-0 border-2 border-white/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Controle de Zoom Slider */}
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1"><ZoomOut size={13} /> Zoom</span>
                <span>{cropScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A44C8]"
              />
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsCropModalOpen(false); setCropImageSrc(null); }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="flex-1 py-2.5 px-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Aplicar Foto</span>
              </button>
            </div>
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

