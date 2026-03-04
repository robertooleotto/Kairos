/* ═══════════════════════════════════════════════════════════════
   MILESTONE MANAGER - Add-on for Commesse.html
   Da includere DOPO il caricamento di commesse.html
   ═══════════════════════════════════════════════════════════════ */

// ═══ GLOBAL STATE ═══
let MILESTONES = [];
let MM_AREAS = [];
let MM_ROLES = [];
let CURRENT_JOB_MILESTONES = [];

// ═══ DATA LOADING ═══

async function loadMilestoneData() {
  console.log('Loading milestone data...');
  
  // Load areas
  try {
    const { data } = await supabaseClient.from('areas').select('*').order('name');
    MM_MM_AREAS = data || [];
  } catch (e) { MM_AREAS = []; }
  
  // Load roles
  try {
    const { data } = await supabaseClient.from('job_roles').select('*').order('name');
    MM_MM_ROLES = data || [];
  } catch (e) { MM_ROLES = []; }
  
  // Load all milestones
  try {
    const { data } = await supabaseClient.from('job_milestones').select('*').order('order_index');
    MILESTONES = data || [];
  } catch (e) { MILESTONES = []; }
}

// ═══ UI INJECTION ═══

function injectMilestoneUI() {
  // Find modal form
  const form = document.getElementById('job-form');
  if (!form) return;
  
  // Check if already injected
  if (document.getElementById('modal-tabs')) return;
  
  // Create tabs container (insert after modal title)
  const modalHeader = document.querySelector('.modal-header');
  if (!modalHeader) return;
  
  const tabsHTML = `
    <div class="modal-tabs" style="display:none" id="modal-tabs">
      <button type="button" class="tab-btn active" data-tab="info" onclick="switchTab('info')">
        📋 Info Commessa
      </button>
      <button type="button" class="tab-btn" data-tab="milestones" onclick="switchTab('milestones')">
        📍 Milestone
      </button>
    </div>
  `;
  
  modalHeader.insertAdjacentHTML('afterend', tabsHTML);
  
  // Wrap existing form content in info tab div
  const existingContent = Array.from(form.children);
  const infoTab = document.createElement('div');
  infoTab.className = 'tab-content active';
  infoTab.id = 'tab-info';
  
  // Move all existing form elements into info tab
  existingContent.forEach(el => {
    infoTab.appendChild(el);
  });
  
  form.appendChild(infoTab);
  
  // Add milestone tab content
  const milestonesTab = document.createElement('div');
  milestonesTab.className = 'tab-content';
  milestonesTab.id = 'tab-milestones';
  milestonesTab.innerHTML = `
    <div id="milestone-list" class="milestone-list-edit"></div>
    <button type="button" class="btn-add-milestone-inline" onclick="addMilestoneInline()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Aggiungi Milestone
    </button>
  `;
  
  form.appendChild(milestonesTab);
}

// ═══ TAB SWITCHING ═══

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
  
  // If switching to milestones tab, render them
  if (tabName === 'milestones' && EDITING_JOB) {
    renderMilestoneList(EDITING_JOB.id);
  }
}

// ═══ MILESTONE RENDERING ═══

