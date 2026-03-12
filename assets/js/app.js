/**
 * DAMC ERP — Core Application Engine
 * Navigation, Toast, Theme, Utilities
 */

const APP = {
  // ── Init ──────────────────────────────────────────────────────
  init() {
    this.user = AUTH.check();
    if (!this.user) return;
    this.renderHeader();
    this.renderSidebarUser();
    this.setActiveNav();
    this.initTheme();
    this.initSidebar();
    this.initSearch();
    this.updateNotifBadge();
    BACKUP.autoBackup();
    console.log('✅ DAMC ERP App Initialized | User:', this.user.name);
  },

  // ── Render Header Info ────────────────────────────────────────
  renderHeader() {
    const el = document.getElementById('headerUserName');
    if (el) el.textContent = this.user.name;
    const role = document.getElementById('headerUserRole');
    if (role) role.textContent = this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1);
  },

  // ── Render Sidebar User ────────────────────────────────────────
  renderSidebarUser() {
    const avatar = document.getElementById('sidebarAvatar');
    const name   = document.getElementById('sidebarUserName');
    const role   = document.getElementById('sidebarUserRole');
    if (avatar) avatar.textContent = this.user.name.charAt(0);
    if (name)   name.textContent   = this.user.name;
    if (role)   role.textContent   = this.user.role;
  },

  // ── Active Navigation ──────────────────────────────────────────
  setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      if (href && path.includes(href.replace('../pages/',''))) {
        item.classList.add('active');
      }
    });
  },

  // ── Sidebar Toggle ─────────────────────────────────────────────
  initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const main    = document.querySelector('.main-content');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          sidebar?.classList.toggle('mobile-open');
          overlay?.classList.toggle('hidden');
        } else {
          sidebar?.classList.toggle('collapsed');
          main?.classList.toggle('expanded');
          localStorage.setItem('damc_sidebar_collapsed',
            sidebar?.classList.contains('collapsed') ? '1' : '0');
        }
      });
    }
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('mobile-open');
        overlay.classList.add('hidden');
      });
    }
    // Restore state
    if (localStorage.getItem('damc_sidebar_collapsed') === '1') {
      sidebar?.classList.add('collapsed');
      main?.classList.add('expanded');
    }
  },

  // ── Theme Toggle ──────────────────────────────────────────────
  initTheme() {
    const saved = localStorage.getItem('damc_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('damc_theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  },

  // ── Global Search ──────────────────────────────────────────────
  initSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    input.addEventListener('input', APP.Utils.debounce((e) => {
      const q = e.target.value.trim();
      if (q.length >= 2) APP.performSearch(q);
    }, 400));
  },

  performSearch(query) {
    const students = DB.search(DB.KEYS.STUDENTS, query, ['name','rollNo','phone','email']);
    const faculty  = DB.search(DB.KEYS.FACULTY,  query, ['name','empId','phone','email']);
    console.log(`Search: "${query}" → ${students.length} students, ${faculty.length} faculty`);
    // Show results dropdown (implement in dashboard)
  },

  // ── Notifications ─────────────────────────────────────────────
  updateNotifBadge() {
    const notices = DB.get(DB.KEYS.NOTICES).length;
    const badge   = document.getElementById('notifBadge');
    if (badge && notices > 0) badge.textContent = notices;
  },

  // ── Toast System ──────────────────────────────────────────────
  toast(message, type = 'info', title = '', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
    const titles = { success:'Success', error:'Error', warning:'Warning', info:'Info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title || titles[type]}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(60px)'; setTimeout(() => toast.remove(), 300); }, duration);
  },

  // ── Confirm Dialog ─────────────────────────────────────────────
  confirm(message, onYes, onNo) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle" style="color:var(--warning)"></i> Confirm Action</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);line-height:1.7">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="confirmNo">Cancel</button>
          <button class="btn btn-danger" id="confirmYes">
            <i class="fas fa-check"></i> Confirm
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirmYes').onclick = () => { overlay.remove(); if (onYes) onYes(); };
    document.getElementById('confirmNo').onclick  = () => { overlay.remove(); if (onNo) onNo(); };
  },

  // ── Utilities ──────────────────────────────────────────────────
  Utils: {
    debounce(fn, delay) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    },
    formatDate(iso) {
      if (!iso) return '-';
      return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    formatCurrency(n) {
      return '₹' + Number(n || 0).toLocaleString('en-IN');
    },
    formatPercent(val, total) {
      if (!total) return '0%';
      return Math.round((val / total) * 100) + '%';
    },
    getInitials(name) {
      return name?.split(' ').map(w => w[0]).join('').toUpperCase().substr(0,2) || 'NA';
    },
    generateRollNo(year, seq) {
      const y = new Date().getFullYear().toString().substr(-2);
      return `BAMS${y}${String(seq).padStart(3,'0')}`;
    },
    calculateAge(dob) {
      const diff = Date.now() - new Date(dob).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    },
    printSection(id) {
      const content = document.getElementById(id)?.innerHTML;
      if (!content) return;
      const w = window.open('', '_blank');
      w.document.write(`
        <html><head>
          <title>DAMC ERP — Print</title>
          <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style>
        </head><body>
          <div style="text-align:center;margin-bottom:20px">
            <h2>Dhanwantari Ayurved Medical College & Hospital</h2>
            <p>Udgir – 413517, Dist. Latur, Maharashtra | Tel: 02385-259825</p>
            <hr/>
          </div>
          ${content}
          <p style="margin-top:20px;font-size:12px;color:#999">Printed on: ${new Date().toLocaleString()}</p>
        </body></html>
      `);
      w.document.close();
      w.print();
    }
  }
};
