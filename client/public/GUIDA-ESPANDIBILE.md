# 📊 CALENDARIO GANTT ESPANDIBILE - GUIDA RAPIDA

---

## 🎯 COME FUNZIONA

### **VISTA GENERALE (default)**

```
┌──────────────────────────────────────────────────────┐
│ Febbraio 2026                                        │
│ 10  11  12  13  14  15  16  17  18  19  20 ... 28   │
├──────────────────────────────────────────────────────┤
│ ▶ 2205-rtt-ftt-I RENATO TASCA                        │
│   ████████████████████████████████████████          │ ← 1 BARRA
│                                                      │
│ ▶ VENETA CUCINE - Brochure                          │
│   ██████████████████████████████                    │ ← 1 BARRA
│                                                      │
│ ▶ ARMONY - Catalogo                                 │
│   ████████████████████████                          │ ← 1 BARRA
└──────────────────────────────────────────────────────┘
```

**Ogni commessa = 1 BARRA UNICA**
- Va da: `prima data inizio` → `ultima data fine` di tutte le fasi
- Icona ▶ indica che è espandibile

---

### **CLICK SU BARRA → ESPANSIONE**

```
Click su "2205-rtt-ftt-I"
↓
┌──────────────────────────────────────────────────────┐
│ Focus: RENATO TASCA - 2205-rtt-ftt-I    [✕ Chiudi]  │
├──────────────────────────────────────────────────────┤
│   Modellazione 3D                                    │
│   ████████████░░░░░░░░░░░░░░░                       │ 10-18 Feb
│                                                      │
│   Setup Scena 3D                                     │
│   ░░░░░░████████████░░░░                            │ 14-22 Feb
│                                                      │
│   Rendering                                          │
│   ░░░░░░░░░░░░████████░░                            │ 20-24 Feb
│                                                      │
│   Post Produzione                                    │
│   ░░░░░░░░░░░░░░░░████████                          │ 24-28 Feb
└──────────────────────────────────────────────────────┘

LE ALTRE COMMESSE SPARISCONO!
FOCUS TOTALE SU QUESTA!
```

**Cosa succede:**
- ✅ Si vedono TUTTE le fasi della commessa
- ✅ Fasi possono SOVRAPPORSI (normale!)
- ✅ Altre commesse NASCOSTE
- ✅ Appare pulsante "✕ Chiudi Focus"

---

### **CHIUSURA FOCUS**

```
Click "✕ Chiudi Focus"
↓
Torna alla vista generale
Tutte le commesse riappaiono
```

---

## 🔍 FILTRI INTELLIGENTI

### **Filtro Reparto**

**Vista Generale:**
```
[Reparto: Compositing ▼]

Risultato:
- Mostra solo commesse CHE HANNO fasi Compositing
- Barra va solo da inizio a fine delle fasi Compositing
```

**Vista Espansa:**
```
[Reparto: Compositing ▼]
Commessa espansa

Risultato:
- Mostra SOLO le fasi Compositing di questa commessa
- Nasconde le altre fasi (3D, Rendering, etc.)
```

---

### **Filtro Persona**

**Vista Generale:**
```
[Persona: Roberto ▼]

Risultato:
- Mostra solo commesse dove Roberto è assegnato
- Barra va da inizio a fine delle SUE fasi
```

**Vista Espansa:**
```
[Persona: Roberto ▼]
Commessa espansa

Risultato:
- Mostra SOLO le fasi dove Roberto è assegnato
```

---

## 🎨 COLORI FASI

```
🟣 Viola Scuro  = Modellazione 3D
🟣 Viola Chiaro = Setup Scena
🔵 Blu          = Rendering
🟢 Verde Acqua  = Compositing
🟢 Verde        = Color Grading
🟠 Arancione    = Fotolito
🔴 Rosa         = Creatività
⚫ Grigio       = Generica
```

---

## ⚡ WORKFLOW ESEMPIO

### **1. CREA COMMESSA CON FASI**

```
Vai su: Commesse
Crea: 2205-rtt-ftt-I

Aggiungi Milestone:
1. Modellazione 3D     10-18 Feb
2. Setup Scena         14-22 Feb  ← SOVRAPPONE!
3. Rendering           20-24 Feb  ← SOVRAPPONE!
4. Post Produzione     24-28 Feb
```

---

### **2. VEDI IN CALENDARIO**

```
Vai su: Calendario

Vista Generale:
2205-rtt-ftt-I
████████████████████████  (10-28 Feb)
↑ Barra unica che copre tutto
```

---

### **3. ESPANDI COMMESSA**

