-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA DATABASE: JOB MILESTONES & WORKFLOW SYSTEM
-- Sistema completo per gestione fasi multi-reparto delle commesse
-- ════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABELLA JOB ROLES (Mansioni/Ruoli predefiniti)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_roles (
  id TEXT PRIMARY KEY DEFAULT ('role_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name TEXT NOT NULL UNIQUE,
  department_id TEXT REFERENCES areas(id),
  description TEXT,
  color TEXT, -- Colore per il Gantt
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_job_roles_department ON job_roles(department_id);

-- Inserimento ruoli predefiniti
INSERT INTO job_roles (name, department_id, description, color) VALUES
  ('Modellatore 3D', NULL, 'Modellazione 3D prodotti', '#8b5cf6'),
  ('Rendering Artist', NULL, 'Rendering immagini finali', '#3b82f6'),
  ('Compositor', NULL, 'Compositing e post-produzione', '#14b8a6'),
  ('Color Grading', NULL, 'Correzione colore e grading', '#10b981'),
  ('Fotolitista', NULL, 'Preparazione file per stampa', '#f59e0b'),
  ('Retoucher', NULL, 'Ritocco immagini', '#06b6d4'),
  ('Creative Director', NULL, 'Direzione creativa', '#f43f5e')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABELLA JOB MILESTONES (Fasi/Tappe delle commesse)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_milestones (
  id TEXT PRIMARY KEY DEFAULT ('milestone_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Reparto e fase
  department_id TEXT REFERENCES areas(id),
  phase_name TEXT NOT NULL, -- Nome fase (es: "Modellazione", "Rendering Base", etc.)
  role_id TEXT REFERENCES job_roles(id), -- Mansione richiesta
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Assegnazioni
  assigned_to TEXT[], -- Array di collaborator IDs
  estimated_hours DECIMAL(10,2), -- Ore stimate
  actual_hours DECIMAL(10,2), -- Ore effettive
  
  -- Stato e priorità
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  order_index INTEGER DEFAULT 0, -- Ordine sequenziale
  
  -- Dipendenze
  depends_on TEXT[], -- Array di milestone IDs che devono completarsi prima
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES collaborators(id),
  
  -- Constraint: end_date deve essere >= start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_milestones_job ON job_milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_milestones_department ON job_milestones(department_id);
CREATE INDEX IF NOT EXISTS idx_milestones_dates ON job_milestones(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON job_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_assigned ON job_milestones USING GIN(assigned_to);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_milestone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milestone_updated_at
  BEFORE UPDATE ON job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_milestones ENABLE ROW LEVEL SECURITY;

-- Job Roles: tutti possono vedere
CREATE POLICY "Everyone can view job roles"
  ON job_roles FOR SELECT
  TO authenticated
  USING (true);

-- Job Roles: solo manager possono modificare
CREATE POLICY "Managers can manage job roles"
  ON job_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE id::text = auth.uid()::text
      AND role IN ('operation_manager', 'area_manager')
    )
  );

-- Milestones: tutti possono vedere
CREATE POLICY "Everyone can view milestones"
  ON job_milestones FOR SELECT
  TO authenticated
  USING (true);

-- Milestones: tutti possono creare
CREATE POLICY "Everyone can create milestones"
  ON job_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Milestones: creator o manager possono modificare
CREATE POLICY "Creators and managers can update milestones"
  ON job_milestones FOR UPDATE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE id::text = auth.uid()::text
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- Milestones: creator o manager possono eliminare
CREATE POLICY "Creators and managers can delete milestones"
  ON job_milestones FOR DELETE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE id::text = auth.uid()::text
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. VISTE UTILI
-- ─────────────────────────────────────────────────────────────────────────────

-- Vista milestone con dettagli completi
CREATE OR REPLACE VIEW v_milestones_detailed AS
SELECT 
  m.*,
  j.code as job_code,
  j.title as job_title,
  j.client as job_client,
  a.name as department_name,
  r.name as role_name,
  r.color as role_color,
  (m.end_date - m.start_date) as duration_days
FROM job_milestones m
LEFT JOIN jobs j ON j.id = m.job_id
LEFT JOIN areas a ON a.id = m.department_id
LEFT JOIN job_roles r ON r.id = m.role_id;

-- Vista carico per reparto per giorno
CREATE OR REPLACE VIEW v_department_load_by_day AS
SELECT 
  m.department_id,
  a.name as department_name,
  generate_series(m.start_date::date, m.end_date::date, '1 day'::interval)::date as work_date,
  COUNT(DISTINCT m.id) as milestone_count,
  SUM(m.estimated_hours / NULLIF(m.end_date - m.start_date, 0)) as estimated_daily_hours
FROM job_milestones m
LEFT JOIN areas a ON a.id = m.department_id
WHERE m.status IN ('todo', 'in_progress')
GROUP BY m.department_id, a.name, work_date;

-- Vista carico per persona per giorno
CREATE OR REPLACE VIEW v_person_load_by_day AS
SELECT 
  unnest(m.assigned_to) as collaborator_id,
  generate_series(m.start_date::date, m.end_date::date, '1 day'::interval)::date as work_date,
  COUNT(DISTINCT m.id) as milestone_count,
  SUM(m.estimated_hours / NULLIF(m.end_date - m.start_date, 0)) as estimated_daily_hours
FROM job_milestones m
WHERE m.status IN ('todo', 'in_progress')
AND m.assigned_to IS NOT NULL
GROUP BY collaborator_id, work_date;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FUNZIONI UTILITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Funzione per calcolare carico reparto in un periodo
CREATE OR REPLACE FUNCTION get_department_load(
  p_department_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  date DATE,
  milestone_count BIGINT,
  total_hours NUMERIC,
  load_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    work_date::date,
    milestone_count,
    estimated_daily_hours,
    ROUND((estimated_daily_hours / 8.0) * 100, 2) as load_percentage -- 8h = 100%
  FROM v_department_load_by_day
  WHERE department_id = p_department_id
    AND work_date BETWEEN p_start_date AND p_end_date
  ORDER BY work_date;
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare carico persona in un periodo
CREATE OR REPLACE FUNCTION get_person_load(
  p_collaborator_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  date DATE,
  milestone_count BIGINT,
  total_hours NUMERIC,
  load_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    work_date::date,
    milestone_count,
    estimated_daily_hours,
    ROUND((estimated_daily_hours / 8.0) * 100, 2) as load_percentage
  FROM v_person_load_by_day
  WHERE collaborator_id = p_collaborator_id
    AND work_date BETWEEN p_start_date AND p_end_date
  ORDER BY work_date;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ESEMPI DI QUERY UTILI
-- ─────────────────────────────────────────────────────────────────────────────

/*
-- Milestone di una commessa in ordine sequenziale
SELECT * FROM v_milestones_detailed 
WHERE job_id = 'job_xxx' 
ORDER BY order_index;

-- Carico reparto Compositing per febbraio
SELECT * FROM get_department_load(
  'area_compositing', 
  '2026-02-01', 
  '2026-02-28'
);

-- Milestone in corso
SELECT * FROM v_milestones_detailed
WHERE status = 'in_progress'
ORDER BY end_date;

-- Milestone in scadenza (prossimi 7 giorni)
SELECT * FROM v_milestones_detailed
WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status != 'done'
ORDER BY end_date;

-- Sovraccarichi (giorni con > 100% capacità)
SELECT 
  department_name,
  work_date,
  milestone_count,
  ROUND((estimated_daily_hours / 8.0) * 100, 2) as load_percentage
FROM v_department_load_by_day
WHERE (estimated_daily_hours / 8.0) * 100 > 100
ORDER BY work_date, load_percentage DESC;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- FINE SCHEMA
-- ════════════════════════════════════════════════════════════════════════════

-- Verifica creazione tabelle
SELECT 
  'job_roles' as table_name, 
  COUNT(*) as row_count 
FROM job_roles
UNION ALL
SELECT 
  'job_milestones', 
  COUNT(*) 
FROM job_milestones;
