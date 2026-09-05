'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PrivacyProvider, usePrivacy } from '@/app/contexts/PrivacyContext';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Bell, 
  ChevronRight, 
  Menu, 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Landmark, 
  Settings, 
  LogOut, 
  Home as HomeIcon, 
  Users, 
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff
} from 'lucide-react';

import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';
import { subscriptionService } from '@/lib/services/subscription';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isConcealed, togglePrivacy } = usePrivacy();
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Verificação de Paywall / Assinatura
  useEffect(() => {
    async function checkSubscription() {
      try {
        const { granted } = await subscriptionService.isAccessGranted();
        if (!granted) {
          router.push('/planos');
          return;
        }
      } catch (err) {
        console.error('Erro ao verificar permissão:', err);
      } finally {
        setCheckingAccess(false);
      }
    }
    checkSubscription();
  }, [pathname, router]);

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const sidebarMenus = [
    {
      title: 'Principal',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
      ]
    },
    {
      title: 'Módulos Financeiros',
      items: [
        { href: '/dashboard/transacoes', icon: Wallet, label: 'Saldo e Extrato' },
        { href: '/dashboard/investimentos', icon: TrendingUp, label: 'Investimentos' },
        { href: '/dashboard/cartoes', icon: CreditCard, label: 'Minhas Faturas', badge: 'Ativo' },
        { href: '/dashboard/terceiros', icon: Users, label: 'Terceiros' },
        { href: '/dashboard/dividas', icon: Landmark, label: 'Dívidas e Empréstimos', badge: '5' },
      ]
    },
    {
      title: 'Sistema & Conta',
      items: [
        { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
      ]
    }
  ];

  const getPageInfo = () => {
    if (pathname === '/dashboard') return { title: 'Visão Geral', icon: LayoutDashboard };
    if (pathname === '/dashboard/transacoes') return { title: 'Saldo e Extrato', icon: Wallet };
    if (pathname === '/dashboard/investimentos') return { title: 'Investimentos', icon: TrendingUp };
    if (pathname === '/dashboard/cartoes') return { title: 'Minhas Faturas', icon: CreditCard };
    if (pathname === '/dashboard/terceiros') return { title: 'Terceiros', icon: Users };
    if (pathname === '/dashboard/dividas') return { title: 'Dívidas e Empréstimos', icon: Landmark };
    if (pathname === '/dashboard/configuracoes') return { title: 'Configurações', icon: Settings };
    return { title: 'Dashboard', icon: HomeIcon };
  };

  const { title: pageTitle } = getPageInfo();

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F9] flex flex-col items-center justify-center gap-3">
        <KaxxaLogo size={36} />
        <div className="w-5 h-5 border-2 border-[#1A44C8]/30 border-t-[#1A44C8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-screen bg-[#F5F6F9] flex font-sans selection:bg-[#1A44C8] selection:text-white text-[#181B22] overflow-hidden relative">
      
      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Flutuante em Formato de Card Sofisticado (#FFFFFF) */}
      <aside className={`my-3 ml-3 flex-shrink-0 rounded-[24px] border border-[#E5E7EB] flex flex-col bg-[#FFFFFF] z-50 h-[calc(100vh-24px)] shadow-[0_8px_28px_rgba(0,0,0,0.03)] transition-all duration-300 overflow-hidden ${
        isSidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
      } ${
        mobileMenuOpen ? 'fixed inset-y-3 left-3 !w-[230px]' : 'hidden lg:flex'
      }`}>
        
        {/* Brand Header do Card */}
        <div className={`h-14 flex items-center border-b border-[#F1F3F7] shrink-0 ${
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0" title="Ir para o Dashboard">
            <KaxxaLogo size={24} />
            {!isSidebarCollapsed && (
              <KaxxaWordmark className="text-base tracking-tight" />
            )}
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#181B22] hover:bg-[#F1F3F7] transition-colors hidden lg:flex items-center justify-center shrink-0"
            title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Menus de Navegação em Formato Slim */}
        <div className="flex-1 px-2 py-3.5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3.5">
            {sidebarMenus.map((menu, idx) => (
              <div key={idx}>
                {!isSidebarCollapsed ? (
                  <h4 className="text-[8.5px] font-bold tracking-wider text-[#94A3B8] mb-1 px-2 uppercase">
                    {menu.title}
                  </h4>
                ) : (
                  <div className="w-5 h-[1px] bg-[#E5E7EB]/80 mx-auto my-1.5" />
                )}
                
                <div className="flex flex-col gap-0.5">
                  {menu.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link key={item.label} href={item.href}>
                        <div 
                          className={`flex items-center rounded-xl transition-all duration-200 group ${
                            isSidebarCollapsed 
                              ? 'justify-center py-2 px-1.5' 
                              : 'justify-between px-2.5 py-2'
                          } ${
                            active 
                              ? 'bg-[#1A44C8] text-white font-semibold shadow-sm shadow-[#1A44C8]/25' 
                              : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#181B22]'
                          }`}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <item.icon 
                              size={15} 
                              className={active ? 'text-white shrink-0' : 'text-[#94A3B8] group-hover:text-[#181B22] shrink-0'} 
                            />
                            {!isSidebarCollapsed && (
                              <span className="text-xs truncate font-medium">{item.label}</span>
                            )}
                          </div>

                          {!isSidebarCollapsed && item.badge && (
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                              active 
                                ? 'bg-white/20 text-white' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {isSidebarCollapsed && active && (
                            <div className="w-1 h-1 rounded-full bg-[#1A44C8] absolute right-1"></div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User Footer no Estilo Micro-Card */}
          <div className="pt-2.5 border-t border-[#F1F3F7] space-y-1.5">
            {!isSidebarCollapsed ? (
              <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]/80 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1A44C8] to-[#00A3FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                    KX
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#181B22] truncate leading-tight">Conta Principal</p>
                    <p className="text-[8.5px] text-[#64748B] truncate">kaxxa // pro</p>
                  </div>
                </div>
                <Activity size={12} className="text-[#1A44C8] shrink-0" />
              </div>
            ) : (
              <div className="flex justify-center" title="Conta Principal • PRO">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1A44C8] to-[#00A3FF] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  KX
                </div>
              </div>
            )}

            <button 
              onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); router.push('/login'); }} 
              className={`flex items-center rounded-xl bg-transparent hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-[#64748B] hover:text-rose-600 group text-xs font-medium ${
                isSidebarCollapsed ? 'justify-center p-1.5 w-full' : 'justify-center gap-1.5 px-2.5 py-1.5 w-full'
              }`}
              title="Encerrar Sessão"
            >
              <LogOut size={13} className="group-hover:text-rose-600 transition-colors shrink-0" />
              {!isSidebarCollapsed && <span className="text-[11px]">Encerrar Sessão</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#F5F6F9]">
        
        {/* Topbar Flutuante no Formato de Card Sofisticado */}
        <header className="my-3 mr-3 ml-2.5 h-14 px-4 sm:px-5 rounded-[22px] bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_8px_28px_rgba(0,0,0,0.03)] flex items-center justify-between z-30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#64748B] hover:text-[#181B22] p-1.5 rounded-xl hover:bg-[#F1F3F7] transition-colors"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#94A3B8] font-medium">Kaxxa</span>
              <ChevronRight size={11} className="text-[#CBD5E1]" />
              <span className="text-[#181B22] font-bold">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Campo de Busca Rápida */}
            <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-1.5 hover:border-[#CBD5E1] transition-colors cursor-text shadow-inner">
              <Search size={13} className="text-[#94A3B8]" />
              <input type="text" placeholder="Buscar no Kaxxa..." className="bg-transparent border-none outline-none text-xs text-[#181B22] placeholder:text-[#94A3B8] w-36 font-sans" disabled />
              <span className="text-[9px] font-mono text-[#64748B] bg-[#FFFFFF] border border-[#E5E7EB] px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
            </div>
            
            {/* Botão de Modo Privacidade (Olho) */}
            <button 
              onClick={togglePrivacy}
              className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all shadow-sm active:scale-95 ${
                isConcealed 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-[#F8FAFC] hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] border-[#E5E7EB]'
              }`}
              title={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
            >
              {isConcealed ? <EyeOff size={13} className="text-amber-600" /> : <Eye size={13} className="text-[#1A44C8]" />}
              <span className="text-[11px] font-semibold hidden sm:inline">{isConcealed ? 'Oculto' : 'Privacidade'}</span>
            </button>

            {/* Sino de Notificações */}
            <button className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:border-[#CBD5E1] hover:text-[#181B22] transition-all relative shadow-sm" title="Notificações">
              <Bell size={14} />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#1A44C8] rounded-full shadow-[0_0_6px_rgba(26,68,200,0.8)]"></div>
            </button>

            {/* Perfil do Usuário */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-1 pr-2.5 cursor-pointer hover:border-[#CBD5E1] transition-all shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#1A44C8] to-[#00A3FF] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                DU
              </div>
              <span className="text-xs font-semibold text-[#181B22] hidden sm:block">Demo User</span>
              <ChevronRight size={11} className="text-[#94A3B8] rotate-90 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Conteúdo com Scroll Próprio */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative px-3 md:px-5 pb-6 z-10">
          {children}
        </main>

      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivacyProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </PrivacyProvider>
  );
}
