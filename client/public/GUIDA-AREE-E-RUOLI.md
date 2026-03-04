# 🏗️ IMPLEMENTAZIONE SISTEMA AREE E RUOLI - GUIDA COMPLETA

---

## 📋 STRUTTURA IMPLEMENTATA

### **AREE (11 totali)**
1. Art Direction
2. Creatività
3. Grafica
4. Modelli / Shaders / Textures
5. Immagini / Animazioni
6. Fotografia
7. Produzione AI
8. Shooting / Video
9. Montaggio / Motion
10. Color / Compositing / Fotolito
11. Configuratore

### **REPARTI (16 totali)**
- ART DIRECTION → Art Direction
- CONCEPT → Creatività
- GRAFICA → Grafica
- MODELLI → Modelli/Shaders/Textures
- PRODUZIONE 3D → Immagini/Animazioni
- ANIMAZIONE 3D → Immagini/Animazioni
- FOTOGRAFIA → Fotografia
- PRODUZIONE AI → Produzione AI
- ANIMAZIONE AI → Produzione AI
- SHOOTING → Shooting/Video
- MONTAGGIO → Montaggio/Motion
- MOTION → Montaggio/Motion
- COMPOSITING → Color/Compositing/Fotolito
- COLOR-CORRECTION → Color/Compositing/Fotolito
- FOTOLITO → Color/Compositing/Fotolito
- CONFIGURATORE → Configuratore

---

## 👥 RUOLI E PERMESSI

### **OPERATION MANAGER** (livello massimo)
**Vede:** ✅ TUTTO
- Tutte le 11 aree
- Tutti i 16 reparti
- Tutte le 30 persone
- Tutte le commesse
- Report globali

**Modifica:** ✅ TUTTO
- Crea/modifica/elimina aree
- Crea/modifica/elimina reparti
- Crea/modifica/elimina persone
- Crea/modifica/elimina commesse
- Gestisce tutti i permessi

---

### **AREA MANAGER** (stesso livello di Operation)
**Vede:** ✅ TUTTE le aree (read-only)
- Vede tutte le 11 aree
- Vede tutti i 16 reparti
- Vede tutte le persone
- Vede tutte le commesse

**Modifica:** ✅ SOLO la sua area
- Modifica solo reparti della sua area
- Modifica solo persone della sua area
- Crea/modifica commesse che coinvolgono la sua area

**Esempio:** Manager "Immagini/Animazioni"
- ✅ Vede tutto (read-only)
- ✅ Modifica PRODUZIONE 3D, ANIMAZIONE 3D
- ✅ Crea commesse
- ❌ Non modifica altre aree

---

### **PROJECT MANAGER**
**Vede:** ✅ TUTTE le aree (read-only)
- Vede tutte le 11 aree
- Vede tutti i 16 reparti
- Vede tutte le persone
- Vede tutte le commesse

**Modifica:** ✅ Solo le commesse che gestisce
- Crea nuove commesse
- Modifica commesse assegnate a lui
- Assegna persone alle commesse

---

### **OPERATORE**
**Vede:** ✅ Solo il suo lavoro
- Vede solo le commesse assegnate a lui
- Vede solo il suo calendario
- Vede solo il suo timesheet

**Modifica:** ✅ Solo il suo timesheet
- Inserisce ore lavorate
- Aggiorna stato task personali

---

## 🗄️ DATABASE STRUTTURA

```sql
TABELLE NUOVE:
├─ areas (11 aree)
├─ departments (16 reparti)
├─ person_departments (competenze multiple)
└─ job_departments (reparti coinvolti in commessa)

TABELLE AGGIORNATE:
├─ collaborators (+ primary_department_id, role, managed_area_id)
├─ clients (+ 11 nuove colonne)
└─ job_assignments (+ department_id, allocated_hours)
```

---

## 🎯 WORKFLOW TIPICO

