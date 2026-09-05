'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Trophy,
  ArrowRight,
  PieChart
} from 'lucide-react';

const COLOR_OPTIONS = [
  {
    id: 'emerald',
    name: '1. Esmeralda & Menta Líquida',
    tag: 'Riqueza & Capital',
    primary: '#1A44C8',
    secondary: '#60A5FA',
    primaryHex: '#1A44C8',
    secondaryHex: '#60A5FA',
    desc: 'A clássica identidade de dinheiro, rentabilidade e solidez patrimonial. Elimina o ar genérico do azul corporativo.',
    cardBg: 'from-[#0F172A] to-[#042F2E]',
    badgeBg: 'bg-[#1A44C8]/10 text-[#1A44C8] border-[#1A44C8]/20',
    btnColor: 'bg-[#1A44C8] hover:bg-[#1538A5]'
  },
  {
    id: 'indigo',
    name: '2. Electric Indigo & Íris',
    tag: 'High-Tech & Elite',
    primary: '#4F46E5',
    secondary: '#818CF8',
    primaryHex: '#4F46E5',
    secondaryHex: '#818CF8',
    desc: 'Estilo Silicon Valley (Linear / Stripe). Magnético, moderno e muito mais sofisticado que o azul tradicional.',
    cardBg: 'from-[#0F172A] to-[#1E1B4B]',
    badgeBg: 'bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20',
    btnColor: 'bg-[#4F46E5] hover:bg-[#4338CA]'
  },
  {
    id: 'gold',
    name: '3. Obsidian Noir & Ouro Champanhe',
    tag: 'Quiet Luxury & Black Card',
    primary: '#0F172A',
    secondary: '#D97706',
    primaryHex: '#0F172A',
    secondaryHex: '#D97706',
    desc: 'Luxo silencioso de private banking internacional. Preto ônix com detalhes em ouro nobre acetinado.',
    cardBg: 'from-[#181B22] to-[#0B0C0E]',
    badgeBg: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
    btnColor: 'bg-[#0F172A] hover:bg-[#1E293B]'
  },
  {
    id: 'terracotta',
    name: '4. Cobre & Terracota Nórdico',
    tag: 'Design Studio & Editorial',
    primary: '#EA580C',
    secondary: '#FB923C',
    primaryHex: '#EA580C',
    secondaryHex: '#FB923C',
    desc: 'Design escandinavo refinado, aconchegante e diferenciado de 99% das ferramentas financeiras.',
    cardBg: 'from-[#1C1917] to-[#292524]',
    badgeBg: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20',
    btnColor: 'bg-[#EA580C] hover:bg-[#C2410C]'
  }
];

