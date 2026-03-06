# Planning Studio - NuDesign

## Overview
Project management tool for NuDesign creative studio. Manages jobs (commesse), team, clients, and Gantt-style calendar planning.

## Architecture
- **Frontend**: Static HTML pages served from `client/public/` (vanilla JS, no React)
  - `preview.html` - Main Gantt calendar view (default page)
  - `commesse.html` - Jobs/orders management
  - `team.html` - Team management (areas, departments, collaborators)
  - `clienti.html` - Client management
  - `report.html` - Reports
  - `status.html` - Status overview
  - `database.html` - Database schema viewer
  - `admin-assegna-ruoli.html` - Role assignment admin
- **Backend**: Express.js with raw SQL queries via `server/db.ts`
- **Database**: PostgreSQL (Replit built-in)
- **API Client**: `client/public/api-client.js` - REST API wrapper used by all pages

## Design
- Dark theme with indigo (#6366f1) accent
- Fonts: Fraunces (serif headings), Sora (body), JetBrains Mono (monospace)
- Custom CSS variables for consistent palette

## Database Tables
- `areas` - 11 work areas (Art Direction, Grafica, Video, etc.)
- `departments` - 16 departments under areas
- `task_types` - Types of tasks with units
- `collaborators` - Team members with roles
- `person_capacities` - Capacity per task type per person
- `collaborator_areas` - Many-to-many: collaborator ↔ area
- `person_departments` - Many-to-many: person ↔ department
- `clients` - Client companies
- `jobs` - Commesse/orders with status, dates, assignments (name and title both NOT NULL)
- `job_phases` - Phases within a job (start_date, due_date, task_type_id, color, notes, assigned_to, completed, parent_phase_id for sub-phases)
- `job_departments` - Many-to-many: job ↔ department
- `job_assignments` - Assignments of people to jobs
- `spans` - Gantt chart time spans

## Key Files
- `server/db.ts` - PostgreSQL connection pool
- `server/routes.ts` - All REST API endpoints (/api/*), includes multer for avatar uploads
- `server/googleCalendar.ts` - Google Calendar integration (Replit Connector) for availability checking
- `server/index.ts` - Express server setup, static file serving
- `client/public/api-client.js` - Frontend API helper
- `uploads/` - Stored avatar images, served statically at /uploads/

## Features
- Team photo upload: collaborators can have avatar photos uploaded via the team form. Files stored in /uploads/, URL saved in collaborators.avatar column. Max 5MB, supports JPG/PNG/GIF/WebP.
- Google Calendar integration: each collaborator can have a `google_calendar_id` (their Google email) stored in the DB. The app uses the Replit Google Calendar connector to check freebusy/events for availability. API endpoints: `/api/calendar/events/:calendarId`, `/api/calendar/freebusy`, `/api/calendar/availability`, `/api/calendar/team-availability`.
- Job phases / Focus view: clicking a job opens a detail panel with a timeline of work phases. Each phase has name, category/task_type, start/end dates, assigned collaborator, color, notes, completion status. Phases shown as vertical timeline with progress bars. Phases support hierarchy: Reparto (area) → Lavorazione (task_type) → Sottolavorazione (sub-phase via parent_phase_id).
- Gantt bar rendering: each phase gets its own row in the Gantt, colored by department (DEPT_COLORS map). Bars are continuous (no day-cell gaps) with grouped hover effect. Phase bars are draggable (move) and resizable from edges (like audio clips). PATCH `/api/jobs/:jobId/phases/:id/dates` updates just start_date/due_date.
- AREA_TO_CATEGORIES maps area IDs to task_type categories for filtering in the phase form.

## Notes
- Originally used Supabase auth (login page still references it) - not active
- The React/Vite setup exists but is not used; app is static HTML
- Default route (/) serves preview.html (Gantt calendar)
