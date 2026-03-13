/**
 * DAMC ERP — Database Layer (localStorage)
 * Dhanwantari Ayurved Medical College & Hospital, Udgir
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const DB = {

  keys: {
    students:   'damc_students',
    faculty:    'damc_faculty',
    attendance: 'damc_attendance',
    fees:       'damc_fees',
    timetable:  'damc_timetable',
    exams:      'damc_exams',
    library:    'damc_library',
    hostel:     'damc_hostel',
    notices:    'damc_notices',
    settings:   'damc_settings',
    users:      'damc_users',
    activity:   'damc_activity',
    departments:'damc_departments',
    feeStructure:'damc_fee_structure'
  },

  // ── Generate unique ID ──────────────────────────────────────
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ── Get all records ─────────────────────────────────────────
  getAll(module) {
    try {
      const key  = this.keys[module];
      if (!key) return [];
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('DB.getAll error:', module, e);
      return [];
    }
  },

  // ── Get by ID ───────────────────────────────────────────────
  getById(module, id) {
    try {
      return this.getAll(module).find(r => r.id === id) || null;
    } catch (e) {
      return null;
    }
  },

  // ── Add record ──────────────────────────────────────────────
  add(module, record) {
    try {
      const key  = this.keys[module];
      if (!key) return false;
      const all  = this.getAll(module);
      if (!record.id) record.id = this.generateId();
      if (!record.createdAt) record.createdAt = new Date().toISOString();
      all.push(record);
      localStorage.setItem(key, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('DB.add error:', module, e);
      return false;
    }
  },

  // ── Update record ───────────────────────────────────────────
  update(module, id, updates) {
    try {
      const key = this.keys[module];
      if (!key) return false;
      const all = this.getAll(module);
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return false;
      all[idx] = { ...all[idx], ...updates, id, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('DB.update error:', module, e);
      return false;
    }
  },

  // ── Delete record ───────────────────────────────────────────
  delete(module, id) {
    try {
      const key     = this.keys[module];
      if (!key) return false;
      const filtered = this.getAll(module).filter(r => r.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('DB.delete error:', module, e);
      return false;
    }
  },

  // ── Search ──────────────────────────────────────────────────
  search(module, query, fields) {
    const q   = query.toLowerCase();
    return this.getAll(module).filter(r =>
      fields.some(f => (r[f] || '').toString().toLowerCase().includes(q))
    );
  },

  // ── Count ───────────────────────────────────────────────────
  count(module) {
    return this.getAll(module).length;
  },

  // ── Save full array ─────────────────────────────────────────
  saveAll(module, data) {
    try {
      const key = this.keys[module];
      if (!key) return false;
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  // ── Full backup export ──────────────────────────────────────
  exportBackup() {
    const backup = {
      version:   '2.0',
      college:   'DAMC Udgir',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Dr. Jadhav V R'
    };
    Object.keys(this.keys).forEach(mod => {
      backup[mod] = this.getAll(mod);
    });
    return backup;
  },

  // ── Full backup import ──────────────────────────────────────
  importBackup(data) {
    try {
      if (!data || !data.version) return false;
      Object.keys(this.keys).forEach(mod => {
        if (data[mod] !== undefined) {
          localStorage.setItem(this.keys[mod], JSON.stringify(data[mod]));
        }
      });
      return true;
    } catch (e) {
      console.error('importBackup error:', e);
      return false;
    }
  },

  // ── Clear module ────────────────────────────────────────────
  clearModule(module) {
    const key = this.keys[module];
    if (key) localStorage.setItem(key, '[]');
  },

  // ── Seed default users ──────────────────────────────────────
  seedUsers() {
    const existing = this.getAll('users');
    if (existing.length > 0) return;
    const users = [
      { id: this.generateId(), username:'admin',    password:'admin123',    role:'admin',    name:'Administrator',    email:'admin@damc.edu.in',    active:true },
      { id: this.generateId(), username:'faculty',  password:'faculty123',  role:'faculty',  name:'Dr. Faculty User', email:'faculty@damc.edu.in',  active:true },
      { id: this.generateId(), username:'student',  password:'student123',  role:'student',  name:'Student User',     email:'student@damc.edu.in',  active:true },
      { id: this.generateId(), username:'accounts', password:'accounts123', role:'accounts', name:'Accounts Staff',   email:'accounts@damc.edu.in', active:true }
    ];
    localStorage.setItem(this.keys.users, JSON.stringify(users));
  },

  // ── Seed settings ───────────────────────────────────────────
  seedSettings() {
    const existing = this.getAll('settings');
    if (existing.length > 0) return;
    const settings = [{
      id:          this.generateId(),
      collegeName: 'Dhanwantari Ayurved Medical College & Hospital',
      shortName:   'DAMC',
      address:     'Udgir, Latur – 413517',
      phone:       '02385-123456',
      email:       'info@damchudgir.edu.in',
      website:     'damchudgir.edu.in',
      affiliation: 'MUHS Nashik',
      course:      'BAMS',
      seats:       '60',
      principal:   'Dr. V.R. Jadhav',
      theme:       'light',
      academicYear:'2024-25'
    }];
    localStorage.setItem(this.keys.settings, JSON.stringify(settings));
  },

  // ── Seed departments ─────────────────────────────────────────
  seedDepartments() {
    const existing = this.getAll('departments');
    if (existing.length > 0) return;
    const depts = [
      'Rachana Sharir (Anatomy)',
      'Kriya Sharir (Physiology)',
      'Maulik Siddhant',
      'Sanskrit',
      'Dravyaguna Vigyan',
      'Rasa Shastra',
      'Roga Nidan',
      'Kayachikitsa',
      'Shalya Tantra',
      'Shalakya Tantra',
      'Prasuti & Striroga',
      'Kaumar Bhritya',
      'Panchakarma',
      'Swasthavritta'
    ].map(name => ({ id: this.generateId(), name, active: true }));
    localStorage.setItem(this.keys.departments, JSON.stringify(depts));
  },

  // ── Run all seeds ────────────────────────────────────────────
  init() {
    this.seedUsers();
    this.seedSettings();
    this.seedDepartments();
    console.log('✅ DB initialized');
  }

};

// Auto-init DB on load
DB.init();