### **1. OPERATION MANAGER crea struttura**
```
1. Database già popolato con 11 aree e 16 reparti
2. Crea le 30 persone e le assegna ai reparti
3. Imposta i ruoli (alcuni Area Manager, alcuni Project Manager, molti Operatori)
4. Configura competenze multiple (es: Mario in MODELLI ma può lavorare anche in PRODUZIONE 3D)
```

### **2. MANAGER crea commessa**
```
1. Click "+ Nuova Commessa"
2. Seleziona cliente
3. Seleziona reparti coinvolti: CONCEPT → GRAFICA → FOTOLITO
4. Per ogni reparto: stima ore
5. Assegna persone specifiche
6. Salva commessa
```

### **3. OPERATORE lavora**
```
1. Login
2. Vede solo le sue 5 commesse attive
3. Click su commessa
4. Inserisce ore lavorate oggi
5. Aggiorna stato task
```

### **4. AREA MANAGER monitora**
```
1. Dashboard mostra:
   - Carico lavoro area (85%)
   - Persone occupate (7/9)
   - Commesse in corso (12)
2. Può vedere altre aree (read-only) per coordinamento
3. Riassegna persone se necessario nella sua area
```

---

## 📤 COSA FARE ORA

### **STEP 1: Database (10 minuti)**

1. **Supabase** → SQL Editor
2. **Copia/incolla** tutto da `database-complete-with-areas.sql`
3. **Run** ▶️
4. Verifica:
   - ✅ Tabella `areas` creata con 11 righe
   - ✅ Tabella `departments` creata con 16 righe
   - ✅ Tabella `person_departments` creata
   - ✅ Tabella `job_departments` creata
   - ✅ `collaborators` ha nuove colonne

---

### **STEP 2: Popola persone (20 minuti)**

**IMPORTANTE:** Devi aggiornare le persone esistenti!

```sql
-- Esempio: Assegna Mario a MODELLI come Operation Manager
UPDATE collaborators 
SET 
  primary_department_id = 'dept_modelli',
  role = 'operation_manager'
WHERE email = 'mario@nudesign.it';

-- Esempio: Assegna Sara a PRODUZIONE 3D come Area Manager
UPDATE collaborators 
SET 
  primary_department_id = 'dept_produzione3d',
  role = 'area_manager',
  managed_area_id = 'area_immagini'
WHERE email = 'sara@nudesign.it';

-- Esempio: Assegna Luca a GRAFICA come Operatore
UPDATE collaborators 
SET 
  primary_department_id = 'dept_grafica',
  role = 'operator'
WHERE email = 'luca@nudesign.it';
```

---

### **STEP 3: Aggiungi competenze multiple (opzionale)**

```sql
-- Mario (MODELLI) può lavorare anche in PRODUZIONE 3D e CONFIGURATORE
INSERT INTO person_departments (person_id, department_id, skill_level) VALUES
  ('mario_id', 'dept_produzione3d', 'senior'),
  ('mario_id', 'dept_configuratore', 'mid');
```

---

## 🎨 INTERFACCIA FINALE

