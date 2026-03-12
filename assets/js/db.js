/**
 * DAMC ERP — Database Engine
 * Uses localStorage for quick access + IndexedDB for large data
 * Supports full JSON Export/Import for cross-device backup
 */

const DB = {
  // ─── College Info ───────────────────────────────────────────────
  COLLEGE: {
    name: "Dhanwantari Ayurved Medical College & Hospital",
    shortName: "DAMC",
    address: "Degloor Road, Udgir – 413517, Dist. Latur, Maharashtra",
    phone: "(02385) 259825",
    email: "contact@damchudgir.edu.in",
    website: "www.damchudgir.edu.in",
    affiliated: "Maharashtra University of Health Sciences (MUHS), Nashik",
    recognized: "CCIM (New Delhi) & AYUSH, Govt. of India",
    established: "2000",
    course: "BAMS (Bachelor of Ayurvedic Medicine and Surgery)",
    intake: 60,
    duration: "4 years + 1 year Internship",
    medium: "Marathi, Sanskrit, Hindi, English",
    principalName: "Dr. Vishnu Kant Damchu",
    logo: null
  },

  // ─── Storage Keys ────────────────────────────────────────────────
  KEYS: {
    STUDENTS:    'damc_students',
    FACULTY:     'damc_faculty',
    ATTENDANCE:  'damc_attendance',
    FEES:        'damc_fees',
    FEE_STRUCT:  'damc_fee_structure',
    TIMETABLE:   'damc_timetable',
    EXAMS:       'damc_exams',
    RESULTS:     'damc_results',
    LIBRARY:     'damc_library',
    LIB_ISSUES:  'damc_lib_issues',
    HOSTEL:      'damc_hostel',
    NOTICES:     'damc_notices',
    EVENTS:      'damc_events',
    USERS:       'damc_users',
    SETTINGS:    'damc_settings',
    DEPARTMENTS: 'damc_departments',
    SUBJECTS:    'damc_subjects',
    DOCUMENTS:   'damc_documents',
  },

  // ─── Generic CRUD ────────────────────────────────────────────────
  get(key) {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : [];
    } catch { return []; }
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch(e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  getObj(key, def = {}) {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : def;
    } catch { return def; }
  },

  setObj(key, data) {
    return this.set(key, data);
  },

  // ─── Add Record ──────────────────────────────────────────────────
  add(key, record) {
    const list = this.get(key);
    record.id = record.id || this.generateId();
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    list.push(record);
    this.set(key, list);
    return record;
  },

  // ─── Update Record ───────────────────────────────────────────────
  update(key, id, updates) {
    const list = this.get(key);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.set(key, list);
    return list[idx];
  },

  // ─── Delete Record ───────────────────────────────────────────────
  delete(key, id) {
    const list = this.get(key);
    const filtered = list.filter(r => r.id !== id);
    this.set(key, filtered);
    return true;
  },

  // ─── Find by ID ──────────────────────────────────────────────────
  findById(key, id) {
    return this.get(key).find(r => r.id === id) || null;
  },

  // ─── Search / Filter ─────────────────────────────────────────────
  search(key, query, fields) {
    const list = this.get(key);
    const q = query.toLowerCase();
    return list.filter(r =>
      fields.some(f => r[f] && r[f].toString().toLowerCase().includes(q))
    );
  },

  // ─── Generate Unique ID ──────────────────────────────────────────
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ─── Get Storage Usage ───────────────────────────────────────────
  getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2) + ' KB';
  },

  // ─── FULL BACKUP → JSON ──────────────────────────────────────────
  exportBackup() {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: AUTH ? AUTH.currentUser()?.name : 'System',
      college: this.COLLEGE,
      data: {}
    };
    Object.entries(this.KEYS).forEach(([name, key]) => {
      backup.data[name] = this.get(key);
    });
    // Also include settings object
    backup.settings = this.getObj(this.KEYS.SETTINGS);
    return backup;
  },

  // ─── FULL RESTORE ← JSON ─────────────────────────────────────────
  importBackup(backupObj) {
    try {
      if (!backupObj.version || !backupObj.data) {
        return { success: false, message: 'Invalid backup file format!' };
      }
      Object.entries(this.KEYS).forEach(([name, key]) => {
        if (backupObj.data[name] !== undefined) {
          this.set(key, backupObj.data[name]);
        }
      });
      if (backupObj.settings) {
        this.setObj(this.KEYS.SETTINGS, backupObj.settings);
      }
      return {
        success: true,
        message: `Backup restored successfully! Exported on: ${new Date(backupObj.exportedAt).toLocaleString()}`
      };
    } catch(e) {
      return { success: false, message: 'Restore failed: ' + e.message };
    }
  },

  // ─── Seed Default Data ───────────────────────────────────────────
  seedDefaultData() {
    // Users
    if (this.get(this.KEYS.USERS).length === 0) {
      const users = [
        { id:'u1', username:'admin',    password:'admin123',    name:'Dr. Vishnu Kant Damchu', role:'admin',    email:'principal@damchudgir.edu.in', phone:'9999999999', active:true },
        { id:'u2', username:'faculty',  password:'faculty123',  name:'Dr. Priya Sharma',       role:'faculty',  email:'faculty@damchudgir.edu.in',   phone:'9988887777', active:true },
        { id:'u3', username:'student',  password:'student123',  name:'Rahul Patil',            role:'student',  email:'rahul@gmail.com',             phone:'9876543210', active:true, studentId:'STU001' },
        { id:'u4', username:'accounts', password:'accounts123', name:'Suresh Kadam',           role:'accounts', email:'accounts@damchudgir.edu.in',  phone:'9977665544', active:true },
        { id:'u5', username:'librarian',password:'lib123',      name:'Mrs. Anita Desai',       role:'librarian',email:'library@damchudgir.edu.in',   phone:'9966554433', active:true },
      ];
      this.set(this.KEYS.USERS, users);
    }

    // Departments
    if (this.get(this.KEYS.DEPARTMENTS).length === 0) {
      const depts = [
        { id:'d1', name:'Kriya Sharir',         head:'Dr. A. Kulkarni',  established:'2000' },
        { id:'d2', name:'Rachana Sharir',        head:'Dr. B. Jadhav',    established:'2000' },
        { id:'d3', name:'Dravyaguna',            head:'Dr. C. Patil',     established:'2000' },
        { id:'d4', name:'Kayachikitsa',          head:'Dr. D. Shinde',    established:'2001' },
        { id:'d5', name:'Shalya Tantra',         head:'Dr. E. More',      established:'2001' },
        { id:'d6', name:'Prasuti & Stri Roga',   head:'Dr. F. Desai',     established:'2002' },
        { id:'d7', name:'Kaumarbhritya',         head:'Dr. G. Kamble',    established:'2002' },
        { id:'d8', name:'Shalakya Tantra',       head:'Dr. H. Wagh',      established:'2003' },
        { id:'d9', name:'Panchakarma',           head:'Dr. I. Bhosale',   established:'2005' },
        { id:'d10',name:'Swasthavritta',         head:'Dr. J. Gaikwad',   established:'2005' },
      ];
      this.set(this.KEYS.DEPARTMENTS, depts);
    }

    // Sample Students
    if (this.get(this.KEYS.STUDENTS).length === 0) {
      const students = [
        { id:'s1', rollNo:'BAMS2024001', name:'Rahul Patil',       gender:'Male',   dob:'2002-05-15', phone:'9876543210', email:'rahul@gmail.com',  year:'1st', batch:'2024-25', department:'d1', address:'Udgir, Latur', guardianName:'Mr. Ramesh Patil', guardianPhone:'9876543211', category:'Open', admissionDate:'2024-07-15', photo:null, active:true },
        { id:'s2', rollNo:'BAMS2024002', name:'Priya Jadhav',      gender:'Female', dob:'2003-03-22', phone:'9765432109', email:'priya@gmail.com',  year:'1st', batch:'2024-25', department:'d2', address:'Latur City',   guardianName:'Mr. Vijay Jadhav',  guardianPhone:'9765432108', category:'OBC',  admissionDate:'2024-07-16', photo:null, active:true },
        { id:'s3', rollNo:'BAMS2023001', name:'Amit Shinde',       gender:'Male',   dob:'2001-08-10', phone:'9654321098', email:'amit@gmail.com',   year:'2nd', batch:'2023-24', department:'d3', address:'Osmanabad',    guardianName:'Mr. Sanjay Shinde', guardianPhone:'9654321097', category:'SC',   admissionDate:'2023-07-20', photo:null, active:true },
        { id:'s4', rollNo:'BAMS2023002', name:'Sneha More',        gender:'Female', dob:'2002-11-30', phone:'9543210987', email:'sneha@gmail.com',  year:'2nd', batch:'2023-24', department:'d4', address:'Nanded',       guardianName:'Mr. Ramesh More',   guardianPhone:'9543210986', category:'NT',   admissionDate:'2023-07-21', photo:null, active:true },
        { id:'s5', rollNo:'BAMS2022001', name:'Kiran Kamble',      gender:'Male',   dob:'2000-07-04', phone:'9432109876', email:'kiran@gmail.com',  year:'3rd', batch:'2022-23', department:'d5', address:'Solapur',      guardianName:'Mr. Anil Kamble',   guardianPhone:'9432109875', category:'ST',   admissionDate:'2022-07-18', photo:null, active:true },
        { id:'s6', rollNo:'BAMS2021001', name:'Deepa Wagh',        gender:'Female', dob:'1999-09-12', phone:'9321098765', email:'deepa@gmail.com',  year:'4th', batch:'2021-22', department:'d6', address:'Bidar',        guardianName:'Mr. Suresh Wagh',   guardianPhone:'9321098764', category:'Open', admissionDate:'2021-07-22', photo:null, active:true },
      ];
      this.set(this.KEYS.STUDENTS, students);
    }

    // Sample Fee Structure
    if (this.get(this.KEYS.FEE_STRUCT).length === 0) {
      const feeStruct = [
        { id:'fs1', name:'Tuition Fee',      year:'1st', amount:85000, dueDate:'2024-08-31', category:'Academic' },
        { id:'fs2', name:'Development Fee',  year:'1st', amount:10000, dueDate:'2024-08-31', category:'Academic' },
        { id:'fs3', name:'Library Fee',      year:'1st', amount:3000,  dueDate:'2024-08-31', category:'Facility' },
        { id:'fs4', name:'Laboratory Fee',   year:'1st', amount:5000,  dueDate:'2024-08-31', category:'Facility' },
        { id:'fs5', name:'Hostel Fee',       year:'1st', amount:40000, dueDate:'2024-08-31', category:'Hostel'   },
        { id:'fs6', name:'Exam Fee',         year:'1st', amount:2500,  dueDate:'2024-10-15', category:'Exam'     },
        { id:'fs7', name:'Tuition Fee',      year:'2nd', amount:85000, dueDate:'2025-08-31', category:'Academic' },
        { id:'fs8', name:'Tuition Fee',      year:'3rd', amount:90000, dueDate:'2026-08-31', category:'Academic' },
        { id:'fs9', name:'Tuition Fee',      year:'4th', amount:95000, dueDate:'2027-08-31', category:'Academic' },
      ];
      this.set(this.KEYS.FEE_STRUCT, feeStruct);
    }

    // Sample Library Books
    if (this.get(this.KEYS.LIBRARY).length === 0) {
      const books = [
        { id:'b1', accNo:'ACC001', title:'Charaka Samhita Vol 1',    author:'Acharya Charaka',   publisher:'Chaukhamba', year:'2018', isbn:'978-81-7080-001-1', category:'Ayurved Samhita', copies:3, available:3, location:'Rack-A1' },
        { id:'b2', accNo:'ACC002', title:'Sushruta Samhita',         author:'Acharya Sushruta',  publisher:'Chaukhamba', year:'2019', isbn:'978-81-7080-002-2', category:'Ayurved Samhita', copies:2, available:2, location:'Rack-A2' },
        { id:'b3', accNo:'ACC003', title:'Ashtanga Hridayam',        author:'Vagbhata',          publisher:'KM Academy', year:'2020', isbn:'978-81-7080-003-3', category:'Ayurved Samhita', copies:4, available:4, location:'Rack-A3' },
        { id:'b4', accNo:'ACC004', title:'Dravyaguna Vijnana',       author:'P.V. Sharma',       publisher:'Chaukhamba', year:'2017', isbn:'978-81-7080-004-4', category:'Dravyaguna',      copies:5, available:5, location:'Rack-B1' },
        { id:'b5', accNo:'ACC005', title:'Physiology & Biochemistry',author:'A.K. Jain',         publisher:'Avichal',    year:'2021', isbn:'978-81-7080-005-5', category:'Modern Science',  copies:6, available:6, location:'Rack-C1' },
        { id:'b6', accNo:'ACC006', title:'Kayachikitsa Vol 1',       author:'Yadavji Trikamji',  publisher:'Chaukhamba', year:'2019', isbn:'978-81-7080-006-6', category:'Kayachikitsa',    copies:3, available:3, location:'Rack-D1' },
      ];
      this.set(this.KEYS.LIBRARY, books);
    }

    // Notices
    if (this.get(this.KEYS.NOTICES).length === 0) {
      const notices = [
        { id:'n1', title:'Examination Schedule — 1st BAMS 2024-25',  content:'The examination for 1st BAMS students will commence from 15th April 2025.',   date:'2025-03-01', priority:'high',   postedBy:'Admin', targetRole:'all' },
        { id:'n2', title:'Fee Payment Reminder',                      content:'Last date for fee payment is 31st March 2025. Please clear all dues.',          date:'2025-03-05', priority:'medium', postedBy:'Admin', targetRole:'student' },
        { id:'n3', title:'Annual Cultural Festival — Dhanwantari Utsav', content:'Annual cultural program on 25th March 2025. All students must participate.', date:'2025-03-08', priority:'low',    postedBy:'Admin', targetRole:'all' },
      ];
      this.set(this.KEYS.NOTICES, notices);
    }

    console.log('✅ DAMC ERP: Default data seeded successfully');
  },

  // ─── Clear All Data ──────────────────────────────────────────────
  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    return true;
  }
};

// Auto-seed on first load
(function() {
  if (!localStorage.getItem('damc_initialized')) {
    DB.seedDefaultData();
    localStorage.setItem('damc_initialized', 'true');
  }
})();
