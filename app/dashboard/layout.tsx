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
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string | null }>({
    name: 'Minha Conta',
    email: '',
    avatar: null
  });

  useEffect(() => {
    const resolveAvatar = (userId?: string, metadataUrl?: string | null): string | null => {
      if (typeof window === 'undefined') return metadataUrl || null;
      const global = localStorage.getItem('kaxxa_user_avatar');
      if (global && global !== 'none') return global;
      if (userId) {
        const byId = localStorage.getItem(`kaxxa_user_avatar_${userId}`);
        if (byId && byId !== 'none') return byId;
      }
      if (global === 'none') return null;
      return metadataUrl || null;
    };

    const handleAvatarUpdate = (e: any) => {
      setUserInfo(prev => ({ ...prev, avatar: e.detail ?? null }));
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

    if (isAdminEmail(userInfo.email)) {
      setAccessGranted(true);
      return;
    }

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
  }, [userInfo.email, router]);

  // Listener global de atalhos
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

  // Fechar popovers ao mudar de rota
  useEffect(() => {
    setIsSettingsMenuOpen(false);
    setIsUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const isAdmin = isAdminEmail(userInfo.email);

  // Navegação Principal de Alto Nível (Labels concisos para telas de qualquer tamanho)
  const primaryNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
    { href: '/dashboard/transacoes', icon: Wallet, label: 'Extrato' },
    { href: '/dashboard/investimentos', icon: TrendingUp, label: 'Investimentos' },
    { href: '/dashboard/cartoes', icon: CreditCard, label: 'Faturas' },
    { href: '/dashboard/terceiros', icon: Users, label: 'Terceiros' },
    { href: '/dashboard/dividas', icon: Landmark, label: 'Dívidas' },
  ];
  const secondaryNavItems = primaryNavItems.slice(4);

  // Configurações & Gestão
  const settingsNavItems = [
    { href: '/dashboard/configuracoes?tab=contas', icon: Landmark, label: 'Contas bancárias' },
    { href: '/dashboard/configuracoes?tab=cartoes', icon: CreditCard, label: 'Cartões' },
    { href: '/dashboard/configuracoes?tab=categorias', icon: Tag, label: 'Categorias' },
    { href: '/dashboard/configuracoes?tab=terceiros', icon: Users, label: 'Pessoas' },
  ];

  const adminNavItems = isAdmin ? [
    { href: '/dashboard/admin', icon: ShieldCheck, label: 'Gestão Geral', badge: 'Admin' },
    { href: '/dashboard/admin/cupons', icon: Ticket, label: 'Cupons de Desconto' },
  ] : [];

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

  const isSettingsActive = pathname === '/dashboard/configuracoes' || pathname?.startsWith('/dashboard/admin');
  const isMoreActive = isSettingsActive || secondaryNavItems.some(item => isItemActive(item.href));

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
    <div className="min-h-screen h-screen w-full bg-luxury-atmosphere flex flex-col font-sans selection:bg-[#0047FF] selection:text-white text-slate-900 dark:text-[#F1F3F7] overflow-x-hidden overflow-y-hidden relative">
      
      {/* =========================================================================
          AMBIENT LUXURY DRIFT (GPU-ACCELERATED, 60FPS, SILKY SMOOTH, ZERO OVERHEAD)
      ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none" aria-hidden="true" />

      {/* =========================================================================
          1. TOP EXECUTIVE COMMAND CAPSULE NAVIGATION (POLIDA & EQUILIBRADA PARA NOTEBOOK)
      ========================================================================= */}
      <header className="dashboard-sidebar mx-2 sm:mx-4 lg:mx-0 mt-2.5 lg:mt-0 mb-2 lg:mb-0 h-14 lg:h-screen lg:w-[246px] lg:fixed lg:inset-y-0 lg:left-0 px-3 sm:px-4 lg:px-5 lg:py-7 rounded-xl lg:rounded-none bg-white/88 dark:bg-[#07090E]/90 lg:bg-[#091a38] lg:dark:bg-[#07152e] backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.09] lg:border-r lg:border-white/[0.1] lg:border-y-0 lg:border-l-0 shadow-[0_8px_30px_rgba(32,48,75,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.7)] lg:shadow-[14px_0_50px_rgba(3,15,38,0.22)] flex lg:flex-col items-center lg:items-stretch justify-between lg:justify-start z-30 flex-shrink-0 relative gap-2 sm:gap-4 min-w-0 overflow-visible">
        
        {/* Glow de acento superior ultra-sutil */}
        <div className="absolute top-0 left-8 right-8 h-px bg-[#7da9ec]/60 pointer-events-none lg:left-5 lg:right-5" />

        {/* Lado Esquerdo: Logo Kaxxa em Azul Degradê Tech Luxury */}
        <div className="flex items-center shrink-0 lg:pb-7 lg:border-b lg:border-white/[0.1]">
          <Link href="/dashboard" className="flex items-center group transition-transform active:scale-95" title="Kaxxa">
            <KaxxaLogo size={22} />
          </Link>
        </div>

        {/* Centro: Deck de Navegação Segmentado Flutuante (Desktop & Notebook) */}
        <nav className="hidden lg:flex items-stretch flex-col gap-1 mt-8 bg-transparent p-0 border-0 shadow-none overflow-visible no-scrollbar min-w-0">
          {primaryNavItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all duration-300 select-none shrink-0 ${
                  active 
                    ? 'nav-pill-luxury-active font-semibold' 
                    : 'nav-pill-luxury-inactive font-medium'
                }`}
                title={item.label}
              >
                <item.icon size={14} strokeWidth={active ? 2.2 : 1.75} className="shrink-0" />
                <span className="tracking-tight">{item.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-pulse shadow-sm" />
                )}
              </Link>
            );
          })}

          {/* Menu Dropdown de Configurações & Ajustes */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setIsSettingsMenuOpen(!isSettingsMenuOpen); setIsUserMenuOpen(false); }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all duration-300 select-none ${
                isMoreActive 
                  ? 'nav-pill-luxury-active font-semibold' 
                  : 'nav-pill-luxury-inactive font-medium'
              }`}
              title="Configurações e Mais"
            >
              <Settings size={14} strokeWidth={1.75} className="shrink-0" />
              <span className="tracking-tight">Mais</span>
              <ChevronRight size={11} className={`transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Flutuante de Configurações */}
            {isSettingsMenuOpen && (
              <div 
                className="absolute top-0 left-full ml-3 w-56 rounded-2xl bg-[#0d2348]/98 backdrop-blur-2xl border border-white/[0.14] shadow-2xl p-2 z-50 animate-luxury-fade"
                onMouseLeave={() => setIsSettingsMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Outras áreas
                </div>
                <div className="flex flex-col gap-0.5">
                  {secondaryNavItems.map(item => {
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSettingsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon size={13.5} strokeWidth={1.75} className="text-slate-400 dark:text-zinc-500" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />
                <div className="px-2 py-1 text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Configurações
                </div>
                <div className="flex flex-col gap-0.5">
                  {settingsNavItems.map(sub => {
                    const active = isItemActive(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setIsSettingsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                          active 
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' 
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <sub.icon size={13.5} strokeWidth={1.75} className="text-slate-400 dark:text-zinc-500" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {adminNavItems.length > 0 && (
                  <>
                    <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />
                    <div className="px-2 py-1 text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Administração
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {adminNavItems.map(adm => {
                        const active = isItemActive(adm.href);
                        return (
                          <Link
                            key={adm.href}
                            href={adm.href}
                            onClick={() => setIsSettingsMenuOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                              active 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' 
                                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <adm.icon size={13.5} strokeWidth={1.75} className="text-blue-500" />
                              <span>{adm.label}</span>
                            </div>
                            {adm.badge && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {adm.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-7 pt-5 border-t border-white/[0.1] flex flex-col gap-1">
            <span className="px-3.5 text-[9px] uppercase tracking-[0.22em] text-blue-200/45 mb-1">Organização</span>
            {settingsNavItems.map(item => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-300 ${
                    active ? 'nav-pill-luxury-active font-medium' : 'nav-pill-luxury-inactive font-normal'
                  }`}
                >
                  <item.icon size={14} strokeWidth={1.7} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {adminNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-blue-100/60 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <item.icon size={14} strokeWidth={1.7} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Lado Direito: Ações Executivas (Sem Busca, Limpo & Espaçoso) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 lg:mt-auto lg:pt-5 lg:border-t lg:border-white/[0.1]">
          
          {/* Alternar Modo Noturno / Claro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shadow-2xs active:scale-95 shrink-0"
            title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            aria-label={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {theme === 'dark' ? (
              <Sun size={14} strokeWidth={1.75} className="text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon size={14} strokeWidth={1.75} className="text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Modo Privacidade (Ocultar Valores) */}
          <button 
            type="button"
            onClick={togglePrivacy}
            className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all shadow-2xs active:scale-95 shrink-0 ${
              isConcealed 
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                : 'bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200/80 dark:border-white/[0.08]'
            }`}
            title={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
            aria-label={isConcealed ? "Revelar valores monetários" : "Ocultar valores monetários (Modo Privacidade)"}
          >
            {isConcealed ? <EyeOff size={14} strokeWidth={1.75} className="text-amber-600 dark:text-amber-400" /> : <Eye size={14} strokeWidth={1.75} className="text-slate-600 dark:text-zinc-300" />}
          </button>

          {/* Cápsula de Perfil (Desktop: dropdown executivo | Mobile: abre o Drawer Completo) */}
          <div className="relative">
            {/* Mobile: Tocar no avatar abre o drawer */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center p-0.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.05] transition-all active:scale-95 shrink-0"
              title="Menu e Perfil"
              aria-label="Menu e Perfil"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#002288] to-[#0055FF] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0 border border-white/20">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInfo.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </button>

            {/* Desktop: Cápsula com Nome e Dropdown */}
            <button
              type="button"
              onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsSettingsMenuOpen(false); }}
              className="hidden lg:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.05] transition-all border border-transparent hover:border-slate-200/80 dark:hover:border-white/[0.08] active:scale-95 shrink-0"
              title="Menu do Usuário"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#002288] to-[#0055FF] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0 border border-white/20">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInfo.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col text-left hidden xl:flex min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[95px] truncate leading-tight">{userInfo.name}</span>
                <span className={`text-[8.5px] font-bold tracking-wide leading-none mt-0.5 uppercase ${
                  subInfo.isRecurringPro ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {subInfo.isRecurringPro ? 'PRO' : getTrialRemainingText(subInfo.periodEnd).text}
                </span>
              </div>
              <ChevronRight size={12} className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown do Usuário (Desktop) */}
            {isUserMenuOpen && (
              <div 
                className="absolute top-full right-0 mt-2 lg:top-auto lg:right-auto lg:bottom-0 lg:left-full lg:ml-3 lg:mt-0 w-60 rounded-2xl bg-white/95 dark:bg-[#0D111A]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.1] shadow-2xl p-2 z-50 animate-luxury-fade"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{userInfo.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">{userInfo.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {subInfo.isRecurringPro ? 'Plano Pro' : 'Período de Testes'}
                    </span>
                    <Link
                      href="/dashboard/minha-conta?tab=assinatura"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Gerenciar
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <Link
                    href="/dashboard/minha-conta"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all font-medium"
                  >
                    <UserCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Minha Conta</span>
                  </Link>

                  <Link
                    href="/dashboard/minha-conta?tab=assinatura"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all font-medium"
                  >
                    <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Minha Assinatura</span>
                  </Link>

                  <Link
                    href="/dashboard/configuracoes"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all font-medium"
                  >
                    <Settings size={14} className="text-slate-400 dark:text-zinc-500" />
                    <span>Preferências</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      await performGlobalSignOut();
                      router.push('/login');
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all w-full text-left font-medium"
                  >
                    <LogOut size={14} className="text-rose-600 dark:text-rose-400" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* =========================================================================
          2. CONTEÚDO PRINCIPAL (100% DA LARGURA DISPONÍVEL - NENHUM CARD APERTADO)
      ========================================================================= */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative px-2 sm:px-4 md:px-5 pb-20 lg:pb-8 lg:pl-[270px] z-0">
        <div className="dashboard-content w-full max-w-none mx-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-8">
          {children}
        </div>
      </main>

      {/* =========================================================================
          3. DOCK FLUTUANTE LUXURY MOBILE (APENAS DISPOSITIVOS MÓVEIS / TABLETS)
      ========================================================================= */}
      <nav className="lg:hidden fixed bottom-2.5 inset-x-2.5 z-40 h-14 rounded-2xl bg-white/90 dark:bg-[#07090E]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.09] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex items-center justify-around px-2">
        {primaryNavItems.slice(0, 4).map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                active 
                  ? 'text-blue-600 dark:text-blue-400 scale-105 font-semibold' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <item.icon size={17} strokeWidth={active ? 2.3 : 1.75} />
              <span className="text-[9.5px] mt-0.5 tracking-tight">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}

        {/* Botão Mais no Dock Mobile */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
            mobileMenuOpen || isItemActive('/dashboard/terceiros') || isItemActive('/dashboard/dividas') || isSettingsActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold' 
              : 'text-slate-400 dark:text-zinc-500'
          }`}
        >
          <Menu size={17} strokeWidth={1.75} />
          <span className="text-[9.5px] mt-0.5 tracking-tight">Mais</span>
        </button>
      </nav>

      {/* =========================================================================
          4. DRAWER / SLIDE-OVER LUXURY MOBILE
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-luxury-fade">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Lateral Direito */}
          <div className="absolute inset-y-0 right-0 max-w-[300px] w-full bg-white/95 dark:bg-[#0A0D14]/95 backdrop-blur-2xl border-l border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-4 flex flex-col justify-between z-10 overflow-y-auto custom-scrollbar">
            <div>
              {/* Header do Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                <KaxxaLogo size={22} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Card Executivo do Usuário (Destaque Principal no Mobile) */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-white/[0.05] dark:to-blue-950/20 border border-slate-200/90 dark:border-white/[0.1] mb-3.5 shadow-sm">
                <Link 
                  href="/dashboard/minha-conta" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#002288] to-[#0055FF] text-white flex items-center justify-center text-xs font-bold shrink-0 border-2 border-white dark:border-[#0A0D14] shadow-sm group-hover:scale-105 transition-transform">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userInfo.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {userInfo.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">{userInfo.email}</p>
                    <span className={`inline-flex items-center text-[8.5px] font-mono font-bold uppercase mt-0.5 px-1.5 py-0.5 rounded ${
                      subInfo.isRecurringPro 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {subInfo.isRecurringPro ? '★ PRO ATIVO' : 'TRIAL: ' + getTrialRemainingText(subInfo.periodEnd).text}
                    </span>
                  </div>
                  <ChevronRight size={15} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Ações Rápidas: Minha Conta & Assinatura */}
                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.07]">
                  <Link
                    href="/dashboard/minha-conta"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition-all active:scale-95"
                  >
                    <UserCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Minha Conta</span>
                  </Link>

                  <Link
                    href="/dashboard/minha-conta?tab=assinatura"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:brightness-105 transition-all active:scale-95"
                  >
                    <ShieldCheck size={13} />
                    <span>Assinatura</span>
                  </Link>
                </div>
              </div>

              {/* Todos os Menus em Lista Elegante */}
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="text-[9px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                    Finanças
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    {primaryNavItems.map(item => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all ${
                            active 
                              ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30' 
                              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <item.icon size={15} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                    Configurações
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    {settingsNavItems.map(sub => {
                      const active = isItemActive(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all ${
                            active 
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' 
                              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <sub.icon size={15} className="text-slate-400" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {adminNavItems.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                      Administração
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {adminNavItems.map(adm => {
                        const active = isItemActive(adm.href);
                        return (
                          <Link
                            key={adm.href}
                            href={adm.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                              active 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' 
                                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <adm.icon size={15} className="text-blue-500" />
                              <span>{adm.label}</span>
                            </div>
                            {adm.badge && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-600">
                                {adm.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé Mobile - Sair da Conta */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] mt-4">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  await performGlobalSignOut();
                  router.push('/login');
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 text-xs font-semibold active:scale-98 transition-all"
              >
                <LogOut size={14} />
                <span>Sair da Conta</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Busca Global (⌘K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        userEmail={userInfo.email}
      />

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
