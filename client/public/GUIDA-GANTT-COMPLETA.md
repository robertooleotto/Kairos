# 📊 CALENDARIO GANTT COMPLETO - GUIDA DEFINITIVA

---

## 🎉 SISTEMA MILESTONE MULTI-REPARTO IMPLEMENTATO!

Hai ricevuto un **sistema professionale completo** per gestire commesse con workflow multi-reparto.

---

## 📦 FILES RICEVUTI (6 files)

1. **database-milestones.sql** ← Schema database completo
2. **preview.html** ← Calendario Gantt con filtri e carico
3. **milestone-manager.js** ← Gestione milestone in commesse
4. **milestone-manager.css** ← Stili per milestone
5. **database-issues.sql** ← Sistema issues (già fatto prima)
6. **GUIDA-GANTT-COMPLETA.md** ← Questa guida

---

## 🚀 INSTALLAZIONE (10 MINUTI)

### **STEP 1: Database (3 min)**

#### **1A: Schema Milestone**
```sql
-- Supabase → SQL Editor → New query
-- Incolla TUTTO da database-milestones.sql
-- Click Run ▶️
```

Verifica:
```sql
SELECT * FROM job_roles;
-- Dovresti vedere 7 ruoli predefiniti

SELECT COUNT(*) FROM job_milestones;
-- Dovrebbe dire 0 (tabella vuota ma pronta)
```

#### **1B: Schema Issues** (se non l'hai già fatto)
```sql
-- Incolla TUTTO da database-issues.sql
-- Click Run ▶️
```

---

### **STEP 2: File Calendario (2 min)**

1. **Netlify** → Tuo sito
2. **Trascina** `preview.html`
3. Aspetta 15 secondi
4. Hard refresh (**Ctrl+Shift+R**)

---

### **STEP 3: File Milestone Manager (3 min)**

#### **3A: Aggiungi CSS**

Apri `commesse.html` e aggiungi DENTRO il tag `<head>`:
```html
<link rel="stylesheet" href="milestone-manager.css">
```

#### **3B: Aggiungi JavaScript**

Sempre in `commesse.html`, aggiungi PRIMA del tag `</body>`:
```html
<script src="milestone-manager.js"></script>
```

#### **3C: Carica i file**

1. **Netlify** → Tuo sito
2. **Trascina** `milestone-manager.js`
3. **Trascina** `milestone-manager.css`
4. **Trascina** `commesse.html` (aggiornato)
5. Hard refresh (**Ctrl+Shift+R**)

---

### **STEP 4: Test Completo (2 min)**

1. Ricarica app (**Ctrl+Shift+R**)
2. Vai su **Calendario**
3. Verifica:
   - ✅ Vedi i 5 filtri in alto
   - ✅ Vedi barra carico con %
   - ✅ Vedi calendario (potrebbe essere vuoto - normale!)

4. Vai su **Commesse**
5. Click su una commessa esistente
6. Verifica:
   - ✅ Vedi 2 tab: "Info Commessa" e "Milestone"
   - ✅ Click tab "Milestone"
   - ✅ Vedi pulsante "+ Aggiungi Milestone"

---

## 🎯 COME FUNZIONA IL SISTEMA

### **CONCETTO BASE**

```
COMMESSA = WORKFLOW MULTI-FASE
│
├─ Fase 1: Modellazione 3D    (Reparto: Produzione, Date: 10-15 Feb, Team: Mario)
├─ Fase 2: Rendering           (Reparto: Immagini,   Date: 16-20 Feb, Team: Sara)
├─ Fase 3: Compositing         (Reparto: Color,      Date: 21-25 Feb, Team: Roberto)
└─ Fase 4: Fotolito           (Reparto: Fotolito,   Date: 26-28 Feb, Team: Giulia)
```

**Nel GANTT vedi:**
```
VENETA - Brochure
████ 3D ████ IMG ████ COMP ████ FT ████
10      15     20      25     28
```

---

## 📋 WORKFLOW COMPLETO

