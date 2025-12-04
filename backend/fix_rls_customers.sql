-- Fix for RLS Policy Mismatch on public.customers table
-- Issue: Table public.customers has RLS policies defined but RLS is not enabled on the table.
-- Recommended Fix: Enable RLS on the table so existing policies take effect.

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
