-- Start fresh: Drop all RLS policies and recreate minimal policies for user signup

-- ============================================================
-- RE-ENABLE RLS ON USERS TABLE
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================

-- Users table
DROP POLICY IF EXISTS "Allow logged-in access" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Households table
DROP POLICY IF EXISTS "Allow logged-in access" ON households;
DROP POLICY IF EXISTS "households_select_members" ON households;
DROP POLICY IF EXISTS "households_insert_creator" ON households;
DROP POLICY IF EXISTS "households_insert_any" ON households;
DROP POLICY IF EXISTS "households_update_members" ON households;
DROP POLICY IF EXISTS "households_delete_creator" ON households;
DROP POLICY IF EXISTS "households_delete_members" ON households;

-- Household members table
DROP POLICY IF EXISTS "Allow logged-in access" ON household_members;
DROP POLICY IF EXISTS "household_members_select_own" ON household_members;
DROP POLICY IF EXISTS "household_members_insert_own" ON household_members;
DROP POLICY IF EXISTS "household_members_update_own" ON household_members;
DROP POLICY IF EXISTS "household_members_delete_own" ON household_members;

-- Shopping items table
DROP POLICY IF EXISTS "Allow logged-in access" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_select_household" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_insert_household" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_update_household" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_delete_household" ON shopping_items;

-- Transactions table
DROP POLICY IF EXISTS "Allow logged-in access" ON transactions;
DROP POLICY IF EXISTS "transactions_select_household" ON transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;

-- Debt ledger table
DROP POLICY IF EXISTS "Allow logged-in access" ON debt_ledger;
DROP POLICY IF EXISTS "debt_ledger_select_involved" ON debt_ledger;
DROP POLICY IF EXISTS "debt_ledger_insert_household" ON debt_ledger;
DROP POLICY IF EXISTS "debt_ledger_insert_involved" ON debt_ledger;
DROP POLICY IF EXISTS "debt_ledger_update_involved" ON debt_ledger;

-- ============================================================
-- MINIMAL POLICIES FOR USER SIGNUP
-- ============================================================

-- Allow users to insert their own profile
CREATE POLICY "users_insert_own" 
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "users_select_own" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- ============================================================
-- TRIGGER TO AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, venmo_handle)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HOUSEHOLDS + MEMBERSHIP POLICIES
-- ============================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Households policies
CREATE POLICY "households_select_members"
ON households FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "households_insert_authenticated"
ON households FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "households_update_admins"
ON households FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

CREATE POLICY "households_delete_admins"
ON households FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

-- Household members policies
CREATE POLICY "household_members_select_house"
ON household_members FOR SELECT
USING (
  household_members.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "household_members_insert_self_or_admin"
ON household_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

CREATE POLICY "household_members_update_self_or_admin"
ON household_members FOR UPDATE
USING (
  household_members.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

CREATE POLICY "household_members_delete_self_or_admin"
ON household_members FOR DELETE
USING (
  household_members.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

-- ============================================================
-- SHOPPING ITEMS POLICIES
-- ============================================================

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_items_select_household"
ON shopping_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = shopping_items.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "shopping_items_insert_household"
ON shopping_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = shopping_items.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "shopping_items_update_household"
ON shopping_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = shopping_items.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "shopping_items_delete_household"
ON shopping_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = shopping_items.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================================
-- TRANSACTIONS POLICIES
-- ============================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_household"
ON transactions FOR SELECT
USING (
  payer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = transactions.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "transactions_insert_payer"
ON transactions FOR INSERT
WITH CHECK (
  payer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = transactions.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "transactions_update_payer"
ON transactions FOR UPDATE
USING (payer_id = auth.uid());

CREATE POLICY "transactions_delete_payer"
ON transactions FOR DELETE
USING (payer_id = auth.uid());

-- ============================================================
-- DEBT LEDGER POLICIES
-- ============================================================

ALTER TABLE debt_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debt_ledger_select_involved"
ON debt_ledger FOR SELECT
USING (
  borrower_id = auth.uid()
  OR lender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = debt_ledger.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "debt_ledger_insert_lender"
ON debt_ledger FOR INSERT
WITH CHECK (
  lender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = debt_ledger.household_id
      AND hm.user_id = auth.uid()
  )
);

CREATE POLICY "debt_ledger_update_involved"
ON debt_ledger FOR UPDATE
USING (
  borrower_id = auth.uid()
  OR lender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = debt_ledger.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

CREATE POLICY "debt_ledger_delete_involved"
ON debt_ledger FOR DELETE
USING (
  borrower_id = auth.uid()
  OR lender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = debt_ledger.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
  )
);

