'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { 
  CreditCard, 
  Landmark, 
  ListTree, 
  UserCircle2, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  Plus, 
  Wallet,
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
  Tag
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { subscriptionService, DbSubscription } from '@/lib/services/subscription';
import { isAdminEmail } from '@/lib/admin';
import { BankLogo } from '@/app/components/BankLogo';

type Category = { id: string; name: string; type: string; parent_id: string | null; };
type Account = { id: string; name: string; type: string; balance: number; };
type Card = { id: string; name: string; limit: number; due_day: number; };
type ThirdParty = { id: string; name: string; type: string; };

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'PERFIL' | 'ASSINATURA' | 'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS'>('PERFIL');
  const [section, setSection] = useState<'CONTA' | 'SISTEMA'>('CONTA');
  
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

  // Categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'MAIN' | 'SUB'>('MAIN');
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('EXPENSE');
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);

  // Contas
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('CORRENTE');
  const [accountBalance, setAccountBalance] = useState('');

  // Cartões
  const [cards, setCards] = useState<Card[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDueDay, setCardDueDay] = useState('10');

  // Terceiros
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [thirdPartyType, setThirdPartyType] = useState('CLIENTE');

  // Modal Proprietário Kaxxa de Confirmação de Exclusão
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'CATEGORY' | 'ACCOUNT' | 'CARD' | 'THIRD_PARTY';
    id: string;
    name: string;
    subWarning?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Sincroniza a aba e seção a partir dos parâmetros de URL (?tab=perfil, ?tab=sistema, ?tab=assinatura, etc)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    const t = tabParam.toLowerCase();

    if (t === 'perfil') {
      setSection('CONTA');
      setActiveTab('PERFIL');
    } else if (t === 'assinatura') {
      setSection('CONTA');
      setActiveTab('ASSINATURA');
    } else if (t === 'sistema' || t === 'contas') {
      setSection('SISTEMA');
      setActiveTab('CONTAS');
    } else if (t === 'cartoes') {
      setSection('SISTEMA');
      setActiveTab('CARTOES');
    } else if (t === 'categorias') {
      setSection('SISTEMA');
      setActiveTab('CATEGORIAS');
    } else if (t === 'terceiros') {
      setSection('SISTEMA');
      setActiveTab('TERCEIROS');
    }
  }, [searchParams]);

  const handleSelectSection = (newSection: 'CONTA' | 'SISTEMA') => {
    setSection(newSection);
    if (newSection === 'CONTA') {
      const nextTab = activeTab === 'ASSINATURA' ? 'ASSINATURA' : 'PERFIL';
      setActiveTab(nextTab);
      router.replace(`/dashboard/configuracoes?tab=${nextTab.toLowerCase()}`, { scroll: false });
    } else {
      const isSystemTab = ['CONTAS', 'CARTOES', 'CATEGORIAS', 'TERCEIROS'].includes(activeTab);
      const nextTab = isSystemTab ? activeTab : 'CONTAS';
      setActiveTab(nextTab as any);
      router.replace(`/dashboard/configuracoes?tab=${nextTab.toLowerCase()}`, { scroll: false });
    }
  };

  const handleSelectTab = (newTab: 'PERFIL' | 'ASSINATURA' | 'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS') => {
    setActiveTab(newTab);
    if (newTab === 'PERFIL' || newTab === 'ASSINATURA') {
      setSection('CONTA');
    } else {
      setSection('SISTEMA');
    }
    router.replace(`/dashboard/configuracoes?tab=${newTab.toLowerCase()}`, { scroll: false });
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

    // Dados Financeiros
    const [catRes, accRes, cardRes, thirdRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', session.user.id).order('name'),
      supabase.from('accounts').select('*').eq('user_id', session.user.id).order('name'),
      supabase.from('credit_cards').select('*').eq('user_id', session.user.id).order('name'),
      supabase.from('third_parties').select('*').eq('user_id', session.user.id).order('name')
    ]);
      
    if (catRes.data) setCategories(catRes.data);
    if (accRes.data) setAccounts(accRes.data.map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance ?? a.initial_balance ?? 0)
    })));
    if (cardRes.data) setCards(cardRes.data.map(c => ({
      id: c.id,
      name: c.name,
      limit: Number(c.credit_limit ?? c.limit ?? 0),
      due_day: c.due_day
    })));
    if (thirdRes.data) setThirdParties(thirdRes.data);
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

  // Cálculo de dias desde a contratação para garantia de 7 dias
  const getDaysSinceCreated = () => {
    if (!subscription) return 999;
    if (!subscription.created_at) return 1; // Se existe assinatura ativa sem created_at, considera recente dentro do prazo
    const created = new Date(subscription.created_at).getTime();
    if (isNaN(created)) return 1;
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  };
  const isWithin7Days = getDaysSinceCreated() <= 7;
  const daysRemainingRefund = Math.max(0, 7 - getDaysSinceCreated());

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

  // --- CATEGORIAS ---
  const handleOpenMainCategoryModal = () => {
    setModalMode('MAIN'); setCategoryName(''); setCategoryType('EXPENSE'); setCategoryParentId(null); resetMessages(); setIsCategoryModalOpen(true);
  };
  const handleOpenSubCategoryModal = (parent: Category) => {
    setModalMode('SUB'); setCategoryName(''); setCategoryType(parent.type); setCategoryParentId(parent.id); resetMessages(); setIsCategoryModalOpen(true);
  };
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('categories').insert({ user_id: session?.user.id, name: categoryName, type: categoryType, parent_id: categoryParentId });
    if (error) setErrorMsg(error.message); else { setSuccessMsg('Salvo!'); setCategoryName(''); fetchData(); setTimeout(() => setIsCategoryModalOpen(false), 800); }
    setIsSubmitting(false);
  };
  // --- EXCLUSÃO PROPRIETÁRIA KAXXA ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    resetMessages();
    try {
      if (deleteTarget.type === 'CATEGORY') {
        // Se for categoria principal, remove também eventuais subcategorias vinculadas
        await supabase.from('categories').delete().eq('parent_id', deleteTarget.id);
        await supabase.from('categories').delete().eq('id', deleteTarget.id);
      } else if (deleteTarget.type === 'ACCOUNT') {
        await supabase.from('accounts').delete().eq('id', deleteTarget.id);
      } else if (deleteTarget.type === 'CARD') {
        await supabase.from('credit_cards').delete().eq('id', deleteTarget.id);
      } else if (deleteTarget.type === 'THIRD_PARTY') {
        await supabase.from('third_parties').delete().eq('id', deleteTarget.id);
      }
      setSuccessMsg('Item excluído com sucesso!');
      fetchData();
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao excluir item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CONTAS ---
  const handleOpenAccountModal = () => {
    setAccountName(''); setAccountType('CORRENTE'); setAccountBalance(''); resetMessages(); setIsAccountModalOpen(true);
  };
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('accounts').insert({ 
      user_id: session?.user.id, 
      name: accountName, 
      type: accountType, 
      initial_balance: parseFloat(accountBalance || '0') 
    });
    if (error) setErrorMsg(error.message); else { setSuccessMsg('Conta salva!'); fetchData(); setTimeout(() => setIsAccountModalOpen(false), 800); }
    setIsSubmitting(false);
  };

  // --- CARTÕES ---
  const handleOpenCardModal = () => {
    setCardName(''); setCardLimit(''); setCardDueDay('10'); resetMessages(); setIsCardModalOpen(true);
  };
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('credit_cards').insert({ 
      user_id: session?.user.id, 
      name: cardName, 
      credit_limit: parseFloat(cardLimit || '0'), 
      closing_day: Math.max(1, parseInt(cardDueDay) - 7), 
      due_day: parseInt(cardDueDay) 
    });
    if (error) setErrorMsg(error.message); else { setSuccessMsg('Cartão salvo!'); fetchData(); setTimeout(() => setIsCardModalOpen(false), 800); }
    setIsSubmitting(false);
  };

  // --- TERCEIROS ---
  const handleOpenThirdPartyModal = () => {
    setThirdPartyName(''); setThirdPartyType('CLIENTE'); resetMessages(); setIsThirdPartyModalOpen(true);
  };
  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let { error } = await supabase.from('third_parties').insert({ user_id: session?.user.id, name: thirdPartyName, type: thirdPartyType });
      if (error && (error.message.includes('type') || error.code === 'PGRST204' || error.message.includes('schema cache'))) {
        const retry = await supabase.from('third_parties').insert({ user_id: session?.user.id, name: thirdPartyName });
        error = retry.error;
      }
      if (error) setErrorMsg(error.message); else { setSuccessMsg('Terceiro salvo!'); fetchData(); setTimeout(() => setIsThirdPartyModalOpen(false), 800); }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar terceiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in-up w-full space-y-6">
      {/* 1. CABEÇALHO CONTEXTUAL COM IDENTIFICAÇÃO CLARA DA SEÇÃO */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#E5E7EB]/80">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
            <span>Configurações</span>
            <span>/</span>
            <span className="text-[#1A44C8]">{section === 'CONTA' ? 'Perfil e Conta' : 'Dados do Sistema'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#181B22] tracking-tight">
            {section === 'CONTA' ? 'Perfil e Conta' : 'Dados do Sistema'}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {section === 'CONTA' 
              ? 'Gerencie seus dados de acesso, foto, informações pessoais e detalhes da sua assinatura.' 
              : 'Estruture suas contas bancárias, cartões de crédito, categorias financeiras e pessoas cadastradas.'}
          </p>
        </div>

        {/* Alternador Rápido de Contexto */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleSelectSection('CONTA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              section === 'CONTA'
                ? 'bg-white text-[#1A44C8] shadow-sm'
                : 'text-[#64748B] hover:text-[#181B22]'
            }`}
          >
            <User size={13} />
            <span>Perfil e Conta</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectSection('SISTEMA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              section === 'SISTEMA'
                ? 'bg-white text-[#1A44C8] shadow-sm'
                : 'text-[#64748B] hover:text-[#181B22]'
            }`}
          >
            <Wallet size={13} />
            <span>Dados do Sistema</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-ABAS EM FORMATO PILL MODERNO */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {section === 'CONTA' ? (
          <>
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
              <span>Meu Perfil</span>
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
              <span>Minha Assinatura</span>
            </button>
          </>
        ) : (
          <>
            <button 
              type="button"
              onClick={() => handleSelectTab('CONTAS')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === 'CONTAS'
                  ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
                  : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
            >
              <Landmark size={14} />
              <span>Contas Bancárias</span>
            </button>

            <button 
              type="button"
              onClick={() => handleSelectTab('CARTOES')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === 'CARTOES'
                  ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
                  : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
            >
              <CreditCard size={14} />
              <span>Cartões de Crédito</span>
            </button>

            <button 
              type="button"
              onClick={() => handleSelectTab('CATEGORIAS')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === 'CATEGORIAS'
                  ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
                  : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
            >
              <ListTree size={14} />
              <span>Categorias</span>
            </button>

            <button 
              type="button"
              onClick={() => handleSelectTab('TERCEIROS')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === 'TERCEIROS'
                  ? 'bg-[#181B22] text-white shadow-sm border border-[#181B22]'
                  : 'bg-white text-[#64748B] hover:text-[#181B22] hover:bg-slate-50 border border-[#E5E7EB]'
              }`}
            >
              <UserCircle2 size={14} />
              <span>Pessoas e Terceiros</span>
            </button>
          </>
        )}
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
        
        {/* ======================================================== */}
        {/* --- ABA MEU PERFIL --- */}
        {/* ======================================================== */}
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
                    ✓ Verificado via Google
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

        {/* ======================================================== */}
        {/* --- ABA ASSINATURA --- */}
        {/* ======================================================== */}
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
                {/* Visual limpo para Master Developer */}
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
                
                {/* Container Único do Plano (Sem caixas aninhadas) */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#F1F5F9] shadow-sm overflow-hidden">
                  
                  {/* Cabeçalho */}
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

                  {/* Informações Principais em Linha Limpa */}
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

                  {/* Ações e Notificação de Ciclo */}
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

                      {/* Opção de Cancelar Renovação restrita a assinaturas ativas com cartão de crédito recorrente */}
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

                  {/* Link discreto de estorno/reembolso visível exclusivamente dentro do prazo legal de 7 dias */}
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

        {/* ======================================================== */}
        {/* --- ABA CONTAS --- */}
        {/* ======================================================== */}
        {activeTab === 'CONTAS' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-[#181B22]">Contas Bancárias</h2>
              </div>
              <button 
                onClick={handleOpenAccountModal} 
                className="text-[10px] font-bold bg-[#1A44C8] text-white px-3.5 py-2 rounded-xl hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-widest active:scale-95"
              >
                <Plus size={13} /> Nova Conta
              </button>
            </div>
            
            <div className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#F1F5F9] shadow-xs overflow-hidden">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#94A3B8] font-medium">
                  Nenhuma conta bancária cadastrada.
                </div>
              ) : (
                accounts.map(acc => (
                  <div key={acc.id} className="p-3.5 px-4 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <BankLogo name={acc.name} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#181B22] block truncate">{acc.name}</span>
                        <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">
                          {acc.type === 'CORRENTE' ? 'Conta Corrente' : acc.type === 'POUPANCA' ? 'Poupança / Investimento' : acc.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#181B22] block">
                          R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-[#059669] font-bold">Saldo</span>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'ACCOUNT', id: acc.id, name: acc.name })} 
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir conta"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* --- ABA CARTÕES --- */}
        {/* ======================================================== */}
        {activeTab === 'CARTOES' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#181B22]">Cartões de Crédito</h2>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Gerencie seus limites e vencimentos.</p>
              </div>
              <button onClick={handleOpenCardModal} className="text-[10px] font-bold bg-[#1A44C8] text-white px-3 py-1.5 rounded-full hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest active:scale-95">
                <Plus size={12} /> Novo Cartão
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.length === 0 ? (
                <div className="col-span-full p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center text-xs text-[#94A3B8] font-medium">
                  Nenhum cartão cadastrado.
                </div>
              ) : (
                cards.map(card => (
                  <div key={card.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex justify-between items-center group hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8]">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <span className="text-sm text-[#181B22] font-bold">{card.name}</span>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold">Vence dia {card.due_day}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-xs text-[#181B22] font-bold">Limite: R$ {card.limit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                       <button 
                         type="button"
                         onClick={() => setDeleteTarget({ type: 'CARD', id: card.id, name: card.name })} 
                         className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                         title="Excluir cartão"
                       >
                         <Trash2 size={13}/>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* --- ABA CATEGORIAS --- */}
        {/* ======================================================== */}
        {activeTab === 'CATEGORIAS' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#181B22]">Categorias</h2>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Agrupe suas receitas e despesas.</p>
              </div>
              <button onClick={handleOpenMainCategoryModal} className="text-[10px] font-bold bg-[#1A44C8] text-white px-3 py-1.5 rounded-full hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest active:scale-95">
                <Plus size={12} /> Nova Categoria
              </button>
            </div>
            
            <div className="space-y-4">
              {categories.length === 0 ? (
                <div className="p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center text-xs text-[#94A3B8] font-medium">
                  Nenhuma categoria cadastrada.
                </div>
              ) : (
                categories.filter(c => !c.parent_id).map(parent => {
                  const subs = categories.filter(c => c.parent_id === parent.id);
                  const isIncome = parent.type === 'INCOME';

                  return (
                    <div key={parent.id} className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden">
                      {/* Linha da Categoria Principal */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-white hover:bg-[#FAFBFD] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${isIncome ? 'bg-[#1A44C8]' : 'bg-rose-500'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#181B22] font-bold truncate">{parent.name}</span>
                              <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isIncome ? 'bg-blue-50 text-[#1A44C8] border border-blue-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                              }`}>
                                {isIncome ? 'Receita' : 'Despesa'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#94A3B8] font-semibold">
                              {subs.length === 0 ? 'Nenhuma subcategoria' : `${subs.length} subcategoria${subs.length > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleOpenSubCategoryModal(parent)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-blue-50 hover:border-blue-200 border border-[#E5E7EB] text-[11px] font-bold text-[#1A44C8] transition-colors active:scale-95"
                          >
                            <Plus size={12} />
                            <span>Nova Sub</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => setDeleteTarget({ 
                              type: 'CATEGORY', 
                              id: parent.id, 
                              name: parent.name,
                              subWarning: subs.length > 0 ? `Atenção: esta categoria possui ${subs.length} subcategoria(s) vinculada(s) que também serão removidas.` : undefined
                            })} 
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Excluir categoria"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Lista Estruturada de Subcategorias (Árvore Hierárquica) */}
                      <div className="bg-[#FAFBFD] border-t border-[#F1F5F9] p-3.5 sm:p-4">
                        {subs.length === 0 ? (
                          <div className="py-2 px-3 text-[11px] text-[#94A3B8] font-medium text-center">
                            Nenhuma subcategoria vinculada. Clique em &quot;+ Nova Sub&quot; para criar.
                          </div>
                        ) : (
                          <div className="space-y-1.5 pl-3 border-l-2 border-[#E2E8F0] ml-2">
                            {subs.map(sub => (
                              <div 
                                key={sub.id} 
                                className="flex items-center justify-between p-2 px-3 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl shadow-2xs group/sub transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/sub:bg-[#1A44C8] transition-colors" />
                                  <span className="text-xs text-[#181B22] font-semibold">{sub.name}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setDeleteTarget({ type: 'CATEGORY', id: sub.id, name: sub.name })}
                                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Excluir subcategoria"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* --- ABA TERCEIROS --- */}
        {/* ======================================================== */}
        {activeTab === 'TERCEIROS' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#181B22]">Terceiros / Contatos</h2>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Pessoas ou empresas que você transaciona.</p>
              </div>
              <button onClick={handleOpenThirdPartyModal} className="text-[10px] font-bold bg-[#1A44C8] text-white px-3 py-1.5 rounded-full hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest active:scale-95">
                <Plus size={12} /> Novo Terceiro
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thirdParties.length === 0 ? (
                <div className="col-span-full p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center text-xs text-[#94A3B8] font-medium">
                  Nenhum terceiro cadastrado.
                </div>
              ) : (
                thirdParties.map(tp => (
                  <div key={tp.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex justify-between items-center group hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8]">
                        <UserCircle2 size={18} />
                      </div>
                      <div>
                        <span className="text-sm text-[#181B22] font-bold">{tp.name}</span>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold">{tp.type}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'THIRD_PARTY', id: tp.id, name: tp.name })} 
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir terceiro"
                    >
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* --- MODAIS --- */}
      {/* ======================================================== */}

      {/* Modal Cancelar Renovação Automática */}
      {isCancelModalOpen && (
        <ModalWrapper title="Cancelar Renovação Automática" onClose={() => setIsCancelModalOpen(false)}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Deseja cancelar a renovação?</strong>
                <span>Seu acesso continuará funcionando normalmente até o final do período já pago. Nenhuma nova cobrança será realizada.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#181B22] font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelRecurring}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Modal Solicitar Reembolso (Apenas dentro da garantia legal de 7 dias) */}
      {isRefundModalOpen && isWithin7Days && (
        <ModalWrapper title="Solicitar Reembolso (Garantia de 7 dias)" onClose={() => setIsRefundModalOpen(false)}>
          <form onSubmit={handleRequestRefund} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[#64748B] space-y-1">
              <strong className="block text-[#181B22]">Garantia Incondicional de 7 dias</strong>
              <p className="text-[11px] leading-relaxed">
                Você está dentro do período de 7 dias após a assinatura. Ao confirmar, seu acesso ao plano será desativado e o estorno de R$ 39,90 será enviado para processamento.
              </p>
            </div>

            <div>
              <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 font-bold">Motivo do Cancelamento (Opcional)</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                rows={2}
                placeholder="Conte-nos brevemente o motivo..."
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] resize-none font-medium"
              />
            </div>

            {subscription?.payment_method === 'PIX' && (
              <div>
                <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 font-bold">Chave PIX para Devolução</label>
                <input
                  type="text"
                  required
                  value={refundPixKey}
                  onChange={e => setRefundPixKey(e.target.value)}
                  placeholder="Seu CPF, e-mail ou telefone cadastrado no Pix"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#181B22] font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Reembolso'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Modal Categoria */}
      {isCategoryModalOpen && (
        <ModalWrapper title={modalMode === 'MAIN' ? 'Nova Categoria' : 'Nova Subcategoria'} onClose={() => setIsCategoryModalOpen(false)}>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <Alerts error={errorMsg} success={successMsg} />
            {modalMode === 'MAIN' && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCategoryType('EXPENSE')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${categoryType==='EXPENSE'?'bg-rose-50 border-rose-200 text-rose-600':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Despesa</button>
                <button type="button" onClick={() => setCategoryType('INCOME')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${categoryType==='INCOME'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Receita</button>
              </div>
            )}
            <Input label="Nome da Categoria" value={categoryName} onChange={setCategoryName} placeholder="Ex: Alimentação" />
            <SubmitButton label="Salvar Categoria" loading={isSubmitting} />
          </form>
        </ModalWrapper>
      )}

      {/* Modal Conta */}
      {isAccountModalOpen && (
        <ModalWrapper title="Nova Conta Bancária" onClose={() => setIsAccountModalOpen(false)}>
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <Alerts error={errorMsg} success={successMsg} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAccountType('CORRENTE')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${accountType==='CORRENTE'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Corrente</button>
              <button type="button" onClick={() => setAccountType('POUPANCA')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${accountType==='POUPANCA'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Poupança / Investimento</button>
            </div>

            {/* Sugestões rápidas com logos */}
            <div>
              <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1.5 pl-1 font-bold">
                Bancos Frequentes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Nubank', 'Itaú', 'Bradesco', 'Inter', 'C6 Bank', 'Santander', 'Caixa', 'Banco do Brasil'].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setAccountName(b)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-blue-50 hover:border-blue-200 border border-[#E5E7EB] text-[10px] font-bold text-[#181B22] transition-colors active:scale-95"
                  >
                    <BankLogo name={b} size="xs" />
                    <span>{b}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input com preview automático da logo do banco */}
            <div>
              <div className="flex items-center justify-between mb-1.5 pl-1">
                <label className="text-[9px] text-[#94A3B8] uppercase tracking-widest font-bold">Nome da Conta / Instituição</label>
                {accountName.trim() && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#059669]">
                    <BankLogo name={accountName} size="xs" />
                    <span>Identificado</span>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                required 
                value={accountName} 
                onChange={e => setAccountName(e.target.value)} 
                placeholder="Ex: Nubank, Itaú, Bradesco..." 
                className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-semibold transition-colors" 
              />
            </div>

            <Input label="Saldo Inicial" value={accountBalance} onChange={setAccountBalance} placeholder="Ex: 1000.00" type="number" step="0.01" />
            <SubmitButton label="Salvar Conta" loading={isSubmitting} />
          </form>
        </ModalWrapper>
      )}

      {/* Modal Cartão */}
      {isCardModalOpen && (
        <ModalWrapper title="Novo Cartão de Crédito" onClose={() => setIsCardModalOpen(false)}>
          <form onSubmit={handleSaveCard} className="space-y-4">
            <Alerts error={errorMsg} success={successMsg} />
            <Input label="Nome do Cartão" value={cardName} onChange={setCardName} placeholder="Ex: Itaú Pão de Açúcar" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Limite (R$)" value={cardLimit} onChange={setCardLimit} placeholder="Ex: 5000.00" type="number" step="0.01" />
              <Input label="Dia Vencimento" value={cardDueDay} onChange={setCardDueDay} placeholder="Ex: 10" type="number" />
            </div>
            <SubmitButton label="Salvar Cartão" loading={isSubmitting} />
          </form>
        </ModalWrapper>
      )}

      {/* Modal Terceiros */}
      {isThirdPartyModalOpen && (
        <ModalWrapper title="Novo Terceiro (Contato)" onClose={() => setIsThirdPartyModalOpen(false)}>
          <form onSubmit={handleSaveThirdParty} className="space-y-4">
            <Alerts error={errorMsg} success={successMsg} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setThirdPartyType('CLIENTE')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${thirdPartyType==='CLIENTE'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Cliente</button>
              <button type="button" onClick={() => setThirdPartyType('FORNECEDOR')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${thirdPartyType==='FORNECEDOR'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Fornecedor</button>
            </div>
            <Input label="Nome / Empresa" value={thirdPartyName} onChange={setThirdPartyName} placeholder="Ex: João da Silva / Apple" />
            <SubmitButton label="Salvar Terceiro" loading={isSubmitting} />
          </form>
        </ModalWrapper>
      )}

      {/* Modal Kaxxa Proprietário de Confirmação de Exclusão */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 z-[9999] bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteTarget(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 scale-in-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 size={22} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#181B22]">
                {deleteTarget.type === 'CATEGORY' ? 'Excluir Categoria' : 
                 deleteTarget.type === 'ACCOUNT' ? 'Excluir Conta' :
                 deleteTarget.type === 'CARD' ? 'Excluir Cartão' : 'Excluir Terceiro'}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Tem certeza que deseja excluir <strong>&quot;{deleteTarget.name}&quot;</strong>? Esta ação não poderá ser desfeita.
              </p>
              {deleteTarget.subWarning && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-medium mt-2">
                  {deleteTarget.subWarning}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-[#F1F3F7] hover:bg-[#E5E7EB] text-[#181B22] text-xs font-bold rounded-xl transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap uppercase tracking-wider ${active ? 'border-[#1A44C8] text-[#1A44C8] bg-[#1A44C8]/5' : 'border-transparent text-[#64748B] hover:text-[#181B22] hover:bg-[#F1F3F7]'}`}>
      {icon} 
      <span>{label}</span>
      {badge && (
        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1A44C8] lowercase">
          {badge}
        </span>
      )}
    </button>
  );
}

function ModalWrapper({ children, title, onClose }: { children: React.ReactNode, title: string, onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col scale-in-center"
      >
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-sm font-bold text-[#181B22]">{title}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-[#181B22] transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F1F3F7]"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", step }: any) {
  return (
    <div>
      <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1.5 pl-1 font-bold">{label}</label>
      <input type={type} step={step} required value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#181B22] placeholder-[#94A3B8] focus:outline-none focus:border-[#1A44C8] font-semibold transition-colors" />
    </div>
  );
}

function SubmitButton({ label, loading }: { label: string, loading: boolean }) {
  return (
    <div className="pt-2">
      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#1A44C8] text-white text-xs font-bold hover:bg-[#1538A5] shadow-md transition-all disabled:opacity-50 active:scale-95">
        {loading ? 'Salvando...' : label}
      </button>
    </div>
  );
}

function Alerts({ error, success }: { error: string, success: string }) {
  if (!error && !success) return null;
  return (
    <>
      {error && <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl text-[10px] font-bold"><AlertCircle size={12} /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-[#059669] bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[10px] font-bold"><CheckCircle2 size={12} /> {success}</div>}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#1A44C8]" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
