# 🎉 CALENDARIO COMPLETO - TUTTE LE FEATURES!

---

## 📦 HAI RICEVUTO (3 files)

1. **preview.html** ← Calendario con TUTTE le features
2. **database-issues.sql** ← Schema tabella issues
3. **GUIDA-COMPLETA.md** ← Questa guida

---

## ✨ FEATURES AGGIUNTE

### **1️⃣ FILTRI INTELLIGENTI** 🔍

```
┌────────────────────────────────────────────────┐
│ [Area ▼] [Cliente ▼] [PM ▼] [✓ Solo mie]     │
└────────────────────────────────────────────────┘
```

**Filtri disponibili:**
- ✅ **Area** → Filtra per area (IMMAGINI, COLOR, CREATIVITÀ, etc.)
- ✅ **Cliente** → Vedi solo commesse di un cliente
- ✅ **Project Manager** → Vedi solo commesse di un PM
- ✅ **Solo mie commesse** → Toggle per vedere solo le TUE

**Come funziona:**
- Seleziona un filtro → Calendario si aggiorna automaticamente
- Badge oggi/domani si aggiornano
- Sidebar mostra solo commesse filtrate

---

### **2️⃣ HEATMAP CARICO GIORNALIERO** 🌡️

```
┌──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │
│ 🟢   │ 🟢   │ 🟡   │ 🔴   │
│ 2    │ 1    │ 5    │ 8    │
└──────┴──────┴──────┴──────┘
```

**Colori automatici:**
- 🟢 **Verde** → 1-3 commesse (carico normale)
- 🟡 **Giallo** → 4-6 commesse (carico medio)
- 🔴 **Rosso** → 7+ commesse (sovraccarico!)

**Utilità:**
- Vedi subito i giorni critici
- Planning più efficace
- Evita sovraccarichi

---

### **3️⃣ BADGE SCADENZE OGGI/DOMANI** 🔥

```
Header:
┌────────────────────────────┐
│ Calendario  [🔥 3] [⏰ 5]  │
│             ^^^^   ^^^^    │
│             Oggi   Domani  │
└────────────────────────────┘
```

**Alert visivo immediato:**
- 🔥 **Rosso** → Scadenze OGGI
- ⏰ **Arancione** → Scadenze DOMANI
- Si aggiorna con i filtri

---

### **4️⃣ SISTEMA ISSUES/ERRORI** 🔴⚠️🛑

#### **A. Badge su Giorni**
```
┌────────────────────┐
│ 20              [2]│ ← Issues critici
│                    │
│ 🟠🟠🟢             │
└────────────────────┘
```

