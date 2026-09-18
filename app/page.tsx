'use client';

import { ArrowDownRight, ArrowUpRight, Bell, ChevronDown, CreditCard, Home, MoreHorizontal, PiggyBank, Plus, ReceiptText, Search, Settings, Sparkles, TrendingUp, Wallet } from 'lucide-react';

const accounts = [
  { name: 'Visa', last4: '9213', balance: '$202,234.00', color: 'from-violet-500 to-purple-600' },
  { name: 'Citi', last4: '9213', balance: '$54,456.00', color: 'from-sky-500 to-cyan-600' },
  { name: 'Master', last4: '9213', balance: '$3,765.00', color: 'from-indigo-500 to-blue-700' },
];

const invoices = [
  { date: 'Jun 8', state: 'Paid', name: 'Noah Williams', value: '$160.00', paid: true },
  { date: 'Jun 10', state: 'Unpaid', name: 'Ava Thompson', value: '$160.00', paid: false },
  { date: 'Jun 12', state: 'Pending', name: 'Ethan Walker', value: '$150.00', paid: false },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] rounded-[30px] border border-[#dfe7ef] bg-[#edf1f5] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.55)]">
        <div className="flex min-h-[880px] overflow-hidden rounded-[24px] bg-[#f5f7f9]">
          <aside className="hidden w-[240px] border-r border-[#e2e8f0] bg-[#f8fafc] p-4 lg:block">
            <div className="mb-6 flex items-center gap-3 px-2 pt-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f2937] text-[10px] font-bold text-white">K</div>
              <div className="flex flex-1 items-center justify-between">
                <div><div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Agency</div><div className="text-sm font-semibold text-slate-800">Orbix Studio Team</div></div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <nav className="space-y-1.5">
              {['Home', 'Tasks', 'Transactions', 'Payments', 'Cards', 'Capital', 'Accounts', 'Workflows', 'Bill Pay', 'Invoicing'].map((label, index) => (
                <button key={label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${index === 0 ? 'bg-[#e9f0ff] text-[#1d4ed8]' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {index === 0 ? <Home className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f5f7fb] p-3">
              <div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white"><Sparkles className="h-4 w-4" /></div><div className="text-sm font-semibold text-slate-700">GlobalLink</div></div>
              <div className="space-y-2"><div className="text-sm text-slate-600">Accept credit cards and bank payments</div><button className="w-full rounded-xl bg-[#2b2d31] px-3 py-2.5 text-sm font-medium text-white">Set up now</button></div>
            </div>
          </aside>

          <section className="flex-1 bg-[#edf2f6] p-5 sm:p-6">
            <header className="mb-6 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">Monday, Jun 12, 2026</div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 shadow-sm md:flex"><Search className="h-4 w-4" /><span>Search...</span></div>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"><Settings className="h-4 w-4" /></button>
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" /></button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f0abfc] to-[#3730a3] text-sm font-semibold text-white">M</div>
              </div>
            </header>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">Welcome Back, Ali!</h1>
              <div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"><ArrowUpRight className="h-4 w-4" /> Request</button><button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"><ArrowDownRight className="h-4 w-4" /> Transfer</button><button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"><PiggyBank className="h-4 w-4" /> Deposit</button></div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.8fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-[22px] border border-[#e5e7eb] bg-white/80 p-4 shadow-sm">
                  <div className="mb-5 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[0.14em] text-slate-400">Overview</div><div className="mt-2 text-[13px] text-slate-500">Total Balance</div><div className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-slate-900">$32,940.093</div></div><div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600"><TrendingUp className="h-4 w-4 text-emerald-600" />+ $3,546.02</div></div>
                  <div className="rounded-[18px] border border-[#edf1f5] bg-[#f9fafb] p-3"><svg viewBox="0 0 700 220" className="h-[180px] w-full"><g opacity="0.5" stroke="#dfe7ef" strokeWidth="1">{[0, 1, 2, 3, 4, 5].map(line => <line key={line} x1="0" y1={20 + line * 35} x2="700" y2={20 + line * 35} />)}</g><path d="M 0 150 C 80 140, 120 100, 180 120 S 280 80, 360 95 S 470 105, 520 90 S 600 120, 700 60" fill="none" stroke="#0ea5e9" strokeWidth="3.5" strokeLinecap="round" /><path d="M 0 165 C 80 150, 120 130, 180 140 S 280 120, 360 128 S 470 140, 520 120 S 600 160, 700 88" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" /></svg></div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">{[['Money in', '$40,829.92', 'sky'], ['Money out', '$7,802.62', 'rose']].map(([label, value, tone]) => <div key={label} className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{label}</span>{label === 'Money in' ? <ArrowDownRight className="h-4 w-4 text-sky-600" /> : <ArrowUpRight className="h-4 w-4 text-rose-600" />}</div><div className="text-[26px] font-semibold text-slate-900">{value}</div><div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full w-[${tone === 'sky' ? '68' : '56'}%] rounded-full ${tone === 'sky' ? 'bg-cyan-400' : 'bg-orange-400'}`} /></div></div>)}</div>
                <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-medium text-slate-600">Transactions</div><ReceiptText className="h-4 w-4 text-slate-400" /></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2.5">Due date</th><th className="px-3 py-2.5">To/Form</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Amount</th></tr></thead><tbody><tr className="border-t border-slate-200"><td className="px-3 py-3">Oct 12-2026</td><td className="px-3 py-3">Google Workspace</td><td className="px-3 py-3 text-emerald-700">Completed</td><td className="px-3 py-3">$836.58</td></tr><tr className="border-t border-slate-200"><td className="px-3 py-3">Oct 18-2026</td><td className="px-3 py-3">Stripe</td><td className="px-3 py-3 text-amber-700">Pending</td><td className="px-3 py-3">$1,240.00</td></tr></tbody></table></div></div>
              </div>
              <div className="space-y-5"><div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div className="text-sm font-medium text-slate-600">Accounts</div><MoreHorizontal className="h-4 w-4 text-slate-500" /></div><div className="space-y-3">{accounts.map(account => <div key={account.name} className="rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm"><div className={`mb-3 flex h-16 items-center justify-between rounded-xl bg-gradient-to-r ${account.color} p-3 text-white`}><div><div className="text-xs opacity-80">{account.name}</div><div className="text-[11px] tracking-[0.18em] opacity-80">•••• {account.last4}</div></div><CreditCard className="h-5 w-5" /></div><div className="flex items-center justify-between px-1"><div className="text-sm text-slate-500">Balance</div><div className="text-lg font-semibold text-slate-900">{account.balance}</div></div></div>)}<button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700"><Plus className="h-4 w-4" /> Create account</button></div></div><div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div className="text-sm font-medium text-slate-600">Invoice</div><MoreHorizontal className="h-4 w-4 text-slate-500" /></div><div className="mb-5 h-2 rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-sky-500" /></div><div className="space-y-3">{invoices.map(invoice => <div key={`${invoice.date}-${invoice.name}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 pb-2 last:border-none"><div className="text-xs text-slate-400">{invoice.date}</div><div><div className="text-sm font-medium text-slate-700">{invoice.state}</div><div className="text-xs text-slate-400">{invoice.name}</div></div><div className="text-right text-sm font-semibold text-slate-700">{invoice.paid ? 'Paid' : 'Unpaid'}<div className="text-xs text-slate-400">{invoice.value}</div></div></div>)}</div></div></div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
