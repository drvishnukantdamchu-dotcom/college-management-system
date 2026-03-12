/**
 * DAMC ERP — Authentication Module
 * Role-based access: admin, faculty, student, accounts, librarian
 */

const AUTH = {
  SESSION_KEY: 'damc_session',

  // ─── Login ────────────────────────────────────────────────────────
  login(username, password) {
    const users = DB.get(DB.KEYS.USERS);
    const user = users.find(u =>
      u.username === username && u.password === password && u.active
    );
    if (!user) {
      return { success: false, message: '❌ Invalid username or password!' };
    }
    const session = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      loginTime: new Date().toISOString(),
      studentId: user.studentId || null
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    // Log activity
    this.logActivity('LOGIN', `${user.name} logged in`);
    return { success: true, user: session };
  },

  // ─── Logout ───────────────────────────────────────────────────────
  logout() {
    const user = this.currentUser();
    if (user) this.logActivity('LOGOUT', `${user.name} logged out`);
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = '../index.html';
  },

  // ─── Current User ─────────────────────────────────────────────────
  currentUser() {
    try {
      const s = sessionStorage.getItem(this.SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  // ─── Check Auth (call on every protected page) ────────────────────
  check(allowedRoles = []) {
    const user = this.currentUser();
    if (!user) {
      window.location.href = '../index.html';
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      alert('⛔ Access Denied! You do not have permission for this page.');
      window.history.back();
      return null;
    }
    return user;
  },

  // ─── Role Check Helpers ───────────────────────────────────────────
  isAdmin: () => AUTH.currentUser()?.role === 'admin',
  isFaculty: () => ['admin','faculty'].includes(AUTH.currentUser()?.role),
  isStudent: () => AUTH.currentUser()?.role === 'student',
  isAccounts: () => ['admin','accounts'].includes(AUTH.currentUser()?.role),
  isLibrarian: () => ['admin','librarian'].includes(AUTH.currentUser()?.role),

  // ─── Activity Log ─────────────────────────────────────────────────
  logActivity(action, details) {
    const logs = DB.get('damc_activity_logs');
    logs.push({
      id: DB.generateId(),
      action,
      details,
      user: this.currentUser()?.name || 'System',
      timestamp: new Date().toISOString()
    });
    // Keep last 500 logs only
    if (logs.length > 500) logs.splice(0, logs.length - 500);
    DB.set('damc_activity_logs', logs);
  },

  // ─── Change Password ──────────────────────────────────────────────
  changePassword(oldPass, newPass) {
    const user = this.currentUser();
    if (!user) return { success: false, message: 'Not logged in' };
    const users = DB.get(DB.KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.userId && u.password === oldPass);
    if (idx === -1) return { success: false, message: 'Old password is incorrect!' };
    users[idx].password = newPass;
    DB.set(DB.KEYS.USERS, users);
    return { success: true, message: 'Password changed successfully!' };
  }
};
