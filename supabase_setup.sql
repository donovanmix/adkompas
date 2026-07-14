-- Supabase Setup Script for WhatsApp CRM Leads
-- Paste this script into your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) >= 1),
    company_name TEXT,
    email TEXT NOT NULL CHECK (char_length(email) >= 3),
    mobile_number TEXT NOT NULL CHECK (char_length(mobile_number) >= 5),
    enquiry_subject TEXT NOT NULL CHECK (char_length(enquiry_subject) >= 1),
    message TEXT,
    channel TEXT NOT NULL DEFAULT 'Direct',
    from_page TEXT
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy to allow anyone (anonymous public users) to INSERT leads.
-- This allows your website frontend or proxy server to save lead details.
CREATE POLICY "Allow public insert of leads"
ON public.whatsapp_leads
FOR INSERT
WITH CHECK (true);

-- 4. Create RLS Policy to only allow authenticated dashboard users (e.g., service role or admin) to SELECT leads.
CREATE POLICY "Allow authenticated read of leads"
ON public.whatsapp_leads
FOR SELECT
TO authenticated
USING (true);

-- 5. Create index on created_at for faster sorting/reporting in your CRM dashboard
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_created_at ON public.whatsapp_leads (created_at DESC);

