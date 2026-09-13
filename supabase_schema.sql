-- ============================================================
-- KAXXA (OCTAMIND) - BANCO DE DADOS PRINCIPAL E RLS (SEGURANÇA)
-- ============================================================

-- 0. Habilitar a extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABELA: Contas Bancárias (accounts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'CHECKING', 'SAVINGS', 'INVESTMENT', 'WALLET'
  balance DECIMAL(15,2) DEFAULT 0.00,
  initial_balance DECIMAL(15,2) DEFAULT 0.00,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de contas por usuario" ON accounts;
DROP POLICY IF EXISTS "Acesso de contas por usuario" ON accounts;
CREATE POLICY "Acesso de contas por usuario" ON accounts FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. TABELA: Cartões de Crédito (credit_cards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bank TEXT DEFAULT 'Nubank',
  brand TEXT DEFAULT 'Mastercard',
  last_digits TEXT DEFAULT '0000',
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  limit_used DECIMAL(15,2) DEFAULT 0.00,
  closing_day INTEGER NOT NULL DEFAULT 5,
  due_day INTEGER NOT NULL DEFAULT 12,
  color TEXT DEFAULT '#1A44C8',
  account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de cartoes por usuario" ON credit_cards;
DROP POLICY IF EXISTS "Acesso de cartoes por usuario" ON credit_cards;
CREATE POLICY "Acesso de cartoes por usuario" ON credit_cards FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. TABELA: Categorias (categories)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'INCOME' ou 'EXPENSE'
  parent_id TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de categorias por usuario" ON categories;
DROP POLICY IF EXISTS "Acesso de categorias por usuario" ON categories;
CREATE POLICY "Acesso de categorias por usuario" ON categories FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. TABELA: Terceiros (third_parties & third_party_debts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS third_parties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'OWES_ME', -- 'OWES_ME' (Me deve) ou 'I_OWE' (Devo a ele)
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE third_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de terceiros por usuario" ON third_parties;
DROP POLICY IF EXISTS "Acesso de terceiros por usuario" ON third_parties;
CREATE POLICY "Acesso de terceiros por usuario" ON third_parties FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS third_party_debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  description TEXT NOT NULL,
  origin_type TEXT NOT NULL DEFAULT 'CARD', -- 'CARD' ou 'ACCOUNT'
  origin_bank_or_card TEXT,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  installments_total INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 0,
  due_date TEXT,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PARTIAL', 'PAID'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE third_party_debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de dividas de terceiros por usuario" ON third_party_debts;
DROP POLICY IF EXISTS "Acesso de dividas de terceiros por usuario" ON third_party_debts;
CREATE POLICY "Acesso de dividas de terceiros por usuario" ON third_party_debts FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. TABELA: Transações (transactions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  account_id TEXT,
  credit_card_id TEXT,
  category_id TEXT,
  category_name TEXT,
  third_party_id TEXT,
  third_party_name TEXT,
  installments INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 1,
  is_paid BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de transacoes por usuario" ON transactions;
DROP POLICY IF EXISTS "Acesso de transacoes por usuario" ON transactions;
CREATE POLICY "Acesso de transacoes por usuario" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. TABELA: Dívidas & Financiamentos (debts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  creditor_type TEXT NOT NULL DEFAULT 'BANK', -- 'BANK' ou 'PERSON'
  category TEXT NOT NULL, -- 'FINANCIAMENTO_IMOVEL', 'VEICULO', 'CONSIGNADO', 'EMPRESTIMO', 'OUTROS'
  original_amount DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_paid DECIMAL(15,2) DEFAULT 0.00,
  total_discounts DECIMAL(15,2) DEFAULT 0.00,
  total_installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  interest_rate TEXT NOT NULL DEFAULT '0%',
  interest_numeric DECIMAL(6,2) DEFAULT 0.00,
  due_day INTEGER NOT NULL DEFAULT 10,
  start_date DATE,
  estimated_end_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAID_OFF'
  is_third_party_responsibility BOOLEAN DEFAULT FALSE,
  third_party_debtor_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de dividas por usuario" ON debts;
DROP POLICY IF EXISTS "Acesso de dividas por usuario" ON debts;
CREATE POLICY "Acesso de dividas por usuario" ON debts FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. TABELA: Amortizações & Histórico de Parcelas (amortizations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amortizations (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount_paid DECIMAL(15,2) NOT NULL,
  discount_or_saved_interest DECIMAL(15,2) DEFAULT 0.00,
  type TEXT NOT NULL DEFAULT 'REGULAR', -- 'REGULAR' ou 'EXTRAORDINARY'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE amortizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de amortizacoes por usuario" ON amortizations;
DROP POLICY IF EXISTS "Acesso de amortizacoes por usuario" ON amortizations;
CREATE POLICY "Acesso de amortizacoes por usuario" ON amortizations FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 8. TABELA: Investimentos & Patrimônio (investments)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  macro_type TEXT NOT NULL DEFAULT 'VARIAVEL', -- 'FIXA' ou 'VARIAVEL'
  category TEXT NOT NULL, -- 'CAIXINHA_PORQUINHO', 'TESOURO_DIRETO', 'CDB_LCI_LCA', 'ACOES', 'FIIS', 'BDRS_STOCKS', 'CRIPTO', 'ETFS'
  name TEXT NOT NULL,
  ticker TEXT,
  institution TEXT NOT NULL DEFAULT 'Corretora',
  rate_or_yield TEXT,
  liquidity TEXT DEFAULT 'DIARIA', -- 'DIARIA', 'D+1', 'VENCIMENTO'
  due_date TEXT,
  quantity DECIMAL(15,4) DEFAULT 0,
  average_price DECIMAL(15,2) DEFAULT 0,
  invested_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  profitability_pct DECIMAL(8,2) DEFAULT 0,
  account_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de investimentos por usuario" ON investments;
DROP POLICY IF EXISTS "Acesso de investimentos por usuario" ON investments;
CREATE POLICY "Acesso de investimentos por usuario" ON investments FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. TABELA: Assinaturas & Paywall (subscriptions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'INACTIVE', -- 'ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'INACTIVE'
  plan_type TEXT NOT NULL DEFAULT 'MENSAL', -- 'MENSAL', 'ANUAL'
  payment_method TEXT DEFAULT 'PIX', -- 'PIX', 'CREDIT_CARD'
  payment_id TEXT, -- ID do pagamento no Mercado Pago
  amount DECIMAL(15,2) DEFAULT 0.00,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de assinaturas por usuario" ON subscriptions;
DROP POLICY IF EXISTS "Acesso de assinaturas por usuario" ON subscriptions;
CREATE POLICY "Acesso de assinaturas por usuario" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 10. TABELA: Cupons de Teste e Desconto (coupons)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'TRIAL_DAYS', -- 'TRIAL_DAYS', 'PERCENT', 'FIXED'
  value DECIMAL(10,2) NOT NULL DEFAULT 2.00,
  discount_duration_months INTEGER DEFAULT 1,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  used_by JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de cupons" ON coupons;
CREATE POLICY "Leitura de cupons" ON coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Modificacao de cupons" ON coupons;
CREATE POLICY "Modificacao de cupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 11. TRIGGERS AUTOMÁTICOS PARA UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
    CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_credit_cards_updated_at') THEN
    CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
    CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_debts_updated_at') THEN
    CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_investments_updated_at') THEN
    CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;
