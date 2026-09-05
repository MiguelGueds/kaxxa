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
  RotateCcw,
  UserCheck,
  Smartphone,
  RefreshCw
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

  // Billing Mode: 'SINGLE' | 'RECURRING'
  const [billingMode, setBillingMode] = useState<'SINGLE' | 'RECURRING'>('RECURRING');

  // Payment Method: 'PIX' | 'CARD_RECURRING' | 'CARD_SINGLE'
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD_RECURRING' | 'CARD_SINGLE'>('CARD_RECURRING');

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

  // Sincronização e Monitoramento de Sessão
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
        console.error('Erro ao verificar sessão:', err);
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
            width: 280,
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

      {/* Header Minimalista e Compacto */}
      <header className="relative z-10 w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <KaxxaLogo className="w-7 h-7" />
          <KaxxaWordmark className="text-lg tracking-tight" />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="hidden sm:inline">Conectado como:</span>
              <strong className="text-[#181B22] max-w-[170px] truncate">{user.email}</strong>
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

      {/* Modal de Sucesso */}
      {isApproved && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 bg-[#059669]/10 text-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#059669]/20 shadow-sm">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-[#181B22] mb-1">Pagamento Aprovado!</h3>
            <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
              Sua Assinatura Kaxxa foi liberada com sucesso. Redirecionando para seu painel...
            </p>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div className="bg-[#1A44C8] h-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Checkout Compacto */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-9">
        
        {/* Título Compacto */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
            <ShieldCheck size={12} />
            <span>Checkout Seguro • Ativação Imediata</span>
          </div>
          <h1 className="text-2xl sm:text-2xl font-black text-[#181B22] tracking-tight">
            Finalizar Assinatura Kaxxa
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Escolha como prefere pagar para liberar o acesso total ao seu controle financeiro.
          </p>
        </div>

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* COLUNA ESQUERDA (7 cols): O FLUXO DE PAGAMENTO PASSO A PASSO */}
          <div className="lg:col-span-7 space-y-4">

            {/* PASSO 1: SUA CONTA DE ACESSO */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1A44C8] text-white flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide">
                    Sua Conta de Acesso
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-[#64748B]">
                  {user ? 'Identificado' : 'Identificação Rápida'}
                </span>
              </div>

              {authLoading ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl animate-pulse flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="space-y-1 flex-1">
                    <div className="w-20 h-2.5 bg-slate-200 rounded" />
                    <div className="w-40 h-2 bg-slate-200 rounded" />
                  </div>
                </div>
              ) : user ? (
                /* Usuário Conectado */
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                      {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'K'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#181B22] truncate">{userName || 'Conta Kaxxa'}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Pronto
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] truncate">
                        Ativação para: <strong>{userEmail}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs font-bold text-[#1A44C8] hover:text-[#1538A5] hover:underline shrink-0 ml-2 px-2 py-1 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                /* Usuário Não Conectado */
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center shrink-0">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#181B22]">
                        Conecte-se com o Google em 1 clique
                      </h3>
                      <p className="text-[10px] text-[#64748B]">
                        Sua assinatura será vinculada com total segurança sem precisar criar senhas.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-0.5 min-h-[40px]">
                    <div id="google-btn-planos" className="flex justify-center w-full min-h-[38px]" />
                    {!gsiReady && (
                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        disabled={loading}
                        className="w-full max-w-xs py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#E2E8F0] hover:border-[#1A44C8] text-[#181B22] rounded-full font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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
                            <span>Conectar com Google</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PASSO 2: ESCOLHA DA FORMA DE PAGAMENTO */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1A44C8] text-white flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide">
                    Forma de Pagamento
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-[#059669]">
                  R$ 39,90
                </span>
              </div>

              {/* SELETOR DE MODALIDADE: RECORRENTE vs ÚNICO */}
              <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center gap-1 border border-[#E2E8F0] mb-3.5">
                <button
                  type="button"
                  onClick={() => { 
                    setBillingMode('RECURRING'); 
                    setPaymentMethod('CARD_RECURRING'); 
                    setPixData(null);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    billingMode === 'RECURRING'
                      ? 'bg-white text-[#181B22] shadow-sm ring-1 ring-black/[0.04]'
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  <RefreshCw size={12} className={billingMode === 'RECURRING' ? 'text-[#1A44C8]' : 'text-slate-400'} />
                  <span>Pagamento Recorrente</span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-[#1A44C8] font-extrabold">
                    Automático
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { 
                    setBillingMode('SINGLE'); 
                    setPaymentMethod('PIX'); 
                    setPixData(null);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    billingMode === 'SINGLE'
                      ? 'bg-white text-[#181B22] shadow-sm ring-1 ring-black/[0.04]'
                      : 'text-[#64748B] hover:text-[#181B22]'
                  }`}
                >
                  <Clock size={12} className={billingMode === 'SINGLE' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Pagamento Único</span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold">
                    30 Dias
                  </span>
                </button>
              </div>

              {/* CASO 1: PAGAMENTO RECORRENTE (ASSINATURA MENSAL) */}
              {billingMode === 'RECURRING' && (
                <div className="space-y-3 animate-in fade-in-50 duration-200">
                  <div className="p-4 rounded-xl border-2 border-[#1A44C8] bg-blue-50/20 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1A44C8] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-[#181B22]">
                              Cartão de Crédito (Assinatura Recorrente)
                            </h3>
                            <span className="text-[9px] font-extrabold text-[#1A44C8] bg-blue-100 px-1.5 py-0.5 rounded-full">
                              Recomendado
                            </span>
                          </div>
                          <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">
                            R$ 39,90 cobrado todo mês diretamente no seu cartão. Você não precisa se preocupar com vencimento e pode cancelar a qualquer momento no painel.
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-[#1A44C8]">
                            <span>✓ Sem fidelidade</span>
                            <span>✓ Cancele com 1 clique</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-[#181B22]">R$ 39,90</div>
                        <span className="text-[10px] text-[#64748B]">/ mês</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B] text-center">
                    Prefere pagar apenas 1 mês avulso sem renovar?{' '}
                    <button
                      type="button"
                      onClick={() => { setBillingMode('SINGLE'); setPaymentMethod('PIX'); }}
                      className="text-[#1A44C8] font-bold hover:underline"
                    >
                      Ir para Pagamento Único
                    </button>
                  </p>
                </div>
              )}

              {/* CASO 2: PAGAMENTO ÚNICO (PIX OU CARTÃO) */}
              {billingMode === 'SINGLE' && (
                <div className="space-y-2.5 animate-in fade-in-50 duration-200">
                  
                  {/* OPÇÃO PIX */}
                  <div 
                    onClick={() => { setPaymentMethod('PIX'); setPixData(null); setErrorMsg(''); }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'PIX'
                        ? 'border-[#059669] bg-emerald-50/20 shadow-sm'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          paymentMethod === 'PIX' ? 'bg-[#059669] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Zap size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#181B22]">PIX Instantâneo</h4>
                            <span className="text-[9px] font-extrabold text-[#059669] bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              Liberação em 3s
                            </span>
                          </div>
                          <p className="text-[10px] text-[#64748B]">
                            QR Code ou Copia-e-Cola • 30 dias de acesso sem renovação
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#181B22]">R$ 39,90</span>
                        <span className="text-[9px] text-[#64748B] block">avulso</span>
                      </div>
                    </div>
                  </div>

                  {/* OPÇÃO CARTÃO ÚNICO */}
                  <div 
                    onClick={() => { setPaymentMethod('CARD_SINGLE'); setPixData(null); setErrorMsg(''); }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'CARD_SINGLE'
                        ? 'border-amber-600 bg-amber-50/20 shadow-sm'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          paymentMethod === 'CARD_SINGLE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <CreditCard size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#181B22]">Cartão de Crédito</h4>
                            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                              Pagamento Único
                            </span>
                          </div>
                          <p className="text-[10px] text-[#64748B]">
                            Cobrança avulsa de 30 dias • Nenhuma cobrança futura
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#181B22]">R$ 39,90</span>
                        <span className="text-[9px] text-[#64748B] block">avulso</span>
                      </div>
                    </div>

                    {/* OPÇÃO DE ATIVAR RECORRÊNCIA AO SELECIONAR CARTÃO NO PAGAMENTO ÚNICO */}
                    {paymentMethod === 'CARD_SINGLE' && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#181B22]">
                          <Sparkles size={13} className="text-[#1A44C8]" />
                          <span className="font-semibold">Deseja ativar a renovação automática todo mês?</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBillingMode('RECURRING');
                            setPaymentMethod('CARD_RECURRING');
                          }}
                          className="px-2.5 py-1 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-lg text-[10px] font-bold shrink-0 transition-all shadow-sm"
                        >
                          Ativar Recorrência
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* PASSO 3: CONCLUSÃO E PAGAMENTO */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm transition-all space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1A44C8] text-white flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide">
                    Confirmar e Pagar
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-[#64748B]">
                  Processamento Mercado Pago
                </span>
              </div>

              {/* Erro */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center animate-in fade-in">
                  {errorMsg}
                </div>
              )}

              {/* FLUXO PIX */}
              {paymentMethod === 'PIX' && (
                <div>
                  {pixData ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-center space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-xs font-bold">
                        <span className="text-[#059669] flex items-center gap-1">
                          <Clock size={13} />
                          Expira em {formatTime(countdown)}
                        </span>
                        <span>Total: R$ 39,90</span>
                      </div>

                      <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl inline-block shadow-sm">
                        {pixData.qrCodeBase64 ? (
                          <img 
                            src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                            alt="QR Code PIX"
                            className="w-40 h-40 object-contain rounded-lg mx-auto"
                          />
                        ) : (
                          <div className="w-40 h-40 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
                            <QrCode size={90} className="text-[#181B22]" />
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-2 mt-2.5 text-[11px] font-bold text-[#1A44C8]">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A44C8] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1A44C8]" />
                          </span>
                          <span>Aguardando confirmação do banco...</span>
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
                            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-xs text-[#64748B] font-mono select-all focus:outline-none truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="px-3.5 py-2 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                          >
                            {copied ? (
                              <>
                                <Check size={13} />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
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
                          className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                        >
                          <CheckCircle2 size={15} />
                          <span>Já fiz o pagamento no meu banco (Liberar Acesso)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPixData(null)}
                          className="w-full py-0.5 text-center text-xs text-[#64748B] hover:text-[#181B22] font-semibold"
                        >
                          Trocar forma de pagamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#475569] space-y-1.5">
                        <p className="font-bold text-[#181B22] flex items-center gap-1.5">
                          <Smartphone size={14} className="text-[#059669]" />
                          <span>Como pagar com PIX:</span>
                        </p>
                        <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-[#475569]">
                          <li>Clique em &quot;Gerar QR Code PIX&quot; abaixo.</li>
                          <li>Abra o app do seu banco e escaneie o código ou copie o código.</li>
                          <li>Seu acesso será liberado em segundos após o pagamento.</li>
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={handleGeneratePix}
                        disabled={loading}
                        className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Zap size={14} />
                            <span>GERAR QR CODE PIX • R$ 39,90</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FLUXO CARTÃO RECORRENTE */}
              {paymentMethod === 'CARD_RECURRING' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#1E3A8A] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lock size={13} className="text-[#1A44C8]" />
                      <span>Pagamento Seguro pelo Mercado Pago</span>
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      Ao clicar abaixo, você será direcionado à página segura do Mercado Pago para digitar os dados do <strong>seu cartão de crédito</strong>. Cobrança de <strong>R$ 39,90/mês</strong> com cancelamento livre a qualquer momento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCardPayment(true)}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>ASSINAR COM MEU CARTÃO (R$ 39,90/MÊS)</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* FLUXO CARTÃO ÚNICO */}
              {paymentMethod === 'CARD_SINGLE' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-[#92400E] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-amber-700" />
                      <span>Cobrança Única Sem Nenhuma Renovação</span>
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      Ao clicar abaixo, você será direcionado à tela oficial do Mercado Pago para digitar com segurança os dados do <strong>seu cartão</strong> para uma cobrança avulsa de <strong>R$ 39,90</strong> (30 dias de acesso).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCardPayment(false)}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>PAGAR R$ 39,90 NO MEU CARTÃO (PAGAMENTO ÚNICO)</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8]">
                <ShieldCheck size={12} className="text-[#059669]" />
                <span>O Kaxxa não armazena dados de cartão. Processamento criptografado pelo Mercado Pago.</span>
              </div>

            </div>

          </div>

          {/* COLUNA DIREITA (5 cols): RESUMO DA ASSINATURA KAXXA & GARANTIA DE 7 DIAS */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">

            {/* Card de Resumo do Pedido */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
              <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide pb-3 border-b border-[#F1F5F9]">
                Resumo do Pedido
              </h2>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-[#181B22]">Assinatura Kaxxa</h3>
                    <p className="text-[11px] text-[#64748B]">Acesso Completo a Todos os Módulos</p>
                  </div>
                  <span className="font-bold text-[#181B22]">R$ 39,90</span>
                </div>

                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Taxa de Ativação</span>
                  <span className="font-bold text-[#059669]">GRÁTIS (R$ 0,00)</span>
                </div>

                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Cancelamento</span>
                  <span className="font-bold text-[#059669]">Livre sem multas</span>
                </div>

                <div className="pt-2.5 border-t border-[#E2E8F0] flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black text-[#181B22] block">Total a Pagar Hoje:</span>
                    <span className="text-[10px] text-[#64748B]">
                      {billingMode === 'RECURRING' ? 'Cobrado mensalmente' : 'Cobrança avulsa por 30 dias'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#181B22] tracking-tight">R$ 39,90</span>
                  </div>
                </div>
              </div>

              {/* Benefícios Inclusos */}
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2 text-xs text-[#334155]">
                <span className="text-[10px] font-extrabold text-[#181B22] uppercase tracking-wider block mb-0.5">
                  O que você desbloqueia:
                </span>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Amortização inteligente de dívidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Gestão ilimitada de cartões & previsão de faturas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Divisão e cobrança automática de terceiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Controle de contas bancárias e investimentos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Painel limpo, sem anúncios nem rastreadores</span>
                </div>
              </div>
            </div>

            {/* Card Garantia de 7 dias */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                <ShieldCheck size={17} />
              </div>
              <div className="text-xs">
                <h3 className="font-extrabold text-[#181B22]">Garantia de 7 dias</h3>
                <p className="text-[#64748B] text-[11px] mt-0.5 leading-relaxed">
                  Teste o Kaxxa sem nenhum risco. Se por qualquer motivo você decidir que a plataforma não é para você, devolvemos 100% do seu dinheiro.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
