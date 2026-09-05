'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingDown, Users, CheckCircle2, ShieldCheck } from 'lucide-react';

export function RoiCalculator() {
  const [thirdPartyValue, setThirdPartyValue] = useState(1200);
  const [debtValue, setDebtValue] = useState(35000);

  // Estimativa conservadora de recuperação de despesas com terceiros esquecidas (15% a 20%)
  const recoveredThirdPartyMonth = Math.round(thirdPartyValue * 0.18);
  
  // Estimativa conservadora de juros poupados com quitação estratégica (média de 22% do saldo devedor)
  const savedInterestTotal = Math.round(debtValue * 0.24);

  // Economia no 1º ano
  const annualSaved = (recoveredThirdPartyMonth * 12) + Math.round(savedInterestTotal * 0.4);
  const subscriptionCostAnnual = 39.90 * 12;
  const roiMultiplier = Math.max(2, Math.round(annualSaved / subscriptionCostAnnual));

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xl max-w-4xl mx-auto text-left relative overflow-hidden">
      
      {/* Faixa decorativa no topo */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1A44C8] via-[#00A3FF] to-[#059669]" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A44C8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            SIMULADOR INTERATIVO DE ECONOMIA
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#181B22] mt-2">
            Quanto o Kaxxa coloca de volta no seu bolso?
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-1">
            Arraste os valores e veja o impacto real no seu orçamento logo nos primeiros 30 dias.
          </p>
        </div>

        <div className="shrink-0 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wide block">
            Retorno Estimado
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#059669]">
            {roiMultiplier}x o valor
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">da assinatura anual</span>
        </div>
      </div>

      {/* Sliders Interativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
        
        {/* Controle 1: Gastos com Terceiros */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
              <Users size={14} className="text-[#1A44C8]" />
              <span>Cartão emprestado ou contas divididas / mês</span>
            </label>
            <span className="text-sm font-black text-[#1A44C8] font-mono">
              R$ {thirdPartyValue.toLocaleString('pt-BR')}
            </span>
          </div>

          <input 
            type="range"
            min="0"
            max="6000"
            step="100"
            value={thirdPartyValue}
            onChange={(e) => setThirdPartyValue(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A44C8]"
          />

          <div className="flex justify-between text-[10px] text-[#94A3B8]">
            <span>R$ 0</span>
            <span>R$ 3.000</span>
            <span>R$ 6.000+</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#64748B] space-y-1">
            <p className="font-medium text-[#181B22] flex items-center gap-1">
              <CheckCircle2 size={13} className="text-[#059669] shrink-0" />
              <span>Blindagem de despesas esquecidas:</span>
            </p>
            <p className="text-[11px] text-[#64748B]">
              Com a segregação do Kaxxa e links diretos de cobrança PIX, você deixa de absorver em média <strong className="text-[#059669]">R$ {recoveredThirdPartyMonth.toLocaleString('pt-BR')}/mês</strong> que antes sumiam na sua fatura.
            </p>
          </div>
        </div>

        {/* Controle 2: Saldo Devedor / Financiamentos */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-[#181B22] flex items-center gap-1.5">
              <TrendingDown size={14} className="text-rose-500" />
              <span>Financiamentos, empréstimos ou dívidas ativas</span>
            </label>
            <span className="text-sm font-black text-[#181B22] font-mono">
              R$ {debtValue.toLocaleString('pt-BR')}
            </span>
          </div>

          <input 
            type="range"
            min="0"
            max="150000"
            step="5000"
            value={debtValue}
            onChange={(e) => setDebtValue(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
          />

          <div className="flex justify-between text-[10px] text-[#94A3B8]">
            <span>R$ 0</span>
            <span>R$ 75.000</span>
            <span>R$ 150.000+</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#64748B] space-y-1">
            <p className="font-medium text-[#181B22] flex items-center gap-1">
              <CheckCircle2 size={13} className="text-[#059669] shrink-0" />
              <span>Juros bancários eliminados:</span>
            </p>
            <p className="text-[11px] text-[#64748B]">
              O simulador Avalanche do Kaxxa direciona amortizações estratégicas, cortando até <strong className="text-[#059669]">R$ {savedInterestTotal.toLocaleString('pt-BR')}</strong> em juros compostos que iriam para os bancos.
            </p>
          </div>
        </div>

      </div>

      {/* Caixa de Conclusão / CTA de Fechamento */}
      <div className="pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-white to-emerald-50/50 p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#1A44C8]" />
            <span className="text-xs font-black text-[#181B22] uppercase tracking-wide">
              Economia Total Estimada no Ano:
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#059669] mt-0.5">
            + R$ {annualSaved.toLocaleString('pt-BR')}
          </p>
          <span className="text-[11px] text-[#64748B] font-medium">
            Assinatura Kaxxa: apenas R$ 39,90/mês (sem fidelidade)
          </span>
        </div>

        <Link
          href="/planos"
          className="w-full sm:w-auto px-6 py-3.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98 shrink-0"
        >
          <span>Quero Economizar Agora</span>
          <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