```
Click sulla barra
↓
Vedi tutte le 4 fasi separate:
- Modellazione   ████████░░░░░░░░
- Setup          ░░░░████████░░░░
- Rendering      ░░░░░░░░░░████░░
- Post Prod      ░░░░░░░░░░░░████
```

---

### **4. FILTRA PER REPARTO**

```
Seleziona: [Reparto: Compositing]

Vista Generale:
Mostra solo commesse con Compositing

Vista Espansa (2205-rtt-ftt-I):
Mostra SOLO:
- Post Produzione  ░░░░░░░░░░░░████
(Le altre fasi spariscono!)
```

---

### **5. CHIUDI FOCUS**

```
Click: [✕ Chiudi Focus]
↓
Torna alla vista generale
Tutte le commesse riappaiono
```

---

## 📋 PANNELLO LATERALE

**Click su FASE espansa:**
```
┌─────────────────────────────┐
│ Post Produzione          ✕  │
│ 2205-rtt-ftt-I              │
├─────────────────────────────┤
│ INFO FASE                   │
│ Commessa: RENATO TASCA      │
│ Reparto: Compositing        │
│ Mansione: Compositor        │
│ Date: 24-28 Feb 2026        │
│ Team: Roberto, Alice        │
└─────────────────────────────┘
```

---

## ✅ COSA PUOI FARE

### **✅ VEDERE OVERVIEW**
- Tutte le commesse in una vista
- Capire quando iniziano e finiscono

### **✅ FOCUS SU UNA**
- Click → Espandi
- Vedi TUTTE le fasi
- Vedi sovrapposizioni

### **✅ FILTRARE**
- Solo un reparto
- Solo una persona
- Solo una mansione

### **✅ ANALIZZARE**
- Quali fasi si sovrappongono
- Chi lavora su cosa
- Carichi di lavoro

---

## 🎯 CASI D'USO

### **Caso 1: Planning Generale**
```
Uso: Vista generale
Vedo: Tutte le commesse
Goal: Capire timeline generale
```

### **Caso 2: Dettaglio Commessa**
```
Uso: Click su commessa → Espandi
Vedo: Tutte le fasi interne
Goal: Capire workflow interno
```

### **Caso 3: Carico Reparto**
```
Uso: Filtro [Reparto: Compositing]
Vedo: Solo fasi compositing
Goal: Capire carico reparto
```

### **Caso 4: Lavoro Persona**
```
Uso: Filtro [Persona: Roberto]
Vedo: Solo fasi di Roberto
Goal: Capire suo carico
```

### **Caso 5: Focus + Filtro**
```
Uso: Espandi commessa + Filtro reparto
Vedo: Solo fasi specifiche della commessa
Goal: Analisi dettagliata workflow
```

---

## 🚀 INSTALLAZIONE (5 MIN)

### **STEP 1: Database**
```
(Già fatto prima - database-milestones.sql)
Se non fatto:
Supabase → SQL Editor → Incolla → Run
```

### **STEP 2: Carica File**
```
Netlify → Trascina:
- preview.html (NUOVO! Espandibile)
- commesse.html
- milestone-manager.js
- milestone-manager.css
```

### **STEP 3: Test**
```
1. Vai su Commesse
2. Aggiungi milestone a una commessa
3. Vai su Calendario
4. Click sulla barra → SI ESPANDE! 🎉
```

---

## 💡 TIPS

### **Tip 1: Sovrapposizioni Normali**
Le fasi possono sovrapporsi - è OK!
Setup può iniziare mentre Modellazione ancora in corso.

### **Tip 2: Usa Filtri**
Combinali per analisi potenti:
`Persona: Roberto` + `Espansione` = Vedi solo lavoro di Roberto in quella commessa

### **Tip 3: Colori Aiutano**
Ogni tipo di fase ha colore diverso → Immediato riconoscimento

### **Tip 4: Focus e Torna**
Usa liberamente espansione/collasso per navigare

---

## ✨ DIFFERENZE CON VERSIONE PRECEDENTE

### **PRIMA:**
- Barre separate per ogni fase
- Tutto visibile sempre
- Confusione con molte commesse

### **ADESSO:**
- 1 barra per commessa (vista generale)
- Click → Espandi fasi
- Chiaro e organizzato
- Sovrapposizioni visibili
- Filtri potenti

---

## 🎯 PROSSIMI STEP

1. **Popola Milestone** in Commesse
2. **Testa Espansione** nel Calendario
3. **Usa Filtri** per analisi
4. **Pianifica** meglio il lavoro!

---

**SISTEMA ESPANDIBILE COMPLETO!** 🚀

Esattamente come richiesto! 💪
