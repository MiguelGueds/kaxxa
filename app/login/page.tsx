'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KaxxaKLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && !name.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      if (isSignUp) {
        // Criar Nova Conta (salvando nome nos metadados do usuário)
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              name: name.trim(),
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          // Usuário cadastrado e logado automaticamente
          const pendingCoupon = typeof window !== 'undefined' ? localStorage.getItem('kaxxa_pending_coupon') : null;
          if (pendingCoupon) {
            router.push(`/planos?cupom=${encodeURIComponent(pendingCoupon)}`);
          } else {
            router.push('/dashboard');
          }
        } else if (data.user) {
          setSuccessMsg('Conta criada com sucesso! Faça login com seu e-mail e senha.');
          setIsSignUp(false);
        }
      } else {
        // Fazer Login com E-mail e Senha
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
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
      console.error('Auth Error:', err);
      if (err.message?.includes('Email signups are disabled')) {
        setErrorMsg('O cadastro de novos usuários precisa ser ativado no Supabase (Authentication > Providers > Email).');
      } else if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMsg('Este e-mail já está cadastrado. Faça login com suas credenciais.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#181B22] relative flex items-center justify-center font-sans overflow-hidden selection:bg-[#1A44C8]/20 selection:text-[#1A44C8]">
      
      {/* Grid Tecnológico Pontilhado Sutil */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Orbes de Luz Vivas */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#1A44C8]/20 via-[#00A3FF]/15 to-transparent rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] bg-gradient-to-bl from-[#6366F1]/18 via-[#38BDF8]/18 to-transparent rounded-full blur-[110px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
      </div>

      {/* Botão Voltar para Início */}
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#181B22] transition-colors z-20 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-[#E2E8F0] backdrop-blur-md shadow-xs group"
      >
        <ArrowLeft className="w-4 h-4 text-[#1A44C8] transition-transform group-hover:-translate-x-0.5" />
        <span>Voltar ao início</span>
      </Link>

      {/* Card Central */}
      <div className="w-full max-w-[420px] z-10 px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-blue-200/70 via-slate-200/60 to-emerald-200/50 shadow-[0_20px_50px_-15px_rgba(26,68,200,0.12),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          
          <div className="bg-white rounded-[23px] p-7 sm:p-9 relative overflow-hidden">
            
            {/* Brilho Superior Interno */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A3FF] via-[#1A44C8] to-[#059669]" />
            
            {/* Logo Kaxxa */}
            <div className="flex justify-center mb-4">
              <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-[#1A44C8] via-[#00A3FF] to-[#059669] shadow-lg shadow-[#1A44C8]/25">
                <div className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center">
                  <KaxxaKLogo size={30} className="text-[#1A44C8]" />
                </div>
              </div>
            </div>
            
            {/* Título e Subtítulo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-1.5">
                <KaxxaWordmark size={24} />
              </div>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                {isSignUp ? 'Crie sua conta no Kaxxa em instantes' : 'Acesse sua conta financeira com segurança'}
              </p>
            </div>

            {/* Alternador Entrar vs Criar Conta */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all ${!isSignUp ? 'bg-white text-[#1A44C8] shadow-xs' : 'hover:text-slate-900'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all ${isSignUp ? 'bg-white text-[#1A44C8] shadow-xs' : 'hover:text-slate-900'}`}
              >
                Criar Conta
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-bold animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* Formulário de Autenticação */}
            <form onSubmit={handleAuth} className="space-y-4">
              
              {/* Campo Nome Completo (exibido apenas ao Criar Conta) */}
              {/* Campo Nome (exibido apenas ao Criar Conta) */}
              {isSignUp && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome Completo</label>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome e sobrenome"
                      placeholder="Seu nome"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#1A44C8] focus:ring-2 focus:ring-[#1A44C8]/20 outline-none text-xs text-slate-900 font-medium transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Campo E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#1A44C8] focus:ring-2 focus:ring-[#1A44C8]/20 outline-none text-xs text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:border-[#1A44C8] focus:ring-2 focus:ring-[#1A44C8]/20 outline-none text-xs text-slate-900 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 bg-[#1A44C8] hover:bg-[#1537A5] text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Criar Minha Conta Grátis' : 'Entrar no Kaxxa'}</span>
                )}
              </button>
            </form>

            {/* Selo de Proteção */}
            <div className="mt-6 pt-4 border-t border-[#F1F5F9] text-center">
              <div className="text-[11px] text-[#64748B] flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-[#059669]" />
                <span>Autenticação direta criptografada LGPD</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
