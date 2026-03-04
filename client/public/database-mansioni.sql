-- ═══════════════════════════════════════════════════════════
-- MANSIONI E CAPACITÀ - Database Setup
-- ═══════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Tabella TASK_TYPES (mansioni globali)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS task_types (
  id TEXT PRIMARY KEY DEFAULT ('task_' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'al giorno',
  icon TEXT,
  color TEXT,
  area_id TEXT REFERENCES areas(id),
  sort_order INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popola le 7 mansioni di Post-produzione
INSERT INTO task_types (id, name, unit, icon, color, sort_order) VALUES
  ('task_postprod', 'Post produzione', 'img/giorno', '🖼️', '#6366f1', 1),
  ('task_fotolito', 'Fotolito', 'file/giorno', '🖨️', '#84cc16', 2),
  ('task_matchcomp', 'Match compositing', 'comp/giorno', '🎨', '#ec4899', 3),
  ('task_postfoto', 'Post Foto', 'foto/giorno', '📸', '#14b8a6', 4),
  ('task_taratura', 'Taratura Texture', 'texture/giorno', '🧊', '#f59e0b', 5),
  ('task_ccanim', 'CC Animazione', 'frame/giorno', '🎬', '#8b5cf6', 6),
  ('task_ccvideo', 'CC Video', 'min/giorno', '🎥', '#ef4444', 7)
ON CONFLICT (id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Tabella PERSON_CAPACITIES (capacità per persona)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS person_capacities (
  id TEXT PRIMARY KEY DEFAULT ('cap_' || substr(md5(random()::text), 1, 10)),
  person_id TEXT REFERENCES collaborators(id) ON DELETE CASCADE,
  task_type_id TEXT REFERENCES task_types(id) ON DELETE CASCADE,
  capacity_per_day NUMERIC NOT NULL DEFAULT 8,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(person_id, task_type_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: Enable RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_capacities ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- TASK_TYPES: tutti possono vedere
CREATE POLICY "Everyone can view task_types"
  ON task_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only managers can modify task_types"
  ON task_types FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role IN ('operation_manager', 'area_manager')
    )
  );

-- PERSON_CAPACITIES: tutti possono vedere, manager modificano
CREATE POLICY "Everyone can view person_capacities"
  ON person_capacities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers can modify person_capacities"
  ON person_capacities FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE id::text = auth.uid()::text 
      AND role IN ('operation_manager', 'area_manager', 'project_manager')
    )
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5: Indexes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_person_capacities_person ON person_capacities(person_id);
CREATE INDEX IF NOT EXISTS idx_person_capacities_task ON person_capacities(task_type_id);

-- ═══════════════════════════════════════════════════════════
-- FINE SETUP MANSIONI
-- ═══════════════════════════════════════════════════════════