#### **B. Lista Issues in Sidebar**
```
┌────────────────────────────────┐
│ FANTONI - Alis                 │
│ ─────────────────────────      │
│ ISSUES (3):      [+ Aggiungi]  │
│                                │
│ ┌────────────────────────────┐ │
│ │ 🔴 CRITICO                 │ │
│ │ File corrotti - impossibile│ │
│ │ 2h fa                      │ │
│ │ [✓ Risolvi] [🗑️ Elimina]  │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ ⚠️ WARNING                 │ │
│ │ Cliente lento nelle risposte│ │
│ │ ieri                       │ │
│ │ [✓ Risolvi] [🗑️ Elimina]  │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

#### **C. Tipi di Issues**
- 🔴 **Critico** → Problema grave, blocca il lavoro
- ⚠️ **Warning** → Attenzione richiesta
- 🛑 **Bloccante** → In attesa di qualcosa

#### **D. Tutti possono aggiungere**
- ✅ Chiunque può creare un issue
- ✅ Chi ha creato può eliminare
- ✅ Manager possono gestire tutti

---

## 🚀 INSTALLAZIONE (5 MINUTI)

### **STEP 1: Database (2 min)**

1. **Supabase → SQL Editor → New query**
2. **Incolla** tutto da `database-issues.sql`
3. **Run** ▶️
4. Verifica:
```sql
SELECT COUNT(*) FROM job_issues;
-- Dovrebbe dire 0 (tabella vuota)
```

---

### **STEP 2: Carica Calendario (1 min)**

1. **Netlify** → Tuo sito
2. **Trascina** preview.html
3. Aspetta 15 secondi

---

### **STEP 3: Testa (2 min)**

1. Ricarica app (**Ctrl+Shift+R**)
2. Vai su **Calendario**
3. Verifica:
   - ✅ Badge **[🔥 X] [⏰ X]** nell'header?
   - ✅ Filtri in alto funzionano?
   - ✅ Giorni colorati (heatmap)?
   - ✅ Click su giorno → Sidebar si apre?

---

## 🎯 COME USARE LE FEATURES

### **🔍 FILTRI**

#### **Filtro per Area:**
```
1. Click dropdown "Area"
2. Seleziona "IMMAGINI / ANIMAZIONI"
3. Calendario mostra SOLO quelle commesse
```

#### **Filtro per Cliente:**
```
1. Click dropdown "Cliente"
2. Seleziona "VENETA CUCINE"
3. Vedi solo commesse VENETA
```

#### **Filtro PM:**
```
1. Click dropdown "PM"
2. Seleziona "Tina Carletti"
3. Vedi solo commesse di Tina
```

#### **Solo Mie:**
```
1. Check ✓ "Solo mie commesse"
2. Vedi solo commesse assegnate a TE
```

---

### **🌡️ HEATMAP**

**Legenda automatica:**
- Giorno **verde** → Ok, carico normale
- Giorno **giallo** → Medio, 4-6 scadenze
- Giorno **rosso** → Attenzione! 7+ scadenze

**Usa per:**
- Pianificare meglio le deadline
- Evitare giorni sovraccarichi
- Vedere subito i colli di bottiglia

---

### **🔴 ISSUES**

#### **Aggiungere un Issue:**
```
1. Click su un giorno
2. Sidebar si apre
3. Trova la commessa
4. Click "+ Aggiungi" nella sezione Issues
5. Scegli tipo (Warning/Critico/Bloccante)
6. Scrivi descrizione
7. Click "Aggiungi Issue"
```

#### **Risolvere un Issue:**
```
1. Apri commessa in sidebar
2. Trova l'issue
3. Click "✓ Risolvi"
4. Issue diventa grigio e marcato "Risolto"
```

#### **Eliminare un Issue:**
```
1. Apri commessa in sidebar
2. Trova l'issue
3. Click "🗑️ Elimina"
4. Conferma
5. Issue sparisce
```

---

## 📊 ESEMPI D'USO

### **Scenario 1: PM vede il suo carico**
```
1. Seleziona filtro PM: "Tina Carletti"
2. Check ✓ "Solo mie commesse"
3. Heatmap mostra il SUO carico
4. Badge mostrano LE SUE scadenze
```

### **Scenario 2: Cliente in ritardo**
```
1. Click su 20 Febbraio
2. Commessa FANTONI - Alis
3. Click "+ Aggiungi" issue
4. Tipo: ⚠️ Warning
5. Descrizione: "Cliente lento nelle risposte"
6. Salva
7. Appare badge giallo sul giorno 20
```

### **Scenario 3: File corrotti**
```
1. Click su 28 Febbraio
2. Commessa VENETA - Brochure
3. Click "+ Aggiungi" issue
4. Tipo: 🔴 Critico
5. Descrizione: "File PSD corrotti, impossibile aprire"
6. Salva
7. Appare badge rosso sul giorno 28
```

### **Scenario 4: In attesa cliente**
```
1. Click su 13 Marzo
2. Commessa DEPADOVA
3. Click "+ Aggiungi" issue
4. Tipo: 🛑 Bloccante
5. Descrizione: "In attesa approvazione finale da cliente"
6. Salva
7. Tutti vedono che è bloccata
```

---

## 🎨 MOCKUP COMPLETO

```
┌──────────────────────────────────────────────────────────────────────┐
│ Calendario [🔥 3] [⏰ 5]                                   [Nav btns] │
├──────────────────────────────────────────────────────────────────────┤
│ [Area ▼] [Cliente ▼] [PM ▼] [✓ Solo mie]                           │
├────────────────────────────────────┬─────────────────────────────────┤
│ ◀ Febbraio 2026 ▶      [‹][•][›]  │ 📅 Giovedì 20 Febbraio         │
│                                    │                                 │
│  L   M   M   G   V   S   D     [2] │ ┌───────────────────────────┐  │
│                             ^^^^   │ │ 🟠 25218-FNT-ALI-I        │  │
│       1   2   3   4   5   6   7    │ │ FANTONI: Alis             │  │
│  🟢  🟢  🟢  🟡  🟡  🟢  🟢       │ │ Rev Def • Immagini        │  │
│  1   1   2   4   5   3   2         │ │                           │  │
│                                    │ │ ISSUES (2):   [+ Aggiungi]│  │
│  8   9  10  11  12  13  14         │ │                           │  │
│ 🟢  🟢  🟢  🟢  🟢  🟡  🟢       │ │ 🔴 CRITICO                │  │
│                                    │ │ File corrotti             │  │
│ 15  16  17  18  19 [20] 21     [2] │ │ 2h fa                     │  │
│ 🟢  🟢  🟢  🟢  🟢  🔴  🟢   ^^^^  │ │ [✓ Risolvi] [🗑️]         │  │
│                     ^^^             │ │                           │  │
│                  SELECTED           │ │ ⚠️ WARNING                │  │
│                                    │ │ Cliente lento             │  │
│ 22  23  24  25  26  27  28         │ │ ieri                      │  │
│ •  🟣  🟠  🟠  🟡  🔴  🔴       │ │ [✓ Risolvi] [🗑️]         │  │
│ 🟢  🟢  🟢  🟢  🟡  🔴  🔴       │ │                           │  │
│ 2   3   2   2   5   8   7          │ │ [✏️ Modifica]             │  │
│                                    │ └───────────────────────────┘  │
│ Heatmap = Verde/Giallo/Rosso      │                                 │
│ Pallini = Commesse                 │ 🔔 SCADENZE VICINE:            │
│ Badge [N] = Issues                 │ • 23 Feb - MASIERO             │
│                                    │ • 26 Feb - INFINITI            │
│                                    │ • 27 Feb - BEB                 │
│                                    │                                 │
│                                    │ [+ Nuova Commessa]             │
└────────────────────────────────────┴─────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

