'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PrivacyProvider, usePrivacy } from '@/app/contexts/PrivacyContext';
import { supabase, performGlobalSignOut } from '@/lib/supabase';
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
  Moon,
  X
} from 'lucide-react';

import { useTheme } from '@/app/contexts/ThemeContext';
import { KaxxaLogo, KaxxaKLogo } from '@/app/components/KaxxaLogo';
import { subscriptionService, getTrialRemainingText } from '@/lib/services/subscription';
import { userProfileService } from '@/lib/services/userProfile';
import { isAdminEmail } from '@/lib/admin';
import { CommandPalette } from '@/app/components/CommandPalette';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isConcealed, toggleConcealed, togglePrivacy } = usePrivacy();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string | null }>({
    name: 'Minha Conta',
    email: '',
    avatar: null
  });

  useEffect(() => {
    const resolveAvatar = (userId?: string, metadataUrl?: string | null): string | null => {
      if (typeof window === 'undefined') return metadataUrl || null;
      const local = userId 
        ? (localStorage.getItem(`kaxxa_user_avatar_${userId}`) || localStorage.getItem('kaxxa_user_avatar'))
        : localStorage.getItem('kaxxa_user_avatar');
      if (local === 'none') return null;
      if (local) return local;
      return metadataUrl || null;
    };

    const handleAvatarUpdate = (e: any) => {
      if (e.detail !== undefined) {
        setUserInfo(prev => ({ ...prev, avatar: e.detail }));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('kaxxa_user_avatar')) {
        const val = e.newValue;
        setUserInfo(prev => ({ ...prev, avatar: (!val || val === 'none') ? null : val }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('kaxxa_avatar_updated', handleAvatarUpdate);
      window.addEventListener('storage', handleStorageChange);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const initialAvatar = resolveAvatar(session.user.id, session.user.user_metadata?.avatar_url);
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Minha Conta',
          email: session.user.email || '',
          avatar: initialAvatar
        });

        // Sincroniza da nuvem para o dispositivo atual (cross-device sync)
        userProfileService.getProfile(session.user.id).then(profile => {
          if (profile) {
            if (profile.avatar !== undefined) {
              setUserInfo(prev => ({ ...prev, avatar: profile.avatar || null }));
            }
            if (profile.name) {
              setUserInfo(prev => ({ ...prev, name: profile.name! }));
            }
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const initialAvatar = resolveAvatar(session.user.id, session.user.user_metadata?.avatar_url);
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Minha Conta',
          email: session.user.email || '',
          avatar: initialAvatar
        });

        userProfileService.getProfile(session.user.id).then(profile => {
          if (profile) {
            if (profile.avatar !== undefined) {
              setUserInfo(prev => ({ ...prev, avatar: profile.avatar || null }));
            }
            if (profile.name) {
              setUserInfo(prev => ({ ...prev, name: profile.name! }));
            }
          }
        });
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('kaxxa_avatar_updated', handleAvatarUpdate);
        window.removeEventListener('storage', handleStorageChange);
      }
      subscription?.unsubscribe();
    };
  }, []);

  const [accessGranted, setAccessGranted] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('kaxxa_access_granted') === 'true') return true;
    }
    return null;
  });
  const [isTrialUser, setIsTrialUser] = useState<boolean>(false);
  const [subInfo, setSubInfo] = useState<{ isRecurringPro: boolean; daysRemaining: number; periodEnd?: string }>({
    isRecurringPro: false,
    daysRemaining: 0
  });

  // Verificação de Paywall / Assinatura
  useEffect(() => {
    let isMounted = true;

    // Fast path: apenas administradores têm acesso instantâneo liberado (0ms)
    if (isAdminEmail(userInfo.email)) {
      setAccessGranted(true);
      return;
    }

    // Verificação síncrona instantânea de expiração no cache local antes de renderizar qualquer UI
    if (typeof window !== 'undefined') {
      try {
        const localTrial = localStorage.getItem('kaxxa_trial_active');
        if (localTrial) {
          const parsed = JSON.parse(localTrial);
          const endsAt = parsed.endsAt || parsed.subscription?.current_period_end;
          if (endsAt && new Date(endsAt).getTime() <= Date.now()) {
            localStorage.removeItem('kaxxa_trial_active');
            localStorage.removeItem('kaxxa_access_granted');
            setAccessGranted(false);
            router.replace('/planos?expired=trial');
            return;
          }
        }
      } catch {}
    }

    async function checkSubscription() {
      try {
        const { granted, subscription, expiredReason } = await subscriptionService.isAccessGranted();
        if (!granted && !isAdminEmail(userInfo.email)) {
          if (isMounted) setAccessGranted(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('kaxxa_access_granted');
          }
          if (expiredReason === 'TRIAL_EXPIRED') {
            router.replace('/planos?expired=trial');
          } else {
            router.replace('/planos');
          }
          return;
        }
        if (subscription) {
          const isCreditCardPro = subscription.payment_method === 'CREDIT_CARD' && subscription.status === 'ACTIVE' && (subscription.amount || 0) > 0;
          let remaining = 0;
          if (subscription.current_period_end) {
            const end = new Date(subscription.current_period_end).getTime();
            remaining = Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
          }
          if (isMounted) {
            setIsTrialUser(!isCreditCardPro);
            setSubInfo({
              isRecurringPro: isCreditCardPro || isAdminEmail(userInfo.email),
              daysRemaining: remaining,
              periodEnd: subscription.current_period_end
            });
          }
        }
        if (isMounted) {
          setAccessGranted(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('kaxxa_access_granted', 'true');
          }
        }
      } catch (err) {
        console.error('Erro ao verificar permissão:', err);
        if (!isAdminEmail(userInfo.email)) {
          if (isMounted) setAccessGranted(false);
          router.replace('/planos');
        } else {
          if (isMounted) {
            setAccessGranted(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('kaxxa_access_granted', 'true');
            }
          }
        }
      }
    }
    checkSubscription();
    return () => { isMounted = false; };
  }, [pathname, router, userInfo.email]);

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
    const [targetPath, targetQuery] = href.split('?');
    if (targetPath !== pathname) return false;

    if (pathname === '/dashboard/configuracoes') {
      const activeTab = searchParams.get('tab')?.toLowerCase() || 'contas';
      const targetTab = targetQuery ? new URLSearchParams(targetQuery).get('tab')?.toLowerCase() : 'contas';
      return activeTab === targetTab;
    }

    if (targetQuery) {
      const currentQuery = searchParams.toString();
      return currentQuery === targetQuery;
    }

    return true;
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
    <div className="min-h-screen h-screen w-full bg-luxury-atmosphere flex font-sans selection:bg-[#0047FF] selection:text-white text-slate-900 dark:text-[#F1F3F7] overflow-x-hidden overflow-y-hidden relative">
      
      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Flutuante no Padrão Luxury Frosted Glass Rail */}
      <aside className={`my-2 sm:my-3 ml-2 sm:ml-3 flex-shrink-0 rounded-[24px] border border-slate-200/80 dark:border-white/[0.08] flex flex-col backdrop-blur-2xl bg-white/85 dark:bg-[#07090E]/85 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 overflow-hidden relative ${
        isSidebarCollapsed ? 'w-[68px]' : 'w-[210px]'
      } ${
        mobileMenuOpen 
          ? 'fixed inset-y-2 left-2 !w-[245px] max-h-[calc(100dvh-16px)] h-[calc(100dvh-16px)] z-50 flex flex-col shadow-2xl' 
          : 'hidden lg:flex z-0 h-[calc(100vh-16px)] sm:h-[calc(100vh-24px)]'
      }`}>
        {/* Glow de acento superior ultra-sutil */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#0047FF]/60 to-transparent pointer-events-none" />
        
        {/* Brand Header do Card com a Nova Logo Oficial e Status Live */}
        <div className={`h-14 flex items-center border-b border-slate-100/90 dark:border-white/[0.06] shrink-0 ${
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        }`}>
          <Link href="/dashboard" className="flex items-center gap-2 group min-w-0" title="Kaxxa">
            {isSidebarCollapsed ? (
              <KaxxaKLogo size={26} />
            ) : (
              <div className="flex items-center gap-2">
                <KaxxaLogo size={22} />
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono font-medium text-emerald-600 dark:text-emerald-400 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
            )}
          </Link>

          {/* Botão Fechar no Mobile */}
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors hidden lg:flex items-center justify-center shrink-0"
            title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Menus de Navegação em Formato Slim com Indicador Ativo e Micro-Interação */}
        <div className="flex-1 min-h-0 px-2.5 py-3 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3">
            {sidebarMenus.map((menu, idx) => (
              <div key={idx}>
                {!isSidebarCollapsed ? (
                  <h4 className="text-[8.5px] font-semibold tracking-[0.22em] text-slate-400 dark:text-zinc-500 mb-1.5 px-2 uppercase">
                    {menu.title}
                  </h4>
                ) : (
                  <div className="w-5 h-[1px] bg-slate-200/80 dark:bg-white/[0.06] mx-auto my-1.5" />
                )}
                
                <div className="flex flex-col gap-1">
                  {menu.items.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <Link key={item.label} href={item.href}>
                        <div 
                          className={`flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden ${
                            isSidebarCollapsed 
                              ? 'justify-center py-2.5 px-1.5' 
                              : 'justify-between px-2.5 py-2'
                          } ${
                            active 
                              ? 'bg-gradient-to-r from-[#002B9E] via-[#0047FF] to-[#0055FF] text-white font-medium shadow-md shadow-blue-600/30' 
                              : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:translate-x-1 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white font-light'
                          }`}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {!isSidebarCollapsed && active && (
                              <span className="w-1 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] shrink-0 mr-0.5 animate-pulse" />
                            )}
                            <item.icon 
                              size={15} 
                              strokeWidth={active ? 2 : 1.75}
                              className={`shrink-0 transition-transform duration-200 ${
                                active ? 'text-white' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110'
                              }`} 
                            />
                            {!isSidebarCollapsed && (
                              <span className="text-xs truncate tracking-tight">{item.label}</span>
                            )}
                          </div>

                          {!isSidebarCollapsed && item.badge && (
                            <span className={`text-[8.5px] font-medium px-1.5 py-0.2 rounded-md ${
                              active 
                                ? 'bg-white/20 text-white' 
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {isSidebarCollapsed && active && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white absolute right-1 shadow-[0_0_6px_#ffffff]" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé da Sidebar - Perfil e Sair da Conta */}
        <div className="p-2.5 border-t border-slate-100/90 dark:border-white/[0.06] shrink-0 bg-white/50 dark:bg-transparent">
          <button 
            type="button"
            onClick={async (e) => { e.preventDefault(); await performGlobalSignOut(); router.push('/login'); }} 
            className={`flex items-center rounded-xl transition-all text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/30 group text-xs font-normal tracking-tight shadow-2xs active:scale-[0.98] ${
              isSidebarCollapsed ? 'justify-center p-2.5 w-full' : 'justify-start gap-2.5 px-3 py-2 w-full'
            }`}
            title="Sair da Conta"
          >
            <LogOut size={14} strokeWidth={1.75} className="text-rose-600 dark:text-rose-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            {!isSidebarCollapsed && <span>Sair da Conta</span>}
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden overflow-y-hidden">
        
        {/* Topbar Flutuante no Formato Luxury Frosted Glass Capsule */}
        <header className="my-2 sm:my-3 mr-2 sm:mr-3 ml-2 sm:ml-2.5 h-14 px-3 sm:px-5 rounded-[22px] bg-white/85 dark:bg-[#07090E]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.45)] flex items-center justify-between z-0 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="text-slate-400 dark:text-zinc-500 font-light hidden sm:inline">Kaxxa</span>
              <ChevronRight size={11} className="text-slate-300 dark:text-zinc-600 hidden sm:inline" />
              <span className="text-slate-900 dark:text-white font-normal truncate max-w-[110px] sm:max-w-none">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Campo de Busca Rápida (Abre Command Palette) */}
            <div 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 rounded-xl px-3 py-1.5 transition-all cursor-pointer group"
              title="Buscar no Kaxxa"
            >
              <Search size={13} strokeWidth={1.75} className="text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <span className="text-xs text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 w-36 font-sans select-none truncate font-light">
                Buscar no Kaxxa...
              </span>
            </div>

            {/* Ícone de Busca em Telas Menores */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="md:hidden h-8 w-8 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
              title="Buscar"
            >
              <Search size={14} strokeWidth={1.75} />
            </button>
            
            {/* Botão de Alternância de Modo Noturno / Claro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              aria-label={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? (
                <Sun size={14} strokeWidth={1.75} className="text-amber-400" />
              ) : (
                <Moon size={14} strokeWidth={1.75} className="text-slate-500" />
              )}
            </button>

            {/* Botão de Modo Privacidade (Apenas Ícone do Olho) */}
            <button 
              type="button"
              onClick={togglePrivacy}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 ${
                isConcealed 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80' 
                  : 'bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200/80 dark:border-white/[0.08]'
              }`}
              title={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
              aria-label={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
            >
              {isConcealed ? <EyeOff size={14} strokeWidth={1.75} className="text-amber-600 dark:text-amber-400" /> : <Eye size={14} strokeWidth={1.75} className="text-slate-600 dark:text-zinc-300" />}
            </button>

            {/* Perfil no Topbar */}
            <Link 
              href="/dashboard/minha-conta"
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.05] transition-colors border border-transparent hover:border-slate-200/80 dark:hover:border-white/[0.08]"
              title="Minha Conta"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-semibold shadow-2xs border border-slate-200/80 dark:border-white/10 shrink-0">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInfo.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col text-left hidden sm:flex min-w-0">
                <span className="text-xs font-normal text-slate-900 dark:text-white max-w-[110px] truncate leading-tight">{userInfo.name}</span>
                <span className={`text-[9px] font-medium tracking-wide leading-none mt-0.5 uppercase ${
                  subInfo.isRecurringPro ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {subInfo.isRecurringPro 
                    ? 'PRO' 
                    : getTrialRemainingText(subInfo.periodEnd).text
                  }
                </span>
              </div>
              <ChevronRight size={11} className="text-slate-400 dark:text-zinc-500 hidden sm:block shrink-0 ml-0.5" />
            </Link>
          </div>
        </header>

        {/* Conteúdo com Scroll Próprio */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative px-2.5 sm:px-5 pb-6 z-0">
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
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-[#F5F6F9] flex flex-col items-center justify-center gap-3">
          <KaxxaLogo size={36} />
          <div className="w-5 h-5 border-2 border-[#1A44C8]/30 border-t-[#1A44C8] rounded-full animate-spin" />
        </div>
      }>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </PrivacyProvider>
  );
}
