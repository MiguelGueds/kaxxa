'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Clock, 
  TrendingUp,
  Layers,
  ChevronRight,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';
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

  // Payment Method: 'PIX' | 'CARD_RECURRING' | 'CARD_SINGLE'
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD_RECURRING' | 'CARD_SINGLE'>('PIX');

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
  const [countdown, setCountdown] = useState(900); // 15 minutos em segundos

  // Polling interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '61580172309-baud3b6dnu4n0ustld3v291btg7b0c2a.apps.googleusercontent.com';

  // 1. Monitoramento e Sincronização de Sessão em Tempo Real
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          setUserEmail(session.user.email || '');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');

          const access = await subscriptionService.isAccessGranted();
          if (access.granted && isMounted) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão inicial:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkCurrentSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        setAuthLoading(false);

        if (event === 'SIGNED_IN') {
          const access = await subscriptionService.isAccessGranted();
          if (access.granted && isMounted) {
            router.push('/dashboard');
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
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320,
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

  // Polling para renderizar o botão oficial do Google caso o usuário não esteja conectado
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
        (window as any).google.accounts.id.prompt();
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/planos`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || 'Erro ao conectar com o Google.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserEmail('');
    setUserName('');
  };

  // Timer regressivo do PIX
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

  // Polling automático a cada 3.5 segundos para checar aprovação do PIX
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

  const handleGeneratePix = async () => {
    if (!user) {
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

  const handleCardPayment = async (recurring: boolean) => {
    if (!user) {
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
          recurring,
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#181B22] font-sans relative selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Script Oficial do Google Identity Services */}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive" 
        onLoad={initGsi} 
      />

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#1A44C8]/[0.05] via-[#3B6CF0]/[0.02] to-transparent blur-[140px]" />
      </div>

      {/* Header Minimalista & Sofisticado */}
      <header className="relative z-10 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <KaxxaLogo className="w-7 h-7" />
          <KaxxaWordmark className="text-lg tracking-tight" />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="hidden sm:inline">Logado como:</span>
              <strong className="text-[#181B22] max-w-[180px] truncate">{user.email}</strong>
              <button 
                onClick={handleSignOut}
                className="text-[#1A44C8] hover:underline font-bold ml-1"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-[#1A44C8] hover:underline font-bold"
            >
              Fazer Login
            </Link>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* Modal de Confirmação de Sucesso */}
        {isApproved && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-[#059669]/10 text-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#059669]/20 shadow-sm">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-[#181B22] mb-1">Pagamento Aprovado!</h3>
              <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
                Seu plano Kaxxa Finanças foi ativado com sucesso. Preparando o seu painel...
              </p>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="bg-[#1A44C8] h-full animate-[pulse_1s_infinite] w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Card Principal Unificado de Checkout */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden grid grid-cols-1 md:grid-cols-12">

          {/* Coluna Esquerda: Resumo do Plano (Clean, Sofisticado & Direto) */}
          <div className="md:col-span-5 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <Sparkles size={11} />
                <span>Assinatura Mensal • Acesso Total</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-[#181B22] tracking-tight">Kaxxa Finanças</h1>
              
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl sm:text-4xl font-black text-[#181B22] tracking-tight">R$ 39,90</span>
                <span className="text-xs text-[#64748B] font-bold">/ mês</span>
              </div>
              <p className="text-xs text-[#059669] font-bold flex items-center gap-1">
                <Check size={14} className="stroke-[3]" />
                <span>Sem fidelidade • Cancele quando quiser</span>
              </p>

              {/* Benefícios Inclusos */}
              <div className="mt-6 pt-6 border-t border-[#E2E8F0] space-y-3 text-xs text-[#334155]">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span className="leading-tight">Amortização inteligente de dívidas e financiamentos</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span className="leading-tight">Gestão ilimitada de cartões e previsão de faturas</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span className="leading-tight">Controle de contas bancárias e investimentos</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span className="leading-tight">Divisão e cobrança automática de terceiros</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span className="leading-tight">Painel 100% livre de anúncios e suporte prioritário</span>
                </div>
              </div>
            </div>

            {/* Rodapé da Coluna Esquerda: Garantia */}
            <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center gap-2.5 text-[11px] text-[#64748B]">
              <ShieldCheck size={18} className="text-[#059669] shrink-0" />
              <span>Garantia incondicional de 7 dias com devolução integral.</span>
            </div>
          </div>

          {/* Coluna Direita: Checkout Sofisticado com Abas & Animações */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">

            <div>
              {/* Header do Checkout: Status da Conta Conectada */}
              {authLoading ? (
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-5 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 bg-slate-200 rounded" />
                    <div className="w-40 h-2.5 bg-slate-200 rounded" />
                  </div>
                </div>
              ) : user ? (
                /* Card do Usuário Autenticado */
                <div className="flex items-center justify-between p-3.5 bg-[#F0FDF4] border border-emerald-200/80 rounded-2xl mb-5 transition-all shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A44C8] to-[#1538A5] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                      {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'K'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#181B22] truncate">{userName || 'Conta Kaxxa'}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Conectado
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate">{userEmail}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs font-bold text-[#1A44C8] hover:text-[#1538A5] hover:underline shrink-0 ml-2 px-2.5 py-1 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                /* Card de Conexão Necessária */
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl mb-5 transition-all shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#181B22]">Identificação de Acesso</h3>
                      <p className="text-[11px] text-[#64748B] truncate">Conecte sua conta Google para liberar seu plano</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#1A44C8] bg-white px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                    1 Clique
                  </span>
                </div>
              )}

              {/* Seletor Segmentado de Abas Sofisticado */}
              <div className="bg-[#F1F5F9] p-1.5 rounded-2xl flex items-center gap-1.5 border border-[#E2E8F0] shadow-inner mb-6">
                
                {/* Aba 1: PIX */}
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('PIX'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                    paymentMethod === 'PIX'
                      ? 'bg-white text-[#181B22] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] scale-[1.01]'
                      : 'text-[#64748B] hover:text-[#181B22] hover:bg-white/50'
                  }`}
                >
                  <Zap size={14} className={paymentMethod === 'PIX' ? 'text-[#059669]' : 'text-slate-400'} />
                  <span>PIX</span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-[#059669] font-extrabold tracking-tight">
                    Instantâneo
                  </span>
                </button>

                {/* Aba 2: Cartão Recorrente */}
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('CARD_RECURRING'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                    paymentMethod === 'CARD_RECURRING'
                      ? 'bg-white text-[#181B22] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] scale-[1.01]'
                      : 'text-[#64748B] hover:text-[#181B22] hover:bg-white/50'
                  }`}
                >
                  <Sparkles size={14} className={paymentMethod === 'CARD_RECURRING' ? 'text-[#1A44C8]' : 'text-slate-400'} />
                  <span>Recorrente</span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-md bg-[#1A44C8]/10 text-[#1A44C8] font-extrabold tracking-tight">
                    Automático
                  </span>
                </button>

                {/* Aba 3: Cartão Único */}
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('CARD_SINGLE'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                    paymentMethod === 'CARD_SINGLE'
                      ? 'bg-white text-[#181B22] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] scale-[1.01]'
                      : 'text-[#64748B] hover:text-[#181B22] hover:bg-white/50'
                  }`}
                >
                  <CreditCard size={14} className={paymentMethod === 'CARD_SINGLE' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Cartão Único</span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 font-extrabold tracking-tight">
                    30 Dias
                  </span>
                </button>
              </div>

              {/* CONTEÚDO DA ABA SELECIONADA */}

              {/* ABA 1: PIX */}
              {paymentMethod === 'PIX' && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 space-y-4">
                  
                  {pixData ? (
                    /* Tela do QR Code Ativo */
                    <div className="text-center space-y-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Clock size={12} />
                          Expira em {formatTime(countdown)}
                        </span>
                        <span className="text-xs font-bold text-[#181B22]">Total: R$ 39,90</span>
                      </div>

                      {/* Frame do QR Code */}
                      <div className="inline-flex flex-col items-center p-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
                        {pixData.qrCodeBase64 ? (
                          <img 
                            src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                            alt="QR Code PIX"
                            className="w-40 h-40 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-40 h-40 bg-gray-50 rounded-xl flex items-center justify-center">
                            <QrCode size={90} className="text-[#181B22]" />
                          </div>
                        )}

                        {/* Status de Polling em Tempo Real */}
                        <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-[#1A44C8]">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A44C8] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1A44C8]" />
                          </span>
                          <span>Aguardando confirmação do banco...</span>
                        </div>
                      </div>

                      {/* Código Copia e Cola */}
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <input
                          type="text"
                          readOnly
                          value={pixData.qrCode}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#64748B] font-mono select-all focus:outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-4 py-2 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          {copied ? (
                            <>
                              <Check size={14} />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={handleManualCheckStatus}
                          disabled={loading}
                          className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                        >
                          <CheckCircle2 size={15} />
                          <span>Já fiz o pagamento (Liberar Acesso)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPixData(null)}
                          className="w-full py-1.5 text-center text-xs text-[#64748B] hover:text-[#181B22] font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>Gerar novo código</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Tela Pré-Geração do PIX */
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-[#065F46] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Zap size={15} className="text-[#059669]" />
                          <span>Liberação em até 3 segundos</span>
                        </div>
                        <p className="text-[11px] text-[#334155] leading-relaxed">
                          Pague pelo QR Code ou Copia e Cola no aplicativo do seu banco. Sua conta é liberada imediatamente e tem duração de 30 dias sem renovação forçada.
                        </p>
                      </div>

                      {user && (
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2 text-xs">
                          <div className="flex justify-between text-[#64748B]">
                            <span>Plano selecionado:</span>
                            <strong className="text-[#181B22]">Kaxxa Finanças (30 dias)</strong>
                          </div>
                          <div className="flex justify-between text-[#64748B]">
                            <span>Chave de ativação para:</span>
                            <strong className="text-[#181B22]">{userEmail}</strong>
                          </div>
                          <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-baseline font-black text-sm text-[#181B22]">
                            <span>Total a pagar via PIX:</span>
                            <span className="text-[#059669] text-base">R$ 39,90</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* ABA 2: CARTÃO RECORRENTE */}
              {paymentMethod === 'CARD_RECURRING' && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 space-y-4">
                  
                  {/* Mockup do Cartão Virtual Black Luxuoso */}
                  <div className="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1A44C8] shadow-lg border border-slate-700/50 group transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    {/* Efeito de brilho ao passar o mouse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <KaxxaLogo className="w-5 h-5 text-white" />
                        <span className="text-[11px] font-black tracking-wider uppercase text-slate-200">KAXXA BLACK</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Sparkles size={10} />
                        RECORRENTE
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      {/* Chip Metálico */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 border border-amber-300/40 shadow-inner flex flex-col justify-between">
                        <div className="w-full h-0.5 bg-amber-700/30 rounded" />
                        <div className="w-full h-0.5 bg-amber-700/30 rounded" />
                      </div>
                      {/* Ícone Contactless */}
                      <svg className="w-4 h-4 text-slate-400 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      </svg>
                    </div>

                    <div className="font-mono text-sm sm:text-base tracking-[0.2em] text-slate-200 mb-3 select-none">
                      •••• •••• •••• 4029
                    </div>

                    <div className="flex items-end justify-between text-[10px] text-slate-400">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Titular da Assinatura</span>
                        <span className="font-bold text-slate-200 uppercase tracking-wider truncate max-w-[180px] block">
                          {userName || userEmail || 'TITULAR DO CARTÃO'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Cobrança Mensal</span>
                        <span className="font-bold text-white tracking-wider">R$ 39,90/mês</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Recorrência */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-[#1E3A8A] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles size={14} className="text-[#1A44C8]" />
                      <span>Cobrança Automática & Cancelamento Livre</span>
                    </div>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      O valor de <strong>R$ 39,90</strong> é cobrado todo mês diretamente no seu cartão sem você precisar se preocupar com vencimento. Cancele com 1 clique no painel quando quiser.
                    </p>
                  </div>

                </div>
              )}

              {/* ABA 3: CARTÃO ÚNICO */}
              {paymentMethod === 'CARD_SINGLE' && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 space-y-4">
                  
                  {/* Mockup do Cartão Virtual Platinum */}
                  <div className="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] shadow-lg border border-slate-600/50 group transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    {/* Efeito de brilho ao passar o mouse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <KaxxaLogo className="w-5 h-5 text-white" />
                        <span className="text-[11px] font-black tracking-wider uppercase text-slate-200">KAXXA PLATINUM</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <CreditCard size={10} />
                        PAGAMENTO ÚNICO
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      {/* Chip Prata */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-1 border border-slate-300/60 shadow-inner flex flex-col justify-between">
                        <div className="w-full h-0.5 bg-slate-600/30 rounded" />
                        <div className="w-full h-0.5 bg-slate-600/30 rounded" />
                      </div>
                      {/* Ícone Contactless */}
                      <svg className="w-4 h-4 text-slate-400 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      </svg>
                    </div>

                    <div className="font-mono text-sm sm:text-base tracking-[0.2em] text-slate-200 mb-3 select-none">
                      •••• •••• •••• 8812
                    </div>

                    <div className="flex items-end justify-between text-[10px] text-slate-300">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Titular</span>
                        <span className="font-bold text-white uppercase tracking-wider truncate max-w-[180px] block">
                          {userName || userEmail || 'TITULAR DO CARTÃO'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Duração</span>
                        <span className="font-bold text-amber-300 tracking-wider">30 Dias (Sem Renovação)</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Pagamento Único */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-[#92400E] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CreditCard size={14} className="text-[#D97706]" />
                      <span>Cobrança Única no Cartão (Sem Recorrência)</span>
                    </div>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      Cobrança avulsa de <strong>R$ 39,90</strong> no cartão de crédito. Você terá 30 dias de acesso total e não haverá nenhuma cobrança futura no seu cartão.
                    </p>
                  </div>

                </div>
              )}

              {/* Mensagem de Erro Geral */}
              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center animate-in fade-in">
                  {errorMsg}
                </div>
              )}

            </div>

            {/* BOTÕES DE AÇÃO PRINCIPAIS */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-3">
              
              {/* Caso o usuário NÃO esteja autenticado: exibe botão Google 1-clique */}
              {!user && !authLoading ? (
                <div className="space-y-3 text-center">
                  <p className="text-xs text-[#64748B] font-medium">
                    Conecte sua conta em 1 clique para continuar:
                  </p>
                  
                  <div className="flex flex-col items-center justify-center min-h-[44px]">
                    <div id="google-btn-planos" className="flex justify-center w-full min-h-[40px]" />
                    
                    {!gsiReady && (
                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        disabled={loading}
                        className="w-full max-w-sm py-3 px-5 bg-white hover:bg-gray-50 border border-[#E2E8F0] hover:border-[#1A44C8] text-[#181B22] rounded-full font-bold text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-[#1A44C8]/30 border-t-[#1A44C8] rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>Continuar com o Google</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Usuário Logado: Botões de Pagamento Direto */
                <>
                  {paymentMethod === 'PIX' && !pixData && (
                    <button
                      type="button"
                      onClick={handleGeneratePix}
                      disabled={loading}
                      className="w-full py-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock size={15} />
                          <span>GERAR QR CODE PIX • R$ 39,90</span>
                        </>
                      )}
                    </button>
                  )}

                  {paymentMethod === 'CARD_RECURRING' && (
                    <button
                      type="button"
                      onClick={() => handleCardPayment(true)}
                      disabled={loading}
                      className="w-full py-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock size={15} />
                          <span>ASSINAR COM CARTÃO • R$ 39,90/MÊS</span>
                        </>
                      )}
                    </button>
                  )}

                  {paymentMethod === 'CARD_SINGLE' && (
                    <button
                      type="button"
                      onClick={() => handleCardPayment(false)}
                      disabled={loading}
                      className="w-full py-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock size={15} />
                          <span>PAGAR R$ 39,90 NO CARTÃO (ÚNICO)</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Selo de Segurança */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8] pt-1">
                <ShieldCheck size={13} className="text-[#059669]" />
                <span>Ambiente 256-bit processado com segurança via Mercado Pago</span>
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
