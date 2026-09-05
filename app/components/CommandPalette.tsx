'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Landmark, 
  Settings, 
  ShieldCheck, 
  Ticket,
  ArrowRight,
  PlusCircle,
  UserCircle2
} from 'lucide-react';
import { isAdminEmail } from '@/lib/admin';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  href: string;
  category: 'Navegação' | 'Ações Rápidas' | 'Configurações' | 'Administração';
  adminOnly?: boolean;
}

export function CommandPalette({ isOpen, onClose, userEmail }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = isAdminEmail(userEmail);

  const allItems: PaletteItem[] = [
    // Páginas de Navegação
    { id: 'nav-dashboard', title: 'Visão Geral', subtitle: 'Painel principal com patrimônio e resumo', icon: LayoutDashboard, href: '/dashboard', category: 'Navegação' },
    { id: 'nav-transacoes', title: 'Saldo e Extrato', subtitle: 'Entradas, saídas e controle de fluxo', icon: Wallet, href: '/dashboard/transacoes', category: 'Navegação' },
    { id: 'nav-cartoes', title: 'Minhas Faturas', subtitle: 'Cartões de crédito e limite comprometido', icon: CreditCard, href: '/dashboard/cartoes', category: 'Navegação' },
    { id: 'nav-investimentos', title: 'Investimentos', subtitle: 'Renda fixa, ações, FIIs e criptoativos', icon: TrendingUp, href: '/dashboard/investimentos', category: 'Navegação' },
    { id: 'nav-terceiros', title: 'Terceiros', subtitle: 'Gastos e empréstimos com amigos ou parentes', icon: Users, href: '/dashboard/terceiros', category: 'Navegação' },
    { id: 'nav-dividas', title: 'Dívidas e Empréstimos', subtitle: 'Amortizações e simulação de quitação antecipada', icon: Landmark, href: '/dashboard/dividas', category: 'Navegação' },
    
    // Configurações
    { id: 'nav-config-perfil', title: 'Perfil e Conta', subtitle: 'Foto, nome, e-mail, telefone e alteração de senha', icon: UserCircle2, href: '/dashboard/configuracoes?tab=perfil', category: 'Configurações' },
    { id: 'nav-config-assinatura', title: 'Minha Assinatura', subtitle: 'Plano ativo, método de pagamento, ciclo e recorrência', icon: ShieldCheck, href: '/dashboard/configuracoes?tab=perfil', category: 'Configurações' },
    { id: 'nav-config-sistema', title: 'Dados do Sistema', subtitle: 'Contas bancárias, cartões, categorias e pessoas', icon: Settings, href: '/dashboard/configuracoes?tab=sistema', category: 'Configurações' },
    
    // Ações Rápidas
    { id: 'act-transacao', title: 'Nova Transação', subtitle: 'Lançar nova receita ou despesa no extrato', icon: PlusCircle, href: '/dashboard/transacoes', category: 'Ações Rápidas' },
    { id: 'act-cartao', title: 'Cadastrar Novo Cartão', subtitle: 'Adicionar limite e bandeira de cartão', icon: PlusCircle, href: '/dashboard/cartoes', category: 'Ações Rápidas' },
    { id: 'act-divida', title: 'Adicionar Dívida / Financiamento', subtitle: 'Cadastrar contrato para cálculo de amortização', icon: PlusCircle, href: '/dashboard/dividas', category: 'Ações Rápidas' },
    { id: 'act-terceiro', title: 'Novo Lançamento de Terceiro', subtitle: 'Vincular despesa a uma pessoa', icon: PlusCircle, href: '/dashboard/terceiros', category: 'Ações Rápidas' },

    // Área Administrativa (Apenas Admin)
    { id: 'adm-users', title: 'Gestão de Usuários', subtitle: 'Métricas de receita, trial, planos e assinantes do sistema', icon: ShieldCheck, href: '/dashboard/admin', category: 'Administração', adminOnly: true },
    { id: 'adm-cupons', title: 'Cupons Promocionais', subtitle: 'Criar cupons de 2 dias ou descontos promocionais', icon: Ticket, href: '/dashboard/admin/cupons', category: 'Administração', adminOnly: true },
  ];

  const filteredItems = allItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Teclas de atalho (Escape, Setas, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          onClose();
          router.push(item.href);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] animate-scale-up">
        {/* Header com Barra de Busca */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E7EB] gap-3 bg-[#F8FAFC]">
          <Search size={18} className="text-[#1A44C8] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar páginas, módulos, cartões, ações..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#181B22] placeholder:text-[#94A3B8] font-sans"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="text-[#94A3B8] hover:text-[#181B22] p-1 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white border border-[#E5E7EB] px-2 py-0.5 rounded shadow-sm">
            ESC
          </span>
        </div>

        {/* Lista de Resultados */}
        <div className="overflow-y-auto max-h-[60vh] p-2 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] space-y-1">
              <Search size={20} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-[#181B22]">Nenhum resultado encontrado</p>
              <p className="text-[11px] text-slate-400">Tente buscar por &quot;cartões&quot;, &quot;investimentos&quot;, &quot;extrato&quot; ou &quot;perfil&quot;.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/80 border border-blue-200 text-[#181B22] shadow-sm' 
                      : 'hover:bg-slate-50 border border-transparent text-[#64748B]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#1A44C8] text-white shadow-sm' : 'bg-slate-100 text-[#1A44C8]'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#181B22]' : 'text-[#181B22]'}`}>
                          {item.title}
                        </p>
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                          item.category === 'Administração'
                            ? 'bg-purple-100 text-purple-700'
                            : item.category === 'Configurações'
                              ? 'bg-blue-100 text-[#1A44C8]'
                              : item.category === 'Ações Rápidas'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'text-[#1A44C8] translate-x-0.5' : 'text-slate-300'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Dicas de Navegação */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-white border border-[#E5E7EB] rounded font-mono font-bold text-[9px] shadow-sm">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-[#E5E7EB] rounded font-mono font-bold text-[9px] shadow-sm">↓</kbd> navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded font-mono font-bold text-[9px] shadow-sm">↵</kbd> abrir</span>
          </div>
          <span className="font-semibold text-[#1A44C8]">Kaxxa Global Search</span>
        </div>
      </div>
    </div>
  );
}

