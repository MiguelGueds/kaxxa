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
  Lock, 
  Clock, 
  Sparkles,
  Gift,
  KeyRound,
  UserCheck
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

  // Forma de Pagamento Direta: 'PIX' | 'CARD'
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  // Se Cartão: Ativar renovação automática mensal (recorrente) ou pagamento avulso
  const [cardRecurring, setCardRecurring] = useState(true);

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

  // VIP Code State
  const [showVipInput, setShowVipInput] = useState(false);
  const [vipCode, setVipCode] = useState('');
  const [vipLoading, setVipLoading] = useState(false);
  const [vipSuccess, setVipSuccess] = useState('');
  const [vipError, setVipError] = useState('');

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

  const handleCardPayment = async () => {
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
          recurring: cardRecurring,
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

  // Validador de Código VIP/Teste
  const handleVipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setVipError('Faça login com o Google acima antes de validar seu convite.');
      return;
    }
    if (!vipCode.trim()) return;

    setVipLoading(true);
    setVipError('');
    setVipSuccess('');

    try {
      const res = await fetch('/api/checkout/vip-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: vipCode.trim(),
          userId: user.id,
          email: user.email,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código VIP inválido.');
      }

      setVipSuccess(data.message || `Acesso de teste de ${data.days} dias liberado!`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1600);
    } catch (err: any) {
      setVipError(err.message || 'Erro ao validar código.');
    } finally {
      setVipLoading(false);
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
      <header className="relative z-10 w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <KaxxaLogo className="w-7 h-7" />
          <KaxxaWordmark className="text-lg tracking-tight" />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="hidden sm:inline">Conectado como:</span>
              <strong className="text-[#181B22] max-w-[190px] truncate">{user.email}</strong>
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

      {/* Conteúdo Principal Ultra Compacto */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-8">
        
        {/* Título Compacto */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <ShieldCheck size={12} />
            <span>Checkout Oficial • Liberação Imediata</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#181B22] tracking-tight">
            Assinatura Kaxxa
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Acesso completo a todas as ferramentas financeiras por R$ 39,90.
          </p>
        </div>

        {/* Notificação Compacta de Login se não estiver logado */}
        {!user && !authLoading && (
          <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#1E3A8A]">
              <UserCheck size={16} className="text-[#1A44C8] shrink-0" />
              <span>Conecte sua conta para vincular o pagamento à sua assinatura:</span>
            </div>
            <div id="google-btn-planos" className="shrink-0 flex justify-center" />
          </div>
        )}

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* COLUNA ESQUERDA (7 cols): ESCOLHA DIRETA PIX vs CARTÃO */}
          <div className="lg:col-span-7 space-y-4">

            {/* SELEÇÃO DIRETA ENTRE PIX E CARTÃO */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
              
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide">
                  Escolha a Forma de Pagamento
                </h2>
                <span className="text-xs font-black text-[#059669]">
                  R$ 39,90
                </span>
              </div>

              {/* BOTOES DE ESCOLHA DIRETA */}
              <div className="grid grid-cols-2 gap-3">
                {/* BOTÃO PIX */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('PIX');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                    paymentMethod === 'PIX'
                      ? 'border-[#059669] bg-emerald-50/25 shadow-sm ring-2 ring-[#059669]/10'
                      : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      paymentMethod === 'PIX' ? 'bg-[#059669] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Zap size={15} />
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#059669]">
                      Instantâneo
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-[#181B22]">PIX</h3>
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
                      ? 'border-[#1A44C8] bg-blue-50/25 shadow-sm ring-2 ring-[#1A44C8]/10'
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

              {/* OPÇÃO DE ATIVAR RECORRÊNCIA (APARECE DIRETAMENTE AO SELECIONAR CARTÃO) */}
              {paymentMethod === 'CARD' && (
                <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardRecurring}
                      onChange={(e) => setCardRecurring(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-[#1A44C8] rounded border-gray-300 focus:ring-[#1A44C8] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#181B22]">
                          Ativar renovação automática mensal
                        </span>
                        <span className="text-[10px] font-black text-[#1A44C8]">
                          R$ 39,90/mês
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">
                        {cardRecurring 
                          ? 'Seu plano renova todo mês sem você se preocupar com vencimento. Cancele com 1 clique a qualquer momento no seu perfil.'
                          : 'Modo Avulso: Cobrança única de 30 dias. Nenhuma cobrança futura será realizada no seu cartão.'}
                      </p>
                    </div>
                  </label>
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
                          <Zap size={14} />
                          <span>PAGAR COM PIX • R$ 39,90</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* FLUXO CARTÃO SELECIONADO */}
              {paymentMethod === 'CARD' && (
                <div className="pt-1">
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
                          {cardRecurring ? 'ASSINAR COM CARTÃO (R$ 39,90/MÊS)' : 'PAGAR R$ 39,90 NO CARTÃO (30 DIAS)'}
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

              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8]">
                <ShieldCheck size={12} className="text-[#059669]" />
                <span>Dados 100% protegidos por criptografia Mercado Pago.</span>
              </div>

            </div>

            {/* SEÇÃO DISCRETA: CÓDIGO VIP / TESTE INTERNO */}
            <div className="text-center pt-1">
              {!showVipInput ? (
                <button
                  type="button"
                  onClick={() => setShowVipInput(true)}
                  className="text-[11px] text-[#64748B] hover:text-[#1A44C8] font-medium transition-colors inline-flex items-center gap-1"
                >
                  <KeyRound size={11} />
                  <span>Possui um código de acesso ou convite VIP?</span>
                </button>
              ) : (
                <form onSubmit={handleVipSubmit} className="max-w-md mx-auto p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
                      <Gift size={13} className="text-[#1A44C8]" />
                      Ativar Convite VIP / Teste
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVipInput(false)}
                      className="text-[10px] text-[#64748B] hover:text-[#181B22]"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: AMIGOKAXA"
                      value={vipCode}
                      onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                      className="flex-1 uppercase font-mono text-xs px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1A44C8]"
                    />
                    <button
                      type="submit"
                      disabled={vipLoading || !vipCode.trim()}
                      className="px-3.5 py-1.5 bg-[#181B22] hover:bg-black text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {vipLoading ? 'Validando...' : 'Ativar'}
                    </button>
                  </div>

                  {vipSuccess && (
                    <p className="text-[11px] text-[#059669] font-bold">{vipSuccess}</p>
                  )}
                  {vipError && (
                    <p className="text-[11px] text-rose-600 font-bold">{vipError}</p>
                  )}
                </form>
              )}
            </div>

          </div>

          {/* COLUNA DIREITA (5 cols): RESUMO E GARANTIA DE 7 DIAS */}
          <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-4">

            {/* Card de Resumo do Pedido */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
              <h2 className="text-xs font-extrabold text-[#181B22] uppercase tracking-wide pb-2.5 border-b border-[#F1F5F9]">
                Resumo da Assinatura
              </h2>

              <div className="py-2.5 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-[#181B22]">Assinatura Kaxxa</h3>
                    <p className="text-[10px] text-[#64748B]">
                      {paymentMethod === 'CARD' && cardRecurring ? 'Cobrança mensal recorrente' : '30 dias de acesso'}
                    </p>
                  </div>
                  <span className="font-bold text-[#181B22]">R$ 39,90</span>
                </div>

                <div className="flex justify-between items-center text-[#64748B] text-[11px]">
                  <span>Cancelamento</span>
                  <span className="font-bold text-[#059669]">Livre sem multas</span>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-baseline">
                  <span className="text-xs font-black text-[#181B22]">Total Hoje:</span>
                  <span className="text-lg font-black text-[#181B22]">R$ 39,90</span>
                </div>
              </div>

              {/* Benefícios Inclusos */}
              <div className="mt-2.5 pt-2.5 border-t border-[#E2E8F0] space-y-1.5 text-xs text-[#334155]">
                <span className="text-[10px] font-extrabold text-[#181B22] uppercase tracking-wider block mb-1">
                  Incluso no seu plano:
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={12} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Amortização inteligente de dívidas</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={12} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Gestão de cartões & previsão de faturas</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={12} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Divisão e cobrança de terceiros</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={12} className="text-[#059669] shrink-0 stroke-[3]" />
                  <span>Controle de contas bancárias e metas</span>
                </div>
              </div>
            </div>

            {/* Card Garantia de 7 dias */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-start gap-2.5 shadow-sm">
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
