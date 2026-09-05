-- ============================================================
-- KAXXA (OCTAMIND) - BANCO DE DADOS PRINCIPAL E RLS (SEGURANÇA)
-- ============================================================
-- Este script cria todas as tabelas necessárias e aplica políticas de
-- segurança RLS (Row Level Security) para garantir que cada usuário
-- acesse, crie e edite EXCLUSIVAMENTE os seus próprios dados.

-- 0. Habilitar a extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABELA: Contas Bancárias (accounts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE POLICY "Isolamento total de contas por usuario" ON accounts 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. TABELA: Cartões de Crédito (credit_cards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank TEXT DEFAULT 'Nubank',
  brand TEXT DEFAULT 'Mastercard',
  last_digits TEXT DEFAULT '0000',
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  limit_used DECIMAL(15,2) DEFAULT 0.00,
  closing_day INTEGER NOT NULL DEFAULT 5,
  due_day INTEGER NOT NULL DEFAULT 12,
  color TEXT DEFAULT '#1A44C8',
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de cartoes por usuario" ON credit_cards;
CREATE POLICY "Isolamento total de cartoes por usuario" ON credit_cards 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. TABELA: Categorias (categories)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'INCOME' ou 'EXPENSE'
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de categorias por usuario" ON categories;
CREATE POLICY "Isolamento total de categorias por usuario" ON categories 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. TABELA: Terceiros (third_parties & third_party_debts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS third_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'OWES_ME', -- 'OWES_ME' (Me deve) ou 'I_OWE' (Devo a ele)
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE third_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de terceiros por usuario" ON third_parties;
CREATE POLICY "Isolamento total de terceiros por usuario" ON third_parties 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS third_party_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE POLICY "Isolamento total de dividas de terceiros por usuario" ON third_party_debts 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. TABELA: Transações (transactions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  third_party_id UUID REFERENCES third_parties(id) ON DELETE SET NULL,
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
CREATE POLICY "Isolamento total de transacoes por usuario" ON transactions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. TABELA: Dívidas & Financiamentos (debts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE POLICY "Isolamento total de dividas por usuario" ON debts 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. TABELA: Amortizações & Histórico de Parcelas (amortizations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amortizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  amount_paid DECIMAL(15,2) NOT NULL,
  discount_or_saved_interest DECIMAL(15,2) DEFAULT 0.00,
  type TEXT NOT NULL DEFAULT 'REGULAR', -- 'REGULAR' ou 'EXTRAORDINARY'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE amortizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de amortizacoes por usuario" ON amortizations;
CREATE POLICY "Isolamento total de amortizacoes por usuario" ON amortizations 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. TABELA: Investimentos & Patrimônio (investments)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento total de investimentos por usuario" ON investments;
CREATE POLICY "Isolamento total de investimentos por usuario" ON investments 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 9. TABELA: Assinaturas & Paywall (subscriptions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE POLICY "Isolamento total de assinaturas por usuario" ON subscriptions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. TRIGGERS AUTOMÁTICOS PARA UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounts_modtime ON accounts;
CREATE TRIGGER update_accounts_modtime BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cc_modtime ON credit_cards;
CREATE TRIGGER update_cc_modtime BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tp_modtime ON third_parties;
CREATE TRIGGER update_tp_modtime BEFORE UPDATE ON third_parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tpd_modtime ON third_party_debts;
CREATE TRIGGER update_tpd_modtime BEFORE UPDATE ON third_party_debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_modtime ON transactions;
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debts_modtime ON debts;
CREATE TRIGGER update_debts_modtime BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_modtime ON investments;
CREATE TRIGGER update_investments_modtime BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_modtime ON subscriptions;
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


