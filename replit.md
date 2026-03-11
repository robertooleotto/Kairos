# Kairos — NuDesign Project Management

## Overview
Project management tool for NuDesign creative studio. Manages jobs (commesse), team, clients, Gantt-style calendar planning, foglio lavoro (image production tracking), and creative asset review/proofing.

## Architecture
- **Frontend**: Static HTML pages served from `client/public/` (vanilla JS, no React)
  - `dashboard.html` - KPI dashboard (landing page after login): active jobs, overdue deadlines, phase completion, workload by department, upcoming deadlines, activity feed
  - `preview.html` - Calendar view with deadline chips, overdue indicators (red pulsing), daily summary popup on cell click
  - `gantt.html` - Interactive Gantt chart (dhtmlxGantt) with filters by department, person, client, status, search
  - `commesse.html` - Jobs/orders management with CSV/PDF export, Google Calendar sync
  - `team.html` - Team management (areas, departments, collaborators)
  - `clienti.html` - Client management
  - `review.html` - Wrike-style proofing/review with side-by-side version comparison
  - `foglio-lavoro.html` - Production tracker with drag & drop reorder, quick filters, CSV/PDF export
  - `sprint.html` - Sprint board: weekly planning board with 18 department columns, editable cards (drag & drop between columns), week navigation, duplicate sprint, CSV export, print
  - `report.html` - Reports
  - `status.html` - Status overview
  - `database.html` - Database schema viewer
  - `admin-assegna-ruoli.html` - Role assignment admin
- **Backend**: Express.js with raw SQL queries via `server/db.ts` + Drizzle ORM for auth
- **Database**: PostgreSQL (Replit built-in)
- **Auth**: Replit Auth (OpenID Connect) via `server/replit_integrations/auth/` — supports Google login
- **API Client**: `client/public/api-client.js` - REST API wrapper used by all pages
- **Auth Guard**: `client/public/auth-guard.js` - Client-side session check, redirects to /api/login if unauthorized
- **Notifications**: `client/public/notifications.js` - Global notification bell component injected into all page headers

## Design
- Light theme on foglio-lavoro.html (warm off-white #f5f5f0 background, white #fff table cells)
- Dark theme with indigo (#6366f1) accent for other pages
- Gantt page uses dark navy blue theme (#132d4a background, #50b4e6 accent)
- Fonts: Fraunces (serif headings), Sora (body), JetBrains Mono (monospace)
- Custom CSS variables for consistent palette

## Authentication
- Replit Auth (OIDC) with passport — session-based via express-session stored in PostgreSQL `sessions` table
- Login page (`index.html`) shows "Accedi con Google" button
- Server middleware protects all .html pages (except index.html) — redirects to login
- Auth routes: `/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`
- User data stored in `users` table (id, email, first_name, last_name, profile_image_url)
- Schema defined in `shared/models/auth.ts`, exported from `shared/schema.ts`

## Database Tables
- `sessions` - Express session storage (sid, sess JSONB, expire)
- `users` - Auth users (id, email, first_name, last_name, profile_image_url)
- `notifications` - Internal notification system (user_email, type, title, message, link, read)
- `areas` - 11 work areas (Art Direction, Grafica, Video, etc.)
- `departments` - 16 departments under areas
- `task_types` - Types of tasks with units
- `collaborators` - Team members with roles
- `person_capacities` - Capacity per task type per person
- `collaborator_areas` - Many-to-many: collaborator ↔ area
- `person_departments` - Many-to-many: person ↔ department
- `clients` - Client companies
- `jobs` - Commesse/orders with status, dates, assignments (name and title both NOT NULL, id is TEXT)
- `job_phases` - Phases within a job (start_date, due_date, task_type_id, color, notes, assigned_to, completed, parent_phase_id)
- `job_departments` - Many-to-many: job ↔ department
- `job_assignments` - Assignments of people to jobs
- `spans` - Gantt chart time spans
- `review_assets` - Uploaded creative assets for review
- `review_comments` - Comments/annotations on review assets
- `review_approvals` - Approval decisions on assets
- `revision_comments` - Comments on foglio revisions (shape_type, shape_data JSONB, department_id, sent)
- `calendar_sync_events` - Tracks Google Calendar sync state per phase
- `sprint_items` - Sprint board cards (sprint_date, column_key, job_id, title, assignees, content, sort_order)
- `foglio_revisions` - Revision files for foglio images
- `foglio_images` - Image rows in foglio lavoro
- `foglio_columns` - Custom phase columns per job
- `foglio_locations` - Location entries per job

## Key Files
- `server/db.ts` - PostgreSQL connection pool + Drizzle ORM instance
- `server/routes.ts` - All REST API endpoints
- `server/googleCalendar.ts` - Google Calendar integration (create/update/delete events, freebusy)
- `server/index.ts` - Express server setup, auth wiring, static file serving with auth protection
- `server/replit_integrations/auth/` - Replit Auth OIDC integration
- `shared/models/auth.ts` - Drizzle schema for users/sessions tables
- `shared/schema.ts` - Re-exports auth models
- `client/public/api-client.js` - Frontend API helper
- `client/public/auth-guard.js` - Client-side auth check
- `client/public/notifications.js` - Global notification bell component
- `uploads/` - Stored avatar images and review assets

## Features
- **Dashboard**: KPI cards (active jobs, overdue phases, completed phases, due within 7 days), status overview bar, upcoming deadlines list, department workload chart, activity feed
- **Notifications**: Bell icon with unread badge on all pages. Notifications generated on comment send to department. API: GET /api/notifications, PATCH /api/notifications/:id/read, POST /api/notifications/mark-all-read
- **Calendar overdue indicators**: Red pulsing border + warning icon on overdue deadline chips. Daily summary popup on cell click
- **Gantt filters**: Department dropdown + person/assignee dropdown in toolbar, combinable with existing search/client/status filters
- **Foglio Lavoro**: Drag & drop row reorder (HTML5 drag API), quick filter bar (search, location, status), CSV export, print-friendly CSS for PDF
- **Review comparison**: "Confronta" button for side-by-side or overlay version comparison with sync scroll/zoom
- **CSV/PDF export**: Export buttons on foglio-lavoro and commesse pages. Browser-side CSV generation with BOM. Print CSS for PDF
- **Google Calendar sync**: Sync job phase deadlines to Google Calendar. createEvent/updateEvent/deleteEvent in googleCalendar.ts. Sync status indicator on job detail
- Team photo upload, Google Calendar availability checking, Gantt with dhtmlxGantt, Review/Proofing with drawing tools and department workflow

## Data Population (Sprint Week 2026-03-09)
- **43 clients** in `clients` table (40 from PDF + 3 preexisting)
- **59 commesse/jobs** in `jobs` table (58 from PDF + 1 preexisting Boffi|Catalogo 2026)
  - All jobs have: `code`, `client`, `name`, `client_id` (FK to clients)
  - Code format: 3-letter client prefix + 3-letter project (e.g., ILL-CVE, BOF-VRT, GLA-STD)
- **114 sprint items** for week 2026-03-09 across 17 department columns
  - Each item: sprint_date, column_key, job_id (FK to jobs), title, assignees, content, sort_order
  - Includes "IN PROGRAMMAZIONE" items (future planning)

## Notes
- The React/Vite setup exists but is not used; app is static HTML
- Default route (/) serves dashboard.html for authenticated users, index.html for unauthenticated
