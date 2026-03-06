import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { query } from "./db";
import { getFreeBusy, getEvents, checkAvailability } from "./googleCalendar";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo immagini consentite"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/", (req, res) => {
    const publicPath = path.resolve(process.cwd(), "client/public");
    res.sendFile(path.join(publicPath, "preview.html"));
  });

  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.post("/api/upload-avatar", (req, res) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        const msg = err instanceof multer.MulterError
          ? (err.code === "LIMIT_FILE_SIZE" ? "File troppo grande (max 5MB)" : err.message)
          : err.message || "Errore upload";
        return res.status(400).json({ error: msg });
      }
      if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });
      const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const ext = path.extname(req.file.filename).toLowerCase();
      if (!allowedExts.includes(ext)) {
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
        return res.status(400).json({ error: "Formato non supportato. Usa JPG, PNG, GIF o WebP." });
      }
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });

  // ─── AREAS ────────────────────────────────────────────────
  app.get("/api/areas", async (req, res) => {
    const rows = await query("SELECT * FROM areas WHERE active=true ORDER BY sort_order");
    res.json(rows);
  });

  // ─── DEPARTMENTS ──────────────────────────────────────────
  app.get("/api/departments", async (req, res) => {
    const rows = await query(`
      SELECT d.*, a.name AS area_name, a.icon AS area_icon, a.color AS area_color, a.code AS area_code
      FROM departments d LEFT JOIN areas a ON a.id = d.area_id
      WHERE d.active=true ORDER BY a.sort_order, d.name
    `);
    res.json(rows);
  });

  app.post("/api/departments", async (req, res) => {
    const { name, area_id } = req.body;
    const rows = await query(
      "INSERT INTO departments (name, area_id) VALUES ($1,$2) RETURNING *",
      [name, area_id]
    );
    res.json(rows[0]);
  });

  // ─── TASK TYPES ───────────────────────────────────────────
  app.get("/api/task-types", async (req, res) => {
    const rows = await query("SELECT * FROM task_types WHERE active=true ORDER BY sort_order");
    res.json(rows);
  });

  // ─── COLLABORATORS (Team) ─────────────────────────────────
  app.get("/api/collaborators", async (req, res) => {
    const rows = await query(`
      SELECT c.*,
        d.name AS department_name, d.area_id AS primary_area_id,
        COALESCE(
          json_agg(
            json_build_object('id', pc.id, 'task_type_id', pc.task_type_id, 'capacity_per_day', pc.capacity_per_day,
              'task_name', tt.name, 'task_icon', tt.icon, 'task_unit', tt.unit)
          ) FILTER (WHERE pc.id IS NOT NULL), '[]'
        ) AS capacities,
        COALESCE(
          (SELECT json_agg(json_build_object('id', a2.id, 'code', a2.code, 'name', a2.name, 'icon', a2.icon, 'color', a2.color))
           FROM collaborator_areas ca JOIN areas a2 ON a2.id = ca.area_id
           WHERE ca.collaborator_id = c.id), '[]'
        ) AS areas
      FROM collaborators c
      LEFT JOIN departments d ON d.id = c.primary_department_id
      LEFT JOIN person_capacities pc ON pc.person_id = c.id
      LEFT JOIN task_types tt ON tt.id = pc.task_type_id
      WHERE c.active = true
      GROUP BY c.id, d.name, d.area_id
      ORDER BY c.name
    `);
    res.json(rows);
  });

  app.post("/api/collaborators", async (req, res) => {
    const { name, email, role, primary_department_id, avatar, google_calendar_id } = req.body;
    const rows = await query(
      "INSERT INTO collaborators (name, email, role, primary_department_id, avatar, google_calendar_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, email || null, role || "operator", primary_department_id || null, avatar || null, google_calendar_id || null]
    );
    res.json(rows[0]);
  });

  app.put("/api/collaborators/:id", async (req, res) => {
    const { name, email, role, primary_department_id, avatar, google_calendar_id } = req.body;
    const rows = await query(
      "UPDATE collaborators SET name=$1, email=$2, role=$3, primary_department_id=$4, avatar=$5, google_calendar_id=$6 WHERE id=$7 RETURNING *",
      [name, email || null, role, primary_department_id || null, avatar || null, google_calendar_id || null, req.params.id]
    );
    res.json(rows[0]);
  });

  app.delete("/api/collaborators/:id", async (req, res) => {
    await query("UPDATE collaborators SET active=false WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // Collaborator ↔ Areas (many-to-many)
  app.get("/api/collaborators/:id/areas", async (req, res) => {
    const rows = await query(
      `SELECT a.* FROM collaborator_areas ca JOIN areas a ON a.id = ca.area_id WHERE ca.collaborator_id=$1 ORDER BY a.sort_order`,
      [req.params.id]
    );
    res.json(rows);
  });

  app.post("/api/collaborators/:id/areas", async (req, res) => {
    const { area_ids } = req.body; // array of area IDs
    await query("DELETE FROM collaborator_areas WHERE collaborator_id=$1", [req.params.id]);
    if (area_ids && area_ids.length > 0) {
      const values = area_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(",");
      await query(`INSERT INTO collaborator_areas (collaborator_id, area_id) VALUES ${values}`, [req.params.id, ...area_ids]);
    }
    res.json({ ok: true });
  });

  // Capacities
  app.post("/api/collaborators/:id/capacities", async (req, res) => {
    const { task_type_id, capacity_per_day } = req.body;
    const rows = await query(
      `INSERT INTO person_capacities (person_id, task_type_id, capacity_per_day)
       VALUES ($1,$2,$3)
       ON CONFLICT (person_id, task_type_id) DO UPDATE SET capacity_per_day=$3
       RETURNING *`,
      [req.params.id, task_type_id, capacity_per_day]
    );
    res.json(rows[0]);
  });

  app.delete("/api/collaborators/:id/capacities/:taskTypeId", async (req, res) => {
    await query("DELETE FROM person_capacities WHERE person_id=$1 AND task_type_id=$2", [
      req.params.id, req.params.taskTypeId
    ]);
    res.json({ ok: true });
  });

  // ─── OVERTIME SETTINGS ──────────────────────────────────────
  app.get("/api/collaborators/:id/overtime", async (req, res) => {
    const rows = await query("SELECT * FROM person_overtime WHERE person_id=$1", [req.params.id]);
    res.json(rows[0] || null);
  });

  app.put("/api/collaborators/:id/overtime", async (req, res) => {
    const { extra_before, extra_after, available_saturday, saturday_hours, available_sunday, sunday_hours, available_holidays, holiday_hours, notes, updated_by } = req.body;
    const rows = await query(
      `INSERT INTO person_overtime (person_id, extra_before, extra_after, available_saturday, saturday_hours, available_sunday, sunday_hours, available_holidays, holiday_hours, notes, updated_by, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
       ON CONFLICT (person_id) DO UPDATE SET
         extra_before=$2, extra_after=$3, available_saturday=$4, saturday_hours=$5,
         available_sunday=$6, sunday_hours=$7, available_holidays=$8, holiday_hours=$9,
         notes=$10, updated_by=$11, updated_at=now()
       RETURNING *`,
      [req.params.id, extra_before||0, extra_after||0, available_saturday||false, saturday_hours||0, available_sunday||false, sunday_hours||0, available_holidays||false, holiday_hours||0, notes||null, updated_by||null]
    );
    res.json(rows[0]);
  });

  // ─── GOOGLE CALENDAR ────────────────────────────────────────
  async function getAllowedCalendarIds(): Promise<string[]> {
    const rows = await query("SELECT google_calendar_id FROM collaborators WHERE active=true AND google_calendar_id IS NOT NULL");
    return rows.map((r: any) => r.google_calendar_id);
  }

  app.get("/api/calendar/events/:calendarId", async (req, res) => {
    try {
      const allowed = await getAllowedCalendarIds();
      if (!allowed.includes(req.params.calendarId)) return res.status(403).json({ message: "Calendar not linked to any collaborator" });
      const { timeMin, timeMax } = req.query as { timeMin: string; timeMax: string };
      if (!timeMin || !timeMax) return res.status(400).json({ message: "timeMin and timeMax required" });
      const events = await getEvents(req.params.calendarId, timeMin, timeMax);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/calendar/freebusy", async (req, res) => {
    try {
      const { calendarIds, timeMin, timeMax } = req.body;
      if (!calendarIds?.length || !timeMin || !timeMax) return res.status(400).json({ message: "calendarIds, timeMin, timeMax required" });
      const allowed = await getAllowedCalendarIds();
      const filtered = calendarIds.filter((id: string) => allowed.includes(id));
      if (filtered.length === 0) return res.status(400).json({ message: "No valid calendar IDs" });
      const data = await getFreeBusy(filtered, timeMin, timeMax);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/calendar/availability", async (req, res) => {
    try {
      const { calendarIds, date } = req.body;
      if (!calendarIds?.length || !date) return res.status(400).json({ message: "calendarIds and date required" });
      const allowed = await getAllowedCalendarIds();
      const filtered = calendarIds.filter((id: string) => allowed.includes(id));
      if (filtered.length === 0) return res.status(400).json({ message: "No valid calendar IDs" });
      const data = await checkAvailability(filtered, date);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/calendar/team-availability", async (req, res) => {
    try {
      const { date } = req.query as { date: string };
      if (!date) return res.status(400).json({ message: "date required" });
      const collabs = await query("SELECT id, name, google_calendar_id FROM collaborators WHERE active=true AND google_calendar_id IS NOT NULL");
      if (collabs.length === 0) return res.json([]);
      const calendarIds = collabs.map((c: any) => c.google_calendar_id);
      const availability = await checkAvailability(calendarIds, date);
      const result = collabs.map((c: any) => ({
        person_id: c.id,
        person_name: c.name,
        calendar_id: c.google_calendar_id,
        ...(availability[c.google_calendar_id] || { available: true, busySlots: [] })
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── CLIENTS ──────────────────────────────────────────────
  app.get("/api/clients", async (req, res) => {
    const rows = await query("SELECT * FROM clients WHERE active=true ORDER BY name");
    res.json(rows);
  });

  app.post("/api/clients", async (req, res) => {
    const { name, email, phone, address, notes, short, logo, logo_url,
      commercial_contact_name, commercial_contact_email, commercial_contact_phone,
      technical_contact_name, technical_contact_email, technical_contact_phone } = req.body;
    const rows = await query(
      `INSERT INTO clients (name, email, phone, address, notes, short, logo, logo_url,
        commercial_contact_name, commercial_contact_email, commercial_contact_phone,
        technical_contact_name, technical_contact_email, technical_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [name, email||null, phone||null, address||null, notes||null, short||null, logo||'🏢', logo_url||null,
       commercial_contact_name||null, commercial_contact_email||null, commercial_contact_phone||null,
       technical_contact_name||null, technical_contact_email||null, technical_contact_phone||null]
    );
    res.json(rows[0]);
  });

  app.put("/api/clients/:id", async (req, res) => {
    const { name, email, phone, address, notes, short, logo, logo_url,
      commercial_contact_name, commercial_contact_email, commercial_contact_phone,
      technical_contact_name, technical_contact_email, technical_contact_phone } = req.body;
    const rows = await query(
      `UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, notes=$5, short=$6, logo=$7, logo_url=$8,
        commercial_contact_name=$9, commercial_contact_email=$10, commercial_contact_phone=$11,
        technical_contact_name=$12, technical_contact_email=$13, technical_contact_phone=$14
       WHERE id=$15 RETURNING *`,
      [name, email||null, phone||null, address||null, notes||null, short||null, logo||'🏢', logo_url||null,
       commercial_contact_name||null, commercial_contact_email||null, commercial_contact_phone||null,
       technical_contact_name||null, technical_contact_email||null, technical_contact_phone||null,
       req.params.id]
    );
    res.json(rows[0]);
  });

  app.delete("/api/clients/:id", async (req, res) => {
    await query("UPDATE clients SET active=false WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── JOBS (Commesse) ──────────────────────────────────────
  app.get("/api/jobs", async (req, res) => {
    const rows = await query(`
      SELECT j.*,
        pm.name AS pm_name,
        rp.name AS rp_name,
        ad.name AS art_dir_name,
        ph.name AS photography_name,
        er.name AS external_ref_name,
        ag.name AS agency_name,
        sr.name AS sales_rep_name
      FROM jobs j
      LEFT JOIN collaborators pm ON pm.id = j.pm_id
      LEFT JOIN collaborators rp ON rp.id = j.rp_id
      LEFT JOIN collaborators ad ON ad.id = j.art_dir_id
      LEFT JOIN collaborators ph ON ph.id = j.photography_id
      LEFT JOIN collaborators er ON er.id = j.external_ref_id
      LEFT JOIN collaborators ag ON ag.id = j.agency_id
      LEFT JOIN collaborators sr ON sr.id = j.sales_rep_id
      ORDER BY j.created_at DESC
    `);
    res.json(rows);
  });

  app.post("/api/jobs", async (req, res) => {
    const {
      code, title, type, areas_csv, status, category, account, client,
      linked_job_id, notes, started_at, due_date, competence_year, is_recurring,
      pm_id, rp_id, art_dir_id, photography_id, external_ref_id, agency_id, sales_rep_id,
      link_db, link_sheet
    } = req.body;

    const rows = await query(`
      INSERT INTO jobs (code, title, type, areas_csv, status, category, account, client,
        linked_job_id, notes, started_at, due_date, competence_year, is_recurring,
        pm_id, rp_id, art_dir_id, photography_id, external_ref_id, agency_id, sales_rep_id,
        link_db, link_sheet)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING *
    `, [
      code, title, type || "C", areas_csv || "", status || "nuova",
      category || null, account || null, client || null,
      linked_job_id || null, notes || null,
      started_at || null, due_date || null,
      competence_year || 2026, is_recurring === "true" || false,
      pm_id || null, rp_id || null, art_dir_id || null, photography_id || null,
      external_ref_id || null, agency_id || null, sales_rep_id || null,
      link_db || null, link_sheet || null
    ]);
    res.json(rows[0]);
  });

  app.put("/api/jobs/:id", async (req, res) => {
    const {
      code, title, type, areas_csv, status, category, account, client,
      linked_job_id, notes, started_at, due_date, competence_year, is_recurring,
      pm_id, rp_id, art_dir_id, photography_id, external_ref_id, agency_id, sales_rep_id,
      link_db, link_sheet
    } = req.body;

    const rows = await query(`
      UPDATE jobs SET
        code=$1, title=$2, type=$3, areas_csv=$4, status=$5, category=$6, account=$7, client=$8,
        linked_job_id=$9, notes=$10, started_at=$11, due_date=$12, competence_year=$13, is_recurring=$14,
        pm_id=$15, rp_id=$16, art_dir_id=$17, photography_id=$18, external_ref_id=$19,
        agency_id=$20, sales_rep_id=$21, link_db=$22, link_sheet=$23
      WHERE id=$24 RETURNING *
    `, [
      code, title, type || "C", areas_csv || "", status || "nuova",
      category || null, account || null, client || null,
      linked_job_id || null, notes || null,
      started_at || null, due_date || null,
      competence_year || 2026, is_recurring === "true" || false,
      pm_id || null, rp_id || null, art_dir_id || null, photography_id || null,
      external_ref_id || null, agency_id || null, sales_rep_id || null,
      link_db || null, link_sheet || null, req.params.id
    ]);
    res.json(rows[0]);
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    await query("DELETE FROM jobs WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── JOB PHASES ───────────────────────────────────────────
  app.get("/api/jobs/:id/phases", async (req, res) => {
    const rows = await query(
      `SELECT p.*, c.name AS assigned_name
       FROM job_phases p LEFT JOIN collaborators c ON c.id = p.assigned_to
       WHERE p.job_id=$1 ORDER BY p.order_index, p.id`,
      [req.params.id]
    );
    res.json(rows);
  });

  app.post("/api/jobs/:id/phases", async (req, res) => {
    const { name, order_index, assigned_to, due_date } = req.body;
    const rows = await query(
      `INSERT INTO job_phases (job_id, name, order_index, assigned_to, due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, name || "Nuova fase", order_index || 0, assigned_to || null, due_date || null]
    );
    res.json(rows[0]);
  });

  app.put("/api/jobs/:jobId/phases/:id", async (req, res) => {
    const { name, assigned_to, due_date, completed, order_index } = req.body;
    const rows = await query(
      `UPDATE job_phases SET name=COALESCE($1,name), assigned_to=$2, due_date=$3,
       completed=COALESCE($4,completed), order_index=COALESCE($5,order_index)
       WHERE id=$6 RETURNING *`,
      [name || null, assigned_to || null, due_date || null, completed ?? null, order_index ?? null, req.params.id]
    );
    res.json(rows[0]);
  });

  app.delete("/api/jobs/:jobId/phases/:id", async (req, res) => {
    await query("DELETE FROM job_phases WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── SCHEMA PREVIEW ───────────────────────────────────────
  app.get("/api/schema", async (req, res) => {
    const tables = await query(`
      SELECT t.table_name,
        json_agg(json_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default
        ) ORDER BY c.ordinal_position) AS columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = 'public'
      WHERE t.table_schema='public' AND t.table_type='BASE TABLE'
        AND t.table_name IN ('areas','departments','task_types','collaborators','person_capacities','clients','jobs','job_phases')
      GROUP BY t.table_name
      ORDER BY t.table_name
    `);
    res.json(tables);
  });

  return httpServer;
}
