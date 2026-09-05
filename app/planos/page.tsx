'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight
} from 'lucide-react';
import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';
import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { subscriptionService } from '@/lib/services/subscription';

export default function PlanosCheckoutPage() {
  const router = useRouter();

  // User state
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Payment Method
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

  useEffect(() => {
    async function initUser() {
      const authUser = await getAuthenticatedUser();
      if (authUser) {
        setUser(authUser);
        setUserEmail(authUser.email || '');
        setUserName(authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '');

        // Se já tem assinatura ativa, redireciona para o dashboard
        const access = await subscriptionService.isAccessGranted();
        if (access.granted) {
          router.push('/dashboard');
        }
      }
    }
    initUser();
  }, [router]);

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
      // No modo demonstração/sandbox permite forçar aprovação para testes
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

  const planPrice = '39,90';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#181B22] font-sans relative selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#1A44C8]/[0.04] blur-[120px]" />
      </div>

      {/* Header Minimalista */}
      <header className="relative z-10 w-full border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <KaxxaLogo className="w-7 h-7" />
          <KaxxaWordmark className="text-lg tracking-tight" />
        </div>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="hidden sm:inline">Logado como:</span>
              <strong className="text-[#181B22]">{user.email}</strong>
              <button 
                onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
                className="text-[#1A44C8] hover:underline font-semibold ml-1"
              >
                Trocar
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
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12">

        {/* Modal de Confirmação de Sucesso */}
        {isApproved && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-14 h-14 bg-[#059669]/10 text-[#059669] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#059669]/30">
                <CheckCircle2 size={32} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold text-[#181B22] mb-1">Pagamento Confirmado!</h3>
              <p className="text-xs text-[#64748B] mb-5">
                Acesso liberado. Redirecionando para o seu painel...
              </p>
              <div className="w-full bg-[#F1F3F7] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#1A44C8] h-full animate-[pulse_1s_infinite] w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Card Unificado de Checkout */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">

          {/* Coluna Esquerda: Resumo do Plano (Clean & Direto) */}
          <div className="md:col-span-5 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-[#E5E7EB] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] text-[10px] font-extrabold uppercase tracking-wider mb-3">
                Assinatura Mensal
              </span>
              <h1 className="text-2xl font-black text-[#181B22] tracking-tight">Kaxxa Finanças</h1>
              
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl sm:text-4xl font-black text-[#181B22] tracking-tight">R$ 39,90</span>
                <span className="text-xs text-[#64748B] font-semibold">/ mês</span>
              </div>
              <p className="text-xs text-[#059669] font-bold">Sem fidelidade • Cancele quando quiser</p>

              {/* Benefícios Rápidos */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-2.5 text-xs text-[#334155]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#059669] shrink-0" />
                  <span>Amortização inteligente de dívidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#059669] shrink-0" />
                  <span>Gestão de cartões & faturas ilimitadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#059669] shrink-0" />
                  <span>Controle de contas & investimentos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#059669] shrink-0" />
                  <span>Divisão e cobrança de terceiros</span>
                </div>
              </div>
            </div>

            {/* Rodapé da Coluna Esquerda: Garantia */}
            <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-center gap-2.5 text-[11px] text-[#64748B]">
              <ShieldCheck size={18} className="text-[#059669] shrink-0" />
              <span>Garantia de 7 dias com devolução integral.</span>
            </div>
          </div>

          {/* Coluna Direita: Pagamento / QR Code */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center">

            {pixData ? (
              /* Visualização do QR Code PIX (Simples e Direta) */
              <div className="text-center space-y-5">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] bg-[#059669]/10 px-2.5 py-0.5 rounded-full mb-2">
                    <Clock size={12} />
                    PIX ativo • Expira em {formatTime(countdown)}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#181B22]">Pague via PIX</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Escaneie o QR Code ou copie o código abaixo</p>
                </div>

                {/* Container do QR Code */}
                <div className="inline-flex flex-col items-center p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
                  {pixData.qrCodeBase64 ? (
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                      alt="QR Code PIX Mercado Pago"
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-gray-50 rounded-xl flex items-center justify-center">
                      <QrCode size={100} className="text-[#181B22]" />
                    </div>
                  )}

                  {/* Pulsing listening status */}
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#1A44C8]">
                    <span className="w-2 h-2 rounded-full bg-[#1A44C8] animate-ping" />
                    <span>Aguardando confirmação do banco...</span>
                  </div>
                </div>

                {/* Código Copia e Cola */}
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    readOnly
                    value={pixData.qrCode}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#64748B] font-mono select-all focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="px-4 py-2 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
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

                {/* Botões de Ação */}
                <div className="space-y-2 max-w-md mx-auto pt-2">
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
                    className="w-full py-1.5 text-center text-xs text-[#64748B] hover:text-[#181B22] font-semibold transition-colors"
                  >
                    Alterar dados
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário Inicial Limpo */
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-[#181B22]">Finalizar Pagamento</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Escolha como prefere assinar o Kaxxa Finanças (R$ 39,90/mês).</p>
                </div>

                {/* Seletor de Forma de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'PIX'
                        ? 'border-[#1A44C8] bg-[#1A44C8]/[0.03] shadow-sm'
                        : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <QrCode size={15} className={paymentMethod === 'PIX' ? 'text-[#059669]' : 'text-gray-400'} />
                        <span className="text-xs font-bold text-[#181B22]">PIX</span>
                      </div>
                      <span className="text-[9px] font-bold text-[#059669] bg-[#059669]/10 px-1.5 py-0.5 rounded-full">
                        Instantâneo
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-tight">QR Code avulso (30 dias)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD_RECURRING')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'CARD_RECURRING'
                        ? 'border-[#1A44C8] bg-[#1A44C8]/[0.03] shadow-sm'
                        : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={15} className={paymentMethod === 'CARD_RECURRING' ? 'text-[#1A44C8]' : 'text-gray-400'} />
                        <span className="text-xs font-bold text-[#181B22]">Cartão</span>
                      </div>
                      <span className="text-[9px] font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-1.5 py-0.5 rounded-full">
                        Recorrente
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-tight">Renovação automática mensal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD_SINGLE')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'CARD_SINGLE'
                        ? 'border-[#1A44C8] bg-[#1A44C8]/[0.03] shadow-sm'
                        : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={15} className={paymentMethod === 'CARD_SINGLE' ? 'text-amber-600' : 'text-gray-400'} />
                        <span className="text-xs font-bold text-[#181B22]">Cartão</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        Único
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-tight">Pague 1 mês sem renovar</p>
                  </button>
                </div>

                {/* Campos do Pagante */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#64748B] block mb-1">Seu Nome</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#64748B] block mb-1">Seu E-mail</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="seu-email@exemplo.com"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                    />
                  </div>
                </div>

                {paymentMethod === 'CARD_RECURRING' && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-[#1E3A8A] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#1A44C8]" />
                      <span>Cobrança Automática Mensal</span>
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      O valor de <strong>R$ 39,90</strong> será cobrado todo mês diretamente no seu cartão, sem você se preocupar com vencimento. Cancele quando quiser a qualquer momento.
                    </p>
                  </div>
                )}

                {paymentMethod === 'CARD_SINGLE' && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-[#92400E] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CreditCard size={14} className="text-[#D97706]" />
                      <span>Pagamento Único no Cartão (30 Dias)</span>
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      Cobrança única de <strong>R$ 39,90</strong> no cartão de crédito. Você terá 30 dias de acesso completo sem nenhuma renovação automática.
                    </p>
                  </div>
                )}

                {paymentMethod === 'PIX' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-[#065F46] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Zap size={14} className="text-[#059669]" />
                      <span>Liberação em 3 segundos</span>
                    </p>
                    <p className="text-[11px] text-[#334155] leading-relaxed">
                      Gere o código PIX e pague no app do seu banco para o seu acesso ser liberado imediatamente (30 dias de acesso).
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Botão Principal */}
                {paymentMethod === 'PIX' && (
                  <button
                    type="button"
                    onClick={handleGeneratePix}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>GERAR PIX • R$ 39,90</span>
                      </>
                    )}
                  </button>
                )}

                {paymentMethod === 'CARD_RECURRING' && (
                  <button
                    type="button"
                    onClick={() => handleCardPayment(true)}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
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
                    className="w-full py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>PAGAR NO CARTÃO • R$ 39,90 (PAGAMENTO ÚNICO)</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8]">
                  <ShieldCheck size={12} className="text-[#059669]" />
                  <span>Ambiente seguro processado via Mercado Pago</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}