### **DATABASE:**
- [ ] Eseguito `database-issues.sql` su Supabase
- [ ] Tabella `job_issues` creata
- [ ] RLS policies attive

### **FILE:**
- [ ] Caricato `preview.html` su Netlify
- [ ] Hard refresh fatto (Ctrl+Shift+R)

### **TEST FILTRI:**
- [ ] Filtro Area funziona
- [ ] Filtro Cliente funziona
- [ ] Filtro PM funziona
- [ ] Toggle "Solo mie" funziona
- [ ] Badge oggi/domani si aggiornano

### **TEST HEATMAP:**
- [ ] Giorni con 1-3 commesse = verde
- [ ] Giorni con 4-6 commesse = giallo
- [ ] Giorni con 7+ commesse = rosso

### **TEST ISSUES:**
- [ ] Click "+ Aggiungi" apre modal
- [ ] Posso creare issue Warning
- [ ] Posso creare issue Critico
- [ ] Posso creare issue Bloccante
- [ ] Badge appare sul giorno
- [ ] Posso risolvere issue
- [ ] Posso eliminare issue

---

## 🎯 RIEPILOGO FEATURES

| Feature | Descrizione | Utilità |
|---------|-------------|---------|
| **Filtri** | 4 filtri indipendenti | Focus su area/cliente/PM |
| **Heatmap** | Colori giorni per carico | Vedi giorni critici |
| **Badge** | Contatori oggi/domani | Alert immediato |
| **Issues** | Sistema problemi/blocchi | Traccia problemi |
| **Sidebar** | Pannello laterale | Dettagli commesse |
| **CRUD Issues** | Crea/Risolvi/Elimina | Gestione completa |

---

## 🚨 TROUBLESHOOTING

### **Filtri non funzionano**
→ Ricarica pagina (Ctrl+Shift+R)
→ Verifica Console (F12) per errori

### **Heatmap non si vede**
→ Normale se ci sono poche commesse
→ Marzo ha più commesse, prova lì

### **Issues non si salvano**
→ Hai eseguito `database-issues.sql`?
→ Verifica su Supabase:
```sql
SELECT * FROM job_issues;
```

### **Badge sempre a 0**
→ Verifica che le commesse abbiano `due_date`
→ Controlla che la data sia oggi/domani

---

**CARICA TUTTO E TESTA!** 🚀

Hai il calendario PIÙ COMPLETO possibile! 💪
