
(function(){
  const style = document.createElement('style');
  style.textContent = `
    .notif-bell{position:relative;cursor:pointer;padding:8px;border-radius:8px;border:none;background:transparent;color:var(--paper-s,#cdd0de);transition:all .15s;margin-left:8px}
    .notif-bell:hover{background:var(--paper-l,#24242d)}
    .notif-badge{position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px}
    .notif-badge.hidden{display:none}
    .notif-dropdown{position:absolute;top:100%;right:0;width:360px;max-height:400px;overflow-y:auto;background:var(--paper-h,#16161f);border:1px solid var(--paper-l,#24242d);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);z-index:200;display:none}
    .notif-dropdown.open{display:block}
    .notif-dd-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--paper-l,#24242d)}
    .notif-dd-title{font-size:.8rem;font-weight:700;color:var(--paper-t,#f9fafb)}
    .notif-dd-mark{font-size:.68rem;color:#6366f1;cursor:pointer;border:none;background:none;font-family:'Sora',sans-serif}
    .notif-dd-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--paper-l,#24242d);cursor:pointer;transition:background .15s;font-size:.75rem}
    .notif-dd-item:hover{background:var(--paper-l,#24242d)}
    .notif-dd-item.unread{background:rgba(99,102,241,.05)}
    .notif-dd-item:last-child{border-bottom:none}
    .notif-dd-dot{width:8px;height:8px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:4px}
    .notif-dd-item:not(.unread) .notif-dd-dot{background:transparent}
    .notif-dd-content{flex:1;min-width:0}
    .notif-dd-t{font-size:.75rem;font-weight:600;margin-bottom:2px;color:var(--paper-t,#f9fafb)}
    .notif-dd-m{font-size:.68rem;color:var(--paper-m,#737889);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .notif-dd-time{font-size:.6rem;color:var(--paper-m,#737889);margin-top:4px}
    .notif-dd-empty{padding:24px;text-align:center;color:var(--paper-m,#737889);font-size:.78rem}
  `;
  document.head.appendChild(style);

  function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  const container = document.createElement('div');
  container.style.cssText='position:relative;margin-left:8px;display:inline-flex';
  container.id='global-notif-container';
  container.innerHTML=`
    <button class="notif-bell" onclick="window.__toggleNotif()" data-testid="button-notifications">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="notif-badge hidden" id="global-notif-count">0</span>
    </button>
    <div class="notif-dropdown" id="global-notif-dd">
      <div class="notif-dd-header">
        <span class="notif-dd-title">Notifiche</span>
        <button class="notif-dd-mark" onclick="window.__markAllNotifRead()">Segna tutte lette</button>
      </div>
      <div id="global-notif-list"></div>
    </div>
  `;

  let _notifs=[];

  function inject(){
    const header = document.querySelector('.header, #toolbar');
    if(!header) return;
    const existing = document.getElementById('global-notif-container');
    if(existing) return;
    const authInfo = document.getElementById('auth-user-info');
    if(authInfo){
      authInfo.parentNode.insertBefore(container, authInfo);
    } else {
      header.appendChild(container);
    }
    loadNotifs();
  }

  async function loadNotifs(){
    try{
      const res = await fetch('/api/notifications',{credentials:'include'});
      if(!res.ok) return;
      _notifs = await res.json();
      renderNotifs();
    }catch(e){}
  }

  function renderNotifs(){
    const unread = _notifs.filter(n=>!n.read).length;
    const badge = document.getElementById('global-notif-count');
    if(badge){
      badge.textContent=unread;
      badge.classList.toggle('hidden',unread===0);
    }
    const list = document.getElementById('global-notif-list');
    if(!list) return;
    if(!_notifs.length){ list.innerHTML='<div class="notif-dd-empty">Nessuna notifica</div>'; return; }
    list.innerHTML = _notifs.slice(0,20).map(n=>{
      const d=new Date(n.created_at);
      const ts=d.toLocaleDateString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      return `<div class="notif-dd-item ${n.read?'':'unread'}" onclick="window.__openNotif(${n.id},'${(n.link||'').replace(/'/g,"\\'")}')">
        <div class="notif-dd-dot"></div>
        <div class="notif-dd-content">
          <div class="notif-dd-t">${escH(n.title)}</div>
          <div class="notif-dd-m">${escH(n.message)}</div>
          <div class="notif-dd-time">${ts}</div>
        </div>
      </div>`;
    }).join('');
  }

  window.__toggleNotif=function(){
    document.getElementById('global-notif-dd').classList.toggle('open');
  };
  window.__openNotif=async function(id,link){
    try{await fetch(`/api/notifications/${id}/read`,{method:'PATCH',credentials:'include'})}catch(e){}
    const n=_notifs.find(x=>x.id===id);
    if(n)n.read=true;
    renderNotifs();
    if(link)window.location.href=link;
  };
  window.__markAllNotifRead=async function(){
    try{await fetch('/api/notifications/mark-all-read',{method:'POST',credentials:'include'})}catch(e){}
    _notifs.forEach(n=>n.read=true);
    renderNotifs();
  };

  document.addEventListener('click',e=>{
    const dd=document.getElementById('global-notif-dd');
    const cont=document.getElementById('global-notif-container');
    if(dd && dd.classList.contains('open') && cont && !cont.contains(e.target)){
      dd.classList.remove('open');
    }
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,200));
  } else {
    setTimeout(inject,200);
  }
})();
