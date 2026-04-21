import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { query, pool } from "./db";
import { getFreeBusy, getEvents, checkAvailability, createEvent, updateEvent } from "./googleCalendar";

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
  // DB migrations are now in database-init.sql - run manually via Railway SQL editor
  // Do NOT run migration queries at startup to avoid crashing if DB is temporarily unavailable
  console.log("[startup] routes initializing...");

  // Dedicated healthcheck endpoint - always returns 200, no auth required
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/", (req: any, res) => {
    const publicPath = path.resolve(process.cwd(), "client/public");
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.sendFile(path.join(publicPath, "dashboard.html"));
    } else {
      res.sendFile(path.join(publicPath, "index.html"));
    }
  });

  // Serve uploaded files (static middleware)
  const expressForStatic = (await import("express")).default;
  app.use("/uploads", expressForStatic.static(uploadsDir));

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
              'task_name', tt.name, 'task_icon', tt.icon, 'task_unit', tt.unit, 'sort_order', pc.sort_order)
            ORDER BY pc.sort_order, pc.created_at
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
    const { task_type_id, capacity_per_day, sort_order } = req.body;
    const rows = await query(
      `INSERT INTO person_capacities (person_id, task_type_id, capacity_per_day, sort_order)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (person_id, task_type_id) DO UPDATE SET capacity_per_day=$3, sort_order=$4
       RETURNING *`,
      [req.params.id, task_type_id, capacity_per_day, sort_order ?? 0]
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
      INSERT INTO jobs (code, name, title, type, areas_csv, status, category, account, client,
        linked_job_id, notes, started_at, due_date, competence_year, is_recurring,
        pm_id, rp_id, art_dir_id, photography_id, external_ref_id, agency_id, sales_rep_id,
        link_db, link_sheet)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *
    `, [
      code, title || code, title, type || "C", areas_csv || "", status || "nuova",
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
        code=$1, name=$2, title=$3, type=$4, areas_csv=$5, status=$6, category=$7, account=$8, client=$9,
        linked_job_id=$10, notes=$11, started_at=$12, due_date=$13, competence_year=$14, is_recurring=$15,
        pm_id=$16, rp_id=$17, art_dir_id=$18, photography_id=$19, external_ref_id=$20,
        agency_id=$21, sales_rep_id=$22, link_db=$23, link_sheet=$24
      WHERE id=$25 RETURNING *
    `, [
      code, title || code, title, type || "C", areas_csv || "", status || "nuova",
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

  // ─── AREAS ──────────────────────────────────────────────
  app.get("/api/areas", async (req, res) => {
    const rows = await query("SELECT * FROM areas WHERE active=true ORDER BY sort_order");
    res.json(rows);
  });

  // ─── ALL PHASES (bulk) ───────────────────────────────────
  app.get("/api/all-phases", async (req, res) => {
    const rows = await query(`
      SELECT p.*, tt.name AS task_type_name, tt.category AS task_type_category, c.name AS assigned_name
      FROM job_phases p
      LEFT JOIN task_types tt ON tt.id = p.task_type_id
      LEFT JOIN collaborators c ON c.id = p.assigned_to
      ORDER BY p.job_id, p.parent_phase_id NULLS FIRST, p.order_index, p.start_date, p.id
    `);
    res.json(rows);
  });

  // ─── JOB PHASES ───────────────────────────────────────────
  app.get("/api/jobs/:id/phases", async (req, res) => {
    const rows = await query(
      `SELECT p.*, c.name AS assigned_name, tt.name AS task_type_name, tt.category AS task_type_category
       FROM job_phases p
       LEFT JOIN collaborators c ON c.id = p.assigned_to
       LEFT JOIN task_types tt ON tt.id = p.task_type_id
       WHERE p.job_id=$1 ORDER BY p.order_index, p.start_date, p.id`,
      [req.params.id]
    );
    res.json(rows);
  });

  app.post("/api/jobs/:id/phases", async (req, res) => {
    const { name, order_index, assigned_to, start_date, due_date, task_type_id, color, notes, parent_phase_id } = req.body;
    const rows = await query(
      `INSERT INTO job_phases (job_id, name, order_index, assigned_to, start_date, due_date, task_type_id, color, notes, parent_phase_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.id, name || "Nuova fase", order_index || 0, assigned_to || null,
       start_date || null, due_date || null, task_type_id || null, color || '#6366f1', notes || null, parent_phase_id || null]
    );
    res.json(rows[0]);
  });

  app.put("/api/jobs/:jobId/phases/:id", async (req, res) => {
    const { name, assigned_to, start_date, due_date, completed, order_index, task_type_id, color, notes, parent_phase_id } = req.body;
    const rows = await query(
      `UPDATE job_phases SET name=COALESCE($1,name), assigned_to=$2, start_date=$3, due_date=$4,
       completed=COALESCE($5,completed), order_index=COALESCE($6,order_index),
       task_type_id=$7, color=COALESCE($8,color), notes=$9, parent_phase_id=$10
       WHERE id=$11 RETURNING *`,
      [name || null, assigned_to || null, start_date || null, due_date || null,
       completed ?? null, order_index ?? null, task_type_id || null, color || null, notes || null,
       parent_phase_id || null, req.params.id]
    );
    res.json(rows[0]);
  });

  app.delete("/api/jobs/:jobId/phases/:id", async (req, res) => {
    await query("DELETE FROM job_phases WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── REVIEW / PROOFING ──────────────────────────────────
  const reviewStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      let ext = path.extname(file.originalname).toLowerCase();
      const safeExts = [".jpg",".jpeg",".png",".gif",".webp",".mp4",".pdf"];
      if (!safeExts.includes(ext)) ext = ".jpg";
      cb(null, `review_${Date.now()}${ext}`);
    },
  });
  const REVIEW_ALLOWED_EXTS = [".jpg",".jpeg",".png",".gif",".webp",".mp4",".pdf"];
  const reviewUpload = multer({
    storage: reviewStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedMimes = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","video/mp4","video/quicktime"];
      if (allowedMimes.includes(file.mimetype) && REVIEW_ALLOWED_EXTS.includes(ext)) cb(null, true);
      else cb(new Error("Formato file non supportato. Consentiti: JPG, PNG, GIF, WebP, PDF, MP4."));
    },
  });

  app.post("/api/review-assets/upload", (req, res) => {
    reviewUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });
      const { job_id, phase_id, title, uploaded_by, parent_asset_id } = req.body;
      if (!job_id || !title) return res.status(400).json({ error: "job_id e title obbligatori" });
      let version = 1;
      if (parent_asset_id) {
        const prev = await query("SELECT COALESCE(MAX(version),0) as maxv FROM review_assets WHERE parent_asset_id=$1 OR id=$1", [parent_asset_id]);
        version = (prev[0]?.maxv || 0) + 1;
      }
      const fileType = req.file.mimetype.startsWith("image/") ? "image" : req.file.mimetype.startsWith("video/") ? "video" : "document";
      const rows = await query(
        `INSERT INTO review_assets (job_id, phase_id, title, file_url, file_type, version, parent_asset_id, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [job_id, phase_id || null, title, `/uploads/${req.file.filename}`, fileType, version, parent_asset_id || null, uploaded_by || null]
      );
      res.json(rows[0]);
    });
  });

  app.get("/api/review-assets", async (req, res) => {
    const { job_id, status } = req.query;
    let sql = `SELECT ra.*, j.code as job_code, j.title as job_title, j.client as job_client
               FROM review_assets ra LEFT JOIN jobs j ON j.id = ra.job_id WHERE 1=1`;
    const params: any[] = [];
    if (job_id) { params.push(job_id); sql += ` AND ra.job_id=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND ra.status=$${params.length}`; }
    sql += ` ORDER BY ra.created_at DESC`;
    const rows = await query(sql, params);
    res.json(rows);
  });

  app.get("/api/review-assets/:id", async (req, res) => {
    const rows = await query(
      `SELECT ra.*, j.code as job_code, j.title as job_title, j.client as job_client
       FROM review_assets ra LEFT JOIN jobs j ON j.id = ra.job_id WHERE ra.id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Asset not found" });
    res.json(rows[0]);
  });

  app.put("/api/review-assets/:id/status", async (req, res) => {
    const { status } = req.body;
    const allowed = ["pending","in_review","approved","changes_requested","rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Stato non valido" });
    const rows = await query("UPDATE review_assets SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]);
    res.json(rows[0]);
  });

  app.delete("/api/review-assets/:id", async (req, res) => {
    await query("DELETE FROM review_assets WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  app.get("/api/review-assets/:id/comments", async (req, res) => {
    const rows = await query("SELECT * FROM review_comments WHERE asset_id=$1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows);
  });

  app.post("/api/review-assets/:id/comments", async (req, res) => {
    const { author_id, author_name, content, pin_x, pin_y, parent_comment_id } = req.body;
    if (!content) return res.status(400).json({ error: "content obbligatorio" });
    const rows = await query(
      `INSERT INTO review_comments (asset_id, author_id, author_name, content, pin_x, pin_y, parent_comment_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, author_id || null, author_name || 'Anonimo', content, pin_x ?? null, pin_y ?? null, parent_comment_id || null]
    );
    res.json(rows[0]);
  });

  app.put("/api/review-comments/:id/resolve", async (req, res) => {
    const rows = await query("UPDATE review_comments SET resolved=$1 WHERE id=$2 RETURNING *", [req.body.resolved ?? true, req.params.id]);
    res.json(rows[0]);
  });

  app.delete("/api/review-comments/:id", async (req, res) => {
    await query("DELETE FROM review_comments WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  app.get("/api/review-assets/:id/approvals", async (req, res) => {
    const rows = await query("SELECT * FROM review_approvals WHERE asset_id=$1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  });

  app.post("/api/review-assets/:id/approvals", async (req, res) => {
    const { reviewer_id, reviewer_name, decision, note } = req.body;
    const allowed = ["approved","changes_requested","rejected"];
    if (!allowed.includes(decision)) return res.status(400).json({ error: "Decisione non valida" });
    const rows = await query(
      `INSERT INTO review_approvals (asset_id, reviewer_id, reviewer_name, decision, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, reviewer_id || null, reviewer_name || 'Anonimo', decision, note || null]
    );
    const statusMap: Record<string, string> = { approved: "approved", changes_requested: "changes_requested", rejected: "rejected" };
    await query("UPDATE review_assets SET status=$1 WHERE id=$2", [statusMap[decision], req.params.id]);
    res.json(rows[0]);
  });

  app.get("/api/review-assets/:id/versions", async (req, res) => {
    const asset = await query("SELECT * FROM review_assets WHERE id=$1", [req.params.id]);
    if (!asset.length) return res.status(404).json({ error: "Asset not found" });
    const parentId = asset[0].parent_asset_id || asset[0].id;
    const rows = await query(
      "SELECT * FROM review_assets WHERE id=$1 OR parent_asset_id=$1 ORDER BY version ASC",
      [parentId]
    );
    res.json(rows);
  });

  // ─── FOGLIO LAVORO ───────────────────────────────────────

  // --- Columns per job ---
  app.get("/api/foglio-columns/:jobId", async (req, res) => {
    const rows = await query(
      "SELECT * FROM foglio_columns WHERE job_id=$1 ORDER BY sort_order, id",
      [req.params.jobId]
    );
    res.json(rows);
  });

  app.post("/api/foglio-columns/:jobId", async (req, res) => {
    const { name, column_key, column_group, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const key = column_key || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const rows = await query(
      `INSERT INTO foglio_columns (job_id, name, column_key, column_group, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.jobId, name, key, column_group || "Produzione", sort_order || 0]
    );
    res.json(rows[0]);
  });

  app.put("/api/foglio-columns/:id", async (req, res) => {
    const { name, column_group, sort_order } = req.body;
    const rows = await query(
      `UPDATE foglio_columns SET name=COALESCE($1,name), column_group=COALESCE($2,column_group),
       sort_order=COALESCE($3,sort_order) WHERE id=$4 RETURNING *`,
      [name, column_group, sort_order, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  });

  app.delete("/api/foglio-columns/:id", async (req, res) => {
    await query("DELETE FROM foglio_columns WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  app.post("/api/foglio-columns/:jobId/init-default", async (req, res) => {
    const existing = await query("SELECT id FROM foglio_columns WHERE job_id=$1 LIMIT 1", [req.params.jobId]);
    if (existing.length) return res.json({ message: "already initialized" });
    const defaults = [
      { name: "Location Bozza", key: "location_bozza", group: "Produzione", order: 1 },
      { name: "Location Def", key: "location_def", group: "Produzione", order: 2 },
      { name: "Fotografia", key: "fotografia", group: "Produzione", order: 3 },
      { name: "Styling", key: "styling", group: "Produzione", order: 4 },
      { name: "Revisioni", key: "revisioni", group: "Produzione", order: 5 },
      { name: "Render", key: "render", group: "Produzione", order: 6 },
      { name: "Post", key: "post", group: "Produzione", order: 7 },
      { name: "Finiture", key: "finiture", group: "Produzione", order: 8 },
      { name: "Rifacimenti", key: "rifacimenti", group: "Recupero", order: 9 },
      { name: "Render", key: "recupero_render", group: "Recupero", order: 10 },
      { name: "Post", key: "recupero_post", group: "Recupero", order: 11 },
      { name: "Finiture", key: "recupero_finiture", group: "Recupero", order: 12 },
      { name: "Recupero", key: "recupero", group: "Recupero", order: 13 },
      { name: "Fatturato", key: "fatturato", group: "Fatturato", order: 14 },
    ];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const d of defaults) {
        await client.query(
          `INSERT INTO foglio_columns (job_id, name, column_key, column_group, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [req.params.jobId, d.name, d.key, d.group, d.order]
        );
      }
      await client.query("COMMIT");
    } catch(e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    const rows = await query("SELECT * FROM foglio_columns WHERE job_id=$1 ORDER BY sort_order, id", [req.params.jobId]);
    res.json(rows);
  });

  // --- Image rows ---
  app.put("/api/foglio-images/reorder", async (req, res) => {
    const { orders } = req.body;
    if (!Array.isArray(orders) || !orders.length) return res.status(400).json({ error: "orders array required" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const { id, sort_order } of orders) {
        await client.query("UPDATE foglio_images SET sort_order=$1 WHERE id=$2", [sort_order, id]);
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  });

  app.get("/api/foglio-images/:jobId", async (req, res) => {
    const rows = await query(
      "SELECT * FROM foglio_images WHERE job_id=$1 ORDER BY sort_order, id",
      [req.params.jobId]
    );
    res.json(rows);
  });

  app.post("/api/foglio-images/:jobId", async (req, res) => {
    const { location, sub_location, frame, optional_1, optional_2, tipo, orientation, image_name, phase_values, percentuale_modifica, note, sort_order } = req.body;
    const rows = await query(
      `INSERT INTO foglio_images (job_id, location, sub_location, frame, optional_1, optional_2, tipo, orientation, image_name, phase_values, percentuale_modifica, note, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.params.jobId, location||'', sub_location||'', frame||'', optional_1||false, optional_2||false, tipo||'', orientation||'', image_name||'', phase_values||'{}', percentuale_modifica||0, note||'', sort_order||0]
    );
    res.json(rows[0]);
  });

  app.put("/api/foglio-images/:id", async (req, res) => {
    const { location, sub_location, frame, optional_1, optional_2, tipo, orientation, image_name, phase_values, percentuale_modifica, note, sort_order } = req.body;
    const rows = await query(
      `UPDATE foglio_images SET
        location=COALESCE($1,location), sub_location=COALESCE($2,sub_location),
        frame=COALESCE($3,frame), optional_1=COALESCE($4,optional_1),
        optional_2=COALESCE($5,optional_2), tipo=COALESCE($6,tipo),
        orientation=COALESCE($7,orientation), image_name=COALESCE($8,image_name),
        phase_values=COALESCE($9,phase_values), percentuale_modifica=COALESCE($10,percentuale_modifica),
        note=COALESCE($11,note), sort_order=COALESCE($12,sort_order)
       WHERE id=$13 RETURNING *`,
      [location, sub_location, frame, optional_1, optional_2, tipo, orientation, image_name, phase_values, percentuale_modifica, note, sort_order, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  });

  app.patch("/api/foglio-images/:id/cell", async (req, res) => {
    const { field, value } = req.body;
    const directFields = ['location','sub_location','frame','optional_1','optional_2','tipo','orientation','image_name','percentuale_modifica','note','sort_order','row_color'];
    if (field === 'row_color') {
      const allowed = ['','red','orange','yellow','green','blue','purple','pink','gray'];
      if (!allowed.includes(value ?? '')) return res.status(400).json({ error: "invalid color" });
    }
    if (directFields.includes(field)) {
      const rows = await query(`UPDATE foglio_images SET ${field}=$1 WHERE id=$2 RETURNING *`, [value, req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "not found" });
      return res.json(rows[0]);
    }
    const rows = await query(
      `UPDATE foglio_images SET phase_values = jsonb_set(COALESCE(phase_values,'{}'), $1, $2::jsonb) WHERE id=$3 RETURNING *`,
      [`{${field}}`, JSON.stringify(value), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  });

  app.delete("/api/foglio-images/:id", async (req, res) => {
    await query("DELETE FROM foglio_images WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── FOGLIO LOCATIONS ───────────────────────────────────────

  app.get("/api/foglio-locations/:jobId", async (req, res) => {
    const rows = await query("SELECT * FROM foglio_locations WHERE job_id=$1 ORDER BY sort_order, id", [req.params.jobId]);
    res.json(rows);
  });

  app.post("/api/foglio-locations/:jobId", async (req, res) => {
    const { nome_location, tipologia, descrizione, note, sort_order } = req.body;
    const rows = await query(
      `INSERT INTO foglio_locations (job_id, nome_location, tipologia, descrizione, note, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.jobId, nome_location||'', tipologia||'', descrizione||'', note||'', sort_order||0]
    );
    res.json(rows[0]);
  });

  app.put("/api/foglio-locations/:id", async (req, res) => {
    const { nome_location, tipologia, descrizione, note, sort_order } = req.body;
    const rows = await query(
      `UPDATE foglio_locations SET nome_location=COALESCE($1,nome_location), tipologia=COALESCE($2,tipologia),
       descrizione=COALESCE($3,descrizione), note=COALESCE($4,note), sort_order=COALESCE($5,sort_order)
       WHERE id=$6 RETURNING *`,
      [nome_location, tipologia, descrizione, note, sort_order, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  });

  app.patch("/api/foglio-locations/:id/cell", async (req, res) => {
    const { field, value } = req.body;
    const allowed = ['nome_location','tipologia','descrizione','note','sort_order'];
    if (!allowed.includes(field)) return res.status(400).json({ error: "invalid field" });
    const rows = await query(`UPDATE foglio_locations SET ${field}=$1 WHERE id=$2 RETURNING *`, [value, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  });

  app.delete("/api/foglio-locations/:id", async (req, res) => {
    await query("DELETE FROM foglio_locations WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  // ─── FOGLIO REVISIONS ───────────────────────────────────────

  let revisionCounter = 0;
  const revisionStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      let ext = path.extname(file.originalname).toLowerCase();
      const safeExts = [".jpg",".jpeg",".png",".gif",".webp",".mp4",".pdf"];
      if (!safeExts.includes(ext)) ext = ".jpg";
      revisionCounter++;
      cb(null, `revision_${Date.now()}_${revisionCounter}_${Math.random().toString(36).slice(2,8)}${ext}`);
    },
  });
  const revisionUpload = multer({
    storage: revisionStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedMimes = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","video/mp4","video/quicktime"];
      if (allowedMimes.includes(file.mimetype) && [".jpg",".jpeg",".png",".gif",".webp",".mp4",".pdf"].includes(ext)) cb(null, true);
      else cb(new Error("Formato non supportato. Consentiti: JPG, PNG, GIF, WebP, PDF, MP4."));
    },
  });

  app.get("/api/foglio-revisions/:imageId", async (req, res) => {
    const { phase_key } = req.query;
    let sql = "SELECT * FROM foglio_revisions WHERE foglio_image_id=$1";
    const params: any[] = [req.params.imageId];
    if (phase_key) { params.push(phase_key); sql += ` AND phase_key=$${params.length}`; }
    sql += " ORDER BY phase_key, version, created_at";
    const rows = await query(sql, params);
    res.json(rows);
  });

  app.get("/api/foglio-revisions-batch/:jobId", async (req, res) => {
    const rows = await query(
      `SELECT fr.* FROM foglio_revisions fr
       JOIN foglio_images fi ON fi.id = fr.foglio_image_id
       WHERE fi.job_id=$1
       ORDER BY fr.foglio_image_id, fr.phase_key, fr.version`,
      [req.params.jobId]
    );
    res.json(rows);
  });

  app.post("/api/foglio-revisions/:imageId/upload", (req, res) => {
    revisionUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });
      const { phase_key, title, notes, uploaded_by } = req.body;
      const fileType = req.file.mimetype.startsWith("image/") ? "image" : req.file.mimetype.startsWith("video/") ? "video" : "document";
      const prevVersions = await query(
        "SELECT COALESCE(MAX(version),0) as maxv FROM foglio_revisions WHERE foglio_image_id=$1 AND phase_key=$2",
        [req.params.imageId, phase_key || '']
      );
      const version = ((prevVersions[0] as any)?.maxv || 0) + 1;
      const rows = await query(
        `INSERT INTO foglio_revisions (foglio_image_id, phase_key, file_url, file_type, title, version, notes, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.params.imageId, phase_key || '', `/uploads/${req.file.filename}`, fileType, title || req.file.originalname, version, notes || '', uploaded_by || '']
      );
      res.json(rows[0]);
    });
  });

  app.post("/api/foglio-revisions/batch-upload/:jobId", (req, res) => {
    revisionUpload.array("files", 200)(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      const files = req.files as Express.Multer.File[];
      if (!files || !files.length) return res.status(400).json({ error: "Nessun file caricato" });
      const { phase_key, uploaded_by } = req.body;
      if (!phase_key) return res.status(400).json({ error: "phase_key richiesto" });
      const jobId = req.params.jobId;

      const imgRows = await query("SELECT id, image_name FROM foglio_images WHERE job_id=$1", [jobId]);
      const imageMap: Record<string, { id: number; image_name: string }> = {};
      (imgRows as any[]).forEach(r => {
        imageMap[r.image_name.toLowerCase()] = r;
      });

      const results: any[] = [];
      for (const file of files) {
        try {
          const origName = path.parse(file.originalname).name;
          const origNameLower = origName.toLowerCase();

          let matched: any = null;
          let bestScore = 0;

          if (imageMap[origNameLower]) {
            matched = imageMap[origNameLower];
            bestScore = 100;
          }

          if (!matched) {
            for (const key of Object.keys(imageMap)) {
              if (key.includes(origNameLower)) {
                matched = imageMap[key];
                bestScore = 90;
                break;
              }
              if (origNameLower.includes(key)) {
                matched = imageMap[key];
                bestScore = 80;
                break;
              }
            }
          }

          if (!matched) {
            const nameParts = origNameLower.replace(/[-_\s]+/g, '-').split('-');
            for (const key of Object.keys(imageMap)) {
              const keyParts = key.replace(/[-_\s]+/g, '-').split('-');
              const commonParts = nameParts.filter(p => p.length > 1 && keyParts.includes(p));
              if (commonParts.length >= 3 && commonParts.length > bestScore) {
                matched = imageMap[key];
                bestScore = commonParts.length;
              }
            }
          }

          if (matched) {
            const fileType = file.mimetype.startsWith("image/") ? "image" : file.mimetype.startsWith("video/") ? "video" : "document";
            const prevVersions = await query(
              "SELECT COALESCE(MAX(version),0) as maxv FROM foglio_revisions WHERE foglio_image_id=$1 AND phase_key=$2",
              [matched.id, phase_key]
            );
            const version = ((prevVersions[0] as any)?.maxv || 0) + 1;
            const rows = await query(
              `INSERT INTO foglio_revisions (foglio_image_id, phase_key, file_url, file_type, title, version, notes, uploaded_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
              [matched.id, phase_key, `/uploads/${file.filename}`, fileType, file.originalname, version, '', uploaded_by || '']
            );
            results.push({ file: file.originalname, status: 'matched', matched_to: matched.image_name, image_id: matched.id, revision: rows[0] });
          } else {
            try { fs.unlinkSync(path.join(uploadsDir, file.filename)); } catch {}
            results.push({ file: file.originalname, status: 'unmatched', matched_to: null });
          }
        } catch (fileErr: any) {
          try { fs.unlinkSync(path.join(uploadsDir, file.filename)); } catch {}
          results.push({ file: file.originalname, status: 'error', matched_to: null, error: fileErr.message });
        }
      }
      res.json({ total: files.length, matched: results.filter(r => r.status === 'matched').length, unmatched: results.filter(r => r.status !== 'matched').length, results });
    });
  });

  app.delete("/api/foglio-revisions/:id", async (req, res) => {
    const rows = await query("SELECT file_url FROM foglio_revisions WHERE id=$1", [req.params.id]);
    if (rows.length) {
      const fileUrl = (rows[0] as any).file_url;
      const fileName = path.basename(fileUrl);
      const filePath = path.join(uploadsDir, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await query("DELETE FROM foglio_revisions WHERE id=$1", [req.params.id]);
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

  app.get("/api/revision-comments/:revisionId", async (req, res) => {
    const rows = await query("SELECT * FROM revision_comments WHERE revision_id=$1 ORDER BY created_at ASC", [req.params.revisionId]);
    res.json(rows);
  });

  app.post("/api/revision-comments/:revisionId", async (req, res) => {
    const { author_name, content, pin_x, pin_y, parent_comment_id, shape_type, shape_data, department_id } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: "Content is required" });
    const revCheck = await query("SELECT id FROM foglio_revisions WHERE id=$1", [req.params.revisionId]);
    if (!revCheck.length) return res.status(404).json({ error: "Revision not found" });
    const VALID_SHAPE_TYPES = ['circle', 'rect', 'arrow', 'freehand'];
    const VALID_COLORS = /^#[0-9a-fA-F]{6}$/;
    let sanitizedShapeType = null;
    let sanitizedShapeData = null;
    if (shape_type && VALID_SHAPE_TYPES.includes(shape_type)) {
      sanitizedShapeType = shape_type;
      if (shape_data && typeof shape_data === 'object') {
        const sd: any = { type: shape_type };
        if (shape_data.color && VALID_COLORS.test(shape_data.color)) sd.color = shape_data.color;
        else sd.color = '#ef4444';
        const sw = typeof shape_data.stroke_width === 'number' ? Math.min(Math.max(Math.round(shape_data.stroke_width), 1), 20) : 4;
        sd.stroke_width = sw;
        if (shape_type === 'freehand' && Array.isArray(shape_data.points)) {
          sd.points = shape_data.points.filter((p: any) => typeof p.x === 'number' && typeof p.y === 'number').map((p: any) => ({ x: p.x, y: p.y }));
        } else {
          if (typeof shape_data.x1 === 'number') sd.x1 = shape_data.x1;
          if (typeof shape_data.y1 === 'number') sd.y1 = shape_data.y1;
          if (typeof shape_data.x2 === 'number') sd.x2 = shape_data.x2;
          if (typeof shape_data.y2 === 'number') sd.y2 = shape_data.y2;
        }
        sanitizedShapeData = JSON.stringify(sd);
      }
    }
    const rows = await query(
      `INSERT INTO revision_comments (revision_id, author_name, content, pin_x, pin_y, parent_comment_id, shape_type, shape_data, department_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.revisionId, author_name || 'Reviewer', content.trim(), pin_x ?? null, pin_y ?? null, parent_comment_id ?? null, sanitizedShapeType, sanitizedShapeData, department_id ?? null]
    );
    res.json(rows[0]);
  });

  app.put("/api/revision-comments/:id/send", async (req, res) => {
    const rows = await query("SELECT * FROM revision_comments WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Comment not found" });
    if (!rows[0].department_id) return res.status(400).json({ error: "Comment has no department assigned" });
    if (rows[0].parent_comment_id) return res.status(400).json({ error: "Cannot send reply comments" });
    const updated = await query("UPDATE revision_comments SET sent=true WHERE id=$1 RETURNING *", [req.params.id]);
    try {
      const deptRows = await query("SELECT name FROM areas WHERE id=$1", [rows[0].department_id]);
      const deptName = deptRows.length ? deptRows[0].name : rows[0].department_id;
      await query(
        "INSERT INTO notifications (user_email, type, title, message, link) VALUES (NULL, $1, $2, $3, $4)",
        ['comment_sent', `Commento inviato a ${deptName}`, (rows[0].content || '').substring(0, 100), 'review.html']
      );
    } catch(e) { console.error('Notification create error:', e); }
    res.json(updated[0]);
  });

  app.put("/api/revision-comments/send-all/:revisionId", async (req, res) => {
    await query("UPDATE revision_comments SET sent=true WHERE revision_id=$1 AND sent=false AND parent_comment_id IS NULL AND department_id IS NOT NULL", [req.params.revisionId]);
    res.json({ ok: true });
  });

  app.put("/api/revision-comments/:id/resolve", async (req, res) => {
    const rows = await query("UPDATE revision_comments SET resolved=$1 WHERE id=$2 RETURNING *", [req.body.resolved ?? true, req.params.id]);
    res.json(rows[0]);
  });

  app.delete("/api/revision-comments/:id", async (req, res) => {
    await query("DELETE FROM revision_comments WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  try { await query(`CREATE TABLE IF NOT EXISTS calendar_sync_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    calendar_id TEXT NOT NULL,
    google_event_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`); } catch(e: any) { console.error("[startup] calendar_sync_events migration warning:", e.message); }

  app.post("/api/calendar/sync-job/:jobId", async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const { calendar_id } = req.body;
      if (!calendar_id) return res.status(400).json({ message: "calendar_id required" });

      const jobs = await query("SELECT * FROM jobs WHERE id=$1", [jobId]);
      if (!jobs.length) return res.status(404).json({ message: "Job not found" });
      const job = jobs[0];

      const phases = await query(
        "SELECT * FROM job_phases WHERE job_id=$1 ORDER BY order_index, start_date",
        [jobId]
      );

      if (phases.length === 0) {
        return res.status(400).json({ message: "No phases to sync" });
      }

      const existingSyncs = await query(
        "SELECT * FROM calendar_sync_events WHERE job_id=$1 AND calendar_id=$2",
        [jobId, calendar_id]
      );
      const syncMap: Record<number, { google_event_id: string; id: number }> = {};
      for (const s of existingSyncs) {
        syncMap[s.phase_id] = { google_event_id: s.google_event_id, id: s.id };
      }

      const results: any[] = [];

      for (const phase of phases) {
        if (!phase.due_date) continue;

        const summary = `[${job.code || job.title}] ${phase.name}`;
        const description = [
          `Commessa: ${job.code || job.title}`,
          job.client ? `Cliente: ${job.client}` : '',
          phase.notes || '',
        ].filter(Boolean).join('\n');

        const startDate = phase.start_date || phase.due_date;
        const endDate = phase.due_date;

        const eventData = {
          summary,
          description,
          start: startDate,
          end: endDate,
          allDay: true,
        };

        try {
          if (syncMap[phase.id]) {
            const gcEvent = await updateEvent(calendar_id, syncMap[phase.id].google_event_id, eventData);
            await query(
              "UPDATE calendar_sync_events SET updated_at=NOW() WHERE id=$1",
              [syncMap[phase.id].id]
            );
            results.push({ phase_id: phase.id, phase_name: phase.name, action: 'updated', event_id: gcEvent.id });
          } else {
            const gcEvent = await createEvent(calendar_id, eventData);
            await query(
              "INSERT INTO calendar_sync_events (job_id, phase_id, calendar_id, google_event_id) VALUES ($1,$2,$3,$4)",
              [jobId, phase.id, calendar_id, gcEvent.id]
            );
            results.push({ phase_id: phase.id, phase_name: phase.name, action: 'created', event_id: gcEvent.id });
          }
        } catch (phaseErr: any) {
          results.push({ phase_id: phase.id, phase_name: phase.name, action: 'error', error: phaseErr.message });
        }
      }

      res.json({
        job_id: jobId,
        job_code: job.code || job.title,
        synced_phases: results.filter(r => r.action !== 'error').length,
        errors: results.filter(r => r.action === 'error').length,
        details: results,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/calendar/sync-status/:jobId", async (req, res) => {
    try {
      const rows = await query(
        "SELECT * FROM calendar_sync_events WHERE job_id=$1 ORDER BY updated_at DESC",
        [req.params.jobId]
      );
      res.json({
        synced: rows.length > 0,
        count: rows.length,
        last_sync: rows.length > 0 ? rows[0].updated_at : null,
        events: rows,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  try { await query(`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )`); } catch(e: any) { console.error("[startup] notifications migration warning:", e.message); }

  app.get("/api/notifications", async (req: any, res) => {
    const email = req.user?.claims?.email || null;
    const rows = await query(
      "SELECT * FROM notifications WHERE user_email IS NULL OR user_email=$1 ORDER BY created_at DESC LIMIT 50",
      [email]
    );
    res.json(rows);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    await query("UPDATE notifications SET read=true WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  app.post("/api/notifications/mark-all-read", async (req: any, res) => {
    const email = req.user?.claims?.email || null;
    await query(
      "UPDATE notifications SET read=true WHERE (user_email IS NULL OR user_email=$1) AND read=false",
      [email]
    );
    res.json({ ok: true });
  });

  try { await query(`CREATE TABLE IF NOT EXISTS sprint_items (
    id SERIAL PRIMARY KEY,
    sprint_date DATE NOT NULL,
    column_key TEXT NOT NULL,
    job_id TEXT,
    title TEXT NOT NULL DEFAULT '',
    assignees TEXT DEFAULT '',
    content TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`); } catch(e: any) { console.error("[startup] sprint_items migration warning:", e.message); }
  try { await query(`CREATE INDEX IF NOT EXISTS idx_sprint_items_date ON sprint_items(sprint_date, column_key, sort_order)`); } catch(e: any) { console.error("[startup] sprint index warning:", e.message); }

  app.get("/api/sprint", async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    console.log(`[sprint] Querying sprint_items for date: '${date}'`);
    const rows = await query(
      "SELECT * FROM sprint_items WHERE sprint_date=$1 ORDER BY column_key, sort_order",
      [date]
    );
    console.log(`[sprint] Found ${rows.length} items for date '${date}'`);
    res.json(rows);
  });

  app.post("/api/sprint", async (req, res) => {
    const { sprint_date, column_key, job_id, title, assignees, content, sort_order } = req.body;
    if (!sprint_date || !column_key) return res.status(400).json({ error: "sprint_date and column_key required" });
    const rows = await query(
      `INSERT INTO sprint_items (sprint_date, column_key, job_id, title, assignees, content, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [sprint_date, column_key, job_id || null, title || '', assignees || '', content || '', sort_order || 0]
    );
    res.json(rows[0]);
  });

  app.patch("/api/sprint/:id", async (req, res) => {
    const { title, assignees, content, sort_order, column_key, job_id } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (title !== undefined) { sets.push(`title=$${idx++}`); vals.push(title); }
    if (assignees !== undefined) { sets.push(`assignees=$${idx++}`); vals.push(assignees); }
    if (content !== undefined) { sets.push(`content=$${idx++}`); vals.push(content); }
    if (sort_order !== undefined) { sets.push(`sort_order=$${idx++}`); vals.push(sort_order); }
    if (column_key !== undefined) { sets.push(`column_key=$${idx++}`); vals.push(column_key); }
    if (job_id !== undefined) { sets.push(`job_id=$${idx++}`); vals.push(job_id); }
    sets.push(`updated_at=NOW()`);
    vals.push(req.params.id);
    const rows = await query(
      `UPDATE sprint_items SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`,
      vals
    );
    res.json(rows[0] || { error: "not found" });
  });

  app.delete("/api/sprint/:id", async (req, res) => {
    await query("DELETE FROM sprint_items WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  });

  app.post("/api/sprint/duplicate", async (req, res) => {
    const { from_date, to_date } = req.body;
    if (!from_date || !to_date) return res.status(400).json({ error: "from_date and to_date required" });
    const existing = await query("SELECT COUNT(*) as c FROM sprint_items WHERE sprint_date=$1", [to_date]);
    if (parseInt(existing[0].c) > 0) return res.status(409).json({ error: "Target sprint already has items" });
    await query(
      `INSERT INTO sprint_items (sprint_date, column_key, job_id, title, assignees, content, sort_order)
       SELECT $2, column_key, job_id, title, assignees, content, sort_order
       FROM sprint_items WHERE sprint_date=$1`,
      [from_date, to_date]
    );
    const rows = await query("SELECT * FROM sprint_items WHERE sprint_date=$1 ORDER BY column_key, sort_order", [to_date]);
    res.json(rows);
  });

  app.get("/api/sprint/dates", async (_req, res) => {
    const rows = await query(
      "SELECT DISTINCT sprint_date FROM sprint_items ORDER BY sprint_date DESC LIMIT 52"
    );
    res.json(rows.map((r: any) => r.sprint_date));
  });

  return httpServer;
}
