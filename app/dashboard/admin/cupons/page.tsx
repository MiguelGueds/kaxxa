'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Ticket, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Share2, 
  Sparkles, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';

interface CouponItem {
  id: string;
  code: string;
  type: 'TRIAL_DAYS' | 'PERCENT' | 'FIXED';
  value: number;
  max_uses: number;
  used_count: number;
  discount_duration_months?: number;
  created_at: string;
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'TRIAL_DAYS' | 'PERCENT' | 'FIXED'>('TRIAL_DAYS');
  const [newCouponValue, setNewCouponValue] = useState<number>(2);
  const [newCouponDurationMonths, setNewCouponDurationMonths] = useState<number>(1);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(1);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || '';
      if (!isAdminEmail(email)) {
        router.replace('/dashboard');
        return;
      }
      loadCoupons();
    });
  }, [router]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      let apiCoupons: CouponItem[] = data.coupons || [];

      // Mescla com localStorage para resiliência imediata
      const localStored = localStorage.getItem('kaxxa_admin_coupons');
      let localCoupons: CouponItem[] = [];
      if (localStored) {
        try { localCoupons = JSON.parse(localStored); } catch {}
      }

      const mergedMap = new Map<string, CouponItem>();
      for (const c of localCoupons) {
        mergedMap.set(c.code, c);
      }
      for (const c of apiCoupons) {
        mergedMap.set(c.code, c);
      }

      const finalCoupons = Array.from(mergedMap.values());
      setCoupons(finalCoupons);
      localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(finalCoupons));
    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
      const localStored = localStorage.getItem('kaxxa_admin_coupons');
      if (localStored) {
        try { setCoupons(JSON.parse(localStored)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      setErrorMsg('Informe o código do cupom.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        code: newCouponCode.trim().toUpperCase(),
        type: newCouponType,
        value: newCouponValue,
        maxUses: newCouponMaxUses,
        discountDurationMonths: newCouponType === 'TRIAL_DAYS' ? 1 : newCouponDurationMonths
      };

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar cupom');
      }

      const createdItem: CouponItem = data.coupon || {
        id: 'cupom_' + Date.now(),
        code: payload.code,
        type: payload.type,
        value: payload.value,
        max_uses: payload.maxUses,
        used_count: 0,
        discount_duration_months: payload.discountDurationMonths,
        created_at: new Date().toISOString()
      };

      const updated = [createdItem, ...coupons.filter(c => c.code !== createdItem.code)];
      setCoupons(updated);
      localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(updated));

      setSuccessMsg(`Cupom "${payload.code}" criado com sucesso!`);
      setNewCouponCode('');
      setNewCouponValue(newCouponType === 'TRIAL_DAYS' ? 2 : 20);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar cupom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const updated = coupons.filter(c => c.id !== id);
      setCoupons(updated);
      localStorage.setItem('kaxxa_admin_coupons', JSON.stringify(updated));
    } catch (err) {
      console.error('Erro ao excluir cupom:', err);
    }
  };

  const generateRandomCouponCode = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = newCouponType === 'TRIAL_DAYS' ? 'TESTE' : 'PROMO';
    setNewCouponCode(`${prefix}-${randomSuffix}`);
  };

  const handleCopyCouponCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2500);
  };

  const handleCopyCouponLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.kaxxa.com.br';
    const link = `${origin}/planos?cupom=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in-up w-full space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#1A44C8] text-white rounded-md shadow-sm">
              Administração
            </span>
            <span className="text-xs text-[#64748B] font-medium">somoskaxxa@gmail.com</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#181B22] mt-1">Cupons</h1>
          <p className="text-xs text-[#64748B]">Crie cupons de degustação gratuita ou descontos promocionais para seus clientes.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin')}
            className="py-2 px-3 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#64748B] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft size={13} />
            <span>Voltar para Gestão</span>
          </button>

          <button
            type="button"
            onClick={loadCoupons}
            className="py-2 px-3 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#181B22] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Formulário de Criação de Cupom */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A44C8] flex items-center justify-center shrink-0">
            <Plus size={14} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#181B22]">Gerar Novo Cupom</h2>
            <p className="text-[11px] text-[#64748B]">Defina o código, o benefício concedido e a quantidade de utilizações.</p>
          </div>
        </div>

        <form onSubmit={handleCreateCoupon} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            
            {/* Código do Cupom */}
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Código do Cupom
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ex: DEGUSTA2DIAS"
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#181B22] uppercase focus:outline-none focus:border-[#1A44C8]"
                />
                <button
                  type="button"
                  onClick={generateRandomCouponCode}
                  className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] rounded-xl text-[10px] font-bold text-[#1A44C8] shrink-0"
                  title="Gerar código aleatório"
                >
                  <Sparkles size={12} className="inline mr-1" />
                  Aleatório
                </button>
              </div>
            </div>

            {/* Tipo de Benefício */}
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Tipo de Benefício
              </label>
              <select
                value={newCouponType}
                onChange={e => {
                  const t = e.target.value as any;
                  setNewCouponType(t);
                  if (t === 'TRIAL_DAYS') setNewCouponValue(2);
                  if (t === 'PERCENT') setNewCouponValue(20);
                  if (t === 'FIXED') setNewCouponValue(10);
                }}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
              >
                <option value="TRIAL_DAYS">Dias de Teste Grátis (Degustação)</option>
                <option value="PERCENT">Desconto Percentual (%)</option>
                <option value="FIXED">Desconto em Reais (R$)</option>
              </select>
            </div>

            {/* Valor do Benefício */}
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                {newCouponType === 'TRIAL_DAYS' ? 'Dias de Degustação' : newCouponType === 'PERCENT' ? 'Porcentagem de Desconto (%)' : 'Valor do Desconto (R$)'}
              </label>
              {newCouponType === 'TRIAL_DAYS' ? (
                <select
                  value={newCouponValue}
                  onChange={e => setNewCouponValue(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                >
                  <option value={1}>1 Dia de Degustação</option>
                  <option value={2}>2 Dias (Recomendado)</option>
                  <option value={3}>3 Dias</option>
                  <option value={7}>7 Dias</option>
                  <option value={14}>14 Dias</option>
                  <option value={30}>30 Dias</option>
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  max={newCouponType === 'PERCENT' ? '100' : '39.90'}
                  value={newCouponValue}
                  onChange={e => setNewCouponValue(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                />
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Limite de Usos */}
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Limite de Utilizações
              </label>
              <select
                value={newCouponMaxUses}
                onChange={e => setNewCouponMaxUses(Number(e.target.value))}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
              >
                <option value={1}>1 Uso (Descartável - Uso Único)</option>
                <option value={2}>2 Usos</option>
                <option value={5}>5 Usos</option>
                <option value={10}>10 Usos</option>
                <option value={999999}>Ilimitado</option>
              </select>
            </div>

            {/* Duração se for desconto */}
            {newCouponType !== 'TRIAL_DAYS' && (
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Validade do Desconto
                </label>
                <select
                  value={newCouponDurationMonths}
                  onChange={e => setNewCouponDurationMonths(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#181B22] focus:outline-none focus:border-[#1A44C8]"
                >
                  <option value={1}>Apenas no 1º mês</option>
                  <option value={2}>Nos 2 primeiros meses</option>
                  <option value={3}>Nos 3 primeiros meses</option>
                  <option value={0}>Todos os meses (Recorrência Contínua)</option>
                </select>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-bold">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold">
              {successMsg}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#1A44C8] hover:bg-[#1538A5] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Plus size={13} />
              <span>{isSubmitting ? 'Gerando...' : 'Criar Cupom'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Cupons Existentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#181B22] uppercase tracking-wider">
            Cupons Cadastrados ({coupons.length})
          </h3>
          <span className="text-[11px] text-[#64748B]">
            Cada cupom pode ser enviado como código ou link direto
          </span>
        </div>

        {coupons.length === 0 ? (
          <div className="bg-white p-8 border border-dashed border-[#E5E7EB] rounded-2xl text-center space-y-1.5">
            <Ticket size={24} className="mx-auto text-slate-300" />
            <p className="text-xs text-[#64748B] font-bold">Nenhum cupom gerado ainda</p>
            <p className="text-[11px] text-slate-400">Gere seu primeiro cupom de teste para liberar acesso ao Kaxxa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coupons.map(coupon => {
              const isExhausted = coupon.used_count >= coupon.max_uses;
              const isCodeCopied = copiedCouponId === coupon.id;
              const isLinkCopied = copiedLinkId === coupon.id;

              let benefitLabel = `${coupon.value} Dias Grátis`;
              if (coupon.type === 'PERCENT') {
                const dur = coupon.discount_duration_months === 0 ? 'Vitalício' : coupon.discount_duration_months === 1 ? '1º mês' : `${coupon.discount_duration_months} meses`;
                benefitLabel = `${coupon.value}% OFF (${dur})`;
              } else if (coupon.type === 'FIXED') {
                const dur = coupon.discount_duration_months === 0 ? 'Vitalício' : coupon.discount_duration_months === 1 ? '1º mês' : `${coupon.discount_duration_months} meses`;
                benefitLabel = `R$ ${Number(coupon.value).toFixed(2).replace('.', ',')} OFF (${dur})`;
              }

              return (
                <div 
                  key={coupon.id} 
                  className={`p-4 bg-white border rounded-2xl space-y-3 shadow-sm transition-all ${
                    isExhausted ? 'border-slate-200 opacity-75' : 'border-[#E5E7EB] hover:border-[#1A44C8]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-[#181B22] tracking-wider bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {coupon.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          coupon.type === 'TRIAL_DAYS' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {benefitLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        {isExhausted ? (
                          <span className="text-rose-600 font-bold">Esgotado</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Disponível</span>
                        )}
                        <span className="text-[#64748B]">
                          • {coupon.used_count || 0} de {coupon.max_uses || 1} {coupon.max_uses === 1 ? 'uso' : 'usos'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Excluir cupom"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#181B22] rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                    >
                      {isCodeCopied ? (
                        <>
                          <Check size={12} className="text-[#059669]" />
                          <span className="text-[#059669]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyCouponLink(coupon.code, coupon.id)}
                      className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1A44C8] rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                    >
                      {isLinkCopied ? (
                        <>
                          <Check size={12} className="text-[#059669]" />
                          <span className="text-[#059669]">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={12} />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

