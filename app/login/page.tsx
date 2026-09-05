'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';
import { subscriptionService } from '@/lib/services/subscription';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || 'Erro ao conectar com o Google.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (tab === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/nova-senha',
        });
        if (error) throw error;
        setSuccessMsg('Link de recuperação enviado! Verifique sua caixa de entrada.');
      }
      else if (tab === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });

        if (error) throw error;
        
        if (data.session) {
          // Novo usuário precisa assinar plano
          router.push('/planos');
        } else {
          setSuccessMsg('Conta criada! Verifique seu email para confirmar.');
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          const access = await subscriptionService.isAccessGranted();
          if (access.granted) {
            router.push('/dashboard');
          } else {
            router.push('/planos');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrorMsg(error.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#181B22] relative flex items-center justify-center font-sans overflow-hidden selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
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
              <KaxxaWordmark className="text-xl" />
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              {tab === 'login' 
                ? 'Clareza e controle absoluto sobre o seu caixa' 
                : tab === 'register' 
                  ? 'Inicie o controle do seu caixa com o Kaxxa' 
                  : 'Digite seu e-mail para receber o link de acesso'}
            </p>
          </div>

          {tab !== 'forgot' && (
            <div className="mb-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#1A44C8]/40 text-[#181B22] rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar com o Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]">ou com seu e-mail</span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#1A44C8]/10 border border-[#1A44C8]/30 text-[#1A44C8] text-xs text-center font-bold">
                {successMsg}
              </div>
            )}

            {tab === 'register' && (
              <div className="relative group">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=" "
                  className="w-full bg-transparent border-b border-[#CBD5E1] px-0 py-2 text-[#181B22] placeholder-transparent focus:outline-none focus:border-[#1A44C8] transition-colors peer text-sm font-semibold"
                  required
                />
                <label 
                  htmlFor="name" 
                  className="absolute left-0 top-2 text-[#94A3B8] text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#1A44C8] peer-focus:font-bold peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
                >
                  Seu nome completo
                </label>
              </div>
            )}

            <div className="relative group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="w-full bg-transparent border-b border-[#CBD5E1] px-0 py-2 text-[#181B22] placeholder-transparent focus:outline-none focus:border-[#1A44C8] transition-colors peer text-sm font-semibold"
                required
              />
              <label 
                htmlFor="email" 
                className="absolute left-0 top-2 text-[#94A3B8] text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#1A44C8] peer-focus:font-bold peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
              >
                Seu e-mail
              </label>
            </div>

            {tab !== 'forgot' && (
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="w-full bg-transparent border-b border-[#CBD5E1] px-0 py-2 pr-8 text-[#181B22] placeholder-transparent focus:outline-none focus:border-[#1A44C8] transition-colors peer text-sm font-semibold"
                  required
                />
                <label 
                  htmlFor="password" 
                  className="absolute left-0 top-2 text-[#94A3B8] text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#1A44C8] peer-focus:font-bold peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
                >
                  Sua senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-[#94A3B8] hover:text-[#181B22] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {tab === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-[#64748B] hover:text-[#1A44C8] transition-colors font-medium"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                tab === 'login' ? 'ENTRAR NO KAXXA' : tab === 'register' ? 'CRIAR CONTA & CONTINUAR' : 'ENVIAR LINK'
              )}
            </button>
          </form>

          {/* Switch tabs */}
          <div className="mt-8 text-center text-xs text-[#64748B]">
            {tab === 'login' ? (
              <>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-[#1A44C8] hover:underline font-bold transition-colors ml-1"
                >
                  Criar conta
                </button>
              </>
            ) : tab === 'register' ? (
              <>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-[#1A44C8] hover:underline font-bold transition-colors ml-1"
                >
                  Fazer login
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-[#1A44C8] hover:underline font-bold transition-colors"
              >
                Voltar para o login
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