### **Dashboard Operation Manager**
```
┌────────────────────────────────────────────────────────┐
│ 📊 Nudesign Planning         [Operation Manager ▼]    │
├────────────────────────────────────────────────────────┤
│ [Dashboard] [Aree ▼] [Commesse] [Team] [Report]       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ CARICO LAVORO GLOBALE                                  │
│                                                        │
│ Art Direction         ████░░░░░░ 40%   [2p]  [3j]    │
│ Creatività            ██████░░░░ 60%   [3p]  [5j]    │
│ Grafica               ████████░░ 80%   [4p]  [8j]    │
│ Modelli/Shaders       ██████████ 95%⚠️ [3p] [12j]    │
│ Immagini/Animazioni   ███████░░░ 70%   [9p] [15j]    │
│ ...                                                    │
│                                                        │
│ COMMESSE CRITICHE                                      │
│ 🔴 CMP-089 | ABC | Scade domani                       │
│    MODELLI → PRODUZIONE 3D → COLOR                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### **Dashboard Area Manager (Immagini/Animazioni)**
```
┌────────────────────────────────────────────────────────┐
│ 📸 Area: Immagini/Animazioni   [Area Manager ▼]      │
├────────────────────────────────────────────────────────┤
│ ← Torna a Dashboard                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ I MIEI REPARTI                                         │
│                                                        │
│ ┌─────────────────┐  ┌─────────────────┐             │
│ │ PRODUZIONE 3D   │  │ ANIMAZIONE 3D   │             │
│ │ 5 persone       │  │ 4 persone       │             │
│ │ 10 commesse     │  │ 5 commesse      │             │
│ │ Carico: 70%     │  │ Carico: 85%     │             │
│ └─────────────────┘  └─────────────────┘             │
│                                                        │
│ 👁️ OVERVIEW ALTRE AREE (read-only)                    │
│ Modelli/Shaders: 95%⚠️  Color/Comp: 100%🔴           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### **Dashboard Operatore**
```
┌────────────────────────────────────────────────────────┐
│ 👤 Mario Rossi - MODELLI              [Operatore ▼]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ LE MIE COMMESSE (5 attive)                             │
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ CMP-089 | Cliente ABC | MODELLI                   ││
│ │ Scade: Domani 🔴  Ore: 8/16                       ││
│ │ [Inserisci ore oggi]                              ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ TIMESHEET OGGI                                         │
│ 08:00 - 12:00  CMP-089  [4h]                          │
│ 14:00 - 18:00  CMP-092  [4h]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 PROSSIMI PASSI

Dopo aver eseguito il database SQL:

1. **PASSO 1:** Assegna ruoli alle persone esistenti
2. **PASSO 2:** Testa login con diversi ruoli
3. **PASSO 3:** Verifica che ogni ruolo veda solo ciò che deve vedere
4. **PASSO 4:** Crea una commessa di test e assegna reparti
5. **PASSO 5:** Verifica workflow completo

---

## ❓ FAQ

**Q: Come assegno un Area Manager?**
```sql
UPDATE collaborators 
SET 
  role = 'area_manager',
  managed_area_id = 'area_immagini'  -- Area che gestisce
WHERE email = 'sara@nudesign.it';
```

**Q: Una persona può lavorare in più reparti?**
Sì! Usa la tabella `person_departments`:
```sql
-- Mario è in MODELLI ma può fare anche PRODUZIONE 3D
INSERT INTO person_departments (person_id, department_id) VALUES
  ('mario_id', 'dept_produzione3d');
```

**Q: Come funziona il workflow di una commessa?**
```
1. Manager crea commessa
2. Seleziona reparti coinvolti (es: CONCEPT → GRAFICA → FOTOLITO)
3. Sistema mostra persone disponibili per reparto
4. Manager assegna persone specifiche
5. Operatori vedono task nel loro dashboard
6. Operatori inseriscono ore
7. Sistema calcola avanzamento
```

**Q: Area Manager può vedere altre aree?**
Sì, in **read-only**! Questo serve per coordinamento. Vede il carico lavoro di altre aree ma non può modificarle.

---

## 🐛 TROUBLESHOOTING

**❌ "areas table doesn't exist"**
→ Non hai eseguito il SQL. Vai su Supabase → SQL Editor → Esegui script.

**❌ "person_id violates foreign key constraint"**
→ Stai provando a inserire in `person_departments` con un ID persona che non esiste. Verifica che la persona esista prima.

**❌ "User doesn't have permission"**
→ Le RLS policies stanno funzionando! Verifica che l'utente loggato abbia il ruolo corretto.

**❌ "Vedo commesse di altri reparti"**
→ Verifica che l'utente abbia `role = 'operator'` e non `operation_manager`.

---

## 🎯 STATO ATTUALE

✅ Database schema completo
✅ Aree e reparti popolati
✅ Ruoli definiti
✅ RLS policies configurate
✅ API client con funzioni aree

⏳ TODO:
- Dashboard HTML per ogni ruolo
- Form persona aggiornato
- Form commessa con selezione reparti
- Menu dinamico

---

**ESEGUI IL DATABASE SQL E DIMMI QUANDO HAI FINITO!** 🚀
