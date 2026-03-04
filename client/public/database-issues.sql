-- ════════════════════════════════════════════════════════════════════════════
-- DATABASE SCHEMA: JOB ISSUES/ERRORI
-- ════════════════════════════════════════════════════════════════════════════

-- Tabella per tracciare problemi/blocchi/warning su commesse
CREATE TABLE IF NOT EXISTS job_issues (
  id TEXT PRIMARY KEY DEFAULT ('issue_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'blocked')),
  description TEXT NOT NULL,
  created_by TEXT REFERENCES collaborators(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by TEXT REFERENCES collaborators(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_job_issues_job_id ON job_issues(job_id);
CREATE INDEX IF NOT EXISTS idx_job_issues_resolved ON job_issues(resolved);
CREATE INDEX IF NOT EXISTS idx_job_issues_type ON job_issues(type);

-- RLS Policies
ALTER TABLE job_issues ENABLE ROW LEVEL SECURITY;

-- Tutti possono vedere gli issues
CREATE POLICY "Everyone can view issues"
  ON job_issues FOR SELECT
  TO authenticated
  USING (true);

-- Tutti possono creare issues
CREATE POLICY "Everyone can create issues"
  ON job_issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo chi ha creato l'issue o i manager possono modificarlo
CREATE POLICY "Creators and managers can update issues"
  ON job_issues FOR UPDATE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE id::text = auth.uid()::text
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- Solo chi ha creato l'issue o i manager possono eliminarlo
CREATE POLICY "Creators and managers can delete issues"
  ON job_issues FOR DELETE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE id::text = auth.uid()::text
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- ESEMPI DI INSERIMENTO
-- ════════════════════════════════════════════════════════════════════════════

-- NOTA: Questi sono esempi, non eseguirli se non vuoi dati di test

/*
-- Issue critico
INSERT INTO job_issues (job_id, type, description, created_by) VALUES
  ('j_xxxxx', 'critical', 'File corrotti - impossibile aprire i render', 'pm_roberto');

-- Warning
INSERT INTO job_issues (job_id, type, description, created_by) VALUES
  ('j_xxxxx', 'warning', 'Cliente lento nelle risposte', 'pm_tina');

-- Bloccante
INSERT INTO job_issues (job_id, type, description, created_by) VALUES
  ('j_xxxxx', 'blocked', 'In attesa approvazione finale da cliente', 'pm_giulia');

-- Risolvere un issue
UPDATE job_issues 
SET resolved = true, 
    resolved_at = NOW(), 
    resolved_by = 'pm_roberto'
WHERE id = 'issue_xxxxx';
*/

-- ════════════════════════════════════════════════════════════════════════════
-- QUERY UTILI
-- ════════════════════════════════════════════════════════════════════════════

-- Conta issues per job
/*
SELECT 
  j.code,
  j.title,
  COUNT(CASE WHEN i.type = 'critical' AND NOT i.resolved THEN 1 END) as critical_count,
  COUNT(CASE WHEN i.type = 'warning' AND NOT i.resolved THEN 1 END) as warning_count,
  COUNT(CASE WHEN i.type = 'blocked' AND NOT i.resolved THEN 1 END) as blocked_count
FROM jobs j
LEFT JOIN job_issues i ON i.job_id = j.id
GROUP BY j.id, j.code, j.title;
*/

-- Tutti gli issues aperti
/*
SELECT 
  i.*,
  j.code as job_code,
  j.title as job_title,
  c.name as created_by_name
FROM job_issues i
JOIN jobs j ON j.id = i.job_id
LEFT JOIN collaborators c ON c.id = i.created_by
WHERE i.resolved = false
ORDER BY i.created_at DESC;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- FINE SCHEMA
-- ════════════════════════════════════════════════════════════════════════════