export default function LogosShowcasePage() {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('emerald');

  const current = COLOR_OPTIONS.find(c => c.id === selectedPaletteId) || COLOR_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#181B22] font-sans selection:bg-[#181B22] selection:text-white pb-20">
      
      {/* Top Header */}
      <header className="border-b border-[#E5E7EB] bg-[#FFFFFF]/90 py-4 px-6 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#181B22] transition-colors">
            <ArrowLeft size={16} />
            <span>Voltar para Início</span>
          </Link>
          <div className="text-xs font-mono font-bold uppercase tracking-widest px-3.5 py-1 rounded-full border flex items-center gap-2 bg-[#FFFFFF] border-[#E5E7EB] text-[#181B22] shadow-sm">
            <Trophy size={13} className="text-amber-500" />
            <span>Estúdio Visual de Cores • KΛXXΛ</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-10">
        
        {/* Título Principal */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] text-[#64748B] font-bold shadow-sm">
            Comparação Visual ao Vivo
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181B22] tracking-tight">
            Qual dessas cores combina mais com o Kaxxa?
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
            Clique nas opções abaixo para visualizar a <strong>logo oficial</strong>, os <strong>Bento Cards</strong>, os <strong>gráficos</strong> e o <strong>cartão</strong> reagirem instantaneamente.
          </p>
        </div>

        {/* 4 CARDS SELETORES DE PALETAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLOR_OPTIONS.map((opt) => {
            const isSelected = selectedPaletteId === opt.id;

            return (
              <div 
                key={opt.id}
                onClick={() => setSelectedPaletteId(opt.id)}
                className={`rounded-3xl border-2 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                  isSelected 
                    ? 'bg-[#FFFFFF] shadow-xl scale-[1.03]' 
                    : 'bg-[#FFFFFF]/70 border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#FFFFFF] shadow-sm'
                }`}
                style={{
                  borderColor: isSelected ? opt.primaryHex : undefined
                }}
              >
                {isSelected && (
                  <div 
                    className="absolute top-3 right-3 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: opt.primaryHex }}
                  >
                    <Check size={10} strokeWidth={3} />
                    Ativa
                  </div>
                )}

                <div>
                  {/* Cores Indicadoras */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: opt.primaryHex }}></span>
                    <span className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: opt.secondaryHex }}></span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: opt.primaryHex }}>
                    {opt.tag}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#181B22] mb-1.5">{opt.name}</h3>
                  <p className="text-[11px] text-[#64748B] font-medium leading-relaxed mb-4">{opt.desc}</p>
                </div>

                <button 
                  className={`w-full py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    isSelected 
                      ? 'text-white shadow-md' 
                      : 'bg-[#F1F3F7] text-[#181B22] hover:bg-[#E5E7EB]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? opt.primaryHex : undefined
                  }}
                >
                  {isSelected ? 'Simulando ao Vivo' : 'Visualizar Paleta'}
                </button>
              </div>
            );
          })}
        </div>

        {/* =========================================================
            SIMULADOR REALÍSTICO AO VIVO
        ========================================================= */}
        <div className="rounded-3xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 sm:p-10 shadow-lg space-y-8">
          
          {/* Header do Simulador com a Logo Dinâmica */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-center shadow-md">
                <svg width="56" height="42" viewBox="0 0 68 52" fill="none">
                  <path 
                    d="M12 10C12 10 24 10 28 10C36 10 40 16 42 22H52C55.3 22 58 19.3 58 16V10H64V16C64 22.6 58.6 28 52 28H28C19.2 28 12 20.8 12 12V10Z" 
                    fill={current.primaryHex} 
                  />
                  <rect x="28" y="24" width="12" height="4" rx="2" fill="#FFFFFF" />
                  <path 
                    d="M56 42C56 42 44 42 40 42C32 42 28 36 26 30H16C12.7 30 10 32.7 10 36V42H4V36C4 29.4 9.4 24 16 24H40C48.8 24 56 31.2 56 40V42Z" 
                    fill={current.secondaryHex} 
                  />
                </svg>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-[0.16em] uppercase flex items-center text-[#181B22]">
                  <span>K</span>
                  <span style={{ color: current.primaryHex }}>Λ</span>
                  <span>X</span>
                  <span style={{ color: current.secondaryHex }}>X</span>
                  <span>Λ</span>
                </div>
                <p className="text-xs text-[#64748B] font-medium mt-1">
                  {current.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                className="px-6 py-3 rounded-full text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: current.primaryHex }}
              >
                <span>Novo Lançamento</span>
                <ArrowRight size={13} />
              </button>
              <div 
                className="px-3.5 py-1.5 rounded-full text-[10px] font-bold border font-mono uppercase tracking-wider"
                style={{ 
                  color: current.primaryHex, 
                  backgroundColor: current.primaryHex + '15',
                  borderColor: current.primaryHex + '30'
                }}
              >
                PRO ACCOUNT
              </div>
            </div>
          </div>

          {/* Grid de Demonstração dos Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Bento Card 1: Patrimônio com Curva Gráfica */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Patrimônio Líquido</span>
                <span 
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ 
                    color: current.primaryHex, 
                    backgroundColor: current.primaryHex + '18' 
                  }}
                >
                  + 18.4% a.a.
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#181B22] tracking-tight">R$ 84.300,50</h3>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Rentabilidade acumulada no ano</p>
              </div>

              {/* Gráfico Curva SVG */}
              <div className="h-12 w-full pt-1">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <path 
                    d="M0 32 Q 40 28, 80 18 T 140 14 T 200 6" 
                    fill="none" 
                    stroke={current.primaryHex} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                  />
                </svg>
              </div>
            </div>

            {/* Bento Card 2: Caixa & Meta de Reservas */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Caixa & Reservas</span>
                <span className="text-[10px] font-mono text-[#94A3B8] font-bold">LIQUIDEZ D+0</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#181B22] tracking-tight">R$ 28.450,00</h3>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Nubank + Itaú Personnalité</p>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[#64748B]">Progresso Meta</span>
                  <span style={{ color: current.primaryHex }}>74%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div 
                    className="h-full rounded-full w-[74%]" 
                    style={{ backgroundColor: current.primaryHex }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Cartão Kaxxa Black Metal com Acabamento */}
            <div className={`p-6 rounded-2xl text-white flex flex-col justify-between h-44 shadow-xl relative overflow-hidden bg-gradient-to-br ${current.cardBg} border border-white/10`}>
              <div className="flex justify-between items-center">
                <div className="w-7 h-5 rounded bg-amber-400/80 shadow-inner"></div>
                <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">KAXXA PRIVATE</span>
              </div>

              <div>
                <p className="text-[10px] font-mono text-[#94A3B8] tracking-widest">•••• •••• •••• 8842</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs font-bold text-white tracking-wide">MIGUEL GUEDES</span>
                  <span 
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded border"
                    style={{ 
                      color: current.secondaryHex,
                      backgroundColor: current.primaryHex + '35',
                      borderColor: current.secondaryHex + '50'
                    }}
                  >
                    VIP BLACK
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