### **1. CREA COMMESSA**

```
Vai su: Commesse
Click: "+ Nuova Commessa"
Compila:
  - Codice: 25100-ARM-CAT-I
  - Cliente: ARMONY
  - Titolo: Catalogo Estate 2026
  - Tipo: Catalogo
  - Scadenza: 28 Feb 2026
  - Stato: Nuova
Salva
```

---

### **2. DEFINISCI MILESTONE**

```
Click sulla commessa appena creata
Click tab: "Milestone"
Click: "+ Aggiungi Milestone"

Milestone 1:
  - Nome fase: Modellazione 3D
  - Data inizio: 2026-02-10
  - Data fine: 2026-02-15
Salva

Milestone 2:
  - Nome fase: Rendering Base
  - Data inizio: 2026-02-16
  - Data fine: 2026-02-20
Salva

Milestone 3:
  - Nome fase: Compositing
  - Data inizio: 2026-02-21
  - Data fine: 2026-02-25
Salva

Milestone 4:
  - Nome fase: Fotolito
  - Data inizio: 2026-02-26
  - Data fine: 2026-02-28
Salva
```

---

### **3. VEDI NEL CALENDARIO GANTT**

```
Vai su: Calendario
Vedi:

┌──────────────────────────────────────────────────────┐
│ Febbraio 2026                                        │
│ 10  11  12  13  14  15  16  17  18  19  20  21 ...  │
├──────────────────────────────────────────────────────┤
│ ARMONY - Catalogo Estate 2026                        │
│ ████ 3D ████ ████ IMG ████ ████ COMP ████ FT ████  │
└──────────────────────────────────────────────────────┘
```

---

## 🔍 SISTEMA FILTRI COMPLETO

### **FILTRO 1: VISTA**

```
[Totale]         → Tutte le milestone insieme
[Per Reparto]    → Separa per reparto (coming soon)
[Per Persona]    → Separa per persona (coming soon)
```

---

### **FILTRO 2: REPARTO**

```
[Tutti]
[Produzione 3D]      → Solo fasi 3D
[Rendering Immagini] → Solo rendering
[Color/Compositing]  → Solo compositing
[Fotolito]          → Solo fotolito
[Creatività]        → Solo creatività
```

**Esempio uso:**
```
Seleziona: [Compositing]
Risultato: Vedi SOLO le fasi di compositing
           di TUTTE le commesse
Carico: "CARICO COMPOSITING: 85%"
```

---

### **FILTRO 3: TIPO LAVORO**

```
[Tutti]
[Catalogo]
[Brochure]
[Immagini]
[Fotolito]
[ADV]
```

**Esempio uso:**
```
Seleziona: [Catalogo]
Risultato: Vedi solo commesse tipo Catalogo
           con tutte le loro fasi
```

---

### **FILTRO 4: MANSIONE**

```
[Tutte]
[Modellatore 3D]
[Rendering Artist]
[Compositor]
[Color Grading]
[Fotolitista]
[Retoucher]
[Creative Director]
```

**Esempio uso:**
```
Seleziona: [Compositor]
Risultato: Vedi solo milestone che richiedono
           la mansione Compositor
```

---

### **FILTRO 5: PERSONA**

```
[Tutti]
[Roberto Oleotto]
[Tina Carletti]
[Mario]
[Sara]
... tutti i collaboratori
```

**Esempio uso:**
```
Seleziona: [Roberto]
Risultato: Vedi solo milestone assegnate a Roberto
Carico: "CARICO ROBERTO: 75%"
```

---

## 🎨 COMBINAZIONI FILTRI

### **Scenario A: Carico Compositing**
```
Vista: [Totale]
Reparto: [Compositing]
Tipo: [Tutti]
Mansione: [Tutte]
Persona: [Tutti]

RISULTATO:
→ Tutte le fasi Compositing
→ Di tutte le commesse
→ Indicatore: "CARICO COMPOSITING: 85%"
```

---

