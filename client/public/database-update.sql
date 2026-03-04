-- ═══════════════════════════════════════════════════════════
-- DATABASE UPDATE - Aggiungi nuovi campi a CLIENTS
-- ═══════════════════════════════════════════════════════════

-- STEP 1: Aggiungi colonne alla tabella CLIENTS
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS commercial_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS commercial_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS commercial_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS preferences TEXT,
  ADD COLUMN IF NOT EXISTS history TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '[]'::jsonb;
