'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  CreditCard, 
  Users, 
  EyeOff, 
  Check, 
  Zap, 
  Play, 
  PieChart, 
  Layers,
  Lock,
  Flame,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  HelpCircle,
  Clock,
  Wallet
} from 'lucide-react';
import { KaxxaLogo, KaxxaWordmark } from '@/app/components/KaxxaLogo';
import { PixIcon } from '@/app/components/PixLogo';
import { RoiCalculator } from '@/app/components/RoiCalculator';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [activeTab, setActiveTab] = useState<'patrimonio' | 'terceiros' | 'dividas' | 'all'>('patrimonio');
  const [isPaused, setIsPaused] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setHeroVisible(window.scrollY < 200); // hero visible near top
    };

    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Rotação automática das abas para demonstrar vida ao visitante
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTab((current) => {
        if (current === 'patrimonio') return 'terceiros';
        if (current === 'terceiros') return 'dividas';
        if (current === 'dividas') return 'all';
        return 'patrimonio';
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="bg-[#F8F9FA] text-[#181B22] font-sans relative selection:bg-[#1A44C8]/20 selection:text-[#1A44C8] min-h-screen overflow-x-hidden">
      
      {/* 1. FUNDO DINÂMICO DE LUXO: ONDAS FLUIDAS, ESFERAS DE CRISTAL 3D & SPOTLIGHT INTERATIVO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        
        {/* Spotlight Interativo que Segue o Cursor */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-transform duration-700 ease-out opacity-25"
          style={{
            transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
            background: 'radial-gradient(circle, rgba(59, 108, 240, 0.28) 0%, rgba(26, 68, 200, 0.06) 45%, transparent 70%)',
            filter: 'blur(55px)',
          }}
        />

        {/* Aura Central Aurora de Fundo */}
        <div 
          className="absolute -top-[160px] left-1/2 -translate-x-1/2 w-[1150px] h-[700px] pointer-events-none opacity-85 animate-aurora-glow"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 22%, rgba(26, 68, 200, 0.14) 0%, rgba(59, 108, 240, 0.06) 40%, transparent 75%)',
            filter: 'blur(65px)',
          }}
        />

        {/* Ondas Fluidas em Movimento Contínuo (SVG Liquid Stream) */}
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[1400px] sm:w-[1700px] h-[650px] pointer-events-none">
          <svg viewBox="0 0 1700 650" className="w-full h-full overflow-visible" fill="none">
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(26, 68, 200, 0)" />
                <stop offset="25%" stopColor="rgba(26, 68, 200, 0.35)" />
                <stop offset="50%" stopColor="rgba(59, 108, 240, 0.6)" />
                <stop offset="75%" stopColor="rgba(37, 99, 235, 0.35)" />
                <stop offset="100%" stopColor="rgba(59, 108, 240, 0)" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 108, 240, 0)" />
                <stop offset="30%" stopColor="rgba(59, 108, 240, 0.3)" />
                <stop offset="60%" stopColor="rgba(26, 68, 200, 0.45)" />
                <stop offset="100%" stopColor="rgba(26, 68, 200, 0)" />
              </linearGradient>
              <linearGradient id="goldAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0)" />
                <stop offset="50%" stopColor="rgba(245, 158, 11, 0.25)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </linearGradient>
            </defs>

            {/* Onda Principal 1 */}
            <path 
              d="M 50 480 C 350 160, 750 620, 1200 220 C 1450 40, 1650 350, 1750 450" 
              stroke="url(#waveGrad1)" 
              strokeWidth="2.5" 
              className="animate-wave-flow-1"
            />

            {/* Onda Cruzada 2 */}
            <path 
              d="M 20 280 C 400 580, 850 80, 1300 480 C 1500 280, 1680 180, 1750 320" 
              stroke="url(#waveGrad2)" 
              strokeWidth="2" 
              className="animate-wave-flow-2"
            />

            {/* Linha de Destaque Dourado Suave */}
            <path 
              d="M 120 400 C 480 200, 920 520, 1380 280 C 1520 180, 1620 220, 1700 300" 
              stroke="url(#goldAccentGrad)" 
              strokeWidth="1" 
              strokeDasharray="8 12"
              className="animate-wave-flow-3"
            />
          </svg>
        </div>

        {/* Esfera de Cristal 1: Esmeralda 3D Superior Esquerda */}
        <div 
          className="absolute top-[8%] left-[7%] w-[240px] h-[240px] rounded-full pointer-events-none animate-crystal-orb-1 border border-white/60 backdrop-blur-sm shadow-[0_20px_50px_rgba(5,150,105,0.16)]"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9) 0%, rgba(59, 108, 240, 0.35) 30%, rgba(26, 68, 200, 0.18) 65%, transparent 95%)',
          }}
        />

        {/* Esfera de Cristal 2: Menta Líquida Superior Direita */}
        <div 
          className="absolute top-[14%] right-[6%] w-[210px] h-[210px] rounded-full pointer-events-none animate-crystal-orb-2 border border-white/50 backdrop-blur-sm shadow-[0_20px_45px_rgba(52,211,153,0.2)]"
          style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.85) 0%, rgba(59, 108, 240, 0.4) 35%, rgba(26, 68, 200, 0.14) 70%, transparent 95%)',
          }}
        />

        {/* Esfera 3: Cristal Lateral */}
        <div 
          className="absolute top-[48%] left-[16%] w-[150px] h-[150px] rounded-full pointer-events-none animate-crystal-orb-3 border border-white/40 shadow-[0_15px_35px_rgba(5,150,105,0.12)]"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(59, 108, 240, 0.25) 40%, rgba(26, 68, 200, 0.08) 75%, transparent 100%)',
          }}
        />

        {/* Órbitas Radiais e Geometria Suíça de Precisão */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[760px] h-[760px] pointer-events-none animate-spin-orbit">
          <svg viewBox="0 0 760 760" className="w-full h-full overflow-visible" fill="none">
            <circle cx="380" cy="380" r="370" stroke="#1A44C8" strokeWidth="1" strokeDasharray="6 12" strokeOpacity="0.22" />
            <circle cx="380" cy="380" r="280" stroke="#60A5FA" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.25" />
            <circle cx="380" cy="380" r="180" stroke="#1A44C8" strokeWidth="0.75" strokeOpacity="0.18" />
            
            {/* Satélite Brilhante */}
            <circle cx="380" cy="10" r="4.5" fill="#60A5FA" className="animate-pulse" />
            <circle cx="380" cy="10" r="10" fill="#60A5FA" fillOpacity="0.15" />
            <circle cx="100" cy="380" r="3.5" fill="#1A44C8" />
          </svg>
        </div>

        {/* Partículas / Sparks Flutuantes */}
        <div className="absolute top-[25%] left-[22%] w-2 h-2 rounded-full bg-[#1A44C8] shadow-[0_0_10px_#1A44C8] animate-float-spark-1" />
        <div className="absolute top-[40%] right-[22%] w-2.5 h-2.5 rounded-full bg-[#60A5FA] shadow-[0_0_12px_#60A5FA] animate-float-spark-2" />
        <div className="absolute top-[18%] right-[35%] w-1.5 h-1.5 rounded-full bg-[#1A44C8] shadow-[0_0_8px_#1A44C8] animate-float-spark-3" />
        <div className="absolute top-[55%] left-[30%] w-2 h-2 rounded-full bg-[#60A5FA] shadow-[0_0_10px_#60A5FA] animate-float-spark-4" />

        {/* Grid Técnico Fino */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.018)_1px,transparent_1px)] bg-[size:52px_52px] opacity-60"
        ></div>
      </div>

      {/* 2. HEADER STICKY GLASSMORPHISM */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#FFFFFF]/90 backdrop-blur-xl border-b border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-3.5' 
          : 'bg-transparent py-5 border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl border border-[#E5E7EB] flex items-center justify-center bg-[#FFFFFF] shadow-sm group-hover:border-[#1A44C8]/40 transition-all">
              <KaxxaLogo size={20} />
            </div>
            <KaxxaWordmark className="text-lg" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[11px] tracking-[0.14em] uppercase font-semibold text-[#64748B]">
            <a href="#demonstracao" className="hover:text-[#181B22] transition-colors">Demonstração</a>
            <a href="#economia" className="hover:text-[#181B22] transition-colors">Economia</a>
            <a href="#arquitetura" className="hover:text-[#181B22] transition-colors">Diferenciais</a>
            <a href="#comparativo" className="hover:text-[#181B22] transition-colors">Comparativo</a>
            <a href="#planos" className="hover:text-[#181B22] transition-colors">Planos</a>
            <a href="#duvidas" className="hover:text-[#181B22] transition-colors">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-bold text-[#64748B] hover:text-[#181B22] px-3 py-1.5 transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link 
              href="/planos" 
              className="relative group overflow-hidden px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#1A44C8] hover:bg-[#1538A5] transition-all duration-300 shadow-md shadow-[#1A44C8]/20 flex items-center gap-1.5 active:scale-95"
            >
              <span>Assinar Agora</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION DE ALTA CONVERSÃO */}
      <div className="hero-wrapper flex justify-center items-center min-h-screen">
        <section className={`relative z-10 pt-36 pb-14 md:pt-44 md:pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center text-center ${heroVisible ? 'animate-fade-in-up' : ''}`}>

        {/* Badge de Destaque Oficial */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#1A44C8] text-xs font-bold mb-6 shadow-2xs animate-in fade-in duration-300">
          <Sparkles size={13} className="text-[#1A44C8]" />
          <span>O Gerenciador Financeiro Oficial de Alta Performance</span>
        </div>

        {/* Título Principal de Alto Impacto */}
        <h1 className="text-3xl sm:text-5xl md:text-[54px] font-black tracking-[-0.03em] leading-[1.12] text-[#181B22] max-w-3xl">
          Controle absoluto do seu dinheiro e <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A44C8] via-[#00A3FF] to-[#059669]">fim das faturas surpresa.</span>
        </h1>

        {/* Subtítulo Claro, Específico e Persuasivo */}
        <p className="mt-5 text-sm sm:text-base text-[#64748B] max-w-2xl font-normal leading-relaxed tracking-normal">
          O único gerenciador que separa seus gastos dos gastos de terceiros, calcula a amortização antecipada de dívidas e indica o melhor cartão de compra hoje para até 40 dias sem juros.
        </p>

        {/* Botões de Ação */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <Link 
            href="/planos" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A44C8] hover:bg-[#1538A5] text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-[#1A44C8]/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Assinar por R$ 39,90/mês</span>
            <ArrowRight size={14} />
          </Link>
          <a 
            href="#demonstracao" 
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#181B22] font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
          >
            <Play size={11} className="fill-[#181B22]" />
            <span>Ver Demonstração</span>
          </a>
        </div>

        {/* Selos de Confiança Imediatos */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[#64748B] font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#059669]" />
            Garantia de 7 dias
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-[#1A44C8]" />
            Ativação imediata via Pix & Cartão
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={14} className="text-[#00A3FF]" />
            100% privado e sem anúncios
          </span>
        </div>

      </section>
      </div>



      {/* 4. DEMONSTRAÇÃO INTERATIVA DO PRODUTO (#DEMONSTRACAO) */}
      <section id="demonstracao" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        
        {/* Título da Seção */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A44C8] font-bold">
            [ DEMONSTRAÇÃO AO VIVO ]
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#181B22] tracking-tight mt-3">
            Veja o Kaxxa em ação
          </h2>
          <p className="text-sm text-[#64748B] font-medium max-w-md mx-auto mt-3">
            Explore as funcionalidades em tempo real. Clique nas abas para navegar.
          </p>
        </div>

        {/* Moldura Reativa */}
        <div 
          className="relative mx-auto rounded-3xl transition-transform duration-300 ease-out group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          
          {/* Micro-Card Flutuante 1: Recebimento ao Vivo */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] backdrop-blur-xl shadow-lg absolute -top-6 -left-6 z-20 animate-float">
            <div className="w-7 h-7 rounded-xl bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center shrink-0">
              <ArrowUpRight size={15} />
            </div>
            <div className="text-left">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#1A44C8] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8] animate-ping"></span> Live Sync
              </span>
              <p className="text-xs font-bold text-[#181B22] tracking-tight">
                + R$ 1.840,50 <span className="text-[#64748B] text-[10px] font-medium">• Rendimentos XP</span>
              </p>
            </div>
          </div>

          {/* Micro-Card Flutuante 2: Blindagem de Terceiros */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] backdrop-blur-xl shadow-lg absolute -bottom-6 -right-6 z-20 animate-float" style={{ animationDelay: '2.5s' }}>
            <div className="w-7 h-7 rounded-xl bg-[#00A3FF]/10 text-[#00A3FF] flex items-center justify-center shrink-0">
              <ShieldCheck size={15} />
            </div>
            <div className="text-left">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#00A3FF] flex items-center gap-1">
                <CheckCircle2 size={10} /> Blindagem Ativa
              </span>
              <p className="text-xs font-bold text-[#181B22] tracking-tight">
                R$ 4.200,00 <span className="text-[#64748B] text-[10px] font-medium">• 100% Segregado</span>
              </p>
            </div>
          </div>

          {/* Moldura da Interface em Bento White */}
          <div className="relative rounded-2xl md:rounded-3xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl overflow-hidden text-left transition-all">
            
            {/* Barra de Janela Superior */}
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-4 py-1 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] text-[11px] text-[#64748B] font-mono">
                <Lock size={10} className="text-[#1A44C8]" />
                <span>kaxxa.com.br</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#1A44C8] bg-[#1A44C8]/10 px-2.5 py-0.5 rounded-full font-bold border border-[#1A44C8]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8] animate-pulse"></span>
                <span className="hidden sm:inline">Ambiente ao Vivo</span>
                <span className="sm:hidden">Live</span>
              </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#E5E7EB] bg-[#F8FAFC]/50 overflow-x-auto text-[11px] select-none">
              
              <button 
                onClick={() => setActiveTab('patrimonio')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all ${
                  activeTab === 'patrimonio'
                    ? 'bg-[#FFFFFF] text-[#1A44C8] border-t-2 border-[#1A44C8] shadow-sm'
                    : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <PieChart size={13} />
                <span>Visão Geral</span>
              </button>

              <button 
                onClick={() => setActiveTab('terceiros')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === 'terceiros'
                    ? 'bg-[#FFFFFF] text-[#1A44C8] border-t-2 border-[#1A44C8] shadow-sm'
                    : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <Users size={13} />
                <span>Terceiros</span>
              </button>

              <button 
                onClick={() => setActiveTab('dividas')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all ${
                  activeTab === 'dividas'
                    ? 'bg-[#FFFFFF] text-[#1A44C8] border-t-2 border-[#1A44C8] shadow-sm'
                    : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <Flame size={13} />
                <span>Dívidas</span>
              </button>

              <button 
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#FFFFFF] text-[#1A44C8] border-t-2 border-[#1A44C8] shadow-sm'
                    : 'text-[#64748B] hover:text-[#181B22]'
                }`}
              >
                <Layers size={13} />
                <span>Tudo em Um Só Lugar</span>
              </button>

            </div>

            {/* Conteúdo Dinâmico da Aba Ativa */}
            <div className="p-4 sm:p-7 bg-[#F5F6F9]">

              {/* ABA 1: VISÃO GERAL & PATRIMÔNIO */}
              {activeTab === 'patrimonio' && (
                <div className="space-y-5 animate-fade-in-up">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="text-sm font-bold text-[#181B22]">Visão Geral • Olá, Miguel</h3>
                      <p className="text-[10.5px] text-[#64748B] font-medium">Patrimônio consolidado sincronizado em tempo real</p>
                    </div>
                    <span className="text-[10px] bg-[#1A44C8]/10 text-[#1A44C8] px-2.5 py-0.5 rounded-full border border-[#1A44C8]/20 font-bold">
                      Última atualização: agora
                    </span>
                  </div>

                  {/* 4 Cards de KPI */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Patrimônio Total</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#181B22] tracking-tight">R$ 484.300,50</p>
                      <span className="text-[9.5px] text-[#1A44C8] font-bold flex items-center gap-0.5">
                        <TrendingUp size={10} /> +18.4% este ano
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Ganho de Capital</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#1A44C8] tracking-tight">+ R$ 12.800,00</p>
                      <span className="text-[9.5px] text-[#64748B] font-medium">+14.2% sobre aportes</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Aportes do Ano</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#181B22] tracking-tight">R$ 48.200,00</p>
                      <span className="text-[9.5px] text-[#64748B] font-medium">5 corretoras consolidadas</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Despesas do Mês</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#181B22] tracking-tight">R$ 4.428,00</p>
                      <span className="text-[9.5px] text-[#1A44C8] font-bold">Dentro do teto (70%)</span>
                    </div>

                  </div>

                  {/* Gráfico Real de Evolução Anual */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#181B22]">Evolução Patrimonial Anual</span>
                      <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#1A44C8]"></span>
                        <span>Consolidado</span>
                      </div>
                    </div>

                    {/* Curva SVG Vetorial */}
                    <div className="h-32 w-full pt-2">
                      <svg viewBox="0 0 600 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="dashAreaGrad" x1="0%" y1="0%" x2="0%" y2="1">
                            <stop offset="0%" stopColor="#1A44C8" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#1A44C8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M 0 100 Q 50 95, 100 85 T 200 70 T 300 55 T 400 35 T 500 20 T 600 10 L 600 120 L 0 120 Z" 
                          fill="url(#dashAreaGrad)" 
                        />
                        <path 
                          d="M 0 100 Q 50 95, 100 85 T 200 70 T 300 55 T 400 35 T 500 20 T 600 10" 
                          fill="none" 
                          stroke="#1A44C8" 
                          strokeWidth="2.5" 
                        />
                        <circle cx="600" cy="10" r="4.5" fill="#00A3FF" className="animate-ping" />
                        <circle cx="600" cy="10" r="3.5" fill="#1A44C8" />
                      </svg>
                    </div>

                    <div className="flex justify-between text-[9px] text-[#94A3B8] font-bold pt-1 border-t border-[#E5E7EB]">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>Mai</span>
                      <span>Jul</span>
                      <span>Set</span>
                      <span>Nov</span>
                      <span className="text-[#1A44C8] font-extrabold">Dez (Hoje)</span>
                    </div>
                  </div>

                  {/* Cartões Conectados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center font-bold text-xs">
                          XP
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#181B22]">XP Visa Infinite</p>
                          <p className="text-[10px] text-[#64748B] font-medium">Fatura: R$ 3.820,00 • Fecha dia 28</p>
                        </div>
                      </div>
                      <span className="text-[9.5px] text-[#1A44C8] bg-[#1A44C8]/10 px-2 py-0.5 rounded border border-[#1A44C8]/20 font-bold">
                        Melhor Cartão Hoje ⭐
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                          NU
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#181B22]">Nubank Ultravioleta</p>
                          <p className="text-[10px] text-[#64748B] font-medium">Fatura: R$ 608,80 • Fecha dia 12</p>
                        </div>
                      </div>
                      <span className="text-[9.5px] text-[#64748B] bg-[#F1F3F7] px-2 py-0.5 rounded font-bold">
                        1% Cashback
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 2: GESTÃO DE TERCEIROS */}
              {activeTab === 'terceiros' && (
                <div className="space-y-5 animate-fade-in-up">
                  
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 font-medium">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">⚠️</span>
                    <span>
                      <strong className="text-amber-900 font-bold">Evite ao máximo emprestar seu cartão ou dinheiro para terceiros.</strong> O cenário ideal é manter esta seção em R$ 0,00 para proteger seu score.
                    </span>
                  </div>

                  {/* 4 Cards de Terceiros */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Total Ativo</span>
                      <p className="text-base sm:text-lg font-extrabold text-amber-600">R$ 5.750,00</p>
                      <span className="text-[9.5px] text-[#64748B] font-medium">2 pessoas pendentes</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Em Faturas</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#1A44C8]">R$ 4.200,00</p>
                      <span className="text-[9.5px] text-[#1A44C8] font-bold">100% Segregado</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Em Conta / PIX</span>
                      <p className="text-base sm:text-lg font-extrabold text-[#181B22]">R$ 1.550,00</p>
                      <span className="text-[9.5px] text-[#64748B] font-medium">Empréstimo direto</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-1">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Já Devolvido</span>
                      <p className="text-base sm:text-lg font-extrabold text-blue-600">R$ 4.750,00</p>
                      <span className="text-[9.5px] text-blue-600 font-bold">45% quitado</span>
                    </div>
                  </div>

                  {/* Devedores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-xs">
                            MC
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#181B22]">Mariana Costa</p>
                            <p className="text-[10px] text-[#64748B] font-medium">iPhone 15 Pro • Santander</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          100% Em Dia
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-[#64748B] font-medium">Progresso (6 / 12 parcelas)</span>
                          <span className="text-[#181B22] font-bold">R$ 2.400 / R$ 4.800</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F1F3F7] overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1A44C8] text-white flex items-center justify-center font-bold text-xs">
                            LF
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#181B22]">Lucas Ferreira</p>
                            <p className="text-[10px] text-[#64748B] font-medium">Passagem Aérea • Nubank</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          Fatura Próxima
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-[#64748B] font-medium">Progresso (2 / 4 parcelas)</span>
                          <span className="text-[#181B22] font-bold">R$ 900 / R$ 1.800</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F1F3F7] overflow-hidden">
                          <div className="h-full bg-[#1A44C8] rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 3: QUITAÇÃO DE DÍVIDAS */}
              {activeTab === 'dividas' && (
                <div className="space-y-5 animate-fade-in-up">
                  
                  <div className="p-3 rounded-xl bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-[#1A44C8] shrink-0" />
                      <span className="text-[#181B22] font-medium">
                        <strong className="text-[#1A44C8] font-bold">Estratégia de Quitação Ativa:</strong> Método Avalanche priorizando contratos com maior taxa de juros real.
                      </span>
                    </div>
                    <span className="text-[10px] text-[#1A44C8] font-bold bg-[#1A44C8]/15 px-2.5 py-0.5 rounded-full shrink-0">
                      -76% de Juros Poupados
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-3.5">
                    <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                      <span className="text-xs font-bold text-[#181B22]">Simulação de Amortização Antecipada</span>
                      <span className="text-[10px] text-[#1A44C8] font-bold">Economia: R$ 38.800,00</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#64748B] font-medium">Fluxo Tradicional (60 meses)</span>
                        <span className="text-rose-600 font-bold">R$ 48.200 pagos em JUROS</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#F1F3F7] overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full w-[95%]"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#1A44C8] font-bold">Com Estratégia Kaxxa (14 meses)</span>
                        <span className="text-blue-600 font-bold">R$ 9.400 em juros (-76%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#F1F3F7] overflow-hidden">
                        <div className="h-full bg-[#1A44C8] rounded-full w-[24%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#181B22]">Financiamento Caixa</p>
                        <p className="text-[10px] text-[#64748B] font-medium">Saldo: R$ 142.000 • 11.5% a.a.</p>
                      </div>
                      <button className="px-3 py-1 rounded-lg bg-[#1A44C8] hover:bg-[#1538A5] text-[10px] font-bold text-white flex items-center gap-1 transition-all shadow-sm">
                        <Zap size={11} /> Pagar R$ 800
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#181B22]">Empréstimo Auto Itaú</p>
                        <p className="text-[10px] text-[#64748B] font-medium">Saldo: R$ 18.500 • 18.2% a.a.</p>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        Prioridade 1 🔥
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 4: TUDO EM UM SÓ LUGAR */}
              {activeTab === 'all' && (
                <div className="space-y-5 animate-fade-in-up">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="text-sm font-bold text-[#181B22]">Tudo em Um Só Lugar</h3>
                      <p className="text-[10.5px] text-[#64748B] font-medium">Sua vida financeira completa consolidada em uma única visão</p>
                    </div>
                    <span className="text-[10px] bg-[#1A44C8]/10 text-[#1A44C8] px-2.5 py-0.5 rounded-full border border-[#1A44C8]/20 font-bold">
                      6 áreas integradas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                    {/* Card: Investimentos */}
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1A44C8]/10 flex items-center justify-center">
                          <TrendingUp size={16} className="text-[#1A44C8]" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Investimentos</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#181B22]">R$ 102.800</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={12} className="text-[#1A44C8]" />
                        <span className="text-[10px] text-[#1A44C8] font-bold">+14.2% no ano</span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">5 corretoras • 12 ativos consolidados</p>
                    </div>

                    {/* Card: Gastos Mensais */}
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <CreditCard size={16} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Gastos do Mês</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#181B22]">R$ 4.428</p>
                      <div className="w-full h-2 rounded-full bg-[#F1F3F7] overflow-hidden">
                        <div className="h-full bg-[#1A44C8] rounded-full w-[70%]"></div>
                      </div>
                      <p className="text-[10px] text-[#1A44C8] font-bold">70% do teto • Dentro do limite</p>
                    </div>

                    {/* Card: Dívidas */}
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <Flame size={16} className="text-rose-500" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Dívidas Ativas</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#181B22]">R$ 160.500</p>
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-[#1A44C8]" />
                        <span className="text-[10px] text-[#1A44C8] font-bold">Economia de R$ 38.800 com estratégia</span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">2 contratos • Método Avalanche ativo</p>
                    </div>

                    {/* Card: Terceiros */}
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Users size={16} className="text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Despesas de Terceiros</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#181B22]">R$ 1.800</p>
                      <div className="w-full h-2 rounded-full bg-[#F1F3F7] overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-1/2"></div>
                      </div>
                      <p className="text-[10px] text-[#64748B]">2 de 4 parcelas pagas • 3 vínculos</p>
                    </div>

                    {/* Card: Foco & Metas */}
                    <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Sparkles size={16} className="text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Foco & Metas</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#1A44C8]">3 de 5</p>
                      <div className="w-full h-2 rounded-full bg-[#F1F3F7] overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-[60%]"></div>
                      </div>
                      <p className="text-[10px] text-[#64748B]">Metas atingidas este trimestre</p>
                    </div>

                    {/* Card: Academia Financeira */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A44C8]/5 to-[#1538A5]/10 border border-[#1A44C8]/20 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1A44C8]/15 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-[#1A44C8]" />
                        </div>
                        <span className="text-xs font-bold text-[#181B22]">Academia Financeira</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#1A44C8]">Nível 4</p>
                      <div className="w-full h-2 rounded-full bg-[#1A44C8]/10 overflow-hidden">
                        <div className="h-full bg-[#1A44C8] rounded-full w-[80%]"></div>
                      </div>
                      <p className="text-[10px] text-[#64748B]">12 módulos concluídos • 80% do curso</p>
                    </div>

                  </div>

                  {/* Resumo consolidado */}
                  <div className="p-3 rounded-xl bg-[#1A44C8]/10 border border-[#1A44C8]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-[#1A44C8] shrink-0" />
                      <span className="text-[#181B22] font-medium">
                        <strong className="text-[#1A44C8] font-bold">Patrimônio Líquido Total:</strong> R$ 102.800 em ativos − R$ 160.500 em dívidas = <strong className="text-rose-600">−R$ 57.700</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-[#1A44C8] font-bold bg-[#1A44C8]/15 px-2.5 py-0.5 rounded-full shrink-0">
                      Meta: Positivo em 14 meses
                    </span>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* 4.5 SIMULADOR INTERATIVO DE ECONOMIA (#ECONOMIA) */}
      <section id="economia" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto relative z-10">
        <RoiCalculator />
      </section>

      {/* 5. FINANÇAS SEM RUÍDO (#ARQUITETURA) */}
      <section id="arquitetura" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#E5E7EB] gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A44C8] font-bold">
              [ 02 // DIFERENCIAIS EXCLUSIVOS ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#181B22] tracking-tight mt-2">
              Finanças sem ruído.
            </h2>
          </div>
          <p className="text-sm text-[#64748B] font-medium max-w-md">
            Quatro pilares desenvolvidos para substituir planilhas desorganizadas e dezenas de apps desconexos.
          </p>
        </div>

        {/* 4 Módulos Arquiteturais em Grid Assimétrico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Módulo 1: Segregação Cirúrgica de Terceiros */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-[#1A44C8]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-3 py-1 rounded-full border border-[#1A44C8]/20">
                  MÓDULO 01
                </span>
                <Users size={22} className="text-[#1A44C8]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#181B22] tracking-tight mb-3">
                Blindagem de Gastos de Terceiros
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed mb-8">
                Emprestar cartões ou pagar contas para terceiros distorce totalmente seu custo de vida mensal. O Kaxxa isola essas despesas em um centro de custos separado, com controle de parcelas e liquidação pontual.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#181B22]">Fatura do Cartão (Total Bruto)</span>
                <span className="font-bold text-[#181B22] tabular-nums">R$ 12.840,00</span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#1A44C8]">
                <span className="font-medium">(-) Despesas de Terceiros Segregadas</span>
                <span className="font-bold tabular-nums">- R$ 4.200,00</span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-xs">
                <span className="font-bold text-[#181B22]">Seu Custo de Vida Real</span>
                <span className="font-extrabold text-[#1A44C8] tabular-nums">R$ 8.640,00</span>
              </div>
            </div>
          </div>

          {/* Módulo 2: Inteligência de Prazos e Cartões */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-[#1A44C8]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-3 py-1 rounded-full border border-[#1A44C8]/20">
                  MÓDULO 02
                </span>
                <CreditCard size={22} className="text-[#1A44C8]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#181B22] tracking-tight mb-3">
                Maximização do Prazo sem Juros
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed mb-8">
                O Kaxxa cruza automaticamente a data de fechamento de todos os seus cartões e indica com precisão o melhor cartão para compra hoje, garantindo até 40 dias de liquidez livre sem pagar 1 centavo de juros.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Melhor Cartão Hoje</span>
                <p className="text-xs font-bold text-[#181B22]">XP Infinite Visa</p>
                <span className="text-[10.5px] text-[#1A44C8] font-medium">38 dias até o vencimento</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-bold">
                  Recomendado 🔥
                </span>
              </div>
            </div>
          </div>

          {/* Módulo 3: Liquidação Acelerada de Juros (Avalanche) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-[#1A44C8]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-3 py-1 rounded-full border border-[#1A44C8]/20">
                  MÓDULO 03
                </span>
                <Flame size={22} className="text-[#1A44C8]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#181B22] tracking-tight mb-3">
                Amortização Estratégica Avalanche
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed mb-8">
                Simule antecipações com precisão matemática. Veja o impacto real de cada amortização extraordinária reduzindo o custo efetivo total e cortando anos de parcelas bancárias.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-medium">Economia calculada com R$ 800/mês</span>
                <span className="font-bold text-[#1A44C8] tabular-nums">R$ 38.800 poupados</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                <div className="h-full bg-[#1A44C8] rounded-full w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Módulo 4: Privacidade Total (Modo Discreto) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-[#1A44C8]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold text-[#1A44C8] bg-[#1A44C8]/10 px-3 py-1 rounded-full border border-[#1A44C8]/20">
                  MÓDULO 04
                </span>
                <EyeOff size={22} className="text-[#1A44C8]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#181B22] tracking-tight mb-3">
                Modo Discreto com 1 Clique
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed mb-8">
                Utilize seu painel financeiro no escritório, café ou aeroporto com total discrição. Com um único clique, todos os saldos e transações são mascarados instantaneamente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium">Saldo em visualização pública</span>
              <span className="font-mono font-bold text-[#181B22] tracking-widest">••••••••••</span>
            </div>
          </div>

        </div>

      </section>

      {/* 6. COMPARATIVO TÉCNICO (#COMPARATIVO) */}
      <section id="comparativo" className="py-24 px-6 max-w-6xl mx-auto relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A44C8] font-bold">
            [ 02 // COMPARATIVO TÉCNICO ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#181B22] tracking-tight mt-2">
            Por que o Kaxxa é diferente.
          </h2>
        </div>

        {/* Tabela de Comparação Estruturada */}
        <div className="overflow-x-auto rounded-3xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <th className="py-4 px-6 font-bold text-[#181B22]">Capacidade Operacional</th>
                <th className="py-4 px-6 font-extrabold text-[#1A44C8] bg-[#1A44C8]/5">Kaxxa</th>
                <th className="py-4 px-6 font-semibold text-[#64748B]">Apps Tradicionais</th>
                <th className="py-4 px-6 font-semibold text-[#64748B]">Planilhas Excel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {[
                {
                  feature: "Segregação de Gastos de Terceiros",
                  kaxxa: "Nativa e Automática",
                  apps: "Inexistente",
                  sheets: "Manual e complexo"
                },
                {
                  feature: "Simulador de Amortização (Avalanche)",
                  kaxxa: "Tempo Real com Curva de Juros",
                  apps: "Inexistente",
                  sheets: "Exige fórmulas avançadas"
                },
                {
                  feature: "Indicação do Melhor Cartão do Dia",
                  kaxxa: "Algoritmo de Fechamento Integrado",
                  apps: "Não possui",
                  sheets: "Inviável na prática"
                },
                {
                  feature: "Ambiente Limpo e Sem Publicidade",
                  kaxxa: "100% Silencioso e Privado",
                  apps: "Cheio de ofertas de empréstimos",
                  sheets: "Sim"
                },
                {
                  feature: "Modo Discreto / Ocultar Saldos",
                  kaxxa: "1 Clique Global",
                  apps: "Raro ou incompleto",
                  sheets: "Não possui"
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td className="py-4 px-6 font-medium text-[#181B22]">{row.feature}</td>
                  <td className="py-4 px-6 font-bold text-[#1A44C8] bg-[#1A44C8]/5 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#1A44C8] shrink-0" />
                    <span>{row.kaxxa}</span>
                  </td>
                  <td className="py-4 px-6 text-[#94A3B8] font-medium">{row.apps}</td>
                  <td className="py-4 px-6 text-[#94A3B8] font-medium">{row.sheets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

      {/* 7. PLANOS & ASSINATURA (#PLANOS) */}
      <section id="planos" className="py-24 px-6 max-w-5xl mx-auto relative z-10 text-center">
        
        <div className="mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A44C8] font-bold">
            [ 04 // ACESSO AO SISTEMA ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#181B22] tracking-tight mt-2">
            Acesso completo e irrestrito.
          </h2>
          <p className="text-sm text-[#64748B] font-medium mt-3 max-w-md mx-auto">
            Sem pegadinhas, sem anúncios e com total controle dos seus dados.
          </p>

          {/* Badge Plano Único */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A44C8]/10 border border-[#1A44C8]/20 text-[#1A44C8] text-xs font-bold shadow-sm">
            <Sparkles size={14} />
            <span>Plano Único Mensal • Sem Fidelidade</span>
          </div>
        </div>

        {/* Card do Plano */}
        <div className="relative mx-auto max-w-3xl">
          <div className="relative rounded-3xl border border-[#E5E7EB] bg-[#FFFFFF] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between text-left gap-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
            
            <div className="flex-1 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#1A44C8]">Acesso Completo</span>
                <h3 className="text-2xl font-extrabold text-[#181B22] mt-1">Assinatura Kaxxa</h3>
                <p className="text-xs text-[#64748B] font-medium mt-1">Controle total e previsibilidade para sua rotina financeira.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#181B22]">
                {[
                  "Contas e transações ilimitadas",
                  "Gestão avançada de terceiros",
                  "Inteligência de faturas e cartões",
                  "Simulação de quitação de dívidas",
                  "Modo privacidade em 1 clique",
                  "Exportação de dados & relatórios",
                  "Atualizações contínuas",
                  "Suporte prioritário"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#1A44C8]/10 text-[#1A44C8] flex items-center justify-center shrink-0">
                      <Check size={11} />
                    </div>
                    <span className="font-medium text-[#64748B]">{item}</span>
                  </div>
                ))}
              </div>

              {/* Formas de pagamento aceitas */}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-4 text-xs text-[#64748B]">
                <span className="text-[11px] font-bold text-[#181B22]">Pagamento instantâneo:</span>
                <div className="flex items-center gap-1.5 font-bold text-[#008A7C]">
                  <PixIcon size={14} color="#32BCAD" />
                  <span>PIX Imediato</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-[#1A44C8]">
                  <CreditCard size={14} />
                  <span>Cartão de Crédito</span>
                </div>
              </div>
            </div>

            {/* Caixa de Preço */}
            <div className="w-full md:w-72 p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col items-center justify-center text-center shrink-0 shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A44C8] bg-[#1A44C8]/10 px-2.5 py-0.5 rounded-full">
                Assinatura Mensal
              </span>
              
              <div className="flex items-start justify-center gap-1 my-3">
                <span className="text-[#64748B] text-sm mt-1 font-bold">R$</span>
                <span className="text-5xl font-extrabold text-[#181B22] tracking-tight tabular-nums">
                  39,90
                </span>
                <span className="text-[#64748B] text-xs self-end mb-1.5 font-bold">/mês</span>
              </div>

              <p className="text-[11px] text-[#64748B] font-medium mb-5">
                Sem fidelidade. Cancele quando quiser em 1 clique.
              </p>

              <Link 
                href="/planos" 
                className="w-full py-3.5 rounded-xl bg-[#1A44C8] hover:bg-[#1538A5] text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md text-center flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Assinar Agora</span>
                <ArrowRight size={14} />
              </Link>

              <span className="text-[10px] text-[#059669] font-bold mt-3 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Garantia de 7 dias
              </span>
            </div>

          </div>
        </div>

      </section>

      {/* 8. SEÇÃO FAQ DE QUEBRA DE OBJEÇÕES (#DUVIDAS) */}
      <section id="duvidas" className="py-24 px-6 max-w-4xl mx-auto relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A44C8] font-bold">
            [ 05 // DÚVIDAS FREQUENTES ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#181B22] tracking-tight mt-2">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-[#64748B] font-medium mt-3">
            Tudo o que você precisa saber sobre a segurança, privacidade e funcionamento do Kaxxa.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "O Kaxxa pede senhas do meu banco ou pode movimentar meu dinheiro?",
              a: "Absolutamente não! O Kaxxa opera com total independência bancária, sem nunca solicitar senhas de banco ou chaves de transferência. Você mantém controle soberano e privacidade total dos seus dados."
            },
            {
              q: "O que torna o Kaxxa diferente de planilhas de Excel ou outros aplicativos?",
              a: "Planilhas são manuais, quebram fórmulas e exigem horas de manutenção. Outros aplicativos de mercado enchem a sua tela de anúncios tentando vender empréstimos caros. O Kaxxa é 100% silencioso e o único com Gestão de Terceiros nativa (separando faturas de quem pegou seu cartão emprestado), Simulador de Amortização Antecipada e Radar do Melhor Cartão de compra do dia."
            },
            {
              q: "Como funciona a Garantia de 7 Dias?",
              a: "Você assina com total tranquilidade. Se dentro de 7 dias você sentir que o Kaxxa não transformou sua rotina financeira, basta solicitar o cancelamento diretamente no painel e seu valor é estornado sem burocracia ou perguntas."
            },
            {
              q: "Tem fidelidade ou multa se eu quiser cancelar?",
              a: "Zero fidelidade e zero multas. Você tem total liberdade e pode pausar ou cancelar sua assinatura mensal com um único clique a qualquer momento no seu painel de configurações."
            },
            {
              q: "Posso acessar pelo celular e pelo computador?",
              a: "Sim! O Kaxxa foi projetado como uma plataforma web ultrarrápida e responsiva, com experiência fluida e moderna em qualquer smartphone, tablet ou computador."
            },
            {
              q: "Quais são as formas de pagamento disponíveis?",
              a: "Aceitamos PIX instantâneo (com aprovação e liberação imediata em segundos) e Cartão de Crédito com opção de renovação mensal automática ou avulsa."
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xs overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#181B22] hover:text-[#1A44C8] transition-colors"
              >
                <span>{item.q}</span>
                <span className="shrink-0 text-[#64748B]">
                  {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#F1F5F9] pt-3 animate-in fade-in duration-200">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* 9. BANNER FINAL DE CONVERSÃO */}
      <section className="py-20 px-6 max-w-5xl mx-auto relative z-10 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A44C8] via-[#1538A5] to-[#0A1B54] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          
          {/* Luzes internas decorativas */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#00A3FF]/25 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#059669]/25 rounded-full blur-[70px] pointer-events-none" />

          <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-block mb-4">
            ACESSO IMEDIATO
          </span>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Comece hoje a cuidar do seu dinheiro como os grandes investidores.
          </h2>

          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto mt-4 leading-relaxed font-normal">
            Assine por apenas R$ 39,90/mês, use por 7 dias com garantia incondicional e sinta a clareza de ter controle definitivo sobre cada centavo.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/planos"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#1A44C8] hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Garantir Minha Assinatura</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-[11px] text-blue-200 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#34D399]" />
              Garantia de 7 dias
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#34D399]" />
              Sem fidelidade, cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#38BDF8]" />
              Liberação imediata via Pix & Cartão
            </span>
          </div>

        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-[#FFFFFF] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg border border-[#E5E7EB] flex items-center justify-center bg-[#F8FAFC]">
              <KaxxaLogo size={16} />
            </div>
            <KaxxaWordmark className="text-xs" />
            <span className="text-[10px] text-[#94A3B8] ml-2 font-medium">© {new Date().getFullYear()} Kaxxa Inc. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#64748B] font-medium">
            <Link href="/dashboard" className="hover:text-[#181B22] transition-colors">Painel</Link>
            <Link href="/login" className="hover:text-[#181B22] transition-colors">Segurança</Link>
            <Link href="/login" className="hover:text-[#181B22] transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-[#181B22] transition-colors">Privacidade</Link>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#1A44C8] bg-[#1A44C8]/10 px-2.5 py-1 rounded-full border border-[#1A44C8]/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A44C8]"></span>
            Sistemas Operacionais 100% Online
          </div>

        </div>
      </footer>

    </div>
  );
}
