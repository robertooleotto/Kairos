// ═══════════════════════════════════════════════════════════════
// SUPABASE API CLIENT - Frontend JavaScript
// ═══════════════════════════════════════════════════════════════

// CONFIGURATION - CREDENZIALI NUDESIGN
const SUPABASE_URL = 'https://jjnrcdobejjspunboxra.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kgvRzfwqADQ-4KCRu8sG-A_ZEOC7Hil';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
// JOBS API
// ─────────────────────────────────────────────────────────────

async function loadJobs(filters = {}) {
  try {
    let query = supabaseClient.from('jobs').select('*');
    
    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.client) query = query.eq('client', filters.client);
    if (filters.prio) query = query.eq('prio', filters.prio);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Load jobs error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load jobs failed:', error);
    return [];
  }
}

async function loadJob(id) {
  try {
    const { data, error } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Load job error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Load job failed:', error);
    return null;
  }
}

async function saveJob(job) {
  try {
    // Check if job exists
    const existing = job.id ? await loadJob(job.id) : null;
    
    if (existing) {
      // Update
      const { data, error } = await supabaseClient
        .from('jobs')
        .update({
          ...job,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .select()
        .single();
      
      if (error) {
        console.error('Update job error:', error);
        return null;
      }
      
      showSyncStatus('Commessa aggiornata!', 'success');
      return data;
    } else {
      // Create
      const { data, error } = await supabaseClient
        .from('jobs')
        .insert([{
          ...job,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Create job error:', error);
        return null;
      }
      
      showSyncStatus('Commessa creata!', 'success');
      return data;
    }
  } catch (error) {
    console.error('Save job failed:', error);
    showSyncStatus('Errore salvataggio', 'error');
    return null;
  }
}

async function deleteJobDB(id) {
  try {
    const { error } = await supabaseClient
      .from('jobs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete job error:', error);
      return false;
    }
    
    showSyncStatus('Commessa eliminata!', 'success');
    return true;
  } catch (error) {
    console.error('Delete job failed:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// SPANS API
// ─────────────────────────────────────────────────────────────

async function loadSpans(filters = {}) {
  try {
    let query = supabaseClient.from('spans').select('*');
    
    if (filters.startDate) {
      query = query.gte('end_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('start_date', filters.endDate);
    }
    if (filters.person) {
      query = query.eq('person', filters.person);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Load spans error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load spans failed:', error);
    return [];
  }
}

async function saveSpan(span) {
  try {
    const { data, error } = await supabaseClient
      .from('spans')
      .insert([span])
      .select()
      .single();
    
    if (error) {
      console.error('Save span error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Save span failed:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// COLLABORATORS API
// ─────────────────────────────────────────────────────────────

async function loadCollaborators() {
  try {
    const { data, error } = await supabaseClient
      .from('collaborators')
      .select('*')
      .eq('active', true);
    
    if (error) {
      console.error('Load collaborators error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load collaborators failed:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// CLIENTS API
// ─────────────────────────────────────────────────────────────

async function loadClients() {
  try {
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('active', true);
    
    if (error) {
      console.error('Load clients error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load clients failed:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// TIME ENTRIES API
// ─────────────────────────────────────────────────────────────

async function loadTimeEntries(filters = {}) {
  try {
    let query = supabaseClient.from('time_entries').select('*');
    
    if (filters.date) query = query.eq('date', filters.date);
    if (filters.person) query = query.eq('person', filters.person);
    if (filters.jobId) query = query.eq('job_id', filters.jobId);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Load time entries error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load time entries failed:', error);
    return [];
  }
}

async function saveTimeEntry(entry) {
  try {
    const { data, error } = await supabaseClient
      .from('time_entries')
      .insert([{
        ...entry,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Save time entry error:', error);
      return null;
    }
    
    showSyncStatus('Ore registrate!', 'success');
    return data;
  } catch (error) {
    console.error('Save time entry failed:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// ISSUES API
// ─────────────────────────────────────────────────────────────

async function loadIssues(filters = {}) {
  try {
    let query = supabaseClient.from('issues').select('*');
    
    if (filters.jobId) query = query.eq('job_id', filters.jobId);
    if (filters.category) query = query.eq('category', filters.category);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Load issues error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load issues failed:', error);
    return [];
  }
}

async function saveIssue(issue) {
  try {
    const { data, error } = await supabaseClient
      .from('issues')
      .insert([{
        ...issue,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Save issue error:', error);
      return null;
    }
    
    showSyncStatus('Problema registrato!', 'success');
    return data;
  } catch (error) {
    console.error('Save issue failed:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// COMPLETIONS API
// ─────────────────────────────────────────────────────────────

async function loadCompletions(filters = {}) {
  try {
    let query = supabaseClient.from('completions').select('*');
    
    if (filters.jobId) query = query.eq('job_id', filters.jobId);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Load completions error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Load completions failed:', error);
    return [];
  }
}

async function saveCompletion(completion) {
  try {
    const { data, error } = await supabaseClient
      .from('completions')
      .insert([completion])
      .select()
      .single();
    
    if (error) {
      console.error('Save completion error:', error);
      return null;
    }
    
    showSyncStatus('Chiusura salvata!', 'success');
    return data;
  } catch (error) {
    console.error('Save completion failed:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// BULK SYNC (for initial data population)
// ─────────────────────────────────────────────────────────────

async function bulkSyncToSheets(data) {
  // For Supabase, we can insert multiple records at once
  const results = {
    jobs: 0,
    spans: 0,
    errors: []
  };
  
  try {
    // Sync jobs
    if (data.jobs && Array.isArray(data.jobs)) {
      const { data: jobsData, error } = await supabaseClient
        .from('jobs')
        .insert(data.jobs)
        .select();
      
      if (error) {
        results.errors.push({type: 'jobs', error: error.message});
      } else {
        results.jobs = jobsData.length;
      }
    }
    
    // Sync spans
    if (data.spans && Array.isArray(data.spans)) {
      const { data: spansData, error } = await supabaseClient
        .from('spans')
        .insert(data.spans)
        .select();
      
      if (error) {
        results.errors.push({type: 'spans', error: error.message});
      } else {
        results.spans = spansData.length;
      }
    }
    
    return {success: true, results: results};
  } catch (error) {
    console.error('Bulk sync failed:', error);
    return {success: false, error: error.toString()};
  }
}

// ─────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────

function showSyncStatus(message, type = 'success') {
  // Remove existing status
  const existing = document.getElementById('sync-status');
  if (existing) existing.remove();
  
  // Create status div
  const div = document.createElement('div');
  div.id = 'sync-status';
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: 'Sora', sans-serif;
  `;
  
  if (type === 'success') {
    div.style.background = '#4ade80';
    div.style.color = '#052e16';
  } else if (type === 'error') {
    div.style.background = '#f87171';
    div.style.color = '#450a0a';
  } else {
    div.style.background = '#93c5fd';
    div.style.color = '#0c2a5c';
  }
  
  div.textContent = message;
  document.body.appendChild(div);
  
  setTimeout(() => div.remove(), 3000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);

console.log('✅ Supabase API Client loaded');
