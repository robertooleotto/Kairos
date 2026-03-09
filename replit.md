# Planning Studio - NuDesign

## Overview
Project management tool for NuDesign creative studio. Manages jobs (commesse), team, clients, Gantt-style calendar planning, and creative asset review/proofing.

## Architecture
- **Frontend**: Static HTML pages served from `client/public/` (vanilla JS, no React)
  - `preview.html` - Main Gantt calendar view (default page)
  - `gantt.html` - Interactive Gantt chart (dhtmlxGantt) with drag/resize/zoom, dark navy blue theme
  - `commesse.html` - Jobs/orders management
  - `team.html` - Team management (areas, departments, collaborators)
  - `clienti.html` - Client management
  - `review.html` - Wrike-style proofing/review page (upload assets, annotate, approve)
  - `report.html` - Reports
  - `status.html` - Status overview
  - `database.html` - Database schema viewer
  - `admin-assegna-ruoli.html` - Role assignment admin
- **Backend**: Express.js with raw SQL queries via `server/db.ts`
- **Database**: PostgreSQL (Replit built-in)
- **API Client**: `client/public/api-client.js` - REST API wrapper used by all pages

## Design
- Light theme on foglio-lavoro.html (warm off-white #f5f5f0 background, white #fff table cells)
- Dark theme with indigo (#6366f1) accent for other pages
- Gantt page uses dark navy blue theme (#132d4a background, #50b4e6 accent)
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
- `jobs` - Commesse/orders with status, dates, assignments (name and title both NOT NULL, id is TEXT)
- `job_phases` - Phases within a job (start_date, due_date, task_type_id, color, notes, assigned_to, completed, parent_phase_id for sub-phases)
- `job_departments` - Many-to-many: job ↔ department
- `job_assignments` - Assignments of people to jobs
- `spans` - Gantt chart time spans
- `review_assets` - Uploaded creative assets for review (job_id TEXT, file_url, status: pending/in_review/approved/changes_requested/rejected, versioning via parent_asset_id)
- `review_comments` - Comments/annotations on review assets (pin_x, pin_y for image coordinates, resolved flag, parent_comment_id for replies)
- `review_approvals` - Approval decisions on assets (decision: approved/changes_requested/rejected, reviewer_name, note)
- `revision_comments` - Comments/annotations on foglio_revisions (revision_id FK→foglio_revisions.id, pin_x, pin_y, resolved, parent_comment_id for replies)

## Key Files
- `server/db.ts` - PostgreSQL connection pool
- `server/routes.ts` - All REST API endpoints (/api/*), includes multer for avatar and review file uploads
- `server/googleCalendar.ts` - Google Calendar integration (Replit Connector) for availability checking
- `server/index.ts` - Express server setup, static file serving
- `client/public/api-client.js` - Frontend API helper
- `uploads/` - Stored avatar images and review assets, served statically at /uploads/

## Features
- Team photo upload: collaborators can have avatar photos uploaded via the team form. Files stored in /uploads/, URL saved in collaborators.avatar column. Max 5MB, supports JPG/PNG/GIF/WebP.
- Google Calendar integration: each collaborator can have a `google_calendar_id` (their Google email) stored in the DB. The app uses the Replit Google Calendar connector to check freebusy/events for availability.
- Job phases / Focus view: clicking a job opens a detail panel with a timeline of work phases. Phases support hierarchy: Reparto (area) → Lavorazione (task_type) → Sottolavorazione (sub-phase via parent_phase_id).
- Gantt bar rendering: each phase gets its own row in the Gantt, colored by department (DEPT_COLORS map). Bars are continuous with grouped hover effect.
- dhtmlxGantt page (gantt.html): Full interactive Gantt chart. Dark navy blue theme. Week scale shows W1-W5 per month. Phase CRUD via modal (double-click edit, right-click context menu). Drag/resize auto-save.
- Review/Proofing (review.html): Gallery-style review tool integrated with foglio_revisions. Light theme gallery, dark viewer. Select commessa → select phase → see all revision images in a grid gallery. Click image to open full-screen viewer with:
  - **Zoom**: Mouse wheel (cursor-relative), Fit/1:1/2x buttons, +/- buttons, keyboard (+/-/0). Uses CSS transform:scale() on .canvas-container with transform-origin:0 0, native overflow:auto scrolling.
  - **Drawing tools**: SVG overlay for Circle, Rectangle, Arrow, Freehand annotations. Color picker (red/yellow/green/blue/white). Undo/Clear. Shapes stored client-side (drawShapes array), rendered via SVG viewBox matching image natural dimensions.
  - **Pin annotations**: Click to place numbered pins on image, linked to comments. Pins zoom/pan with image inside canvas-container.
  - **Comments sidebar**: Author selector (Art Director/Reviewer/Cliente/PM/Fotografo/Post-produzione), tag system (Correzione/Problema/Nota/Domanda/Approvato as colored badges), replies, resolve/delete.
  - Navigation: prev/next arrows + keyboard (Left/Right/Escape).
  - Deep-link: review.html?jobId=...&revisionId=... or &imageId=... from foglio-lavoro "Apri in Review".
- Foglio Lavoro (foglio-lavoro.html): Spreadsheet-like production tracker with Google Sheets-style tab bar at bottom. Tab system includes:
  - **Elenco Immagini** tab: Image production tracking per commessa. Custom phase columns configurable per job (default: Location Bozza, Location Def, Fotografia, Styling, Revisioni, Render, Post, Finiture, Rifacimenti, Recupero, Fatturato). Phase values displayed as checkmark icons (click to toggle 0/1). Row selection via checkboxes for batch color assignment. Delete mode toggled via toolbar button (hidden by default). Image names displayed at 1rem bold. Row colors saved in `row_color` column (red/orange/yellow/green/blue/purple/pink/gray). Columns config modal with add/delete.
  - **Locations** tab: Location list per commessa with Nome location, Tipologia (dropdown with 22 predefined values like "Architettura interni moderna", "Set studio complesso", "Moodboard" etc.), Descrizione, Note. Inline editing with dropdown for tipologia field.
- `foglio_locations` table: id(serial), job_id(text), nome_location, tipologia, descrizione, note, sort_order
  - **Expandable Revision Rows**: Each image row has an expand toggle (▶) that reveals per-phase revision slots. Users can upload revision files (images/videos/PDFs, max 20MB) directly into phase cells, see thumbnails, and click to open a lightbox with prev/next navigation and keyboard support (Escape/Arrow keys). The latest revision thumbnail also appears inline in the image name column.
- `foglio_revisions` table: id(serial), foglio_image_id(int FK→foglio_images.id), phase_key(text), file_url(text), file_type(text: image/video/document), title(text), version(int), notes(text), uploaded_by(text), created_at(timestamp). Index on (foglio_image_id, phase_key).
- AREA_TO_CATEGORIES maps area IDs to task_type categories for filtering in the phase form.

## Foglio Lavoro API Endpoints
- GET /api/foglio-columns/:jobId - List columns for a job
- POST /api/foglio-columns/:jobId - Add column
- PUT /api/foglio-columns/:id - Update column
- DELETE /api/foglio-columns/:id - Delete column
- POST /api/foglio-columns/:jobId/init-default - Initialize default phase columns
- GET /api/foglio-images/:jobId - List image rows for a job
- POST /api/foglio-images/:jobId - Add image row
- PUT /api/foglio-images/:id - Update full image row
- PATCH /api/foglio-images/:id/cell - Update single cell (direct field or JSONB phase value)
- DELETE /api/foglio-images/:id - Delete image row
- GET /api/foglio-locations/:jobId - List locations for a job
- POST /api/foglio-locations/:jobId - Add location
- PUT /api/foglio-locations/:id - Update location
- PATCH /api/foglio-locations/:id/cell - Update single cell
- DELETE /api/foglio-locations/:id - Delete location
- GET /api/foglio-revisions/:imageId - List revisions for an image (optional ?phase_key filter)
- GET /api/foglio-revisions-batch/:jobId - Batch fetch all revisions for a job
- POST /api/foglio-revisions/:imageId/upload - Upload revision file (multipart, max 20MB)
- POST /api/foglio-revisions/batch-upload/:jobId - Batch upload multiple files with auto-matching by filename (exact match → substring → 3+ common parts)
- DELETE /api/foglio-revisions/:id - Delete revision + file

## Review API Endpoints (legacy review_assets)
- POST /api/review-assets/upload - Upload file (multipart, max 20MB, JPG/PNG/GIF/WebP/PDF/MP4)
- GET /api/review-assets - List all assets (filter by job_id, status)
- GET /api/review-assets/:id - Get single asset
- PUT /api/review-assets/:id/status - Update status
- DELETE /api/review-assets/:id - Delete asset
- GET/POST /api/review-assets/:id/comments - List/add comments (with pin_x, pin_y)
- PUT /api/review-comments/:id/resolve - Toggle resolved
- DELETE /api/review-comments/:id - Delete comment
- GET/POST /api/review-assets/:id/approvals - List/add approval decisions
- GET /api/review-assets/:id/versions - List all versions of an asset

## Revision Comments API (used by review.html gallery)
- GET /api/revision-comments/:revisionId - List comments for a foglio revision
- POST /api/revision-comments/:revisionId - Add comment (author_name, content, pin_x, pin_y, parent_comment_id)
- PUT /api/revision-comments/:id/resolve - Toggle resolved
- DELETE /api/revision-comments/:id - Delete comment

## Notes
- Originally used Supabase auth (login page still references it) - not active
- The React/Vite setup exists but is not used; app is static HTML
- Default route (/) serves preview.html (Gantt calendar)
