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
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');

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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const planPrice = '39,90';

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#181B22] font-sans relative selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#1A44C8]/[0.05] blur-[140px]" />
      </div>

      {/* Header Superior */}
      <header className="relative z-10 w-full border-b border-[#E5E7EB] bg-[#FFFFFF]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KaxxaLogo className="w-8 h-8" />
          <KaxxaWordmark className="text-xl tracking-tight" />
        </div>

        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-[#64748B]">
              <span>Logado como: <strong className="text-[#181B22]">{user.email}</strong></span>
              <button 
                onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
                className="text-[#1A44C8] hover:underline font-semibold ml-1"
              >
                Trocar conta
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-[#1A44C8] hover:underline font-bold"
            >
              Já possui conta? Fazer Login
            </Link>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        
        {/* Título & Proposta de Valor */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 text-[#1A44C8] text-[11px] font-extrabold uppercase tracking-wider mb-3">
            <Sparkles size={12} />
            Acesso Imediato ao Kaxxa
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181B22] tracking-tight mb-3">
            Assuma o controle definitivo do seu dinheiro
          </h1>
          <p className="text-[#64748B] text-sm">
            Amortização acelerada de dívidas, controle de faturas, investimentos e extratos inteligentes em uma única plataforma.
          </p>
        </div>

        {/* Modal de Confirmação de Sucesso */}
        {isApproved && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-[#059669]/10 text-[#059669] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#059669]/30">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#181B22] mb-2">Pagamento Aprovado! 🎉</h3>
              <p className="text-sm text-[#64748B] mb-6">
                Sua assinatura do Kaxxa foi confirmada com sucesso. Redirecionando para o seu novo painel financeiro...
              </p>
              <div className="w-full bg-[#F1F3F7] h-2 rounded-full overflow-hidden">
                <div className="bg-[#1A44C8] h-full animate-[pulse_1s_infinite] w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Se já gerou o PIX: Exibe tela focada no pagamento */}
        {pixData ? (
          <div className="max-w-xl mx-auto bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-[#059669]/10 px-3 py-1 rounded-full mb-2">
                <Clock size={13} />
                PIX Gerado • Expira em {formatTime(countdown)}
              </span>
              <h2 className="text-2xl font-extrabold text-[#181B22] tracking-tight">
                Pague via PIX para liberar agora
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Abra o aplicativo do seu banco, escolha <strong className="text-[#181B22]">Pagar com PIX</strong> e aponte a câmera para o QR Code ou copie o código.
              </p>
            </div>

            {/* Valor */}
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 text-center mb-6">
              <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider block">Valor a pagar:</span>
              <div className="text-3xl font-extrabold text-[#1A44C8] tracking-tight">
                R$ {planPrice}
              </div>
              <span className="text-[10px] text-[#059669] font-bold">Assinatura Mensal • Sem fidelidade</span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl mb-6">
              {pixData.qrCodeBase64 ? (
                <img 
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                  alt="QR Code PIX Mercado Pago"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                /* Mock visual elegante para simulação ou fallback */
                <div className="w-52 h-52 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 relative">
                  <QrCode size={120} className="text-[#181B22] mb-2" />
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">QR Code PIX</span>
                </div>
              )}

              {/* Status de escuta em tempo real */}
              <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-[#1A44C8]">
                <span className="w-2 h-2 rounded-full bg-[#1A44C8] animate-ping" />
                <span>Aguardando confirmação do banco em tempo real...</span>
              </div>
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-2 mb-6">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                PIX Copia e Cola
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qrCode}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#64748B] font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-4 py-2 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
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
            </div>

            {/* Botão de Verificação Manual & Trocar Plano */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleManualCheckStatus}
                disabled={loading}
                className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 size={16} />
                <span>Já fiz o pagamento (Liberar Acesso)</span>
              </button>

              <button
                type="button"
                onClick={() => setPixData(null)}
                className="w-full py-2 text-center text-xs text-[#64748B] hover:text-[#181B22] font-semibold transition-colors"
              >
                Alterar forma de pagamento
              </button>
            </div>
          </div>
        ) : (
          /* Grid de Planos e Seleção */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Esquerda: Apresentação do Plano Único */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-[#181B22]">1. Seu plano de acesso</h2>

              {/* Card Plano Único Mensal */}
              <div className="relative bg-[#FFFFFF] border-2 border-[#1A44C8] rounded-3xl p-6 sm:p-7 shadow-md ring-4 ring-[#1A44C8]/10 overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#1A44C8] text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles size={11} />
                  Acesso Completo • Sem Fidelidade
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-bold text-[#1A44C8] uppercase tracking-wider block mb-1">
                      Assinatura Mensal Kaxxa
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#181B22]">Plano Único Kaxxa</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Controle financeiro avançado, quitação de dívidas e investimentos em um só lugar.
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="flex items-baseline sm:justify-end gap-1">
                      <span className="text-xs text-[#64748B] font-bold">R$</span>
                      <span className="text-3xl font-black text-[#181B22] tracking-tight">39,90</span>
                      <span className="text-xs text-[#64748B] font-semibold">/ mês</span>
                    </div>
                    <span className="inline-block text-[11px] text-[#059669] font-bold mt-0.5 bg-[#059669]/10 px-2 py-0.5 rounded-md">
                      Cancele quando quiser
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#E5E7EB] space-y-3">
                  <h4 className="text-xs font-bold text-[#181B22] uppercase tracking-wider">
                    Tudo o que está incluído no seu acesso:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#181B22]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Simulador e amortização de dívidas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Gestão e projeção de faturas de cartões</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Controle de contas bancárias e extrato</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Acompanhamento de investimentos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Divisão de contas & cobrança de terceiros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                        <Check size={13} />
                      </div>
                      <span>Relatórios automáticos e sem anúncios</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Garantia */}
              <div className="flex items-center gap-3 p-4 bg-white border border-[#E5E7EB] rounded-2xl text-xs text-[#64748B]">
                <ShieldCheck size={26} className="text-[#059669] shrink-0" />
                <span>
                  <strong className="text-[#181B22]">Garantia incondicional de 7 dias:</strong> Se por qualquer motivo você não gostar da plataforma, você pode cancelar a qualquer momento sem pegadinhas ou fidelidade.
                </span>
              </div>
            </div>

            {/* Coluna Direita: Método de Pagamento & Checkout */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-lg font-bold text-[#181B22]">2. Forma de pagamento</h2>

              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-6 shadow-md space-y-6">
                
                {/* Abas PIX vs Cartão */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F3F7] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'PIX'
                        ? 'bg-white text-[#181B22] shadow-sm'
                        : 'text-[#64748B] hover:text-[#181B22]'
                    }`}
                  >
                    <QrCode size={14} className="text-[#059669]" />
                    <span>PIX (Instantâneo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'bg-white text-[#181B22] shadow-sm'
                        : 'text-[#64748B] hover:text-[#181B22]'
                    }`}
                  >
                    <CreditCard size={14} className="text-[#1A44C8]" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>

                {/* Dados do Pagante */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#64748B] block mb-1">Seu Nome</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#64748B] block mb-1">Seu E-mail</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                    />
                  </div>
                </div>

                {/* Se Cartão selecionado */}
                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    <p className="font-bold flex items-center gap-1 mb-1">
                      <AlertCircle size={14} />
                      Recomendamos pagar via PIX
                    </p>
                    O PIX possui aprovação instantânea em 3 segundos e sem consumir o limite do seu cartão. Você pode alternar para a aba PIX acima.
                  </div>
                )}

                {/* Resumo */}
                <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B]">Plano Selecionado:</span>
                    <strong className="text-[#181B22]">Assinatura Mensal Kaxxa</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B]">Cobrança:</span>
                    <span className="text-[#059669] font-bold">Sem fidelidade (Cancele quando quiser)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B]">Total hoje:</span>
                    <strong className="text-xl font-extrabold text-[#1A44C8]">R$ {planPrice}</strong>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Botão Final de Checkout */}
                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={loading}
                  className="w-full py-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>{paymentMethod === 'PIX' ? 'GERAR PIX & LIBERAR ACESSO' : 'PAGAR & LIBERAR ACESSO'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#94A3B8]">
                  <ShieldCheck size={13} className="text-[#059669]" />
                  <span>Ambiente seguro processado via Mercado Pago</span>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