async function renderMilestoneList(jobId) {
  const container = document.getElementById('milestone-list');
  if (!container) return;
  
  // Load milestones for this job
  try {
    const { data } = await supabaseClient
      .from('job_milestones')
      .select('*')
      .eq('job_id', jobId)
      .order('order_index');
    
    CURRENT_JOB_MILESTONES = data || [];
  } catch (e) {
    CURRENT_JOB_MILESTONES = [];
  }
  
  if (CURRENT_JOB_MILESTONES.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--paper-m)">
        Nessuna milestone definita.<br>
        Click "Aggiungi Milestone" per iniziare.
      </div>
    `;
    return;
  }
  
  // Render milestone cards
  container.innerHTML = CURRENT_JOB_MILESTONES.map((m, idx) => renderMilestoneCard(m, idx)).join('');
}

function renderMilestoneCard(milestone, index) {
  const area = MM_MM_AREAS.find(a => a.id === milestone.department_id);
  const role = MM_MM_ROLES.find(r => r.id === milestone.role_id);
  
  // Get assigned people names
  const people = (milestone.assigned_to || []).map(id => {
    const collab = COLLABORATORS.find(c => c.id === id);
    return collab ? collab.name : '';
  }).filter(Boolean).join(', ');
  
  const statusColors = {
    todo: '#9ca3af',
    in_progress: '#3b82f6',
    done: '#22c55e',
    blocked: '#ef4444'
  };
  
  const statusLabels = {
    todo: 'Da Fare',
    in_progress: 'In Corso',
    done: 'Completata',
    blocked: 'Bloccata'
  };
  
  return `
    <div class="milestone-card-edit" data-milestone-id="${milestone.id}">
      <div class="milestone-card-header">
        <div class="milestone-order">#${index + 1}</div>
        <button type="button" class="btn-milestone-edit" onclick="editMilestone('${milestone.id}')">✏️</button>
        <button type="button" class="btn-milestone-delete" onclick="deleteMilestone('${milestone.id}')">🗑️</button>
      </div>
      
      <div class="milestone-card-body">
        <div class="milestone-phase-name">${milestone.phase_name}</div>
        <div class="milestone-dept">${area ? area.name : 'N/A'} ${role ? `• ${role.name}` : ''}</div>
        <div class="milestone-dates">
          📅 ${new Date(milestone.start_date).toLocaleDateString('it-IT')} 
          → ${new Date(milestone.end_date).toLocaleDateString('it-IT')}
        </div>
        ${people ? `<div class="milestone-people">👤 ${people}</div>` : ''}
        <div class="milestone-status" style="background:${statusColors[milestone.status]}22;color:${statusColors[milestone.status]}">
          ${statusLabels[milestone.status]}
        </div>
      </div>
    </div>
  `;
}

// ═══ MILESTONE CRUD ═══

async function addMilestoneInline() {
  if (!EDITING_JOB) {
    alert('Salva prima la commessa');
    return;
  }
  
  const phaseName = prompt('Nome fase (es: "Modellazione 3D", "Rendering Base"):');
  if (!phaseName) return;
  
  const startDate = prompt('Data inizio (YYYY-MM-DD):');
  if (!startDate) return;
  
  const endDate = prompt('Data fine (YYYY-MM-DD):');
  if (!endDate) return;
  
  // Create milestone
  const milestoneData = {
    job_id: EDITING_JOB.id,
    phase_name: phaseName,
    start_date: startDate,
    end_date: endDate,
    status: 'todo',
    order_index: CURRENT_JOB_MILESTONES.length
  };
  
  try {
    const { data, error } = await supabaseClient
      .from('job_milestones')
      .insert([milestoneData])
      .select()
      .single();
    
    if (error) throw error;
    
    CURRENT_JOB_MILESTONES.push(data);
    renderMilestoneList(EDITING_JOB.id);
  } catch (error) {
    console.error('Error adding milestone:', error);
    alert('Errore: ' + error.message);
  }
}

async function editMilestone(milestoneId) {
  const milestone = CURRENT_JOB_MILESTONES.find(m => m.id === milestoneId);
  if (!milestone) return;
  
  const newName = prompt('Nome fase:', milestone.phase_name);
  if (!newName) return;
  
  try {
    const { error } = await supabaseClient
      .from('job_milestones')
      .update({ phase_name: newName })
      .eq('id', milestoneId);
    
    if (error) throw error;
    
    milestone.phase_name = newName;
    renderMilestoneList(EDITING_JOB.id);
  } catch (error) {
    console.error('Error updating milestone:', error);
    alert('Errore: ' + error.message);
  }
}

async function deleteMilestone(milestoneId) {
  if (!confirm('Vuoi eliminare questa milestone?')) return;
  
  try {
    const { error } = await supabaseClient
      .from('job_milestones')
      .delete()
      .eq('id', milestoneId);
    
    if (error) throw error;
    
    CURRENT_JOB_MILESTONES = CURRENT_JOB_MILESTONES.filter(m => m.id !== milestoneId);
    renderMilestoneList(EDITING_JOB.id);
  } catch (error) {
    console.error('Error deleting milestone:', error);
    alert('Errore: ' + error.message);
  }
}

// ═══ INITIALIZATION ═══

// Hook into existing editJob function
const originalEditJob = window.editJob;
window.editJob = function(job) {
  if (originalEditJob) originalEditJob(job);
  
  // Show tabs when editing
  const tabs = document.getElementById('modal-tabs');
  if (tabs) tabs.style.display = 'flex';
  
  // Switch to info tab by default
  switchTab('info');
};

// Hook into existing openNewJobForm
const originalOpenNewJobForm = window.openNewJobForm;
window.openNewJobForm = function() {
  if (originalOpenNewJobForm) originalOpenNewJobForm();
  
  // Hide tabs when creating new
  const tabs = document.getElementById('modal-tabs');
  if (tabs) tabs.style.display = 'none';
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMilestoneManager);
} else {
  // DOM already loaded
  setTimeout(initMilestoneManager, 100);
}

async function initMilestoneManager() {
  await loadMilestoneData();
  injectMilestoneUI();
  console.log('Milestone manager loaded');
}
