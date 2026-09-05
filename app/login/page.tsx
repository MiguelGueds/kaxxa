'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gsiReady, setGsiReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '61580172309-baud3b6dnu4n0ustld3v291btg7b0c2a.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google ID Token error:', err);
      setErrorMsg(err.message || 'Erro ao autenticar com o Google.');
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
            width: 360,
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

  // Polling resiliente para renderizar o botão oficial do Google sem depender do tempo de script
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

      // Tenta abrir o prompt nativo do Google sem navegar para fora do site
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

      // Fallback tradicional OAuth caso o script do Google seja bloqueado por adblock
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

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#181B22] relative flex items-center justify-center font-sans overflow-hidden selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Script Oficial do Google Identity Services */}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive" 
        onLoad={initGsi} 
      />

      {/* Luzes Suaves de Fundo */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#1A44C8]/[0.04] blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#00A3FF]/[0.04] blur-[140px]" />
      </div>

      {/* ANÉIS ORBITAIS / RADIAL AMBIENCE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none z-0 opacity-20">
        <svg viewBox="0 0 1000 1000" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="loginOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16,53,229,0.3)" />
              <stop offset="50%" stopColor="rgba(0,163,255,0.1)" />
              <stop offset="100%" stopColor="rgba(16,53,229,0)" />
            </linearGradient>
          </defs>
          
          <g className="animate-[spin_40s_linear_infinite]" style={{ transformOrigin: '500px 500px' }}>
            <ellipse cx="500" cy="500" rx="400" ry="120" fill="none" stroke="url(#loginOrbitGrad)" strokeWidth="1.5" />
          </g>
          <g className="animate-[spin_50s_linear_infinite_reverse]" style={{ transformOrigin: '500px 500px' }}>
            <ellipse cx="500" cy="500" rx="400" ry="120" fill="none" stroke="url(#loginOrbitGrad)" strokeWidth="1.5" transform="rotate(45 500 500)" />
          </g>
        </svg>
      </div>

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#181B22] transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4 text-[#1A44C8]" />
        Voltar para o início
      </Link>

      <div className="w-full max-w-[440px] z-10 px-4">
        {/* Main Card with #FFFFFF */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-10 relative overflow-hidden shadow-xl">
          
          {/* Logo Kaxxa Oficial */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-center shadow-sm">
              <KaxxaLogo size={32} />
            </div>
          </div>
          
          {/* Título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-1">
              <KaxxaWordmark className="text-2xl tracking-tight" />
            </div>
            <p className="text-xs text-[#64748B] mt-1.5 font-medium">
              Acesse ou crie sua conta em 1 clique com sua conta Google
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Botão Oficial do Google */}
          <div className="space-y-4">
            
            <div className="flex flex-col items-center justify-center min-h-[44px]">
              {/* Container do Botão Nativo Oficial do Google (Sem URL do Supabase) */}
              <div id="google-btn-container" className="flex justify-center w-full min-h-[40px]" />

              {/* Botão Fallback estilizado caso o Google script demore */}
              {!gsiReady && (
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading}
                  className="w-full py-3 px-5 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#1A44C8] text-[#181B22] rounded-full font-bold text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
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

            <div className="pt-2 text-[11px] text-[#94A3B8] flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-[#059669]" />
              <span>Autenticação rápida, oficial e segura</span>
            </div>
          </div>

          {/* Micro-termos */}
          <p className="mt-8 text-[10px] text-[#94A3B8] leading-relaxed text-center">
            Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade do Kaxxa.
          </p>

        </div>
      </div>
    </div>
  );
}

