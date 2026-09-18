'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, CreditCard, Landmark, MoreHorizontal, Plus, Search, TrendingUp, Wallet } from 'lucide-react';
import { accountsService, DbAccount } from '@/lib/services/accounts';
import { debtsService, DbDebt } from '@/lib/services/debts';
import { investmentsService, DbInvestment } from '@/lib/services/investments';
import { transactionsService, DbTransaction } from '@/lib/services/transactions';
import { cardsService, DbCard } from '@/lib/services/cards';
import { usePrivacy } from '@/app/contexts/PrivacyContext';
import { BankLogo } from '@/app/components/BankLogo';

const money = (value: number, concealed: boolean) => concealed ? '•••••' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const { isConcealed } = usePrivacy();
  const [accounts, setAccounts] = useState<DbAccount[]>([]);
  const [debts, setDebts] = useState<DbDebt[]>([]);
  const [investments, setInvestments] = useState<DbInvestment[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [cards, setCards] = useState<DbCard[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextAccounts, nextDebts, nextInvestments, nextTransactions, nextCards] = await Promise.all([
        accountsService.fetchAccounts(),
        debtsService.fetchDebts(),
        investmentsService.fetchInvestments(),
        transactionsService.fetchTransactions(100),
        cardsService.fetchCards(),
      ]);
      if (!active) return;
      setAccounts(nextAccounts || []);
      setDebts(nextDebts || []);
      setInvestments(nextInvestments || []);
      setTransactions(nextTransactions || []);
      setCards(nextCards || []);
    };
    load();
    const refresh = () => load();
    window.addEventListener('kaxxa_refresh_data', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('kaxxa_refresh_data', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const totalAccounts = accounts.reduce((sum, account) => sum + Number(account.balance ?? account.initial_balance ?? 0), 0);
  const totalInvestments = investments.reduce((sum, investment) => sum + Number(investment.current_value || investment.invested_amount || 0), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.current_balance || 0), 0);
  const totalCardLimit = cards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);
  const totalCardUsed = cards.reduce((sum, card) => sum + Number(card.limit_used || 0), 0);
  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter(transaction => !normalized || transaction.description.toLowerCase().includes(normalized)).slice(0, 6);
  }, [transactions, query]);

  const flow = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    return months.map((month, index) => {
      const monthTransactions = transactions.filter(transaction => new Date(`${transaction.date}T12:00:00`).getMonth() === index);
      const income = monthTransactions.filter(transaction => transaction.type === 'INCOME').reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0);
      const expense = monthTransactions.filter(transaction => transaction.type === 'EXPENSE').reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0);
      return { month, value: income || expense || 0 };
    });
  }, [transactions]);
  const maxFlow = Math.max(...flow.map(item => item.value), 1);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs text-slate-400">Visão geral</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Overview</h1><p className="text-xs text-slate-500">Aqui está o resumo dos seus dados financeiros.</p></div>
        <div className="flex items-center gap-2"><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Este mês</option><option>Este ano</option></select><Link href="/dashboard/configuracoes" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Resetar dados</Link></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/transacoes" className="group rounded-xl bg-emerald-600 p-5 text-white shadow-[0_12px_28px_rgba(5,150,105,0.2)]"><div className="flex items-center justify-between"><span className="text-sm font-medium">Meu saldo</span><MoreHorizontal className="h-4 w-4 opacity-70" /></div><p className="mt-1 text-[11px] text-emerald-100">Saldo total em contas correntes</p><div className="mt-5 flex items-end justify-between"><strong className="text-2xl font-semibold">R$ {money(totalAccounts, isConcealed)}</strong><ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></div><div className="mt-4 text-[11px] text-emerald-100">Ver detalhes <ChevronRight className="ml-1 inline h-3 w-3" /></div></Link>
        <Link href="/dashboard/transacoes" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Savings account</span><MoreHorizontal className="h-4 w-4 text-slate-400" /></div><p className="mt-1 text-[11px] text-slate-400">Saldo disponível</p><div className="mt-5 flex items-end justify-between"><strong className="text-2xl font-semibold text-slate-900">R$ {money(totalAccounts, isConcealed)}</strong><span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">{accounts.length} contas</span></div><div className="mt-4 text-[11px] text-slate-400">Ver resumo <ChevronRight className="ml-1 inline h-3 w-3" /></div></Link>
        <Link href="/dashboard/investimentos" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Investment portfolio</span><MoreHorizontal className="h-4 w-4 text-slate-400" /></div><p className="mt-1 text-[11px] text-slate-400">Valor total investido</p><div className="mt-5 flex items-end justify-between"><strong className="text-2xl font-semibold text-slate-900">R$ {money(totalInvestments, isConcealed)}</strong><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div className="mt-4 text-[11px] text-slate-400">Analisar performance <ChevronRight className="ml-1 inline h-3 w-3" /></div></Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">My Wallet</h2><p className="text-[11px] text-slate-400">Contas bancárias conectadas</p></div><Link href="/dashboard/configuracoes" className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Plus className="h-3.5 w-3.5" /> Add New</Link></div><div className="grid grid-cols-2 gap-3">{accounts.length === 0 ? <div className="col-span-2 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-400">Nenhuma conta cadastrada.</div> : accounts.map(account => <Link href="/dashboard/transacoes" key={account.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200"><div className="flex items-center justify-between"><BankLogo name={account.name} size="sm" /><span className="text-[10px] text-slate-400">{account.type}</span></div><p className="mt-3 truncate text-xs font-semibold text-slate-700">{account.name}</p><p className={`mt-1 text-sm font-semibold ${Number(account.balance) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>R$ {money(Number(account.balance ?? 0), isConcealed)}</p><span className="text-[10px] text-emerald-600">Ativa</span></Link>)}</div></section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">Cash Flow</h2><p className="text-[11px] text-slate-400">Entradas e saídas consolidadas</p></div><div className="flex items-center gap-2"><span className="text-xl font-semibold text-slate-900">R$ {money(totalAccounts + totalInvestments - totalDebts, isConcealed)}</span><BarChart3 className="h-4 w-4 text-emerald-600" /></div></div><div className="flex h-48 items-end gap-3 border-b border-slate-100 px-2">{flow.map((item, index) => <div key={item.month} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full max-w-10 rounded-t-md transition-all ${index === 2 ? 'bg-emerald-600' : 'bg-emerald-100'}`} style={{ height: `${Math.max(8, (item.value / maxFlow) * 135)}px` }} title={`R$ ${money(item.value, isConcealed)}`} /><span className="text-[10px] text-slate-400">{item.month}</span></div>)}</div><div className="mt-4 flex items-center justify-between text-[11px] text-slate-400"><span>Saldo em contas: R$ {money(totalAccounts, isConcealed)}</span><span>Cartões: R$ {money(totalCardUsed, isConcealed)} / {money(totalCardLimit, isConcealed)}</span></div></section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-800">Recent Activities</h2><p className="text-[11px] text-slate-400">Últimos lançamentos sincronizados</p></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400 sm:flex"><Search className="h-3.5 w-3.5" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search" className="w-32 outline-none" /></div><Link href="/dashboard/transacoes" className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">Ver tudo</Link></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-3">Activity</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Account</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{visibleTransactions.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Nenhuma atividade encontrada.</td></tr> : visibleTransactions.map(transaction => <tr key={transaction.id} className="border-b border-slate-50 text-slate-600"><td className="px-3 py-3 font-medium text-slate-800">{transaction.description}</td><td className="px-3 py-3">{new Date(`${transaction.date}T12:00:00`).toLocaleDateString('pt-BR')}</td><td className="px-3 py-3">{accounts.find(account => account.id === transaction.account_id)?.name || 'Conta'}</td><td className={`px-3 py-3 text-right font-semibold ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'}`}>{transaction.type === 'INCOME' ? '+' : '-'} R$ {money(Math.abs(Number(transaction.amount || 0)), isConcealed)}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">{transaction.is_paid === false ? 'Pending' : 'Completed'}</span></td></tr>)}</tbody></table></div></section>

      <div className="grid gap-4 md:grid-cols-3"><Link href="/dashboard/dividas" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-slate-500"><Landmark className="h-4 w-4" /><span className="text-xs">Dívidas ativas</span></div><strong className="mt-3 block text-xl text-slate-900">R$ {money(totalDebts, isConcealed)}</strong></Link><Link href="/dashboard/cartoes" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /><span className="text-xs">Faturas de cartão</span></div><strong className="mt-3 block text-xl text-slate-900">R$ {money(totalCardUsed, isConcealed)}</strong></Link><Link href="/dashboard/transacoes" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-slate-500"><Wallet className="h-4 w-4" /><span className="text-xs">Fluxo líquido</span></div><strong className="mt-3 block text-xl text-slate-900">R$ {money(totalAccounts - totalDebts, isConcealed)}</strong></Link></div>
    </div>
  );
}
