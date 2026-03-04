// ═══════════════════════════════════════════════════════════════
// API CLIENT - FUNZIONI PER AREE E REPARTI
// ═══════════════════════════════════════════════════════════════

// Get current user with role
async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabaseClient
    .from('collaborators')
    .select('*, primary_department:departments(*, area:areas(*))')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error loading user:', error);
    return null;
  }
  
  return data;
}

// Get all areas
async function loadAreas() {
  const { data, error } = await supabaseClient
    .from('areas')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Error loading areas:', error);
    return [];
  }
  
  return data || [];
}

// Get departments by area
async function loadDepartmentsByArea(areaId) {
  const { data, error } = await supabaseClient
    .from('departments')
    .select('*')
    .eq('area_id', areaId)
    .eq('active', true);
  
  if (error) {
    console.error('Error loading departments:', error);
    return [];
  }
  
  return data || [];
}

// Get all departments
async function loadAllDepartments() {
  const { data, error } = await supabaseClient
    .from('departments')
    .select('*, area:areas(*)')
    .eq('active', true);
  
  if (error) {
    console.error('Error loading departments:', error);
    return [];
  }
  
  return data || [];
}

// Get people count by department
async function getPeopleCountByDepartment(departmentId) {
  const { count, error } = await supabaseClient
    .from('collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('primary_department_id', departmentId)
    .eq('active', true);
  
  if (error) {
    console.error('Error counting people:', error);
    return 0;
  }
  
  return count || 0;
}

// Get jobs count by department
async function getJobsCountByDepartment(departmentId) {
  const { count, error } = await supabaseClient
    .from('job_departments')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', departmentId)
    .eq('status', 'in_progress');
  
  if (error) {
    console.error('Error counting jobs:', error);
    return 0;
  }
  
  return count || 0;
}

// Get workload by area (percentage)
async function getWorkloadByArea(areaId) {
  // Simplified: get active jobs involving this area
  const { data: departments } = await supabaseClient
    .from('departments')
    .select('id')
    .eq('area_id', areaId);
  
  if (!departments || departments.length === 0) return 0;
  
  const deptIds = departments.map(d => d.id);
  
  const { count } = await supabaseClient
    .from('job_departments')
    .select('*', { count: 'exact', head: true })
    .in('department_id', deptIds)
    .eq('status', 'in_progress');
  
  // Mock calculation: jobs * 10% (max 100%)
  return Math.min(count * 10, 100);
}

// Check if user can edit based on role
function canUserEdit(userRole, targetArea = null) {
  if (userRole === 'operation_manager') return true;
  if (userRole === 'area_manager' && targetArea) {
    // Area manager can edit only their area
    // This needs to check user.managed_area_id === targetArea.id
    return true; // Simplified for now
  }
  if (userRole === 'project_manager') return true;
  return false;
}

// Check if user can create jobs
function canUserCreateJobs(userRole) {
  return ['operation_manager', 'area_manager', 'project_manager'].includes(userRole);
}
