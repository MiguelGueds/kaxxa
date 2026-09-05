'use client';

import React, { useState } from 'react';
import { PixIcon } from './PixLogo';

interface BankLogoProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Mapeamento completo de nomes e variações para os arquivos PNG na pasta /logos/bancos/
function getBankSlug(rawName: string): string {
  const n = (rawName || '').toLowerCase().trim();

  // Mapeamentos específicos dos arquivos presentes em public/logos/bancos/
  if (n.includes('99') || n.includes('99pay') || n.includes('99bank')) return '99bank';
  if (n.includes('ourocard')) return 'ourocard';
  if (n.includes('brasil') || n.includes('bb') || n.includes('bancodobrasil')) return 'bancodobrasil';
  if (n.includes('btg')) return 'btg';
  if (n.includes('caixa') || n.includes('cef')) return 'caixa';
  if (n.includes('c&a') || n.includes('ceapay') || n.includes('cea')) return 'ceapay';
  if (n.includes('daycoval')) return 'daycoval';
  if (n.includes('emmanuelle')) return 'emmanuelle';
  if (n.includes('inter')) return 'inter';
  if (n.includes('itaú') || n.includes('itau') || n.includes('personnalité') || n.includes('personnalite')) return 'itau';
  if (n.includes('mercado pago') || n.includes('mercadopago') || n.includes('mp')) return 'mercadopago';
  if (n.includes('nubank') || n.includes('nu ') || n.includes('ultravioleta') || n === 'nu') return 'nubank';
  if (n.includes('picpay') || n.includes('pic pay')) return 'picpay';
  if (n.includes('recargapay') || n.includes('recarga pay')) return 'recargapay';
  if (n.includes('renner') || n.includes('realize')) return 'renner';
  if (n.includes('riachuelo') || n.includes('midway')) return 'riachuelo';
  if (n.includes('santander')) return 'santander';
  if (n.includes('sofisa')) return 'sofisa';

  // Outros bancos comuns (caso sejam adicionados futuramente)
  if (n.includes('bradesco')) return 'bradesco';
  if (n.includes('xp')) return 'xp';
  if (n.includes('c6')) return 'c6';
  if (n.includes('safra')) return 'safra';
  if (n.includes('sicoob')) return 'sicoob';
  if (n.includes('sicredi')) return 'sicredi';

  return n.replace(/[^a-z0-9]/g, '');
}

// Configuração visual de cores e iniciais de fallback caso a imagem falhe
function getBankBadgeConfig(rawName: string): { label: string; bg: string; text: string } {
  const n = (rawName || '').toLowerCase().trim();

  if (n.includes('santander')) return { label: 'S', bg: 'bg-[#EC0000]', text: 'text-white' };
  if (n.includes('itaú') || n.includes('itau') || n.includes('personnalité')) return { label: 'IT', bg: 'bg-[#EC7000]', text: 'text-white' };
  if (n.includes('nubank') || n.includes('nu ') || n.includes('ultravioleta')) return { label: 'NU', bg: 'bg-[#820AD1]', text: 'text-white' };
  if (n.includes('bradesco')) return { label: 'B', bg: 'bg-[#CC092F]', text: 'text-white' };
  if (n.includes('xp')) return { label: 'XP', bg: 'bg-[#15171D]', text: 'text-white' };
  if (n.includes('btg')) return { label: 'BTG', bg: 'bg-[#0B1E36]', text: 'text-white' };
  if (n.includes('inter')) return { label: 'IN', bg: 'bg-[#FF7A00]', text: 'text-white' };
  if (n.includes('c6')) return { label: 'C6', bg: 'bg-[#242424]', text: 'text-white' };
  if (n.includes('mercado pago') || n.includes('mercadopago') || n.includes('mp')) return { label: 'MP', bg: 'bg-[#009EE3]', text: 'text-white' };
  if (n.includes('caixa')) return { label: 'CX', bg: 'bg-[#005CA9]', text: 'text-white' };
  if (n.includes('brasil') || n.includes('bb') || n.includes('ourocard')) return { label: 'BB', bg: 'bg-[#F8D117]', text: 'text-[#003882]' };
  if (n.includes('picpay')) return { label: 'PP', bg: 'bg-[#11C76F]', text: 'text-white' };
  if (n.includes('daycoval')) return { label: 'DY', bg: 'bg-[#003865]', text: 'text-white' };
  if (n.includes('sofisa')) return { label: 'SF', bg: 'bg-[#E30613]', text: 'text-white' };
  if (n.includes('renner')) return { label: 'RN', bg: 'bg-[#CC0000]', text: 'text-white' };
  if (n.includes('riachuelo')) return { label: 'RH', bg: 'bg-[#1E1E1E]', text: 'text-white' };
  if (n.includes('99')) return { label: '99', bg: 'bg-[#FFDE00]', text: 'text-black' };

  // Fallback genérico
  const initials = (rawName || 'BK')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return { label: initials || 'B', bg: 'bg-[#181A20]', text: 'text-blue-400' };
}

export function BankLogo({ name, size = 'md', className = '' }: BankLogoProps) {
  const [imgError, setImgError] = useState(false);
  const slug = getBankSlug(name);
  const badgeConfig = getBankBadgeConfig(name);

  // Dimensões arredondadas (rounded-full) com proporção 1:1 e padding interno de encaixe perfeito
  const sizeConfig = {
    xs: { wrapper: 'w-6 h-6 min-w-[24px] min-h-[24px] p-0.5', text: 'text-[9px]' },
    sm: { wrapper: 'w-8 h-8 min-w-[32px] min-h-[32px] p-1', text: 'text-[11px]' },
    md: { wrapper: 'w-10 h-10 min-w-[40px] min-h-[40px] p-1.5', text: 'text-xs' },
    lg: { wrapper: 'w-12 h-12 min-w-[48px] min-h-[48px] p-2', text: 'text-sm' },
    xl: { wrapper: 'w-16 h-16 min-w-[64px] min-h-[64px] p-2.5', text: 'text-base' },
  }[size];

  // Se o método for PIX, renderiza o logo oficial vetorial do Banco Central
  if ((name || '').toLowerCase().includes('pix')) {
    const iconSize = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    }[size];
    return (
      <div 
        className={`rounded-full aspect-square shrink-0 flex items-center justify-center bg-[#32BCAD]/15 border border-[#32BCAD]/30 shadow-2xs ${sizeConfig.wrapper} ${className}`}
        title={name}
      >
        <PixIcon size={iconSize} color="#008A7C" />
      </div>
    );
  }

  // 1. Se existir imagem PNG na pasta /logos/bancos/, renderiza em container 100% arredondado com encaixe total (object-contain)
  if (!imgError && slug) {
    return (
      <div 
        className={`rounded-full aspect-square shrink-0 flex items-center justify-center bg-[#181B24] border border-white/[0.12] shadow-sm overflow-hidden ${sizeConfig.wrapper} ${className}`}
        title={name}
      >
        <img
          src={`/logos/bancos/${slug}.png`}
          alt={name}
          className="w-full h-full object-contain rounded-full select-none pointer-events-none"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 2. Fallback: Badge 100% arredondado com as cores e inicial característica do banco
  return (
    <div 
      className={`rounded-full aspect-square shrink-0 flex items-center justify-center font-black shadow-sm select-none tracking-tight border border-white/[0.08] ${sizeConfig.wrapper} ${sizeConfig.text} ${badgeConfig.bg} ${badgeConfig.text} ${className}`} 
      title={name}
    >
      {badgeConfig.label}
    </div>
  );
}
