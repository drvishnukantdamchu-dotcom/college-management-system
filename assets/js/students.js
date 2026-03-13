/**
 * DAMC ERP — Students Module (Complete Fresh Version)
 * Dhanwantari Ayurved Medical College & Hospital, Udgir
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const STUDENTS = {

  state: {
    all:       [],
    filtered:  [],
    editingId: null,
    selected:  new Set()
  },

  // ──────────────────── INIT ──────────────────────────────────
  init() {
    try {
      this.seedDefaultData();
      this.loadAll();
      this.renderTable();
      this.updateStats();
      console.log('✅ Students module initialized');
    } catch (err) {
      console.error('❌ Students init error:', err);
    }
  },

  // ──────────────────── SEED DATA ─────────────────────────────
  seedDefaultData() {
    const existing = DB.getAll('students');
    if (existing && existing.length > 0) return;

    const sampleStudents = [
      { rollNo:'DAMC001', name:'Rahul Suresh Patil',    gender:'Male',   dob:'2000-05-15',
        year:'1st Year', course:'BAMS', batch:'2024-25', category:'OBC',
        phone:'9876543210', email:'rahul.patil@email.com',
        address:'Udgir, Latur', fatherName:'Suresh Patil', fatherPhone:'9876543211',
        motherName:'Sunita Patil', motherPhone:'9876543212',
        aadhar:'1234-5678-9012', bloodGroup:'B+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC002', name:'Priya Ramesh Sharma',   gender:'Female', dob:'2001-03-22',
        year:'2nd Year', course:'BAMS', batch:'2023-24', category:'General',
        phone:'9876543220', email:'priya.sharma@email.com',
        address:'Nanded', fatherName:'Ramesh Sharma', fatherPhone:'9876543221',
        motherName:'Geeta Sharma', motherPhone:'9876543222',
        aadhar:'9876-5432-1098', bloodGroup:'O+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC003', name:'Aakash Vijay Deshmukh', gender:'Male',   dob:'1999-11-08',
        year:'3rd Year', course:'BAMS', batch:'2022-23', category:'SC',
        phone:'9876543230', email:'aakash.d@email.com',
        address:'Latur', fatherName:'Vijay Deshmukh', fatherPhone:'9876543231',
        motherName:'Lata Deshmukh', motherPhone:'9876543232',
        aadhar:'1122-3344-5566', bloodGroup:'A+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC004', name:'Sneha Anand Kulkarni',  gender:'Female', dob:'2002-07-19',
        year:'1st Year', course:'BAMS', batch:'2024-25', category:'General',
        phone:'9876543240', email:'sneha.k@email.com',
        address:'Solapur', fatherName:'Anand Kulkarni', fatherPhone:'9876543241',
        motherName:'Rekha Kulkarni', motherPhone:'9876543242',
        aadhar:'2233-4455-6677', bloodGroup:'AB+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC005', name:'Mohammad Arif Khan',    gender:'Male',   dob:'2000-01-25',
        year:'2nd Year', course:'BAMS', batch:'2023-24', category:'OBC',
        phone:'9876543250', email:'arif.khan@email.com',
        address:'Osmanabad', fatherName:'Irfan Khan', fatherPhone:'9876543251',
        motherName:'Nafisa Khan', motherPhone:'9876543252',
        aadhar:'3344-5566-7788', bloodGroup:'B-', religion:'Islam', status:'Active' },

      { rollNo:'DAMC006', name:'Anjali Prakash Jadhav', gender:'Female', dob:'2001-09-14',
        year:'4th Year', course:'BAMS', batch:'2021-22', category:'NT',
        phone:'9876543260', email:'anjali.j@email.com',
        address:'Bidar', fatherName:'Prakash Jadhav', fatherPhone:'9876543261',
        motherName:'Vaishali Jadhav', motherPhone:'9876543262',
        aadhar:'4455-6677-8899', bloodGroup:'O-', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC007', name:'Suraj Baburao Mane',    gender:'Male',   dob:'1998-04-30',
        year:'Intern',   course:'BAMS', batch:'2020-21', category:'ST',
        phone:'9876543270', email:'suraj.mane@email.com',
        address:'Gulbarga', fatherName:'Baburao Mane', fatherPhone:'9876543271',
        motherName:'Savita Mane', motherPhone:'9876543272',
        aadhar:'5566-7788-9900', bloodGroup:'A-', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC008', name:'Pooja Sanjay Rao',      gender:'Female', dob:'2002-12-03',
        year:'1st Year', course:'BAMS', batch:'2024-25', category:'EWS',
        phone:'9876543280', email:'pooja.rao@email.com',
        address:'Hyderabad', fatherName:'Sanjay Rao', fatherPhone:'9876543281',
        motherName:'Meera Rao', motherPhone:'9876543282',
        aadhar:'6677-8899-0011', bloodGroup:'B+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC009', name:'Rohit Ganesh Shinde',   gender:'Male',   dob:'2000-08-17',
        year:'3rd Year', course:'BAMS', batch:'2022-23', category:'OBC',
        phone:'9876543290', email:'rohit.s@email.com',
        address:'Pune', fatherName:'Ganesh Shinde', fatherPhone:'9876543291',
        motherName:'Kamla Shinde', motherPhone:'9876543292',
        aadhar:'7788-9900-1122', bloodGroup:'AB-', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC010', name:'Kavita Dilip Pawar',    gender:'Female', dob:'2003-02-11',
        year:'1st Year', course:'BAMS', batch:'2024-25', category:'General',
        phone:'9876543300', email:'kavita.p@email.com',
        address:'Aurangabad', fatherName:'Dilip Pawar', fatherPhone:'9876543301',
        motherName:'Sushma Pawar', motherPhone:'9876543302',
        aadhar:'8899-0011-2233', bloodGroup:'O+', religion:'Hindu', status:'Active' },

      { rollNo:'DAMC011', name:'Nikhil Vitthal Kamble', gender:'Male',   dob:'1999-06-27',
        year:'4th Year', course:'BAMS', batch:'2021-22', category:'SC',
        phone:'9876543310', email:'nikhil.k@email.com',
        address:'Kolhapur', fatherName:'Vitthal Kamble', fatherPhone:'9876543311',
        motherName:'Laxmi Kamble', motherPhone:'9876543312',
        aadhar:'9900-1122-3344', bloodGroup:'A+', religion:'Buddhism', status:'Active' },

      { rollNo:'DAMC012', name:'Divya Rajesh Nair',     gender:'Female', dob:'2001-10-05',
        year:'2nd Year', course:'BAMS', batch:'2023-24', category:'General',
        phone:'9876543320', email:'divya.n@email.com',
        address:'Nagpur', fatherName:'Rajesh Nair', fatherPhone:'9876543321',
        motherName:'Gita Nair', motherPhone:'9876543322',
        aadhar:'0011-2233-4455', bloodGroup:'B+', religion:'Hindu', status:'Active' },
    ];

    sampleStudents.forEach(s => {
      DB.add('students', { ...s, id: DB.generateId(), createdAt: new Date().toISOString() });
    });
    console.log('✅ Student seed data added:', sampleStudents.length, 'students');
  },

  // ──────────────────── LOAD ──────────────────────────────────
  loadAll() {
    this.state.all      = DB.getAll('students') || [];
    this.state.filtered = [...this.state.all];
  },

  // ──────────────────── RENDER TABLE ──────────────────────────
  renderTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const list = this.state.filtered;

    if (!list.length) {
      tbody.innerHTML = `
        <tr><td colspan="9"
          style="text-align:center;padding:3rem;color:var(--text-muted)">
          <i class="fas fa-user-slash fa-2x"></i><br/><br/>
          No students found. Add students or clear filters.
        </td></tr>`;
      const rc = document.getElementById('recordCount');
      if (rc) rc.textContent = '(0 records)';
      return;
    }

    tbody.innerHTML = list.map((s, i) => {
      const initials = s.name
        ? s.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
        : '?';
      const statusClass =
        s.status === 'Active'   ? 'status-active'   :
        s.status === 'Alumni'   ? 'status-alumni'   : 'status-inactive';

      return `
        <tr>
          <td><input type="checkbox" class="row-chk" value="${s.id}"
            onchange="STUDENTS.toggleSelect('${s.id}',this.checked)"/></td>
          <td style="color:var(--text-muted);font-size:.8rem">${i + 1}</td>
          <td>
            <div class="student-name-cell">
              <div class="student-avatar">${initials}</div>
              <div>
                <div class="s-name">${s.name || '—'}</div>
                <div class="s-roll">${s.rollNo || '—'}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:600">${s.year || '—'}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">
              ${s.course || ''} ${s.batch ? '· '+s.batch : ''}
            </div>
          </td>
          <td>${s.phone || '—'}</td>
          <td>${s.category || '—'}</td>
          <td>
            <span style="background:rgba(248,150,30,.15);color:#f8961e;
              padding:.15rem .45rem;border-radius:8px;font-size:.75rem;font-weight:700">
              ${s.bloodGroup || '—'}
            </span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">${s.status || 'Active'}</span>
          </td>
          <td>
            <div class="action-group">
              <button class="btn-xs btn-primary"
                style="background:var(--primary);color:#fff"
                onclick="STUDENTS.viewProfile('${s.id}')"
                title="View Profile">👁️</button>
              <button class="btn-xs"
                style="background:rgba(248,150,30,.2);color:#f8961e"
                onclick="STUDENTS.openEdit('${s.id}')"
                title="Edit">✏️</button>
              <button class="btn-xs"
                style="background:rgba(239,68,68,.2);color:#dc2626"
                onclick="STUDENTS.deleteStudent('${s.id}')"
                title="Delete">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    const rc = document.getElementById('recordCount');
    if (rc) rc.textContent = `(${list.length} records)`;
  },

  // ──────────────────── STATS ─────────────────────────────────
  updateStats() {
    const all = this.state.all;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statTotal',         all.length);
    set('statActive',        all.filter(s => s.status === 'Active').length);
    set('statMale',          all.filter(s => s.gender === 'Male').length);
    set('statFemale',        all.filter(s => s.gender === 'Female').length);
    set('statNewAdmissions', all.filter(s => s.year === '1st Year').length);
  },

  // ──────────────────── FILTERS ───────────────────────────────
  applyFilters() {
    const search   = (document.getElementById('searchInput')?.value   || '').toLowerCase();
    const year     =  document.getElementById('filterYear')?.value     || '';
    const gender   =  document.getElementById('filterGender')?.value   || '';
    const category =  document.getElementById('filterCategory')?.value || '';
    const status   =  document.getElementById('filterStatus')?.value   || '';

    this.state.filtered = this.state.all.filter(s => {
      const matchSearch = !search ||
        (s.name   || '').toLowerCase().includes(search) ||
        (s.rollNo || '').toLowerCase().includes(search) ||
        (s.phone  || '').includes(search);
      return matchSearch &&
        (!year     || s.year     === year)     &&
        (!gender   || s.gender   === gender)   &&
        (!category || s.category === category) &&
        (!status   || s.status   === status);
    });

    this.renderTable();
  },

  clearFilters() {
    ['searchInput','filterYear','filterGender','filterCategory','filterStatus']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    this.state.filtered = [...this.state.all];
    this.renderTable();
  },

  // ──────────────────── ADD/EDIT MODAL ────────────────────────
  openAdd() {
    this.state.editingId = null;
    document.getElementById('studentModalTitle').textContent = '➕ Add New Student';
    this.resetForm();
    // Auto-generate roll number
    const all     = DB.getAll('students') || [];
    const nextNum = String(all.length + 1).padStart(3, '0');
    const el = document.getElementById('sRollNo');
    if (el) el.value = `DAMC${nextNum}`;
    document.getElementById('studentModal').style.display = 'flex';
  },

  openEdit(id) {
    const s = DB.getById('students', id);
    if (!s) { if(typeof APP!=='undefined') APP.showToast('Student not found!','error'); return; }
    this.state.editingId = id;
    document.getElementById('studentModalTitle').textContent = '✏️ Edit Student';

    const fields = {
      sName:'name', sRollNo:'rollNo', sGender:'gender', sDob:'dob',
      sBloodGroup:'bloodGroup', sAadhar:'aadhar', sYear:'year', sCourse:'course',
      sBatch:'batch', sCategory:'category', sReligion:'religion', sStatus:'status',
      sPhone:'phone', sEmail:'email', sAddress:'address',
      sFatherName:'fatherName', sFatherPhone:'fatherPhone',
      sMotherName:'motherName', sMotherPhone:'motherPhone'
    };
    Object.entries(fields).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) el.value = s[key] || '';
    });
    document.getElementById('studentModal').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('studentModal').style.display = 'none';
    this.state.editingId = null;
    this.resetForm();
  },

  resetForm() {
    const ids = ['sName','sRollNo','sGender','sDob','sBloodGroup','sAadhar',
                 'sYear','sCourse','sBatch','sCategory','sReligion','sStatus',
                 'sPhone','sEmail','sAddress',
                 'sFatherName','sFatherPhone','sMotherName','sMotherPhone'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'sCourse') el.value = 'BAMS';
      else if (id === 'sStatus') el.value = 'Active';
      else el.value = '';
    });
  },

  // ──────────────────── SAVE ──────────────────────────────────
  saveStudent() {
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

    const name   = get('sName');
    const rollNo = get('sRollNo');
    const gender = get('sGender');
    const year   = get('sYear');

    if (!name || !rollNo || !gender || !year) {
      if(typeof APP!=='undefined')
        APP.showToast('Name, Roll No, Gender आणि Year आवश्यक आहेत!','warning');
      return;
    }

    // Duplicate roll check
    const all = DB.getAll('students') || [];
    const dup = all.find(s => s.rollNo === rollNo && s.id !== this.state.editingId);
    if (dup) {
      if(typeof APP!=='undefined')
        APP.showToast(`⚠️ Roll No "${rollNo}" आधीच exists आहे!`,'error');
      return;
    }

    const data = {
      name, rollNo, gender,
      dob:          get('sDob'),
      bloodGroup:   get('sBloodGroup'),
      aadhar:       get('sAadhar'),
      year,
      course:       get('sCourse') || 'BAMS',
      batch:        get('sBatch'),
      category:     get('sCategory'),
      religion:     get('sReligion'),
      status:       get('sStatus') || 'Active',
      phone:        get('sPhone'),
      email:        get('sEmail'),
      address:      get('sAddress'),
      fatherName:   get('sFatherName'),
      fatherPhone:  get('sFatherPhone'),
      motherName:   get('sMotherName'),
      motherPhone:  get('sMotherPhone'),
      updatedAt:    new Date().toISOString()
    };

    if (this.state.editingId) {
      DB.update('students', this.state.editingId, data);
      if(typeof APP!=='undefined') APP.showToast('✅ Student updated successfully!','success');
    } else {
      data.createdAt = new Date().toISOString();
      DB.add('students', { ...data, id: DB.generateId() });
      if(typeof APP!=='undefined') APP.showToast('✅ Student added successfully!','success');
    }

    this.closeModal();
    this.loadAll();
    this.renderTable();
    this.updateStats();
  },

  // ──────────────────── DELETE ────────────────────────────────
  deleteStudent(id) {
    const s = DB.getById('students', id);
    if (!s) return;
    if (!confirm(`"${s.name}" ला delete करायचे आहे का?`)) return;
    DB.delete('students', id);
    if(typeof APP!=='undefined') APP.showToast('🗑️ Student deleted','info');
    this.loadAll();
    this.renderTable();
    this.updateStats();
  },

  // ──────────────────── VIEW PROFILE ──────────────────────────
  viewProfile(id) {
    const s = DB.getById('students', id);
    if (!s) return;
    const initials = s.name
      ? s.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
      : '?';
    const info = (label, value) => value
      ? `<tr>
           <td style="font-weight:600;color:var(--text-muted);padding:.35rem .5rem .35rem 0;
             font-size:.82rem;white-space:nowrap">${label}</td>
           <td style="font-size:.85rem;padding:.35rem 0">${value}</td>
         </tr>` : '';

    document.getElementById('profileContent').innerHTML = `
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="width:90px;height:90px;border-radius:50%;background:var(--primary);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:2.2rem;font-weight:700;margin:0 auto .75rem">
          ${initials}
        </div>
        <h3 style="margin:0">${s.name || '—'}</h3>
        <p style="color:var(--text-muted);margin:.25rem 0">${s.rollNo || ''} · ${s.course || ''} · ${s.year || ''}</p>
        <span style="background:rgba(34,197,94,.15);color:#16a34a;padding:.2rem .6rem;
          border-radius:12px;font-size:.8rem;font-weight:700">${s.status || 'Active'}</span>
      </div>
      <table style="width:100%;border-collapse:collapse" class="profile-info">
        ${info('📅 Date of Birth', s.dob)}
        ${info('🩸 Blood Group',   s.bloodGroup)}
        ${info('🆔 Aadhar',       s.aadhar)}
        ${info('📞 Phone',        s.phone)}
        ${info('📧 Email',        s.email)}
        ${info('🏠 Address',      s.address)}
        ${info('📚 Batch',        s.batch)}
        ${info('🏷️ Category',    s.category)}
        ${info('🛐 Religion',     s.religion)}
        ${info('👨 Father',       s.fatherName ? s.fatherName + (s.fatherPhone ? ' · '+s.fatherPhone : '') : '')}
        ${info('👩 Mother',       s.motherName ? s.motherName + (s.motherPhone ? ' · '+s.motherPhone : '') : '')}
      </table>`;

    const editBtn = document.getElementById('profileEditBtn');
    if (editBtn) {
      editBtn.onclick = () => {
        document.getElementById('profileModal').style.display = 'none';
        this.openEdit(id);
      };
    }
    document.getElementById('profileModal').style.display = 'flex';
  },

  // ──────────────────── SELECT / BULK ─────────────────────────
  toggleSelect(id, checked) {
    checked ? this.state.selected.add(id) : this.state.selected.delete(id);
  },

  toggleAll(checked) {
    document.querySelectorAll('.row-chk').forEach(chk => {
      chk.checked = checked;
      this.toggleSelect(chk.value, checked);
    });
  },

  selectAll() {
    document.getElementById('selectAllChk').checked = true;
    this.toggleAll(true);
  },

  bulkDelete() {
    const ids = [...this.state.selected];
    if (!ids.length) {
      if(typeof APP!=='undefined') APP.showToast('कोणताही student select केलेला नाही!','warning');
      return;
    }
    if (!confirm(`${ids.length} students delete करायचे आहेत का?`)) return;
    ids.forEach(id => DB.delete('students', id));
    this.state.selected.clear();
    if(typeof APP!=='undefined') APP.showToast(`🗑️ ${ids.length} students deleted`,'info');
    this.loadAll();
    this.renderTable();
    this.updateStats();
  },

  // ──────────────────── EXPORT CSV ────────────────────────────
  exportCSV() {
    const all = this.state.filtered;
    if (!all.length) {
      if(typeof APP!=='undefined') APP.showToast('Export करण्यासाठी data नाही!','warning');
      return;
    }
    const headers = ['Roll No','Name','Gender','DOB','Year','Course','Batch',
                     'Category','Phone','Email','Address','Father','Father Ph',
                     'Mother','Mother Ph','Aadhar','Blood','Religion','Status'];
    const rows = all.map(s => [
      s.rollNo, s.name, s.gender, s.dob, s.year, s.course, s.batch,
      s.category, s.phone, s.email, s.address,
      s.fatherName, s.fatherPhone, s.motherName, s.motherPhone,
      s.aadhar, s.bloodGroup, s.religion, s.status
    ]);
    const csv  = [headers, ...rows]
      .map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'DAMC_Students_Export.csv';
    a.click();
    if(typeof APP!=='undefined') APP.showToast('📥 Students CSV exported!','success');
  },

  // ──────────────────── IMPORT CSV ────────────────────────────
  importCSV() {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text  = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        if(typeof APP!=='undefined') APP.showToast('CSV file empty or invalid!','error');
        return;
      }
      let added = 0, skipped = 0, errors = [];
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(',').map(x => x.replace(/^"|"$/g,'').trim());
        const [rollNo,name,gender,,dob,year,course,batch,category,
               phone,email,address,fatherName,fatherPhone,
               motherName,motherPhone,aadhar,bloodGroup,religion,status] = c;
        if (!rollNo || !name) { skipped++; errors.push(`Row ${i+1}: Roll No or Name missing`); continue; }
        const dup = (DB.getAll('students')||[]).find(s => s.rollNo === rollNo);
        if (dup) { skipped++; errors.push(`Row ${i+1}: Roll No ${rollNo} already exists`); continue; }
        DB.add('students', {
          id:DB.generateId(), rollNo,name,gender,dob,year,course,batch,category,
          phone,email,address,fatherName,fatherPhone,motherName,motherPhone,
          aadhar,bloodGroup,religion, status:status||'Active',
          createdAt:new Date().toISOString()
        });
        added++;
      }
      if(typeof APP!=='undefined')
        APP.showToast(`✅ ${added} imported, ${skipped} skipped`,'success');
      if (errors.length) console.warn('Import issues:', errors);
      this.loadAll(); this.renderTable(); this.updateStats();
    };
    input.click();
  },

  // ──────────────────── DOWNLOAD TEMPLATE ─────────────────────
  downloadTemplate() {
    const rows = [
      ['rollNo','name','gender','dob','year','course','batch','category',
       'phone','email','address','fatherName','fatherPhone',
       'motherName','motherPhone','aadhar','bloodGroup','religion','status'],
      ['DAMC001','Rahul Suresh Patil','Male','2000-05-15','1st Year','BAMS','2024-25',
       'OBC','9876543210','rahul@email.com','Udgir, Latur',
       'Suresh Patil','9876543211','Sunita Patil','9876543212',
       '1234-5678-9012','B+','Hindu','Active'],
      ['DAMC002','Priya Ramesh Sharma','Female','2001-03-22','2nd Year','BAMS','2023-24',
       'General','9876543220','priya@email.com','Nanded',
       'Ramesh Sharma','9876543221','Geeta Sharma','9876543222',
       '9876-5432-1098','O+','Hindu','Active']
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'DAMC_Students_Template.csv';
    a.click();
    if(typeof APP!=='undefined') APP.showToast('📄 Students template downloaded!','success');
  }

};
