-- ═══════════════════════════════════════════════════════════════
-- NUDESIGN PLANNING - DATABASE COMPLETO CON AREE E PERMESSI
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: AREE (11 aree principali)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY DEFAULT ('area_' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popola aree iniziali
INSERT INTO areas (id, name, icon, color, sort_order) VALUES
  ('area_artdirection', 'Art Direction', '🎨', '#8b5cf6', 1),
  ('area_creativita', 'Creatività', '💡', '#3b82f6', 2),
  ('area_grafica', 'Grafica', '📐', '#10b981', 3),
  ('area_modelli', 'Modelli / Shaders / Textures', '🧊', '#f59e0b', 4),
  ('area_immagini', 'Immagini / Animazioni', '📸', '#ec4899', 5),
  ('area_fotografia', 'Fotografia', '📷', '#14b8a6', 6),
  ('area_ai', 'Produzione AI', '🤖', '#a855f7', 7),
  ('area_video', 'Shooting / Video', '🎬', '#ef4444', 8),
  ('area_montaggio', 'Montaggio / Motion', '✂️', '#6366f1', 9),
  ('area_color', 'Color / Compositing / Fotolito', '🎨', '#84cc16', 10),
  ('area_configuratore', 'Configuratore', '⚙️', '#06b6d4', 11)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: REPARTI (16 reparti sotto le aree)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT ('dept_' || substr(md5(random()::text), 1, 10)),
  area_id TEXT REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popola reparti iniziali
INSERT INTO departments (id, area_id, name) VALUES
  ('dept_artdirection', 'area_artdirection', 'ART DIRECTION'),
  ('dept_concept', 'area_creativita', 'CONCEPT'),
  ('dept_grafica', 'area_grafica', 'GRAFICA'),
  ('dept_modelli', 'area_modelli', 'MODELLI'),
  ('dept_produzione3d', 'area_immagini', 'PRODUZIONE 3D'),
  ('dept_animazione3d', 'area_immagini', 'ANIMAZIONE 3D'),
  ('dept_fotografia', 'area_fotografia', 'FOTOGRAFIA'),
  ('dept_produzioneai', 'area_ai', 'PRODUZIONE AI'),
  ('dept_animazioneai', 'area_ai', 'ANIMAZIONE AI'),
  ('dept_shooting', 'area_video', 'SHOOTING'),
  ('dept_montaggio', 'area_montaggio', 'MONTAGGIO'),
  ('dept_motion', 'area_montaggio', 'MOTION'),
  ('dept_compositing', 'area_color', 'COMPOSITING'),
  ('dept_colorcorrection', 'area_color', 'COLOR-CORRECTION'),
  ('dept_fotolito', 'area_color', 'FOTOLITO'),
  ('dept_configuratore', 'area_configuratore', 'CONFIGURATORE')
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: AGGIORNA TABELLA COLLABORATORS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE collaborators 
  ADD COLUMN IF NOT EXISTS primary_department_id TEXT REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operator',
  ADD COLUMN IF NOT EXISTS managed_area_id TEXT REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS can_view_all BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar TEXT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: COMPETENZE MULTIPLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS person_departments (
  id TEXT PRIMARY KEY DEFAULT ('pd_' || substr(md5(random()::text), 1, 10)),
  person_id TEXT REFERENCES collaborators(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  skill_level TEXT DEFAULT 'mid',
  capacity_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(person_id, department_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5: AGGIORNA CLIENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 6: REPARTI COINVOLTI IN COMMESSA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS job_departments (
  id TEXT PRIMARY KEY DEFAULT ('jd_' || substr(md5(random()::text), 1, 10)),
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, department_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 7: CREA TABELLA JOB_ASSIGNMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS job_assignments (
  id TEXT PRIMARY KEY DEFAULT ('ja_' || substr(md5(random()::text), 1, 10)),
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES collaborators(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id),
  allocated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, person_id, department_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 8: ENABLE RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 9: DROP EXISTING POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "Everyone can view areas" ON areas;
DROP POLICY IF EXISTS "Only operation managers can modify areas" ON areas;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;
DROP POLICY IF EXISTS "Managers can modify departments" ON departments;
DROP POLICY IF EXISTS "Users see collaborators based on role" ON collaborators;
DROP POLICY IF EXISTS "Users see jobs based on role" ON jobs;
DROP POLICY IF EXISTS "Managers can create jobs" ON jobs;
DROP POLICY IF EXISTS "Managers can update jobs" ON jobs;
DROP POLICY IF EXISTS "Everyone can view job_assignments" ON job_assignments;
DROP POLICY IF EXISTS "Managers can modify job_assignments" ON job_assignments;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 10: CREATE RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "Everyone can view areas"
  ON areas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only operation managers can modify areas"
  ON areas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'operation_manager'
    )
  );

CREATE POLICY "Everyone can view departments"
  ON departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers can modify departments"
  ON departments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role IN ('operation_manager', 'area_manager')
    )
  );

CREATE POLICY "Users see collaborators based on role"
  ON collaborators FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'operation_manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators c1
      JOIN collaborators c2 ON c2.primary_department_id IN (
        SELECT d.id FROM departments d 
        WHERE d.area_id = c1.managed_area_id
      )
      WHERE c1.id::text = auth.uid()::text 
      AND c1.role = 'area_manager'
      AND c2.id = collaborators.id
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'project_manager'
    )
    OR
    id::text = auth.uid()::text
  );

CREATE POLICY "Users see jobs based on role"
  ON jobs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'operation_manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators c
      JOIN departments d ON d.area_id = c.managed_area_id
      JOIN job_departments jd ON jd.department_id = d.id
      WHERE c.id::text = auth.uid()::text 
      AND c.role = 'area_manager'
      AND jd.job_id = jobs.id
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'project_manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM job_assignments 
      WHERE job_id = jobs.id 
      AND person_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Managers can create jobs"
  ON jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

CREATE POLICY "Managers can update jobs"
  ON jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'operation_manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators c
      JOIN departments d ON d.area_id = c.managed_area_id
      JOIN job_departments jd ON jd.department_id = d.id
      WHERE c.id::text = auth.uid()::text 
      AND c.role = 'area_manager'
      AND jd.job_id = jobs.id
    )
    OR
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role = 'project_manager'
    )
  );

CREATE POLICY "Everyone can view job_assignments"
  ON job_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers can modify job_assignments"
  ON job_assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 11: INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_departments_area ON departments(area_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_dept ON collaborators(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON collaborators(role);
CREATE INDEX IF NOT EXISTS idx_person_departments_person ON person_departments(person_id);
CREATE INDEX IF NOT EXISTS idx_person_departments_dept ON person_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_job_departments_job ON job_departments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_departments_dept ON job_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_dept ON job_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_person ON job_assignments(person_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job ON job_assignments(job_id);
