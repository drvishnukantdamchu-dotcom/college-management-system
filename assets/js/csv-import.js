/**
 * DAMC ERP — CSV Import/Export Utility
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const CSV_IMPORT = {

  // ── Template definitions ──────────────────────────────────────
  templates: {
    students: {
      filename: 'DAMC_Students_Template.csv',
      headers: ['rollNo','name','gender','dob','category','religion',
                'year','course','batch','phone','email','address',
                'fatherName','fatherPhone','motherName','motherPhone',
                'aadhar','bloodGroup','status'],
      sample: [
        ['DAMC001','Rahul Patil','Male','2000-05-15','OBC','Hindu',
         '1st Year','BAMS','2024-25','9876543210','rahul@email.com',
         'Udgir, Latur','Suresh Patil','9876543211','Sunita Patil','9876543212',
         '1234-5678-9012','B+','Active'],
        ['DAMC002','Priya Sharma','Female','2001-03-22','General','Hindu',
         '2nd Year','BAMS','2023-24','9876543220','priya@email.com',
         'Nanded','Ramesh Sharma','9876543221','Geeta Sharma','9876543222',
         '9876-5432-1098','O+','Active']
      ]
    },
    faculty: {
      filename: 'DAMC_Faculty_Template.csv',
      headers: ['empId','name','gender','dob','department','designation',
                'qualification','phone','email','joiningDate','salary','status'],
      sample: [
        ['FAC001','Dr. Anjali Desai','Female','1985-08-10','Anatomy','Assistant Professor',
         'MD (Anatomy)','9876543300','anjali@damc.edu.in','2018-07-01','75000','Active'],
        ['FAC002','Dr. Ravi Kulkarni','Male','1980-12-05','Physiology','Associate Professor',
         'MD (Physiology)','9876543301','ravi@damc.edu.in','2015-06-01','90000','Active']
      ]
    },
    attendance: {
      filename: 'DAMC_Attendance_Template.csv',
      headers: ['date','rollNo','studentName','year','subject','session','status'],
      sample: [
        ['2025-01-15','DAMC001','Rahul Patil','1st Year','Anatomy','Morning','Present'],
        ['2025-01-15','DAMC002','Priya Sharma','1st Year','Anatomy','Morning','Absent']
      ]
    },
    fees: {
      filename: 'DAMC_Fees_Template.csv',
      headers: ['rollNo','studentName','year','feeType','amount','dueDate',
                'paymentDate','paymentMode','transactionId','status'],
      sample: [
        ['DAMC001','Rahul Patil','1st Year','Tuition Fee','50000','2025-04-30',
         '2025-04-10','Online','TXN123456','Paid'],
        ['DAMC002','Priya Sharma','2nd Year','Hostel Fee','30000','2025-04-30',
         '','','','Pending']
      ]
    },
    library: {
      filename: 'DAMC_Library_Template.csv',
      headers: ['accessionNo','title','author','subject','publisher',
                'year','edition','isbn','copies','location'],
      sample: [
        ['LIB001','Gray\'s Anatomy','Henry Gray','Anatomy','Elsevier',
         '2020','42nd','978-0-7020-7707-4','3','Shelf A-1'],
        ['LIB002','Guyton Physiology','Arthur Guyton','Physiology','Elsevier',
         '2021','14th','978-0-323-59712-8','2','Shelf B-1']
      ]
    },
    timetable: {
      filename: 'DAMC_Timetable_Template.csv',
      headers: ['year','day','slot','subject','faculty','room','type'],
      sample: [
        ['1st Year','Monday','08:00-09:00','Anatomy','Dr. Sharma','Room 101','Theory'],
        ['1st Year','Monday','09:00-10:00','Physiology','Dr. Patil','Room 102','Theory'],
        ['1st Year','Tuesday','08:00-09:00','Anatomy Lab','Dr. Sharma','Lab 1','Practical']
      ]
    }
  },

  // ── Download Template ─────────────────────────────────────────
  downloadTemplate(module) {
    const tpl = this.templates[module];
    if (!tpl) { alert('Template not found for: ' + module); return; }
    const rows = [tpl.headers, ...tpl.sample];
    const csv = rows.map(r =>
      r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tpl.filename;
    a.click();
    APP.showToast(`📥 ${module} template downloaded!`, 'success');
  },

  // ── Parse CSV string ──────────────────────────────────────────
  parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const row = [];
      let cell = '', inQuotes = false;
      for (let j = 0; j < lines[i].length; j++) {
        const ch = lines[i][j];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { row.push(cell.trim()); cell = ''; }
        else { cell += ch; }
      }
      row.push(cell.trim());
      result.push(row);
    }
    return result;
  },

  // ── Import CSV for any module ─────────────────────────────────
  importCSV(module, text) {
    const rows   = this.parseCSV(text);
    if (rows.length < 2) {
      APP.showToast('CSV file empty or invalid format!', 'error'); return { success:0, errors:[] };
    }
    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,''));
    const tplH    = this.templates[module]?.headers || [];
    const success = [], errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(c => !c)) continue; // skip empty rows
      const obj = {};
      tplH.forEach((key, idx) => { obj[key] = row[idx] || ''; });
      obj.id = DB.generateId();
      obj.createdAt = new Date().toISOString();

      // Module-specific validation
      const err = this.validate(module, obj, i + 1);
      if (err) { errors.push(err); continue; }

      // Duplicate check for students
      if (module === 'students') {
        const existing = DB.getAll('students').find(s => s.rollNo === obj.rollNo);
        if (existing) { errors.push(`Row ${i+1}: Roll No ${obj.rollNo} already exists`); continue; }
      }

      DB.add(module, obj);
      success.push(obj);
    }

    const msg = `✅ ${success.length} records imported` +
                (errors.length ? `, ⚠️ ${errors.length} skipped` : '');
    APP.showToast(msg, success.length ? 'success' : 'warning');
    return { success: success.length, errors };
  },

  validate(module, obj, rowNum) {
    if (module === 'students') {
      if (!obj.rollNo) return `Row ${rowNum}: Roll No missing`;
      if (!obj.name)   return `Row ${rowNum}: Name missing`;
    }
    if (module === 'faculty') {
      if (!obj.empId) return `Row ${rowNum}: Employee ID missing`;
      if (!obj.name)  return `Row ${rowNum}: Name missing`;
    }
    if (module === 'timetable') {
      if (!obj.year || !obj.day || !obj.slot || !obj.subject)
        return `Row ${rowNum}: Year/Day/Slot/Subject required`;
    }
    return null;
  },

  // ── Open file-picker and import ───────────────────────────────
  openImportDialog(module) {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const result = this.importCSV(module, text);
      // Refresh page-specific renderer
      if (module === 'students'   && typeof STUDENTS   !== 'undefined') STUDENTS.init();
      if (module === 'faculty'    && typeof FACULTY     !== 'undefined') FACULTY.init();
      if (module === 'timetable'  && typeof TIMETABLE   !== 'undefined') TIMETABLE.init();
      if (module === 'library'    && typeof LIBRARY     !== 'undefined') LIBRARY.init();
      if (module === 'fees'       && typeof FEES         !== 'undefined') FEES.init();
      if (result.errors.length) {
        console.table(result.errors);
        alert('Import Errors:\n' + result.errors.join('\n'));
      }
    };
    input.click();
  }
};
