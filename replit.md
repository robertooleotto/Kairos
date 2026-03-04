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
- `jobs` - Commesse/orders with status, dates, assignments
- `job_phases` - Phases within a job
- `job_departments` - Many-to-many: job ↔ department
- `job_assignments` - Assignments of people to jobs
- `spans` - Gantt chart time spans

## Key Files
- `server/db.ts` - PostgreSQL connection pool
- `server/routes.ts` - All REST API endpoints (/api/*)
- `server/index.ts` - Express server setup, static file serving
- `client/public/api-client.js` - Frontend API helper

## Notes
- Originally used Supabase auth (login page still references it) - not active
- The React/Vite setup exists but is not used; app is static HTML
- Default route (/) serves preview.html (Gantt calendar)
