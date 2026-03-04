// ═══════════════════════════════════════════════════════════════
// AUTH GUARD - Protegge le pagine riservate
// ═══════════════════════════════════════════════════════════════

// Show loading overlay
function showAuthLoading(){
  const overlay=document.createElement('div');
  overlay.id='auth-loading-overlay';
  overlay.style.cssText=`
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:var(--paper,#0f0f17);
    display:flex;align-items:center;justify-content:center;
    z-index:99999;
  `;
  overlay.innerHTML='<div style="text-align:center;color:var(--paper-t,#f9fafb)"><div style="font-size:2rem;margin-bottom:12px">📊</div><div>Caricamento...</div></div>';
  document.body.appendChild(overlay);
}

function hideAuthLoading(){
  const overlay=document.getElementById('auth-loading-overlay');
  if(overlay){
    overlay.remove();
  }
}

// Check authentication on page load
(async function checkAuth(){
  // Skip if on login page
  if(window.location.pathname.includes('login.html')){
    return;
  }
  
  // Show loading
  showAuthLoading();
  
  // Wait a bit for supabaseClient to be ready
  await new Promise(resolve=>setTimeout(resolve,100));
  
  try{
    if(!supabaseClient){
      console.error('Supabase client not initialized');
      window.location.href='login.html';
      return;
    }
    
    const {data,error}=await supabaseClient.auth.getSession();
    
    if(error){
      console.error('Session error:',error);
      window.location.href='login.html';
      return;
    }
    
    if(!data.session){
      // Not logged in - redirect to login
      console.log('No session found - redirecting to login');
      window.location.href='login.html';
      return;
    }
    
    // User is logged in - show UI
    console.log('Session valid - user:',data.session.user.email);
    initAuthUI(data.session.user);
    hideAuthLoading();
    
  }catch(err){
    console.error('Auth check failed:',err);
    window.location.href='login.html';
  }
})();

// Initialize auth UI elements
function initAuthUI(user){
  // Add user info to header if not already present
  const header=document.querySelector('.header');
  if(!header){
    console.warn('No .header element found - skipping UI');
    return;
  }
  
  if(document.getElementById('auth-user-info')){
    return; // Already initialized
  }
  
  const userInfo=document.createElement('div');
  userInfo.id='auth-user-info';
  userInfo.style.cssText=`
    display:flex;
    align-items:center;
    gap:12px;
    margin-left:auto;
    margin-right:12px;
    padding:8px 16px;
    background:var(--paper-h);
    border-radius:8px;
    border:1px solid var(--paper-l);
  `;
  
  const userName=user.user_metadata?.full_name||user.email.split('@')[0];
  const userInitials=userName.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2);
  
  userInfo.innerHTML=`
    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff">
      ${userInitials}
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:.75rem;font-weight:600;color:var(--paper-t)">${userName}</div>
      <div style="font-size:.65rem;color:var(--paper-m)">${user.email}</div>
    </div>
    <button onclick="handleLogout()" style="padding:6px 12px;border-radius:6px;background:var(--paper-l);border:1px solid var(--paper-l);color:var(--paper-s);font-size:.7rem;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;transition:all .15s" onmouseover="this.style.background='var(--paper)'" onmouseout="this.style.background='var(--paper-l)'">
      Esci
    </button>
  `;
  
  // Try to insert before navigation buttons, or just append
  const navButtons=header.querySelector('div:last-child');
  if(navButtons && navButtons.parentNode===header){
    header.insertBefore(userInfo,navButtons);
  }else{
    header.appendChild(userInfo);
  }
}

// Logout handler
async function handleLogout(){
  if(!confirm('Vuoi davvero uscire?')){
    return;
  }
  
  try{
    await supabaseClient.auth.signOut();
    window.location.href='login.html';
  }catch(err){
    console.error('Logout failed:',err);
    alert('Errore durante il logout');
  }
}

// Get current user
async function getCurrentUser(){
  try{
    const {data,error}=await supabaseClient.auth.getSession();
    if(error||!data.session){
      return null;
    }
    return data.session.user;
  }catch(err){
    console.error('Get user failed:',err);
    return null;
  }
}

console.log('✅ Auth Guard loaded');
