'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CreditCard,
  Download,
  Home,
  Landmark,
  PiggyBank,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  BriefcaseBusiness,
  BarChart3,
  ReceiptText,
  Building2,
  UserRound,
  CircleDollarSign,
  Check,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Tasks', icon: ReceiptText },
  { label: 'Transactions', icon: ArrowDownRight },
  { label: 'Payments', icon: CircleDollarSign },
  { label: 'Cards', icon: CreditCard },
  { label: 'Capital', icon: TrendingUp },
  { label: 'Accounts', icon: Wallet },
  { label: 'Workflows', icon: BriefcaseBusiness },
  { label: 'Bill Pay', icon: ReceiptText },
  { label: 'Invoicing', icon: Download },
  { label: 'Reimbursements', icon: ArrowUpRight },
  { label: 'Accounting', icon: Landmark },
];

const accountItems = [
  { name: 'Visa', last4: '9213', balance: '$202,234.00', color: 'from-violet-500 to-purple-600' },
  { name: 'Citi', last4: '9213', balance: '$54,456.00', color: 'from-sky-500 to-cyan-600' },
  { name: 'Master', last4: '9213', balance: '$3,765.00', color: 'from-indigo-500 to-blue-700' },
];

const invoiceItems = [
  { date: 'Jun 8', state: 'Paid', name: 'Noah Williams', value: '$160.00', paid: true },
  { date: 'Jun 10', state: 'Unpaid', name: 'Ava Thompson', value: '$160.00', paid: false },
  { date: 'Jun 12', state: 'Pending', name: 'Ethan Walker', value: '$150.00', paid: false },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] rounded-[30px] border border-[#dfe7ef] bg-[#edf1f5] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.55)]">
        <div className="flex min-h-[880px] overflow-hidden rounded-[24px] bg-[#f5f7f9]">
          <aside className="w-[240px] border-r border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="mb-6 flex items-center gap-3 px-2 pt-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f2937] text-[10px] font-bold text-white shadow-sm">
                K
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Agency</div>
                  <div className="text-sm font-semibold text-slate-800">Orbix Studio Team</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-[#e9f0ff] text-[#1d4ed8] shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f5f7fb] p-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-700">GlobalLink</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Accept credit cards and bank payments</div>
                <button className="w-full rounded-xl bg-[#2b2d31] px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1f2329]">
                  Set up now
                </button>
              </div>
            </div>
          </aside>

          <section className="flex-1 bg-[#edf2f6] p-6">
            <header className="mb-6 flex items-center justify-between">
              <div className="text-sm text-slate-500">Monday, Jun 12, 2026</div>
              <div className="flex items-center gap-4">
                <div className="flex w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
                  <Search className="h-4 w-4" />
                  <span>Search...</span>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Settings className="h-4 w-4" />
                </button>
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f0abfc] to-[#3730a3] text-sm font-semibold text-white shadow-sm">
                  M
                </div>
              </div>
            </header>

            <div className="mb-5 flex items-center justify-between">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">Welcome Back, Ali!</div>
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <ArrowUpRight className="h-4 w-4" /> Request
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <ArrowDownRight className="h-4 w-4" /> Transfer
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <PiggyBank className="h-4 w-4" /> Deposit
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <ReceiptText className="h-4 w-4" /> Pay Bill
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <CreditCard className="h-4 w-4" /> Create Invoice
                </button>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.8fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-[22px] border border-[#e5e7eb] bg-white/80 p-4 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Overview</div>
                      <div className="mt-2 text-[13px] text-slate-500">Total Balance</div>
                      <div className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-slate-900">$32,940.093</div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">+ $3,546.02</span>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#edf1f5] bg-[#f9fafb] p-3">
                    <svg viewBox="0 0 700 220" className="h-[180px] w-full">
                      <g opacity="0.5" stroke="#dfe7ef" strokeWidth="1">
                        {[0,1,2,3,4,5].map((line) => (
                          <line key={line} x1="0" y1={20 + line * 35} x2="700" y2={20 + line * 35} />
                        ))}
                        {[0,1,2,3,4,5,6,7].map((line) => (
                          <line key={line} x1={60 + line * 90} y1="0" x2={60 + line * 90} y2="220" />
                        ))}
                      </g>
                      <path d="M 0 150 C 80 140, 120 100, 180 120 S 280 80, 360 95 S 470 105, 520 90 S 600 120, 700 60" fill="none" stroke="#0ea5e9" strokeWidth="3.5" strokeLinecap="round" />
                      <path d="M 0 165 C 80 150, 120 130, 180 140 S 280 120, 360 128 S 470 140, 520 120 S 600 160, 700 88" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
                      <g>
                        <circle cx="520" cy="90" r="5" fill="#10b981" />
                        <circle cx="700" cy="60" r="5" fill="#38bdf8" />
                      </g>
                    </svg>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Money in</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <ArrowDownRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-[26px] font-semibold tracking-[-0.05em] text-slate-900">$40,829.92</div>
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                    </div>
                    <div className="mt-3 text-sm text-slate-500">The biggest income this month is from salary</div>
                  </div>

                  <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Money out</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-[26px] font-semibold tracking-[-0.05em] text-slate-900">$7,802.62</div>
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[56%] rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
                    </div>
                    <div className="mt-3 text-sm text-slate-500">The biggest expense this month is from shopping</div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-600">Transactions</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <button className="rounded-lg bg-slate-100 px-2 py-1">Recent</button>
                      <button className="rounded-lg px-2 py-1">My transactions</button>
                      <button className="rounded-lg px-2 py-1">Monthly money in</button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">Due date</th>
                          <th className="px-3 py-2.5 font-medium">To/Form</th>
                          <th className="px-3 py-2.5 font-medium">Status</th>
                          <th className="px-3 py-2.5 font-medium">Amount</th>
                          <th className="px-3 py-2.5 font-medium">Account</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200 bg-white">
                          <td className="px-3 py-3">Oct 12-2026</td>
                          <td className="px-3 py-3">Google Workspace</td>
                          <td className="px-3 py-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Completed</span></td>
                          <td className="px-3 py-3">$836.58</td>
                          <td className="px-3 py-3">Visa</td>
                        </tr>
                        <tr className="border-t border-slate-200 bg-white">
                          <td className="px-3 py-3">Oct 18-2026</td>
                          <td className="px-3 py-3">Stripe</td>
                          <td className="px-3 py-3"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Pending</span></td>
                          <td className="px-3 py-3">$1,240.00</td>
                          <td className="px-3 py-3">Checking</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-600">Accounts</div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {accountItems.map(({ name, last4, balance, color }) => (
                      <div key={name} className="rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm">
                        <div className={`mb-3 flex h-16 items-center justify-between rounded-xl bg-gradient-to-r ${color} p-3 text-white`}>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-white/15 backdrop-blur-sm" />
                            <div>
                              <div className="text-xs opacity-80">{name}</div>
                              <div className="text-[11px] tracking-[0.18em] opacity-80">•••• {last4}</div>
                            </div>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">06/28</div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <div className="text-sm font-medium text-slate-500">Balance</div>
                          <div className="text-lg font-semibold tracking-[-0.04em] text-slate-900">{balance}</div>
                        </div>
                      </div>
                    ))}
                    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
                      <Plus className="h-4 w-4" /> Create account
                    </button>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-600">Invoice</div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mb-5 rounded-full bg-slate-100 p-1">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-sky-500" style={{ width: '80%' }} />
                  </div>
                  <div className="space-y-3">
                    {invoiceItems.map(({ date, state, name, value, paid }) => (
                      <div key={`${date}-${name}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 pb-2 last:border-none last:pb-0">
                        <div className="text-xs text-slate-400">{date}</div>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-slate-700">{state}</div>
                          <div className="text-xs text-slate-400">{name}</div>
                        </div>
                        <div className={`text-right text-sm font-semibold ${paid ? 'text-slate-700' : 'text-slate-400'}`}>
                          {paid ? 'Paid' : 'Unpaid'}
                          <div className="text-xs text-slate-400">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

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
          
          <div className="flex items-center gap-3">
            <KaxxaLogo size={20} />
            <span className="text-[10px] text-[#94A3B8] font-medium border-l border-[#E5E7EB] pl-3">© {new Date().getFullYear()} Kaxxa Inc. Todos os direitos reservados.</span>
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
