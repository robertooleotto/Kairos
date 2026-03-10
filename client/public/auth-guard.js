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
  if(overlay) overlay.remove();
}

(async function checkAuth(){
  if(window.location.pathname.includes('login.html')) return;

  showAuthLoading();

  try{
    const res = await fetch('/api/auth/user', { credentials: 'include' });
    if(res.status === 401){
      window.location.href='/api/login';
      return;
    }
    if(!res.ok){
      window.location.href='/api/login';
      return;
    }
    const user = await res.json();
    if(!user || !user.id){
      window.location.href='/api/login';
      return;
    }
    window.__currentUser = user;
    initAuthUI(user);
    hideAuthLoading();
  }catch(err){
    console.error('Auth check failed:', err);
    window.location.href='/api/login';
  }
})();

function initAuthUI(user){
  const header = document.querySelector('.header');
  if(!header) return;
  if(document.getElementById('auth-user-info')) return;

  const userInfo = document.createElement('div');
  userInfo.id = 'auth-user-info';
  userInfo.style.cssText = `
    display:flex;align-items:center;gap:12px;
    margin-left:auto;margin-right:12px;
    padding:8px 16px;background:var(--paper-h,#16161f);
    border-radius:8px;border:1px solid var(--paper-l,#24242d);
  `;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Utente';
  const initials = displayName.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2);

  if(user.profileImageUrl){
    const img = document.createElement('img');
    img.src = user.profileImageUrl;
    img.style.cssText = 'width:32px;height:32px;border-radius:50%;object-fit:cover';
    img.alt = '';
    userInfo.appendChild(img);
  } else {
    const av = document.createElement('div');
    av.style.cssText = 'width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff';
    av.textContent = initials;
    userInfo.appendChild(av);
  }

  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = 'display:flex;flex-direction:column;gap:2px';
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'font-size:.75rem;font-weight:600;color:var(--paper-t,#f9fafb)';
  nameEl.textContent = displayName;
  const emailEl = document.createElement('div');
  emailEl.style.cssText = 'font-size:.65rem;color:var(--paper-m,#737889)';
  emailEl.textContent = user.email || '';
  infoDiv.appendChild(nameEl);
  infoDiv.appendChild(emailEl);
  userInfo.appendChild(infoDiv);

  const logoutBtn = document.createElement('button');
  logoutBtn.setAttribute('data-testid', 'button-logout');
  logoutBtn.style.cssText = 'padding:6px 12px;border-radius:6px;background:var(--paper-l,#24242d);border:1px solid var(--paper-l,#24242d);color:var(--paper-s,#cdd0de);font-size:.7rem;font-weight:600;cursor:pointer;font-family:Sora,sans-serif;transition:all .15s';
  logoutBtn.textContent = 'Esci';
  logoutBtn.onclick = handleLogout;
  userInfo.appendChild(logoutBtn);

  const navButtons = header.querySelector('div:last-child');
  if(navButtons && navButtons.parentNode === header){
    header.insertBefore(userInfo, navButtons);
  } else {
    header.appendChild(userInfo);
  }
}

function handleLogout(){
  if(!confirm('Vuoi davvero uscire?')) return;
  window.location.href = '/api/logout';
}

function getCurrentUser(){
  return window.__currentUser || null;
}

console.log('✅ Auth Guard loaded');
