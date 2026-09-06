'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  QrCode, 
  CreditCard, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  Clock, 
  Sparkles,
  Ticket,
  X,
  UserCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { KaxxaLogo } from '@/app/components/KaxxaLogo';
import { PixIcon, PixBadge } from '@/app/components/PixLogo';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '@/lib/services/subscription';

export default function PlanosCheckoutPage() {
  const router = useRouter();

  // User & Auth state
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [gsiReady, setGsiReady] = useState(false);

  // Forma de Pagamento Direta: 'PIX' | 'CARD'
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  // Se Cartão: Ativar renovação automática mensal - por padrão DESMARCADO conforme solicitação
  const [cardRecurring, setCardRecurring] = useState(false);
  const [authWarning, setAuthWarning] = useState(false);

  // Checkout State
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64?: string | null;
    amount: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(900);

  // Cupom de Desconto / Teste
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
    discountDurationMonths: number;
    discountAmount: number;
    finalPrice: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Preço calculado com desconto
  const displayPrice = appliedCoupon ? appliedCoupon.finalPrice : 39.90;

  // Polling interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '61580172309-baud3b6dnu4n0ustld3v291btg7b0c2a.apps.googleusercontent.com';

  // Sincronização e Monitoramento de Sessão
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const isChangeMethod = searchParams?.get('change_method') === 'true' || searchParams?.get('mudar_metodo') === 'true';

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          setUserEmail(session.user.email || '');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        }

        // Se já possui acesso liberado e NÃO está trocando método, redireciona direto
        if (!isChangeMethod) {
          const access = await subscriptionService.isAccessGranted();
          if (access.granted && isMounted) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkCurrentSession();

    // Lê cupom da URL caso passado (?cupom=XYZ ou ?coupon=XYZ)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCoupon = params.get('cupom') || params.get('coupon');
      if (urlCoupon) {
        setCouponInput(urlCoupon.toUpperCase());
        setShowCouponInput(true);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        setAuthLoading(false);

        if (event === 'SIGNED_IN') {
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const isChangeMethod = searchParams?.get('change_method') === 'true' || searchParams?.get('mudar_metodo') === 'true';
          if (!isChangeMethod) {
            const access = await subscriptionService.isAccessGranted();
            if (access.granted && isMounted) {
              router.push('/dashboard');
            }
          }
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
        setUserEmail('');
        setUserName('');
        setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  // Callback do Google Identity Services
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setUserEmail(data.user.email || '');
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '');

        const access = await subscriptionService.isAccessGranted();
        if (access.granted) {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Google ID Token error:', err);
      setErrorMsg(err.message || 'Erro ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Inicializador do Botão Oficial do Google
  const initGsi = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && !user) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-btn-planos');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'medium',
            text: 'continue_with',
            shape: 'pill',
            width: 240,
            logo_alignment: 'left',
          });
          setGsiReady(true);
          return true;
        }
      } catch (e) {
        console.error('Error initializing GSI on planos:', e);
      }
    }
    return false;
  }, [clientId, handleCredentialResponse, user]);

  useEffect(() => {
    if (authLoading || user) return;

    let interval: NodeJS.Timeout;
    let attempts = 0;

    const tryInit = () => {
      attempts++;
      const success = initGsi();
      if (success || attempts > 30) {
        clearInterval(interval);
      }
    };

    tryInit();
    interval = setInterval(tryInit, 200);

    return () => clearInterval(interval);
  }, [authLoading, user, initGsi]);

  const renderWarningButtons = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && !user) {
      try {
        const containers = [
          'google-btn-warning-pix',
          'google-btn-warning-card',
          'google-btn-warning-trial'
        ];
        containers.forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = '';
            (window as any).google.accounts.id.renderButton(el, {
              theme: 'filled_blue',
              size: 'medium',
              text: 'continue_with',
              shape: 'pill',
            });
          }
        });
      } catch (e) {
        console.error('Error rendering warning Google buttons:', e);
      }
    }
  }, [user]);

  useEffect(() => {
    if (authWarning) {
      renderWarningButtons();
      const t = setTimeout(renderWarningButtons, 80);
      return () => clearTimeout(t);
    }
  }, [authWarning, renderWarningButtons]);

  const handleGoogleOAuthDirect = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (appliedCoupon) {
        localStorage.setItem('kaxxa_pending_coupon', appliedCoupon.code);
      }
      const redirectUrl = appliedCoupon 
        ? `${window.location.origin}/planos?cupom=${encodeURIComponent(appliedCoupon.code)}`
        : `${window.location.origin}/planos`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth Direct error:', err);
      setErrorMsg(err.message || 'Erro ao conectar com o Google.');
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setAuthWarning(true);
          }
        });
        setLoading(false);
        return;
      }

      await handleGoogleOAuthDirect();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || 'Erro ao conectar com o Google.');
      setLoading(false);
      setAuthWarning(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserEmail('');
    setUserName('');
  };

  // Timer do PIX
  useEffect(() => {
    if (!pixData || isApproved) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData, isApproved]);

  // Polling automático da aprovação do PIX
  useEffect(() => {
    if (!pixData || isApproved) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status/${pixData.paymentId}?userId=${user?.id || ''}&planType=MENSAL`);
        const data = await res.json();

        if (data.status === 'approved' || data.accessGranted) {
          setIsApproved(true);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2500);
        }
      } catch (err) {
        console.error('Erro na verificação de status:', err);
      }
    }, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [pixData, isApproved, user, router]);

  // Validar Cupom de Desconto ou Degustação
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VALIDATE',
          code: couponInput.trim(),
          userId: user?.id,
          email: user?.email,
          originalPrice: 39.90,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cupom inválido.');
      }

      setAppliedCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        discountDurationMonths: data.discountDurationMonths,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        message: data.message,
      });
      setPixData(null);
    } catch (err: any) {
      setCouponError(err.message || 'Cupom inválido.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  // Resgatar Cupom de Degustação (100% Grátis)
  const handleRedeemTrialCoupon = async (currentUser?: any) => {
    let activeUser = currentUser || user;

    if (!activeUser) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          activeUser = session.user;
          setUser(session.user);
          setUserEmail(session.user.email || '');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        }
      } catch {}
    }

    if (!activeUser) {
      if (appliedCoupon && typeof window !== 'undefined') {
        localStorage.setItem('kaxxa_pending_coupon', appliedCoupon.code);
      }
      router.push('/login');
      return;
    }

    if (!appliedCoupon) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REDEEM',
          code: appliedCoupon.code,
          userId: activeUser.id,
          email: activeUser.email,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível resgatar o cupom.');
      }

      // Garante a gravação direta no Supabase pelo cliente autenticado do navegador (usando auth.uid())
      try {
        const days = data.days || appliedCoupon.value || 2;
        await subscriptionService.activateSubscription({
          userId: activeUser.id,
          status: appliedCoupon.type === 'TRIAL_DAYS' ? 'TRIAL' : 'ACTIVE',
          durationDays: days,
          paymentMethod: 'PIX',
          paymentId: `cupom-${appliedCoupon.code.toLowerCase()}`,
          amount: 0,
        });
      } catch (e) {
        console.warn('Erro na sincronização cliente-Supabase:', e);
      }

      // Salva localmente para acesso imediato no navegador sem depender do Supabase
      if (typeof window !== 'undefined') {
        const days = data.days || appliedCoupon.value || 2;
        const endsAt = data.endsAt || (data.subscription ? data.subscription.current_period_end : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString());
        localStorage.setItem('kaxxa_trial_active', JSON.stringify({
          id: data.subscription?.id || `trial-${Date.now()}`,
          userId: activeUser.id,
          code: appliedCoupon.code,
          days,
          endsAt,
          subscription: data.subscription
        }));
        localStorage.setItem('kaxxa_access_granted', 'true');
        localStorage.removeItem('kaxxa_pending_coupon');
      }

      setIsApproved(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao ativar cupom:', err);
      setErrorMsg(err.message || 'Erro ao ativar cupom.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePix = async () => {
    if (!user) {
      setAuthWarning(true);
      handleGoogleClick();
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'MENSAL',
          email: userEmail || user?.email,
          name: userName || 'Cliente Kaxxa',
          userId: user?.id,
          couponCode: appliedCoupon?.code,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível gerar o PIX');
      }

      setPixData({
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        amount: data.amount
      });
      setCountdown(900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleManualCheckStatus = async () => {
    if (!pixData) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/status/${pixData.paymentId}?userId=${user?.id || ''}&planType=MENSAL&forceApprove=true`);
      const data = await res.json();
      if (data.status === 'approved' || data.accessGranted) {
        setIsApproved(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        alert('Pagamento ainda não identificado no banco. Aguarde alguns instantes.');
      }
    } catch {
      alert('Erro ao consultar status. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!user) {
      setAuthWarning(true);
      handleGoogleClick();
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail || user?.email,
          name: userName || 'Cliente Kaxxa',
          userId: user?.id,
          recurring: cardRecurring,
          couponCode: appliedCoupon?.code,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento no cartão');
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar pagamento no cartão.');
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-white text-[#181B22] font-sans relative selection:bg-[#1A44C8]/20 selection:text-[#1A44C8] overflow-x-hidden">
      
      {/* Script Oficial do Google Identity Services */}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive" 
        onLoad={initGsi} 
      />

      {/* Header 100% Unificado com o Fundo da Tela */}
      <header className="relative z-20 w-full bg-white px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-100">
        {/* Lado Esquerdo: Botão Voltar */}
        <div className="w-1/3 flex items-center justify-start">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#181B22] transition-colors group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 text-[#64748B]" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
        </div>

        {/* Centro: Logo Kaxxa Perfeitamente Centralizada */}
        <div className="w-1/3 flex items-center justify-center">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
            <KaxxaLogo size={26} />
          </Link>
        </div>

        {/* Lado Direito: Status da Conta / Login */}
        <div className="w-1/3 flex items-center justify-end gap-2.5 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="hidden md:inline text-[11px]">Conectado:</span>
              <strong className="text-[#181B22] max-w-[120px] sm:max-w-[180px] truncate text-xs">{user.email}</strong>
              <button 
                type="button"
                onClick={handleSignOut}
                className="text-[#1A44C8] hover:underline font-bold ml-1 text-xs"
              >
                Sair
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleGoogleClick}
              className="text-[#1A44C8] hover:underline font-bold text-xs"
            >
              Fazer Login
            </button>
          )}
        </div>
      </header>

      {/* Modal de Sucesso */}
      {isApproved && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 bg-[#059669]/10 text-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#059669]/20 shadow-sm">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-[#181B22] mb-1">
              {appliedCoupon?.type === 'TRIAL_DAYS' ? 'Acesso Liberado!' : 'Pagamento Aprovado!'}
            </h3>
            <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
              {appliedCoupon?.type === 'TRIAL_DAYS' 
                ? `Seu teste de ${appliedCoupon.value} dias foi ativado com sucesso. Redirecionando para seu painel...`
                : 'Sua Assinatura Kaxxa foi liberada com sucesso. Redirecionando para seu painel...'}
            </p>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div className="bg-[#1A44C8] h-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal Ultra Compacto */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-4 sm:py-6">

        {/* Notificação Compacta de Login se não estiver logado */}
        {!user && !authLoading && (
          <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs backdrop-blur-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-[#1E3A8A]">
              <UserCheck size={16} className="text-[#1A44C8] shrink-0" />
              <span className="font-semibold">Conecte sua conta para vincular seu acesso à assinatura:</span>
            </div>
            <div className="shrink-0 flex justify-center">
              <div id="google-btn-planos" />
              {!gsiReady && (
                <button
                  type="button"
                  onClick={handleGoogleOAuthDirect}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#181B22] font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continuar com o Google</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* COLUNA ESQUERDA (7 cols): FORMA DE PAGAMENTO */}
          <div className="lg:col-span-7 space-y-4">

            {/* SELEÇÃO DIRETA ENTRE PIX E CARTÃO (SEM PREÇO REPETIDO NO CABEÇALHO) */}
            <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all">
              
              <div className="pb-2 border-b border-[#F1F5F9]">
                <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide">
                  Escolha a Forma de Pagamento
                </h2>
              </div>

              {/* SE CUPOM DE TESTE 100% ESTIVER ATIVADO: CARD DE ATIVAÇÃO GRÁTIS */}
              {appliedCoupon && appliedCoupon.type === 'TRIAL_DAYS' ? (
                <div className="p-4 bg-emerald-50/80 border-2 border-[#059669] rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Tag size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-[#181B22]">
                            Cupom &quot;{appliedCoupon.code}&quot; Ativo!
                          </span>
                          <span className="text-[9px] font-black bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            100% OFF
                          </span>
                        </div>
                        <p className="text-[11px] text-[#059669] font-medium mt-0.5">
                          {appliedCoupon.value} dias de degustação completa sem precisar pagar nada.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold p-1"
                      title="Remover cupom"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Aviso se clicou sem estar logado */}
                  {authWarning && !user && (
                    <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Entre em sua conta antes de ativar</span>
                          <span className="text-[11px] text-amber-800">Conecte com sua conta Google para liberar os {appliedCoupon.value} dias de teste gratuito.</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (appliedCoupon) localStorage.setItem('kaxxa_pending_coupon', appliedCoupon.code);
                            handleGoogleOAuthDirect();
                          }}
                          className="px-4 py-2 bg-[#1A44C8] hover:bg-[#1538A5] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                        >
                          <span>Entrar com Google</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de Erro Visível */}
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRedeemTrialCoupon()}
                    disabled={loading}
                    className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>ATIVAR MEU ACESSO DE {appliedCoupon.value} DIAS GRÁTIS</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* FLUXO NORMAL OU COM CUPOM DE DESCONTO (% / R$) */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* BOTÃO PIX COM LOGO OFICIAL */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('PIX');
                        setErrorMsg('');
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                        paymentMethod === 'PIX'
                          ? 'border-[#32BCAD] bg-teal-50/40 shadow-sm ring-2 ring-[#32BCAD]/15'
                          : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          paymentMethod === 'PIX' ? 'bg-[#32BCAD] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <PixIcon size={15} color={paymentMethod === 'PIX' ? '#FFFFFF' : '#32BCAD'} />
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-100/80 text-[#008A7C]">
                          Instantâneo
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-extrabold text-[#181B22]">PIX</h3>
                        <PixIcon size={13} color="#32BCAD" />
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5">QR Code ou Copia e Cola</p>
                    </button>

                    {/* BOTÃO CARTÃO DE CRÉDITO */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('CARD');
                        setPixData(null);
                        setErrorMsg('');
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                        paymentMethod === 'CARD'
                          ? 'border-[#1A44C8] bg-blue-50/35 shadow-sm ring-2 ring-[#1A44C8]/10'
                          : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'CARD' ? 'bg-[#1A44C8] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <CreditCard size={15} />
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#1A44C8]">
                          Mercado Pago
                        </span>
                      </div>
                      <h3 className="text-xs font-extrabold text-[#181B22]">Cartão de Crédito</h3>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Recorrente ou Pagamento Único</p>
                    </button>
                  </div>

                  {/* OPÇÃO COMPACTA E MODERNA DE RENOVAÇÃO AUTOMÁTICA */}
                  {paymentMethod === 'CARD' && (
                    <div
                      onClick={() => setCardRecurring(!cardRecurring)}
                      className={`px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 ${
                        cardRecurring
                          ? 'bg-blue-50/70 border-[#1A44C8]/50 shadow-xs'
                          : 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Toggle Switch Moderno */}
                        <div
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                            cardRecurring ? 'bg-[#1A44C8]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                              cardRecurring ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#181B22]">
                              Renovação automática mensal
                            </span>
                            {cardRecurring ? (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
                                Ativa
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                ⭐ Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                            {cardRecurring
                              ? 'Acesso contínuo sem interrupções • Cancele quando quiser no perfil'
                              : 'Evite bloqueios e a necessidade de renovar manualmente todo mês'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[11px] font-black block ${cardRecurring ? 'text-[#1A44C8]' : 'text-slate-600'}`}>
                          R$ {displayPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[9px] text-[#64748B] block -mt-0.5">
                          {cardRecurring ? '/mês' : '/30 dias'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Erro */}
                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* FLUXO PIX SELECIONADO */}
                  {paymentMethod === 'PIX' && (
                    <div className="pt-1">
                      {pixData ? (
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-center space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-xs font-bold">
                            <span className="text-[#008A7C] flex items-center gap-1.5 font-bold">
                              <PixIcon size={15} color="#32BCAD" />
                              <Clock size={13} className="text-[#64748B]" />
                              Expira em {formatTime(countdown)}
                            </span>
                            <span>Total: R$ {displayPrice.toFixed(2).replace('.', ',')}</span>
                          </div>

                          <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl inline-block shadow-sm">
                            {pixData.qrCodeBase64 ? (
                              <img 
                                src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                                alt="QR Code PIX"
                                className="w-36 h-36 object-contain rounded-lg mx-auto"
                              />
                            ) : (
                              <div className="w-36 h-36 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
                                <QrCode size={80} className="text-[#181B22]" />
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-bold text-[#1A44C8]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A44C8] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1A44C8]" />
                              </span>
                              <span>Aguardando pagamento no banco...</span>
                            </div>
                          </div>

                          {/* Copia e Cola */}
                          <div className="space-y-1 max-w-sm mx-auto">
                            <label className="text-[10px] font-bold text-[#64748B] block text-left">
                              Código PIX Copia e Cola:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={pixData.qrCode}
                                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#64748B] font-mono select-all focus:outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={handleCopyPix}
                                className="px-3 py-1.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                              >
                                {copied ? (
                                  <>
                                    <Check size={12} />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="pt-1 space-y-2">
                            <button
                              type="button"
                              onClick={handleManualCheckStatus}
                              disabled={loading}
                              className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                            >
                              <CheckCircle2 size={14} />
                              <span>Já paguei no meu banco (Liberar Agora)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPixData(null)}
                              className="w-full text-center text-[11px] text-[#64748B] hover:text-[#181B22]"
                            >
                              Gerar outro código
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Aviso se clicou sem estar logado */}
                          {authWarning && !user && (
                            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-amber-950 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                                <span className="font-bold">Entre em sua conta antes</span>
                              </div>
                              <div className="shrink-0 flex justify-center">
                                <div id="google-btn-warning-pix" />
                                {!gsiReady && (
                                  <button
                                    type="button"
                                    onClick={handleGoogleClick}
                                    className="px-3.5 py-1.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                                  >
                                    <span>Entrar com Google</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleGeneratePix}
                            disabled={loading}
                            className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                          >
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <PixIcon size={16} color="#FFFFFF" />
                                <span>PAGAR COM PIX • R$ {displayPrice.toFixed(2).replace('.', ',')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FLUXO CARTÃO SELECIONADO */}
                  {paymentMethod === 'CARD' && (
                    <div className="pt-1 space-y-2">
                      {/* Aviso se clicou sem estar logado */}
                      {authWarning && !user && (
                        <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-amber-950 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <span className="font-bold">Entre em sua conta antes</span>
                          </div>
                          <div className="shrink-0 flex justify-center">
                            <div id="google-btn-warning-card" />
                            {!gsiReady && (
                              <button
                                type="button"
                                onClick={handleGoogleClick}
                                className="px-3.5 py-1.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <span>Entrar com Google</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCardPayment}
                        disabled={loading}
                        className="w-full py-3 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>
                              {cardRecurring 
                                ? `ASSINAR COM CARTÃO (R$ ${displayPrice.toFixed(2).replace('.', ',')}/MÊS)` 
                                : `PAGAR R$ ${displayPrice.toFixed(2).replace('.', ',')} NO CARTÃO (30 DIAS)`}
                            </span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-[#64748B] text-center mt-2">
                        Você será direcionado à página segura do Mercado Pago para inserir os dados do cartão.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8]">
                <ShieldCheck size={12} className="text-[#059669]" />
                <span>Dados 100% protegidos por criptografia Mercado Pago.</span>
              </div>

            </div>

            {/* SEÇÃO PROFISSIONAL: CUPOM DE DESCONTO */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
              {!showCouponInput && !appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="text-xs text-[#1A44C8] hover:underline font-normal flex items-center gap-1.5"
                >
                  <Tag size={13} />
                  <span>Possui um cupom de desconto?</span>
                </button>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                      <Tag size={13} className="text-[#1A44C8]" />
                      Cupom de Desconto
                    </span>
                    {!appliedCoupon && (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(false)}
                        className="text-[10px] text-[#64748B] hover:text-[#181B22]"
                      >
                        Fechar
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite aqui"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      disabled={couponLoading || !!appliedCoupon}
                      className={`flex-1 font-sans text-xs px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1A44C8] bg-white text-[#181B22] placeholder:font-sans placeholder:normal-case placeholder:text-[11px] placeholder:text-slate-400 placeholder:opacity-60 ${couponInput ? 'uppercase font-bold tracking-wider' : ''}`}
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 bg-[#181B22] hover:bg-black text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {couponLoading ? 'Validando...' : 'Aplicar'}
                      </button>
                    )}
                  </div>

                  {appliedCoupon && (
                    <p className="text-[11px] text-[#059669] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>{appliedCoupon.message}</span>
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-bold">{couponError}</p>
                  )}
                </form>
              )}
            </div>

          </div>

          {/* COLUNA DIREITA (5 cols): RESUMO E GARANTIA DE 7 DIAS */}
          <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-4">

            {/* Card de Resumo do Pedido */}
            <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
              <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide pb-2.5 border-b border-[#F1F5F9]">
                Resumo da Assinatura
              </h2>

              <div className="py-2.5 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-[#181B22]">Assinatura Kaxxa</h3>
                    <p className="text-[10px] text-[#64748B]">
                      {appliedCoupon?.type === 'TRIAL_DAYS'
                        ? `Degustação de ${appliedCoupon.value} dias` 
                        : (paymentMethod === 'CARD' && cardRecurring ? 'Cobrança mensal recorrente' : '30 dias de acesso')}
                    </p>
                  </div>
                  <span className={`font-bold ${appliedCoupon ? 'line-through text-slate-400' : 'text-[#181B22]'}`}>
                    R$ 39,90
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-[#059669] text-xs font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      Cupom ({appliedCoupon.code})
                    </span>
                    <span>- R$ {appliedCoupon.discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                  <span>Cancelamento</span>
                  <span className="font-bold text-[#059669]">Livre sem multas</span>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-baseline">
                  <span className="text-xs font-black text-[#181B22]">Total Hoje:</span>
                  <span className="text-lg font-black text-[#181B22]">
                    R$ {displayPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Garantia de 7 dias */}
            <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 flex items-start gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                <ShieldCheck size={15} />
              </div>
              <div className="text-xs">
                <h3 className="font-extrabold text-[#181B22]">Garantia de 7 dias</h3>
                <p className="text-[#64748B] text-[10px] mt-0.5 leading-relaxed">
                  Satisfação garantida ou seu dinheiro de volta em até 7 dias diretamente pelo Mercado Pago.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
