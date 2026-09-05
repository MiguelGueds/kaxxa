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
  const [activeTab, setActiveTab] = useState<'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS'>('CONTAS');
  
  // Shared States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Sincroniza a aba a partir dos parâmetros de URL (?tab=contas, ?tab=cartoes, ?tab=categorias, ?tab=terceiros)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    const t = tabParam.toLowerCase();

    if (t === 'perfil' || t === 'assinatura') {
      router.replace(`/dashboard/minha-conta?tab=${t}`);
      return;
    }

    if (t === 'cartoes') {
      setActiveTab('CARTOES');
    } else if (t === 'categorias') {
      setActiveTab('CATEGORIAS');
    } else if (t === 'terceiros' || t === 'pessoas') {
      setActiveTab('TERCEIROS');
    } else {
      setActiveTab('CONTAS');
    }
  }, [searchParams, router]);

  const handleSelectTab = (newTab: 'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS') => {
    setActiveTab(newTab);
    router.replace(`/dashboard/configuracoes?tab=${newTab.toLowerCase()}`, { scroll: false });
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
      {/* SUB-ABAS EM FORMATO PILL MODERNO */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
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
          <span>Contas bancárias</span>
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
          <span>Cartões</span>
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
          <Tag size={14} />
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
          <span>Pessoas</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
        
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
