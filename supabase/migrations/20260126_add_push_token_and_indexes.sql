-- Migration: Add push_token to users and indexes to debt_ledger
-- Run this in Supabase SQL Editor

-- Add push_token column to users table for push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add indexes to debt_ledger for better query performance
CREATE INDEX IF NOT EXISTS idx_debt_ledger_borrower ON debt_ledger(borrower_id);
CREATE INDEX IF NOT EXISTS idx_debt_ledger_lender ON debt_ledger(lender_id);
CREATE INDEX IF NOT EXISTS idx_debt_ledger_transaction ON debt_ledger(transaction_id);
