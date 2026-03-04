# ✅ CLIENTI.HTML AGGIORNATO CON MODIFICA/ELIMINA

---

## 🎨 COSA HO AGGIUNTO

### **1. Pulsanti su ogni card cliente:**
```
┌──────────────────────────┐
│ 🏢 VENETA CUCINE        │
│ ...info cliente...       │
├──────────────────────────┤
│ [✏️ Modifica] [🗑️ Elimina]│
└──────────────────────────┘
```

### **2. Funzione Modifica:**
- Click "✏️ Modifica" → Apre il form precompilato
- Cambia i dati
- Salva → Aggiorna il cliente nel DB

### **3. Funzione Elimina:**
- Click "🗑️ Elimina" → Chiede conferma
- Conferma → Elimina dal DB
- Lista si aggiorna automaticamente

---

## 🚀 COSA FARE

### **STEP 1: Carica su Netlify**
1. Trascina **clienti.html** su Netlify
2. Aspetta 15 secondi

### **STEP 2: Testa**
1. Ricarica app (Ctrl+Shift+R)
2. Vai su **Clienti**
3. Dovresti vedere i **22 clienti** inseriti via SQL
4. Ogni card ha **[✏️ Modifica] [🗑️ Elimina]**

### **STEP 3: Prova Modifica**
1. Click **"✏️ Modifica"** su un cliente
2. Form si apre **precompilato**
3. Cambia qualcosa (es: logo, contatto)
4. Click **"Salva Cliente"**
5. Card si aggiorna! ✅

### **STEP 4: Prova Elimina**
1. Click **"🗑️ Elimina"** su un cliente
2. Conferma
3. Cliente sparisce! ✅

---

## 📊 COLLEGAMENTO CLIENTI → COMMESSE

### **È GIÀ FATTO! ✅**

Nel database:
```sql
CLIENTI:
- id: 'client_veneta'
- name: 'VENETA CUCINE'

COMMESSE:
- code: '25017-VNC-BRO-F'
- client: 'VENETA CUCINE'  ← Match per nome!
```

L'app può fare join così:
```javascript
// Trova tutte le commesse di un cliente
const commesse = JOBS.filter(j => j.client === 'VENETA CUCINE');

// Oppure trova il cliente di una commessa
const cliente = CLIENTS.find(c => c.name === job.client);
```

**Il collegamento funziona per NOME**, non per ID!

---

## 📅 CALENDARIO - SI POPOLA AUTOMATICAMENTE?

### **DIPENDE DA COME È FATTO preview.html**

Se il calendario:
- ✅ Legge da `jobs` → **SÌ, si popola!**
- ❌ Legge da `spans` → **NO, serve mapping**

### **Verifica:**
1. Vai su **Calendario** (preview.html)
2. **Vedi le 35 commesse?**
   - ✅ **SÌ** → Perfetto! Funziona!
   - ❌ **NO** → Devi dirmi come funziona il calendario

---

## 🔍 COME VERIFICARE IL COLLEGAMENTO

### **Opzione A: Console del browser (F12)**
```javascript
// Carica commesse e clienti
const jobs = await supabaseClient.from('jobs').select('*');
const clients = await supabaseClient.from('clients').select('*');

console.log('Jobs:', jobs.data);
console.log('Clients:', clients.data);

// Trova commesse di VENETA CUCINE
const venetaJobs = jobs.data.filter(j => j.client === 'VENETA CUCINE');
console.log('Commesse VENETA:', venetaJobs);
```

### **Opzione B: SQL su Supabase**
```sql
-- Conta commesse per cliente
SELECT client, COUNT(*) as num_commesse
FROM jobs
GROUP BY client
ORDER BY num_commesse DESC;
```

Dovresti vedere:
```
MOLTENI        | 3
SMEG           | 3
...
```

---

## ✅ RIEPILOGO STATO

### **DATABASE:**
- ✅ 22 Clienti inseriti
- ✅ 7 PM inseriti (6 nuovi + Roberto)
- ✅ 35 Commesse inserite
- ✅ Commesse collegate a clienti per nome

### **INTERFACCIA:**
- ✅ Pagina Clienti mostra tutti i clienti
- ✅ Pulsanti Modifica/Elimina funzionanti
- ✅ Form modifica precompilato
- ⏳ Calendario (da verificare)

---

## 🎯 PROSSIMI PASSI

1. **Carica clienti.html** su Netlify
2. **Testa** modifica/elimina
3. **Vai sul Calendario** (preview.html)
4. **DIMMI:**
   - Vedi le 35 commesse?
   - O è vuoto?
   - Se vuoto, mandami screenshot o codice di preview.html

---

**CARICA IL FILE E VERIFICA IL CALENDARIO!** 🚀

Se il calendario NON si popola, lo fisso subito! 💪