### **Scenario B: Lavoro di Roberto**
```
Vista: [Totale]
Reparto: [Tutti]
Tipo: [Tutti]
Mansione: [Tutte]
Persona: [Roberto]

RISULTATO:
→ Tutte le milestone di Roberto
→ Qualsiasi reparto, qualsiasi tipo
→ Indicatore: "CARICO ROBERTO: 70%"
```

---

### **Scenario C: Cataloghi in Produzione 3D**
```
Vista: [Totale]
Reparto: [Produzione 3D]
Tipo: [Catalogo]
Mansione: [Tutte]
Persona: [Tutti]

RISULTATO:
→ Solo fasi 3D
→ Solo dei cataloghi
→ Indicatore: "CARICO PRODUZIONE 3D: 60%"
```

---

### **Scenario D: Compositing fatto da Roberto**
```
Vista: [Totale]
Reparto: [Compositing]
Tipo: [Tutti]
Mansione: [Compositor]
Persona: [Roberto]

RISULTATO:
→ Solo fasi Compositing
→ Solo mansione Compositor
→ Solo assegnate a Roberto
→ Focus totale sul suo carico specifico
```

---

## 📊 INDICATORE CARICO

### **Come viene calcolato:**

```
1. Somma ore stimate di tutte le milestone filtrate
2. Calcola giorni lavorativi nel mese (escl. weekend)
3. Calcola ore disponibili (giorni × 8h × persone)
4. Carico % = (ore richieste / ore disponibili) × 100
```

### **Colori:**

- 🟢 **0-70%** = Ok, carico normale
- 🟡 **71-100%** = Medio, attenzione
- 🔴 **>100%** = Sovraccarico! ⚠️

### **Esempi:**

```
CARICO TOTALE: ████████░░ 85% 🟡
→ Studio carico all'85%, va bene

CARICO COMPOSITING: ████████████ 120% 🔴
→ Reparto Compositing sovraccarico!

CARICO ROBERTO: ██████░░░░ 65% 🟢
→ Roberto ha ancora capacità
```

---

## 🎨 CALENDARIO GANTT - INTERAZIONI

### **Click su Barra**
```
Click barra VENETA - Brochure
→ Pannello laterale si apre
→ Vedi:
  - Info commessa
  - Tutte le milestone
  - Issues aperti
  - Pulsante "Aggiungi Milestone"
```

### **Colori Barre**
```
🟣 Viola   = Modellazione 3D
🔵 Blu     = Rendering Immagini
🟢 Verde   = Compositing/Color
🟠 Arancio = Fotolito
🟡 Rosa    = Creatività
```

### **Navigazione Mesi**
```
‹  = Mese precedente
•  = Torna a oggi
›  = Mese successivo
```

---

## ⚡ FUNZIONI AVANZATE

### **Pannello Dettaglio**

Quando clicki una barra, vedi:

