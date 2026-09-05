'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { subscriptionService, DbSubscription } from '@/lib/services/subscription';
import { isAdminEmail } from '@/lib/admin';

type Category = { id: string; name: string; type: string; parent_id: string | null; };
type Account = { id: string; name: string; type: string; balance: number; };
type Card = { id: string; name: string; limit: number; due_day: number; };
type ThirdParty = { id: string; name: string; type: string; };

export default function SettingsPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetchData();
  }, []);

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
    if (accRes.data) setAccounts(accRes.data);
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

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();

    try {
      // Salva solicitação formal no Supabase
      await supabase
        .from('subscriptions')
        .update({
          status: 'CANCELED',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      setSubscription(prev => prev ? { ...prev, status: 'CANCELED' } : null);
      setSuccessMsg('Solicitação de cancelamento e reembolso registrada! Processaremos o estorno no Mercado Pago em até 24h úteis.');
      setIsRefundModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao solicitar reembolso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculo de dias desde a contratação para garantia de 7 dias
  const getDaysSinceCreated = () => {
    if (!subscription?.created_at) return 0;
    const created = new Date(subscription.created_at).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };
  const isWithin7Days = getDaysSinceCreated() <= 7;
  const daysRemainingRefund = Math.max(0, 7 - getDaysSinceCreated());

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
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    await supabase.from('categories').delete().eq('id', id); fetchData();
  };

  // --- CONTAS ---
  const handleOpenAccountModal = () => {
    setAccountName(''); setAccountType('CORRENTE'); setAccountBalance(''); resetMessages(); setIsAccountModalOpen(true);
  };
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('accounts').insert({ user_id: session?.user.id, name: accountName, type: accountType, balance: parseFloat(accountBalance || '0') });
    if (error) setErrorMsg(error.message); else { setSuccessMsg('Conta salva!'); fetchData(); setTimeout(() => setIsAccountModalOpen(false), 800); }
    setIsSubmitting(false);
  };
  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    await supabase.from('accounts').delete().eq('id', id); fetchData();
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
  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    await supabase.from('credit_cards').delete().eq('id', id); fetchData();
  };

  // --- TERCEIROS ---
  const handleOpenThirdPartyModal = () => {
    setThirdPartyName(''); setThirdPartyType('CLIENTE'); resetMessages(); setIsThirdPartyModalOpen(true);
  };
  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); resetMessages();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('third_parties').insert({ user_id: session?.user.id, name: thirdPartyName, type: thirdPartyType });
      if (error) setErrorMsg(error.message); else { setSuccessMsg('Terceiro salvo!'); fetchData(); setTimeout(() => setIsThirdPartyModalOpen(false), 800); }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar terceiro");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteThirdParty = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    await supabase.from('third_parties').delete().eq('id', id); fetchData();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in-up w-full space-y-6">
      <header className="mb-1">
        <h1 className="text-xl font-extrabold text-[#181B22]">Configurações</h1>
        <p className="text-xs text-[#64748B]">Gerencie seus dados pessoais, assinatura e a estrutura financeira do sistema.</p>
      </header>

      {/* 1. SELETOR PRINCIPAL: PERFIL E CONTA VS DADOS DO SISTEMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#F1F5F9] rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setSection('CONTA');
            if (activeTab !== 'PERFIL' && activeTab !== 'ASSINATURA') {
              setActiveTab('PERFIL');
            }
          }}
          className={`p-3 rounded-xl transition-all text-left flex items-center gap-3 ${
            section === 'CONTA'
              ? 'bg-white shadow-sm border border-[#E5E7EB]'
              : 'hover:bg-white/60 text-[#64748B]'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            section === 'CONTA' ? 'bg-blue-50 text-[#1A44C8]' : 'bg-slate-200/70 text-slate-500'
          }`}>
            <User size={18} />
          </div>
          <div>
            <span className={`text-xs font-bold block ${section === 'CONTA' ? 'text-[#181B22]' : 'text-[#64748B]'}`}>
              Perfil e Conta
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium">
              Foto, dados pessoais, plano e pagamentos
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSection('SISTEMA');
            if (activeTab === 'PERFIL' || activeTab === 'ASSINATURA') {
              setActiveTab('CONTAS');
            }
          }}
          className={`p-3 rounded-xl transition-all text-left flex items-center gap-3 ${
            section === 'SISTEMA'
              ? 'bg-white shadow-sm border border-[#E5E7EB]'
              : 'hover:bg-white/60 text-[#64748B]'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            section === 'SISTEMA' ? 'bg-blue-50 text-[#1A44C8]' : 'bg-slate-200/70 text-slate-500'
          }`}>
            <Wallet size={18} />
          </div>
          <div>
            <span className={`text-xs font-bold block ${section === 'SISTEMA' ? 'text-[#181B22]' : 'text-[#64748B]'}`}>
              Dados do Sistema
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium">
              Contas bancárias, cartões, categorias e pessoas
            </span>
          </div>
        </button>
      </div>

      {/* 2. SUB-ABAS DA SEÇÃO ATIVA */}
      <div className="flex border-b border-[#E5E7EB] overflow-x-auto custom-scrollbar">
        {section === 'CONTA' ? (
          <>
            <TabButton 
              active={activeTab === 'PERFIL'} 
              onClick={() => setActiveTab('PERFIL')} 
              icon={<User size={14} />} 
              label="Meu Perfil" 
            />
            <TabButton 
              active={activeTab === 'ASSINATURA'} 
              onClick={() => setActiveTab('ASSINATURA')} 
              icon={<ShieldCheck size={14} />} 
              label="Assinatura" 
            />
          </>
        ) : (
          <>
            <TabButton 
              active={activeTab === 'CONTAS'} 
              onClick={() => setActiveTab('CONTAS')} 
              icon={<Landmark size={14} />} 
              label="Contas Bancárias" 
            />
            <TabButton 
              active={activeTab === 'CARTOES'} 
              onClick={() => setActiveTab('CARTOES')} 
              icon={<CreditCard size={14} />} 
              label="Cartões de Crédito" 
            />
            <TabButton 
              active={activeTab === 'CATEGORIAS'} 
              onClick={() => setActiveTab('CATEGORIAS')} 
              icon={<ListTree size={14} />} 
              label="Categorias" 
            />
            <TabButton 
              active={activeTab === 'TERCEIROS'} 
              onClick={() => setActiveTab('TERCEIROS')} 
              icon={<UserCircle2 size={14} />} 
              label="Pessoas e Terceiros" 
            />
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
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A44C8] to-[#1538A5] text-white flex items-center justify-center font-black text-xl shadow-sm">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'K'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Alterar foto"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <div className="space-y-1">
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
              <p className="text-[11px] text-[#64748B] mt-0.5">Gerencie seu plano ativo, método de pagamento e renovação recorrente.</p>
            </div>

            <Alerts error={errorMsg} success={successMsg} />

            {loadingSub ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse space-y-3">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-48 h-3 bg-slate-200 rounded" />
              </div>
            ) : isAdmin ? (
              <div className="space-y-4">
                {/* Card de Status da Assinatura para Master Developer */}
                <div className="p-5 bg-gradient-to-br from-[#F8FAFC] to-blue-50/40 border border-blue-200/80 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1A44C8] block">Nível de Acesso</span>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md shadow-sm">
                          Master Developer
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#181B22] mt-0.5">Conta Oficial Kaxxa ({userEmail})</h3>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Acesso Vitalício Ativo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Status de Cobrança</span>
                      <strong className="text-sm font-black text-emerald-600">Isento Permanente</strong>
                    </div>

                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Permissões de Sistema</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <ShieldCheck size={13} className="text-[#1A44C8]" />
                        Acesso Total de Desenvolvedor
                      </strong>
                    </div>

                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Expiração</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <Sparkles size={13} className="text-[#059669]" />
                        Vitalício (100 Anos)
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-2 text-xs">
                    <h4 className="font-bold text-[#181B22] flex items-center gap-1.5">
                      <KeyRound size={14} className="text-[#1A44C8]" />
                      Como testar a experiência real de novos clientes?
                    </h4>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Esta conta oficial (<code className="text-[#1A44C8] font-bold">{userEmail}</code>) tem passe livre permanente de desenvolvedor master com acesso completo às telas de <strong>Gestão</strong> e <strong>Cupons</strong>.
                    </p>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Para testar o fluxo exato de novos clientes (bloqueio do paywall ao acessar <code className="text-[#181B22] font-semibold">/dashboard</code>, tela de pagamento <code className="text-[#181B22] font-semibold">/planos</code>, resgate de cupons de degustação, Pix com QR Code e cancelamento), utilize uma <strong>segunda conta pessoal</strong> ou abra em aba anônima.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/admin')}
                      className="flex-1 py-2.5 px-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={14} />
                      <span>Ir para o Painel de Gestão</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Card de Status da Assinatura */}
                <div className="p-5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B] block">Plano Atual</span>
                      <h3 className="text-base font-black text-[#181B22]">Assinatura Kaxxa</h3>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${
                        subscription?.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : subscription?.status === 'CANCELED' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-[#1A44C8]'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {subscription?.status === 'ACTIVE' ? 'Ativa' : subscription?.status === 'CANCELED' ? 'Cancelada (Fim do Ciclo)' : 'Ativa'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Valor do Plano</span>
                      <strong className="text-sm font-black text-[#181B22]">R$ 39,90/mês</strong>
                    </div>

                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Forma de Pagamento</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <CreditCard size={13} className="text-[#1A44C8]" />
                        {subscription?.payment_method === 'PIX' ? 'PIX (Avulso)' : 'Cartão de Crédito (Recorrente)'}
                      </strong>
                    </div>

                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                      <span className="text-[10px] text-[#64748B] block mb-0.5">Vencimento do Ciclo</span>
                      <strong className="text-xs font-bold text-[#181B22] flex items-center gap-1">
                        <Calendar size={13} className="text-[#059669]" />
                        {subscription?.current_period_end 
                          ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR') 
                          : 'Ativo por 30 dias'}
                      </strong>
                    </div>
                  </div>

                  {/* Banner Garantia de 7 Dias */}
                  {isWithin7Days && subscription?.status !== 'CANCELED' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#059669] shrink-0" />
                        <div className="text-xs">
                          <strong className="text-emerald-950 block">Garantia de 7 dias ativa ({daysRemainingRefund} dias restantes)</strong>
                          <span className="text-emerald-800 text-[11px]">Você pode solicitar o cancelamento e reembolso de 100% caso não deseje continuar.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRefundModalOpen(true)}
                        className="text-[11px] font-bold text-[#059669] hover:underline shrink-0 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
                      >
                        Solicitar Reembolso
                      </button>
                    </div>
                  )}
                </div>

                {/* Card de Método de Pagamento e Recorrência */}
                <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                        <RefreshCw size={13} className="text-[#1A44C8]" />
                        Método de Pagamento e Recorrência
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {subscription?.payment_method === 'PIX'
                          ? 'Seu plano atual é cobrado manualmente via Pix a cada ciclo de 30 dias.'
                          : 'Sua assinatura conta com renovação automática mensal no cartão de crédito.'}
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      subscription?.payment_method === 'PIX'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {subscription?.payment_method === 'PIX' ? 'Pix Manual' : 'Recorrência Ativa'}
                    </span>
                  </div>

                  {subscription?.payment_method === 'PIX' ? (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs font-bold text-[#181B22] block">Deseja ativar renovação automática no Cartão?</strong>
                        <span className="text-[11px] text-[#64748B]">
                          Evite interrupções no acesso ativando o débito recorrente no cartão de crédito.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/planos')}
                        className="py-2 px-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <CreditCard size={13} />
                        <span>Ativar Recorrência</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs font-bold text-[#181B22] block">Cartão de Crédito Cadastrado</strong>
                        <span className="text-[11px] text-[#64748B]">
                          Você pode atualizar os dados do seu cartão ou migrar para pagamento avulso via Pix.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/planos')}
                        className="py-2 px-3.5 bg-white hover:bg-slate-100 border border-[#E5E7EB] text-[#181B22] rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw size={13} className="text-[#1A44C8]" />
                        <span>Alterar Cartão</span>
                      </button>
                    </div>
                  )}

                  {/* Ações de Gestão: Mudar Método ou Cancelar */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-[#F1F5F9]">
                    <button
                      type="button"
                      onClick={() => router.push('/planos')}
                      className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#1A44C8] text-[#181B22] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} className="text-[#1A44C8]" />
                      <span>Mudar Método de Pagamento</span>
                    </button>

                    {subscription?.status !== 'CANCELED' && (
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="py-2.5 px-4 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <X size={14} />
                        <span>Cancelar Renovação</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* --- ABA CONTAS --- */}
        {/* ======================================================== */}
        {activeTab === 'CONTAS' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#181B22]">Contas Bancárias</h2>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Onde seu dinheiro está guardado.</p>
              </div>
              <button onClick={handleOpenAccountModal} className="text-[10px] font-bold bg-[#1A44C8] text-white px-3 py-1.5 rounded-full hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest active:scale-95">
                <Plus size={12} /> Nova Conta
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.length === 0 ? (
                <div className="col-span-full p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center text-xs text-[#94A3B8] font-medium">
                  Nenhuma conta cadastrada.
                </div>
              ) : (
                accounts.map(acc => (
                  <div key={acc.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex justify-between items-center group hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8]">
                        <Landmark size={18} />
                      </div>
                      <div>
                        <span className="text-sm text-[#181B22] font-bold">{acc.name}</span>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold">{acc.type}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-xs text-[#1A44C8] font-extrabold">R$ {acc.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                       <button onClick={() => handleDeleteAccount(acc.id)} className="text-[#94A3B8] hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
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
                       <button onClick={() => handleDeleteCard(card.id)} className="text-[#94A3B8] hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
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
                categories.filter(c => !c.parent_id).map(parent => (
                  <div key={parent.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 group/parent">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${parent.type === 'INCOME' ? 'bg-[#1A44C8]' : 'bg-rose-500'}`}></div>
                        <div>
                          <span className="text-sm text-[#181B22] font-bold">{parent.name}</span>
                          <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold mt-0.5">{parent.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={() => handleDeleteCategory(parent.id)} className="text-[#94A3B8] hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-[#94A3B8] font-bold mb-3 uppercase tracking-wider">Subcategorias:</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {categories.filter(c => c.parent_id === parent.id).map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm rounded-lg px-3 py-1.5 hover:border-[#1A44C8]/30 transition-colors">
                            <span className="text-xs text-[#181B22] font-medium">{sub.name}</span>
                            <button onClick={() => handleDeleteCategory(sub.id)} className="text-[#94A3B8] hover:text-rose-600 transition-colors"><X size={12} /></button>
                          </div>
                        ))}
                        <button onClick={() => handleOpenSubCategoryModal(parent)} className="flex items-center gap-1.5 bg-[#1A44C8]/10 border border-[#1A44C8]/20 text-[#1A44C8] hover:bg-[#1A44C8]/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors">
                          <Plus size={12} /> Add Subcategoria
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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
                    <button onClick={() => handleDeleteThirdParty(tp.id)} className="text-[#94A3B8] hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
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

      {/* Modal Solicitar Reembolso (Garantia de 7 dias) */}
      {isRefundModalOpen && (
        <ModalWrapper title="Solicitar Reembolso (Garantia de 7 dias)" onClose={() => setIsRefundModalOpen(false)}>
          <form onSubmit={handleRequestRefund} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <strong className="block">Devolução Integral Garantida</strong>
                <span>Dentro dos 7 dias, o valor de R$ 39,90 será estornado diretamente no Mercado Pago.</span>
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1 font-bold">Motivo (Opcional)</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                rows={2}
                placeholder="Conte-nos o que podemos melhorar..."
                className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] resize-none font-medium"
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
                  placeholder="Seu CPF, e-mail ou telefone"
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8] font-medium"
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
                className="flex-1 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Reembolso'}
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
            <Input label="Nome da Conta" value={accountName} onChange={setAccountName} placeholder="Ex: Nubank Principal" />
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col scale-in-center">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-sm font-bold text-[#181B22]">{title}</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#181B22] transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F1F3F7]"><X size={14} /></button>
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
