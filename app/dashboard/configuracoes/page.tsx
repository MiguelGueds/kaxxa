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
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { subscriptionService, DbSubscription } from '@/lib/services/subscription';
import { accountsService } from '@/lib/services/accounts';
import { cardsService } from '@/lib/services/cards';
import { isAdminEmail } from '@/lib/admin';
import { BankLogo } from '@/app/components/BankLogo';
import { PortalModal } from '@/app/components/PortalModal';

type Category = { id: string; name: string; type: string; parent_id: string | null; };
type Account = { id: string; name: string; type: string; balance: number; };
type Card = { id: string; name: string; limit: number; due_day: number; };
type ThirdParty = { id: string; name: string; type?: string; phone?: string; avatar_url?: string; };

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const [cardBank, setCardBank] = useState('Nubank');
  const [cardBrand, setCardBrand] = useState('Mastercard Black');
  const [cardLastDigits, setCardLastDigits] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDueDay, setCardDueDay] = useState('10');

  // Terceiros / Contatos
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [thirdPartyPhone, setThirdPartyPhone] = useState('');
  const [thirdPartyAvatar, setThirdPartyAvatar] = useState('');

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
  const tabParam = (searchParams.get('tab') || 'contas').toLowerCase();

  useEffect(() => {
    if (tabParam === 'perfil' || tabParam === 'assinatura') {
      router.replace(`/dashboard/minha-conta?tab=${tabParam}`);
    }
  }, [tabParam, router]);

  const activeTab: 'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS' = 
    tabParam === 'cartoes' ? 'CARTOES' :
    tabParam === 'categorias' ? 'CATEGORIAS' :
    (tabParam === 'terceiros' || tabParam === 'pessoas') ? 'TERCEIROS' : 'CONTAS';

  const handleSelectTab = (newTab: 'CONTAS' | 'CARTOES' | 'CATEGORIAS' | 'TERCEIROS') => {
    router.replace(`/dashboard/configuracoes?tab=${newTab.toLowerCase()}`, { scroll: false });
  };

  const fetchData = async () => {
    const user = await getAuthenticatedUser();
    if (!user) return;

    try {
      const [catRes, accList, cardList, thirdRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('name').then(r => r, () => ({ data: null })),
        accountsService.fetchAccounts(),
        cardsService.fetchCards(),
        supabase.from('third_parties').select('*').eq('user_id', user.id).order('name').then(r => r, () => ({ data: null }))
      ]);
        
      if (catRes && (catRes as any).data) setCategories((catRes as any).data);
      if (accList) {
        setAccounts(accList.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: Number(a.balance ?? a.initial_balance ?? 0)
        })));
      }
      if (cardList) {
        setCards(cardList.map(c => ({
          id: c.id,
          name: c.name,
          limit: Number(c.credit_limit ?? 0),
          due_day: c.due_day
        })));
      }
      if (thirdRes && (thirdRes as any).data) setThirdParties((thirdRes as any).data);
    } catch (e) {
      console.warn('Erro ao carregar dados:', e);
      const localAccs = accountsService.getCachedAccounts();
      if (localAccs) {
        setAccounts(localAccs.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: Number(a.balance ?? a.initial_balance ?? 0)
        })));
      }
      const localCards = cardsService.getCachedCards();
      if (localCards) {
        setCards(localCards.map(c => ({
          id: c.id,
          name: c.name,
          limit: Number(c.credit_limit ?? 0),
          due_day: c.due_day
        })));
      }
    }
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
    e.preventDefault(); 
    if (!categoryName.trim()) return;
    setIsSubmitting(true); resetMessages();
    try {
      const user = await getAuthenticatedUser();
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('categories').insert({ 
        id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        user_id: user.id, 
        name: categoryName.trim(), 
        type: categoryType, 
        parent_id: categoryParentId 
      });
      if (error) setErrorMsg(error.message); else { setSuccessMsg('Salvo!'); setCategoryName(''); fetchData(); setTimeout(() => setIsCategoryModalOpen(false), 800); }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
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
        await accountsService.deleteAccount(deleteTarget.id);
      } else if (deleteTarget.type === 'CARD') {
        await cardsService.deleteCard(deleteTarget.id);
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
    e.preventDefault(); 
    if (!accountName.trim()) return;
    setIsSubmitting(true); resetMessages();
    try {
      const created = await accountsService.createAccount({
        name: accountName.trim(),
        type: accountType,
        balance: parseFloat(accountBalance || '0')
      });
      if (created) {
        setSuccessMsg('Conta salva!');
        await fetchData();
        setTimeout(() => setIsAccountModalOpen(false), 800);
      } else {
        setErrorMsg('Não foi possível salvar a conta.');
      }
    } catch (err: any) {
      console.error('Erro ao salvar conta:', err);
      setErrorMsg(err?.message || 'Erro ao salvar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CARTÕES ---
  const handleOpenCardModal = () => {
    setCardName(''); setCardBank('Nubank'); setCardBrand('Mastercard Black'); setCardLastDigits(''); setCardLimit(''); setCardDueDay('10'); resetMessages(); setIsCardModalOpen(true);
  };
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!cardName.trim()) return;
    setIsSubmitting(true); resetMessages();
    try {
      const created = await cardsService.createCard({
        name: cardName.trim(),
        bank: cardBank,
        brand: cardBrand,
        last_digits: cardLastDigits || '0000',
        credit_limit: parseFloat(cardLimit || '0'),
        closing_day: Math.max(1, parseInt(cardDueDay, 10) - 7),
        due_day: parseInt(cardDueDay, 10) || 10,
        color: '#1A44C8'
      });
      if (created) {
        setSuccessMsg('Cartão salvo!');
        fetchData();
        setTimeout(() => setIsCardModalOpen(false), 800);
      } else {
        setErrorMsg('Não foi possível salvar o cartão.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar cartão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- TERCEIROS ---
  const handleOpenThirdPartyModal = () => {
    setThirdPartyName(''); setThirdPartyPhone(''); setThirdPartyAvatar(''); resetMessages(); setIsThirdPartyModalOpen(true);
  };
  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!thirdPartyName.trim()) {
      setErrorMsg('Por favor, informe o nome da pessoa.');
      return;
    }
    setIsSubmitting(true); resetMessages();
    try {
      const user = await getAuthenticatedUser();
      if (!user?.id) throw new Error('Usuário não autenticado');
      const tpId = 'tp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      let { error } = await supabase.from('third_parties').insert({ 
        id: tpId,
        user_id: user.id, 
        name: thirdPartyName.trim(), 
        phone: thirdPartyPhone.trim() || null, 
        avatar_url: thirdPartyAvatar || null 
      });
      if (error && (error.message.includes('phone') || error.message.includes('avatar_url') || error.code === 'PGRST204')) {
        const retry = await supabase.from('third_parties').insert({ id: tpId, user_id: user.id, name: thirdPartyName.trim() });
        error = retry.error;
      }
      if (error) setErrorMsg(error.message); else { setSuccessMsg('Pessoa salva!'); fetchData(); setTimeout(() => setIsThirdPartyModalOpen(false), 800); }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar terceiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6 w-full">
      {/* ======================================================== */}
      {/* --- ABA CONTAS --- */}
      {/* ======================================================== */}
      {activeTab === 'CONTAS' && (
        <div className="space-y-4">
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
        <div>
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
        <div>
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
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-[#181B22]">Terceiros / Pessoas</h2>
              <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Pessoas registradas para empréstimos e controle de terceiros.</p>
            </div>
            <button onClick={handleOpenThirdPartyModal} className="text-[10px] font-bold bg-[#1A44C8] text-white px-3 py-1.5 rounded-full hover:bg-[#1538A5] transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest active:scale-95">
              <Plus size={12} /> Nova Pessoa
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thirdParties.length === 0 ? (
              <div className="col-span-full p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center text-xs text-[#94A3B8] font-medium">
                Nenhuma pessoa cadastrada.
              </div>
            ) : (
              thirdParties.map(tp => (
                <div key={tp.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex justify-between items-center group hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    {tp.avatar_url ? (
                      <img src={tp.avatar_url} alt={tp.name} className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex items-center justify-center text-[#1A44C8] font-extrabold text-sm">
                        {tp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-[#181B22] font-bold">{tp.name}</span>
                      <p className="text-[10px] text-[#64748B] font-semibold">{tp.phone || 'Pessoa Física'}</p>
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

      {/* ======================================================== */}
      {/* --- MODAIS --- */}
      {/* ======================================================== */}

      {/* Modal Categoria */}
      {isCategoryModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsCategoryModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[88vh] overflow-hidden m-auto animate-scale-in-center shrink-0"
            >
              <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
                <h2 className="text-sm font-bold text-[#181B22]">
                  {modalMode === 'MAIN' ? 'Nova Categoria' : 'Nova Subcategoria'}
                </h2>
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
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
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Modal Conta */}
      {isAccountModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsAccountModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[88vh] overflow-hidden m-auto animate-scale-in-center shrink-0"
            >
              <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
                <h2 className="text-sm font-bold text-[#181B22]">Nova Conta Bancária</h2>
                <button 
                  type="button" 
                  onClick={() => setIsAccountModalOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <Alerts error={errorMsg} success={successMsg} />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setAccountType('CORRENTE')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${accountType==='CORRENTE'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Corrente</button>
                    <button type="button" onClick={() => setAccountType('POUPANCA')} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${accountType==='POUPANCA'?'bg-[#1A44C8]/10 border-[#1A44C8]/30 text-[#1A44C8]':'border-[#E5E7EB] text-[#64748B] hover:bg-[#F1F3F7]'}`}>Poupança / Investimento</button>
                  </div>

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
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Modal Cartão */}
      {isCardModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsCardModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[88vh] overflow-hidden m-auto animate-scale-in-center shrink-0"
            >
              <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
                <h2 className="text-sm font-bold text-[#181B22]">Novo Cartão de Crédito</h2>
                <button 
                  type="button" 
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSaveCard} className="space-y-4">
                  <Alerts error={errorMsg} success={successMsg} />
                  <Input label="Nome do Cartão" value={cardName} onChange={setCardName} placeholder="Ex: Itaú Pão de Açúcar" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1.5 pl-1 font-bold">Banco / Instituição</label>
                      <select 
                        value={cardBank} 
                        onChange={e => setCardBank(e.target.value)} 
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-xs text-[#181B22] font-semibold focus:outline-none focus:border-[#1A44C8] cursor-pointer"
                      >
                        <option value="Nubank">Nubank</option>
                        <option value="Itaú">Itaú</option>
                        <option value="Banco Inter">Banco Inter</option>
                        <option value="C6 Bank">C6 Bank</option>
                        <option value="Bradesco">Bradesco</option>
                        <option value="Santander">Santander</option>
                        <option value="XP Investimentos">XP Investimentos</option>
                        <option value="BTG Pactual">BTG Pactual</option>
                        <option value="Caixa">Caixa</option>
                        <option value="Banco do Brasil">Banco do Brasil</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1.5 pl-1 font-bold">Bandeira</label>
                      <select 
                        value={cardBrand} 
                        onChange={e => setCardBrand(e.target.value)} 
                        className="w-full bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-xs text-[#181B22] font-semibold focus:outline-none focus:border-[#1A44C8] cursor-pointer"
                      >
                        <option value="Mastercard Black">Mastercard Black</option>
                        <option value="Mastercard Platinum">Mastercard Platinum</option>
                        <option value="Mastercard Gold">Mastercard Gold</option>
                        <option value="Visa Infinite">Visa Infinite</option>
                        <option value="Visa Signature">Visa Signature</option>
                        <option value="Visa Platinum">Visa Platinum</option>
                        <option value="Elo Nanquim">Elo Nanquim</option>
                        <option value="Elo Grafite">Elo Grafite</option>
                        <option value="Amex Platinum">Amex Platinum</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Limite (R$)" value={cardLimit} onChange={setCardLimit} placeholder="Ex: 5000" type="number" step="0.01" />
                    <Input label="Dia Vencimento" value={cardDueDay} onChange={setCardDueDay} placeholder="Ex: 10" type="number" />
                    <Input label="Últimos Dígitos" value={cardLastDigits} onChange={setCardLastDigits} placeholder="Ex: 4321" />
                  </div>

                  <SubmitButton label="Salvar Cartão" loading={isSubmitting} />
                </form>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Modal Terceiros / Pessoa */}
      {isThirdPartyModalOpen && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setIsThirdPartyModalOpen(false)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[88vh] overflow-hidden m-auto animate-scale-in-center shrink-0"
            >
              <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC] shrink-0">
                <h2 className="text-sm font-bold text-[#181B22]">Nova Pessoa (Terceiro)</h2>
                <button 
                  type="button" 
                  onClick={() => setIsThirdPartyModalOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSaveThirdParty} className="space-y-4">
                  <Alerts error={errorMsg} success={successMsg} />
                  
                  <div className="flex flex-col items-center justify-center mb-1">
                    <label className="relative cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-[#F8FAFC] border-2 border-dashed border-[#1A44C8]/30 flex items-center justify-center overflow-hidden hover:border-[#1A44C8] transition-all">
                        {thirdPartyAvatar ? (
                          <img src={thirdPartyAvatar} alt="Foto de Perfil" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={22} className="text-[#1A44C8]/60 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 3 * 1024 * 1024) {
                              setErrorMsg('A imagem deve ter no máximo 3MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setThirdPartyAvatar(evt.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[#64748B] font-semibold mt-1">
                      {thirdPartyAvatar ? 'Foto adicionada (Clique para alterar)' : 'Adicionar foto de perfil (Opcional)'}
                    </span>
                  </div>

                  <Input label="Nome da Pessoa" value={thirdPartyName} onChange={setThirdPartyName} placeholder="Ex: Lucas Ferreira, Rodrigo" required />
                  <Input label="Telefone / WhatsApp (opcional)" value={thirdPartyPhone} onChange={setThirdPartyPhone} placeholder="Ex: (11) 99999-9999" />
                  
                  <SubmitButton label="Salvar Pessoa" loading={isSubmitting} />
                </form>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Modal Kaxxa Proprietário de Confirmação de Exclusão */}
      {deleteTarget && (
        <PortalModal>
          <div 
            className="fixed inset-0 w-screen h-screen min-h-dvh z-[99999] overflow-y-auto bg-[#0A0D14]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 transition-all duration-300"
            onClick={() => setDeleteTarget(null)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 my-auto animate-scale-in-center shrink-0"
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
        </PortalModal>
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
