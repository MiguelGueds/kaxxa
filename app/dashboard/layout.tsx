'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PrivacyProvider, usePrivacy } from '@/app/contexts/PrivacyContext';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
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
  EyeOff,
  ShieldCheck,
  Ticket,
  UserCircle2,
  Tag,
  Sun,
  Moon
} from 'lucide-react';

import { useTheme } from '@/app/contexts/ThemeContext';
import { KaxxaLogo, KaxxaKLogo } from '@/app/components/KaxxaLogo';
import { subscriptionService } from '@/lib/services/subscription';
import { isAdminEmail } from '@/lib/admin';
import { CommandPalette } from '@/app/components/CommandPalette';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { isConcealed, togglePrivacy } = usePrivacy();
  const { theme, toggleTheme } = useTheme();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string | null }>({
    name: 'Minha Conta',
    email: '',
    avatar: null
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Minha Conta',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || null
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Minha Conta',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || null
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [isTrialUser, setIsTrialUser] = useState<boolean>(false);

  // Verificação de Paywall / Assinatura
  useEffect(() => {
    let isMounted = true;
    async function checkSubscription() {
      try {
        const { granted, subscription } = await subscriptionService.isAccessGranted();
        if (!granted) {
          if (isMounted) setAccessGranted(false);
          router.replace('/planos');
          return;
        }
        if (subscription) {
          const isTrial = subscription.status === 'TRIAL' || (subscription.amount === 0 && !isAdminEmail(userInfo.email));
          if (isMounted) setIsTrialUser(isTrial);
        }
        if (isMounted) setAccessGranted(true);
      } catch (err) {
        console.error('Erro ao verificar permissão:', err);
        if (isMounted) setAccessGranted(false);
        router.replace('/planos');
      }
    }
    checkSubscription();
    return () => { isMounted = false; };
  }, [pathname, router]);

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Atalho global Cmd+K / Ctrl+K para Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isAdmin = isAdminEmail(userInfo.email);

  const sidebarMenus = [
    {
      title: 'Principal',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
      ]
    },
    {
      title: 'Finanças',
      items: [
        { href: '/dashboard/transacoes', icon: Wallet, label: 'Saldo e Extrato' },
        { href: '/dashboard/investimentos', icon: TrendingUp, label: 'Investimentos' },
        { href: '/dashboard/cartoes', icon: CreditCard, label: 'Minhas Faturas' },
        { href: '/dashboard/terceiros', icon: Users, label: 'Terceiros' },
        { href: '/dashboard/dividas', icon: Landmark, label: 'Dívidas e Empréstimos' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { href: '/dashboard/configuracoes?tab=contas', icon: Landmark, label: 'Contas bancárias' },
        { href: '/dashboard/configuracoes?tab=cartoes', icon: CreditCard, label: 'Cartões' },
        { href: '/dashboard/configuracoes?tab=categorias', icon: Tag, label: 'Categorias' },
        { href: '/dashboard/configuracoes?tab=terceiros', icon: Users, label: 'Pessoas' },
      ]
    },
    ...(isAdmin ? [
      {
        title: 'Administração',
        items: [
          { href: '/dashboard/admin', icon: ShieldCheck, label: 'Gestão', badge: 'Admin' },
          { href: '/dashboard/admin/cupons', icon: Ticket, label: 'Cupons' },
        ]
      }
    ] : [])
  ];

  const isItemActive = (href: string) => {
    if (href === pathname) return true;
    if (href.startsWith('/dashboard/configuracoes')) {
      if (pathname !== '/dashboard/configuracoes') return false;
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hrefTab = href.split('tab=')[1];
      if (hrefTab) {
        return search.includes(`tab=${hrefTab}`);
      }
      return false;
    }
    return false;
  };

  const getPageInfo = () => {
    if (pathname === '/dashboard') return { title: 'Visão Geral', icon: LayoutDashboard };
    if (pathname === '/dashboard/transacoes') return { title: 'Saldo e Extrato', icon: Wallet };
    if (pathname === '/dashboard/investimentos') return { title: 'Investimentos', icon: TrendingUp };
    if (pathname === '/dashboard/cartoes') return { title: 'Minhas Faturas', icon: CreditCard };
    if (pathname === '/dashboard/terceiros') return { title: 'Terceiros', icon: Users };
    if (pathname === '/dashboard/dividas') return { title: 'Dívidas e Empréstimos', icon: Landmark };
    if (pathname === '/dashboard/minha-conta') return { title: 'Minha Conta', icon: UserCircle2 };
    if (pathname === '/dashboard/configuracoes') return { title: 'Configurações', icon: Settings };
    if (pathname === '/dashboard/admin/cupons') return { title: 'Cupons', icon: Ticket };
    if (pathname?.startsWith('/dashboard/admin')) return { title: 'Gestão', icon: ShieldCheck };
    return { title: 'Dashboard', icon: HomeIcon };
  };

  const { title: pageTitle } = getPageInfo();

  if (accessGranted !== true) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F5F6F9] flex flex-col items-center justify-center gap-3">
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
          <Link href="/dashboard" className="flex items-center group min-w-0" title="Ir para o Dashboard">
            {isSidebarCollapsed ? (
              <KaxxaKLogo size={24} className="text-[#1A44C8]" />
            ) : (
              <KaxxaLogo size={24} />
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
                    const active = isItemActive(item.href);
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

          {/* Rodapé da Sidebar - Sair da Conta */}
          <div className="pt-2 border-t border-[#F1F3F7]">
            <button 
              onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); router.push('/login'); }} 
              className={`flex items-center rounded-xl bg-transparent hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-[#64748B] hover:text-rose-600 group text-xs font-semibold ${
                isSidebarCollapsed ? 'justify-center p-2 w-full' : 'justify-start gap-2.5 px-3 py-2 w-full'
              }`}
              title="Sair da Conta"
            >
              <LogOut size={15} className="group-hover:text-rose-600 transition-colors shrink-0" />
              {!isSidebarCollapsed && <span>Sair da Conta</span>}
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
            {/* Campo de Busca Rápida (Abre Command Palette) */}
            <div 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#1A44C8]/40 rounded-xl px-3 py-1.5 transition-all cursor-pointer shadow-inner group"
              title="Buscar no Kaxxa"
            >
              <Search size={13} className="text-[#94A3B8] group-hover:text-[#1A44C8] transition-colors" />
              <span className="text-xs text-[#94A3B8] group-hover:text-[#64748B] w-36 font-sans select-none truncate">
                Buscar no Kaxxa...
              </span>
            </div>

            {/* Botão de Busca Mobile */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="md:hidden h-8 w-8 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F3F7] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#181B22]"
              title="Buscar no Kaxxa"
            >
              <Search size={14} />
            </button>
            
            {/* Botão de Alternância de Modo Noturno / Claro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              aria-label={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? (
                <Sun size={14} className="text-amber-400" />
              ) : (
                <Moon size={14} className="text-[#64748B]" />
              )}
            </button>

            {/* Botão de Modo Privacidade (Apenas Ícone do Olho) */}
            <button 
              type="button"
              onClick={togglePrivacy}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 ${
                isConcealed 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-[#F8FAFC] hover:bg-[#F1F3F7] text-[#64748B] hover:text-[#181B22] border-[#E5E7EB]'
              }`}
              title={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
              aria-label={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
            >
              {isConcealed ? <EyeOff size={14} className="text-amber-600" /> : <Eye size={14} className="text-[#1A44C8]" />}
            </button>

            {/* Perfil no Topbar (Avatar Redondo + Acesso Pro / Período teste) */}
            <Link 
              href="/dashboard/minha-conta"
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-[#F1F3F7] transition-colors border border-transparent hover:border-[#E5E7EB]"
              title="Minha Conta"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#1A44C8] to-[#00A3FF] text-white flex items-center justify-center text-[10px] font-bold shadow-xs border border-white/60 shrink-0">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInfo.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col text-left hidden sm:flex min-w-0">
                <span className="text-xs font-bold text-[#181B22] max-w-[120px] truncate leading-tight">{userInfo.name}</span>
                <span className={`text-[9.5px] font-extrabold tracking-tight leading-none mt-0.5 ${
                  isTrialUser ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {isTrialUser ? 'Período teste' : 'Acesso Pro'}
                </span>
              </div>
              <ChevronRight size={11} className="text-[#94A3B8] hidden sm:block shrink-0 ml-0.5" />
            </Link>
          </div>
        </header>

        {/* Conteúdo com Scroll Próprio */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative px-3 md:px-5 pb-6 z-10">
          {children}
        </main>

        {/* Modal de Busca Global (⌘K / Ctrl+K) */}
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          userEmail={userInfo.email}
        />

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
