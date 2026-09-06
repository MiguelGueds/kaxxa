'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { KaxxaLogo, KaxxaKLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gsiReady, setGsiReady] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'GOOGLE' | 'EMAIL'>('GOOGLE');
  const [isSignUp, setIsSignUp] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1013913072699-93aluj2vckav760pp05t7pcriipk1n5b.apps.googleusercontent.com';

  // Redireciona caso já esteja autenticado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const pendingCoupon = typeof window !== 'undefined' ? localStorage.getItem('kaxxa_pending_coupon') : null;
        if (pendingCoupon) {
          router.push(`/planos?cupom=${encodeURIComponent(pendingCoupon)}`);
        } else {
          router.push('/dashboard');
        }
      }
    });
  }, [router]);

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      const pendingCoupon = typeof window !== 'undefined' ? localStorage.getItem('kaxxa_pending_coupon') : null;
      if (pendingCoupon) {
        router.push(`/planos?cupom=${encodeURIComponent(pendingCoupon)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Google ID Token error:', err);
      if (err.message?.includes('disabled_client') || err.error === 'disabled_client' || err.message?.includes('401')) {
        setErrorMsg('O Cliente OAuth do Google foi desativado no Google Cloud Console. Reative o Client ID no Google Cloud Console ou Supabase.');
      } else {
        setErrorMsg(err.message || 'Erro ao autenticar com o Google.');
      }
      setLoading(false);
    }
  }, [router]);

  const initGsi = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 340,
            logo_alignment: 'left',
          });
          setGsiReady(true);
          return true;
        }
      } catch (e) {
        console.error('Error initializing GSI:', e);
      }
    }
    return false;
  }, [clientId, handleCredentialResponse]);

  useEffect(() => {
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
  }, [initGsi]);

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
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err.message?.includes('provider is not enabled') || err.message?.includes('Unsupported provider') || err.error_code === 'validation_failed') {
        setErrorMsg('O login com Google precisa ser ativado no painel do Supabase (Authentication > Providers > Google).');
      } else {
        setErrorMsg(err.message || 'Erro ao conectar com o Google.');
      }
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          const pendingCoupon = typeof window !== 'undefined' ? localStorage.getItem('kaxxa_pending_coupon') : null;
          if (pendingCoupon) {
            router.push(`/planos?cupom=${encodeURIComponent(pendingCoupon)}`);
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session?.user) {
          const pendingCoupon = typeof window !== 'undefined' ? localStorage.getItem('kaxxa_pending_coupon') : null;
          if (pendingCoupon) {
            router.push(`/planos?cupom=${encodeURIComponent(pendingCoupon)}`);
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.message?.includes('Email signups are disabled')) {
        setErrorMsg('O cadastro por e-mail está desativado no Supabase. Ative em Authentication > Providers > Email no painel do Supabase.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Credenciais inválidas. Verifique o e-mail e a senha digitados.');
      } else {
        setErrorMsg(err.message || 'Erro ao autenticar com e-mail.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#181B22] relative flex items-center justify-center font-sans overflow-hidden selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Script Oficial do Google Identity Services */}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive" 
        onLoad={initGsi} 
      />

      {/* Grid Tecnológico Pontilhado Sutil de Alta Definição */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Orbes de Luz Vivas com Animação Fluida e Contraste Sofisticado */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Orbe Azul Principal - Pulso Suave */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#1A44C8]/20 via-[#00A3FF]/15 to-transparent rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
        
        {/* Orbe Ciano/Índigo - Movimento Fluido */}
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] bg-gradient-to-bl from-[#6366F1]/18 via-[#38BDF8]/18 to-transparent rounded-full blur-[110px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
        
        {/* Orbe Esmeralda Suave no Topo */}
        <div className="absolute -top-20 right-1/3 w-[450px] h-[450px] bg-[#059669]/14 rounded-full blur-[100px] animate-[pulse_7s_ease-in-out_infinite_1s]" />
      </div>

      {/* Círculos de Órbita Animados Dinâmicos (Realçados com Gradientes Vivos) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] pointer-events-none z-0 opacity-60">
        <svg viewBox="0 0 850 850" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="loginGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#1A44C8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="loginGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#1A44C8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#00A3FF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <g className="animate-[spin_24s_linear_infinite]" style={{ transformOrigin: '425px 425px' }}>
            <ellipse cx="425" cy="425" rx="380" ry="140" fill="none" stroke="url(#loginGrad1)" strokeWidth="2" strokeDasharray="10 7" />
          </g>
          <g className="animate-[spin_32s_linear_infinite_reverse]" style={{ transformOrigin: '425px 425px' }}>
            <ellipse cx="425" cy="425" rx="360" ry="160" fill="none" stroke="url(#loginGrad2)" strokeWidth="1.8" strokeDasharray="8 6" transform="rotate(55 425 425)" />
          </g>
        </svg>
      </div>

      {/* Botão Voltar para Início */}
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#181B22] transition-colors z-20 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-[#E2E8F0] backdrop-blur-md shadow-xs group"
      >
        <ArrowLeft className="w-4 h-4 text-[#1A44C8] transition-transform group-hover:-translate-x-0.5" />
        <span>Voltar ao início</span>
      </Link>

      {/* Card Central com Borda Iluminada Sofisticada */}
      <div className="w-full max-w-[420px] z-10 px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Contêiner com Borda e Sombra de Alto Padrão */}
        <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-blue-200/70 via-slate-200/60 to-emerald-200/50 shadow-[0_20px_50px_-15px_rgba(26,68,200,0.12),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          
          <div className="bg-white rounded-[23px] p-7 sm:p-9 relative overflow-hidden">
            
            {/* Brilho Superior Interno */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A3FF] via-[#1A44C8] to-[#059669]" />
            
            {/* Logo Kaxxa com Anel Iluminado */}
            <div className="flex justify-center mb-5">
              <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-[#1A44C8] via-[#00A3FF] to-[#059669] shadow-lg shadow-[#1A44C8]/25">
                <div className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center">
                  <KaxxaKLogo size={30} className="text-[#1A44C8]" />
                </div>
              </div>
            </div>
            
            {/* Título e Subtítulo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <KaxxaWordmark size={24} />
              </div>
              <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
                Acesse ou crie sua conta em 1 clique com segurança total
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Ação de Login Oficial Google */}
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center min-h-[44px]">
                {/* Botão Oficial Google */}
                <div id="google-btn-container" className="flex justify-center w-full min-h-[40px]" />

                {/* Botão Fallback estilizado */}
                {!gsiReady && (
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={loading}
                    className="w-full py-3 px-5 bg-white hover:bg-slate-50 border-2 border-[#E2E8F0] hover:border-[#1A44C8] text-[#181B22] rounded-full font-bold text-xs transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
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

              {/* Selo de Proteção */}
              <div className="pt-2 text-[11px] text-[#64748B] flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-[#059669]" />
                <span>Autenticação criptografada oficial Google</span>
              </div>
            </div>

            {/* Rodapé / Microtermos */}
            <div className="mt-7 pt-4 border-t border-[#F1F5F9] text-center">
              <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                Ambiente seguro • Proteção de dados bancários LGPD
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