```
┌──────────────────────────────┐
│ VENETA CUCINE - Brochure  ✕ │
│ 25017-VNC-BRO-F              │
├──────────────────────────────┤
│ INFO COMMESSA                │
│ Cliente: VENETA CUCINE       │
│ Tipo: Brochure               │
│ Scadenza: 28 Feb 2026        │
├──────────────────────────────┤
│ MILESTONE (4)                │
│ ┌──────────────────────────┐ │
│ │ #1 🟣 Modellazione 3D    │ │
│ │ 10-15 Feb • Todo         │ │
│ │ 👤 Mario                 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ #2 🔵 Rendering Base     │ │
│ │ 16-20 Feb • In Corso     │ │
│ │ 👤 Sara, Paolo           │ │
│ └──────────────────────────┘ │
│ ...                          │
│ [+ Aggiungi Milestone]       │
├──────────────────────────────┤
│ ISSUES APERTI (2)            │
│ 🔴 File corrotti             │
│ ⚠️ Cliente lento             │
└──────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

### **DATABASE:**
- [ ] Eseguito `database-milestones.sql`
- [ ] Eseguito `database-issues.sql`
- [ ] Tabelle create correttamente

### **FILES:**
- [ ] Caricato `preview.html` (calendario)
- [ ] Caricato `milestone-manager.js`
- [ ] Caricato `milestone-manager.css`
- [ ] Aggiornato `commesse.html` con includes

### **TEST CALENDARIO:**
- [ ] Vedo 5 filtri in alto
- [ ] Vedo indicatore carico
- [ ] Filtri funzionano
- [ ] Barra carico si aggiorna
- [ ] Click barra → Pannello si apre

### **TEST MILESTONE:**
- [ ] In Commesse vedo tab "Milestone"
- [ ] Posso aggiungere milestone
- [ ] Posso modificare milestone
- [ ] Posso eliminare milestone
- [ ] Milestone appaiono nel Gantt

---

## 🚨 TROUBLESHOOTING

### **Problema: Calendario vuoto**
→ Normale! Devi prima creare milestone
→ Vai su Commesse
→ Modifica commessa
→ Tab Milestone
→ Aggiungi milestone

### **Problema: Tab Milestone non appare**
→ Verifica che `milestone-manager.js` e `.css` siano caricati
→ Controlla Console (F12) per errori
→ Ricarica con Ctrl+Shift+R

### **Problema: Filtri non funzionano**
→ Ricarica pagina (Ctrl+Shift+R)
→ Verifica che ci siano milestone nel database

### **Problema: Carico sempre 0%**
→ Milestone devono avere `estimated_hours` compilato
→ Per ora il sistema stima automaticamente

### **Problema: Barre non appaiono**
→ Verifica che le milestone abbiano date nel mese visibile
→ Controlla che `start_date` e `end_date` siano corretti

---

## 🎯 PROSSIMI PASSI

### **1. Popola i Dati**
```
- Vai su Commesse
- Per ogni commessa:
  - Aggiungi 3-4 milestone
  - Definisci date
  - Assegna persone (quando disponibile)
```

### **2. Testa i Filtri**
```
- Prova ogni combinazione
- Verifica carico per reparto
- Verifica carico per persona
```

### **3. Usa Issues**
```
- Aggiungi problemi quando serve
- Monitora issues dal calendario
- Risolvi issues chiusi
```

---

## 💡 SUGGERIMENTI

### **Definire Milestone Standard**

Per ogni tipo di commessa, crea template milestone:

**CATALOGO:**
1. Modellazione 3D (5 giorni)
2. Rendering Base (5 giorni)
3. Compositing (5 giorni)
4. Fotolito (3 giorni)

**BROCHURE:**
1. Rendering (3 giorni)
2. Color Grading (2 giorni)
3. Fotolito (2 giorni)

**IMMAGINI:**
1. Rendering (2 giorni)
2. Ritocco (2 giorni)

---

## 🎨 ESEMPI PRATICI

### **Esempio 1: Piano Febbraio**

```
1. Crea 5 commesse per Febbraio
2. Per ognuna definisci 3-4 milestone
3. Vai su Calendario
4. Vedi timeline completa
5. Usa filtri per verificare carichi
```

### **Esempio 2: Sovraccarico Compositing**

```
1. Filtro: Reparto = Compositing
2. Vedi: CARICO 120% 🔴
3. Azione: Sposta alcune milestone
4. O: Assegna a più persone
```

### **Esempio 3: Planning Persona**

```
1. Filtro: Persona = Roberto
2. Vedi: Tutte sue milestone
3. Vedi: CARICO ROBERTO: 85%
4. Pianifica meglio distribuzione
```

---

## ✨ QUESTO È IL SISTEMA COMPLETO!

Hai ora:
- ✅ Calendario Gantt professionale
- ✅ Sistema milestone multi-reparto
- ✅ 5 filtri combinabili
- ✅ Indicatori carico real-time
- ✅ Issues tracking integrato
- ✅ Pannello dettagli completo

**SISTEMA PROFESSIONALE COMPLETO PER IL TUO STUDIO!** 🎯

**BUON LAVORO!** 🚀
