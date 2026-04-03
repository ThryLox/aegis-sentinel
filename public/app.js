// Core Elements
const dashTerminal = document.getElementById('dashboard-terminal');
const mainTerminal = document.getElementById('main-terminal');
const scanBtn = document.getElementById('scan-btn');
const fixBtn = document.getElementById('fix-btn');
const authBtn = document.getElementById('auth-btn');
const alertContainer = document.getElementById('alert-container');
const navItems = document.querySelectorAll('.nav-item');
const viewPanels = document.querySelectorAll('.view-panel');

let userIsAuth = false;

// Tab Navigation Logic
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // 1. Remove active state from all navs
    navItems.forEach(n => n.classList.remove('active'));
    // 2. Add active to clicked nav
    item.classList.add('active');
    
    // 3. Hide all panels
    viewPanels.forEach(p => p.classList.remove('active'));
    // 4. Show target panel
    const targetId = `view-${item.dataset.tab}`;
    document.getElementById(targetId).classList.add('active');
  });
});

// Dual Terminal Logging
function log(msg, type = 'log-sys') {
  const ts = new Date().toISOString().split('T')[1].slice(0,-1);
  const lineStr = `[${ts}] > ${msg}`;
  
  // Create element for dashboard terminal
  const dLine = document.createElement('div');
  dLine.className = `log-line ${type}`;
  dLine.innerText = lineStr;
  dashTerminal.appendChild(dLine);
  dashTerminal.scrollTop = dashTerminal.scrollHeight;

  // Create element for full logs terminal
  const mLine = document.createElement('div');
  mLine.className = `log-line ${type}`;
  mLine.innerText = lineStr;
  mainTerminal.appendChild(mLine);
  mainTerminal.scrollTop = mainTerminal.scrollHeight;
}

// Initial Boot Sequence
setTimeout(() => log('Kernel initialized.', 'log-sys'), 100);
setTimeout(() => log('Auth0 Middleware active. Checking tokens...', 'log-info'), 600);

// Check Authentication Status
async function checkAuth() {
  try {
    const res = await fetch('/api/user');
    const data = await res.json();
    userIsAuth = data.isAuthenticated;
    
    if (userIsAuth) {
      document.getElementById('auth-text').innerText = data.user.email || 'Authenticated';
      document.getElementById('auth-dot').classList.add('active');
      authBtn.onclick = () => window.location.href = '/logout';
      log('User Identity Verified via Auth0.', 'log-success');
      log('Token Vault policies loaded in memory.', 'log-sys');
    } else {
      authBtn.onclick = () => window.location.href = '/login';
      log('Anonymous state. Step-up Auth required for mutable operations.', 'log-warn');
    }
  } catch (err) {
    log('Failed to reach Auth0 gateway.', 'log-err');
  }
}

// Initiate Scanner
scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  alertContainer.classList.remove('visible');
  log('Dispatching Aegis Agent for environment audit (Gemini-2.5-Flash)...', 'log-info');
  
  try {
    const res = await fetch('/api/agent/scan', { method: 'POST' });
    if (!res.ok) throw new Error('Agent failed to scan.');
    
    const data = await res.json();
    
    log(`Vulnerability Discovered: Severity [${data.severity}]`, 'log-err');
    
    document.getElementById('alert-analysis').innerText = data.analysis;
    document.getElementById('alert-action').innerText = data.proposedAction;
    alertContainer.classList.add('visible');
    
  } catch (err) {
    log(err.message, 'log-err');
  } finally {
    scanBtn.disabled = false;
  }
});

// Execute Fix (Step-Up Auth)
fixBtn.addEventListener('click', async () => {
  if (!userIsAuth) {
    log('BLOCKING ACTION. Agent requires explicit user consent.', 'log-err');
    log('Redirecting to Auth0 Step-up Authentication...', 'log-warn');
    setTimeout(() => {
      window.location.href = '/login'; 
    }, 1500);
    return;
  }
  
  log('User consent granted. Contacting Auth0 Vault for delegated credentials...', 'log-info');
  fixBtn.disabled = true;
  fixBtn.innerHTML = "Processing via Vault...";
  
  try {
    const res = await fetch('/api/agent/fix', { method: 'POST' });
    if (!res.ok) {
        if(res.status === 401) throw new Error('Step-up auth token expired! Relogin required.');
        throw new Error('Failed to execute fix.');
    }
    
    const data = await res.json();
    log(`Vault Key Released. Action Executed: ${data.message}`, 'log-success');
    
    // Simulate resolution
    setTimeout(() => {
      alertContainer.classList.remove('visible');
      fixBtn.disabled = false;
      fixBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Grant Agent Access (Step-Up Auth)`;
      log('Aegis Sentinel returning to standby mode.', 'log-sys');
    }, 3000);
    
  } catch (err) {
    log(err.message, 'log-err');
    fixBtn.disabled = false;
    fixBtn.innerHTML = "Try Again";
  }
});

// Initialize
setTimeout(checkAuth, 1000);

// --- DRAGGABLE TOPOLOGY LOGIC ---
const topoNodes = document.querySelectorAll('.topo-node');
const topoContainer = document.getElementById('topo-container');

// Map lines to nodes for dynamic redrawing
const lineConnections = [
  { lineId: 'line-web-waf', startNode: 'node-web', endNode: 'node-waf' },
  { lineId: 'line-waf-eks', startNode: 'node-waf', endNode: 'node-eks' },
  { lineId: 'line-waf-s3', startNode: 'node-waf', endNode: 'node-s3' },
  { lineId: 'line-s3-iam', startNode: 'node-s3', endNode: 'node-iam' }
];

let activeNode = null;
let offsetX = 0;
let offsetY = 0;

function updateLines() {
  lineConnections.forEach(conn => {
    const start = document.getElementById(conn.startNode);
    const end = document.getElementById(conn.endNode);
    const line = document.getElementById(conn.lineId);
    
    if (start && end && line) {
      // Parse coordinates (removing 'px')
      const sx = parseInt(start.style.left, 10);
      const sy = parseInt(start.style.top, 10);
      const ex = parseInt(end.style.left, 10);
      const ey = parseInt(end.style.top, 10);
      
      line.setAttribute('d', `M ${sx} ${sy} L ${ex} ${ey}`);
    }
  });
}

topoNodes.forEach(node => {
  node.addEventListener('mousedown', (e) => {
    activeNode = node;
    const rect = topoContainer.getBoundingClientRect();
    
    // Parse current pos or use 0
    const currentLeft = parseInt(node.style.left || 0, 10);
    const currentTop = parseInt(node.style.top || 0, 10);
    
    // Calculate offset relative to the mouse pointer
    offsetX = e.clientX - rect.left - currentLeft;
    offsetY = e.clientY - rect.top - currentTop;
    
    node.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent text selection
  });
});

document.addEventListener('mousemove', (e) => {
  if (!activeNode) return;
  
  const rect = topoContainer.getBoundingClientRect();
  let newLeft = e.clientX - rect.left - offsetX;
  let newTop = e.clientY - rect.top - offsetY;
  
  // Basic bounds checking
  newLeft = Math.max(0, Math.min(newLeft, rect.width));
  newTop = Math.max(0, Math.min(newTop, rect.height));
  
  activeNode.style.left = `${newLeft}px`;
  activeNode.style.top = `${newTop}px`;
  
  updateLines();
});

document.addEventListener('mouseup', () => {
  if (activeNode) {
    activeNode.style.cursor = 'grab';
    activeNode = null;
  }
});
