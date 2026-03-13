/**
 * DAMC ERP — Authentication Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const AUTH = {

  SESSION_KEY: 'damc_session',

  // ── Check if logged in, redirect if not ──────────────────────
  checkLogin() {
    const session = this.getSession();
    if (!session) {
      window.location.href = this.getLoginPath();
      return false;
    }
    return true;
  },

  // ── Get correct login path based on current directory ────────
  getLoginPath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) return '../index.html';
    return 'index.html';
  },

  // ── Login ─────────────────────────────────────────────────────
  login(username, password) {
    const users   = DB.getAll('users');
    const user    = users.find(
      u => u.username === username && u.password === password && u.active !== false
    );
    if (!user) return { success: false, message: 'Invalid username or password' };

    const session = {
      id:        user.id,
      username:  user.username,
      name:      user.name,
      role:      user.role,
      email:     user.email,
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    // Log activity
    DB.add('activity', {
      id:     DB.generateId(),
      user:   user.username,
      action: 'Login',
      detail: `${user.name} logged in`,
      time:   new Date().toISOString()
    });

    return { success: true, user: session };
  },

  // ── Logout ────────────────────────────────────────────────────
  logout() {
    const session = this.getSession();
    if (session) {
      DB.add('activity', {
        id:     DB.generateId(),
        user:   session.username,
        action: 'Logout',
        detail: `${session.name} logged out`,
        time:   new Date().toISOString()
      });
    }
    sessionStorage.removeItem(this.SESSION_KEY);
    const path = window.location.pathname;
    window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
  },

  // ── Get current session ───────────────────────────────────────
  getSession() {
    try {
      const s = sessionStorage.getItem(this.SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  },

  // ── Role checks ───────────────────────────────────────────────
  isAdmin()    { return this.getSession()?.role === 'admin';    },
  isFaculty()  { return this.getSession()?.role === 'faculty';  },
  isStudent()  { return this.getSession()?.role === 'student';  },
  isAccounts() { return this.getSession()?.role === 'accounts'; },

  // ── Get user display name ─────────────────────────────────────
  getUserName() { return this.getSession()?.name || 'User'; },
  getRole()     { return this.getSession()?.role || '';     }

};
