/**
 * DAMC ERP — Student Management Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 * Dhanwantari Ayurved Medical College & Hospital, Udgir
 */

const STUDENTS = {

  // ── Render Student List ──────────────────────────────────────
  renderList(filter = {}) {
    let list = DB.get(DB.KEYS.STUDENTS);

    // Apply filters
    if (filter.year)   list = list.filter(s => s.year   === filter.year);
    if (filter.gender) list = list.filter(s => s.gender === filter.gender);
    if (filter.batch)  list = list.filter(s => s.batch  === filter.batch);
    if (filter.category) list = list.filter(s => s.category === filter.category);
    if (filter.active !== undefined) list = list.filter(s => s.active === filter.active);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q)   ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.phone?.includes(q)                ||
        s.email?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `
        <tr><td colspan="9">
          <div class="empty-state">
            <i class="fas fa-user-graduate"></i>
            <h4>No Students Found</h4>
            <p>Try adjusting your filters or add a new student.</p>
          </div>
        </td></tr>`;
      document.getElementById('studentCount').textContent = '0 Students';
      return;
    }

    document.getElementById('studentCount').textContent =
      `${list.length} Student${list.length > 1 ? 's' : ''}`;

    tbody.innerHTML = list.map((s, i) => `
      <tr class="animate-in" style="animation-delay:${i * 0.03}s">
        <td>
          <input type="checkbox" class="student-check" value="${s.id}"
            onchange="STUDENTS.toggleSelect('${s.id}')"/>
        </td>
        <td>
          <div class="student-avatar-wrap">
            ${s.photo
              ? `<img src="${s.photo}" class="student-photo" alt="${s.name}"/>`
              : `<div class="student-avatar">${APP.Utils.getInitials(s.name)}</div>`
            }
          </div>
        </td>
        <td>
          <div class="student-name-cell">
            <strong>${s.name}</strong>
            <small>${s.email || '-'}</small>
          </div>
        </td>
        <td><span class="text-primary text-bold">${s.rollNo}</span></td>
        <td><span class="badge badge-blue">${s.year} Year</span></td>
        <td>${s.phone || '-'}</td>
        <td>
          <span class="badge ${
            s.category === 'Open' ? 'badge-blue' :
            s.category === 'OBC'  ? 'badge-orange' :
            s.category === 'SC'   ? 'badge-purple' :
            s.category === 'ST'   ? 'badge-green' : 'badge-gray'
          }">${s.category || '-'}</span>
        </td>
        <td>
          <span class="badge ${s.active ? 'badge-green' : 'badge-red'}">
            ${s.active ? '● Active' : '● Inactive'}
          </span>
        </td>
        <td>
          <div class="td-actions">
            <button class="btn btn-sm btn-outline" title="View"
              onclick="STUDENTS.viewStudent('${s.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-primary" title="Edit"
              onclick="STUDENTS.openForm('${s.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" title="Delete"
              onclick="STUDENTS.deleteStudent('${s.id}')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-outline" title="ID Card"
              onclick="STUDENTS.printIDCard('${s.id}')">
              <i class="fas fa-id-card"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ── Open Add/Edit Form ───────────────────────────────────────
  openForm(id = null) {
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('studentModalTitle');
    const form  = document.getElementById('studentForm');
    form.reset();
    document.getElementById('photoPreview').innerHTML =
      '<i class="fas fa-user" style="font-size:2rem;color:var(--text-muted)"></i>';

    if (id) {
      const s = DB.findById(DB.KEYS.STUDENTS, id);
      if (!s) return;
      title.innerHTML = '<i class="fas fa-edit"></i> Edit Student';
      this._fillForm(s);
      form.dataset.editId = id;
    } else {
      title.innerHTML = '<i class="fas fa-user-plus"></i> Add New Student';
      delete form.dataset.editId;
      // Auto-generate roll number
      const students = DB.get(DB.KEYS.STUDENTS);
      const next = students.length + 1;
      const yr   = new Date().getFullYear().toString().substr(-2);
      document.getElementById('sRollNo').value = `BAMS${yr}${String(next).padStart(3,'0')}`;
    }
    modal.classList.remove('hidden');
  },

  // ── Fill Form for Edit ───────────────────────────────────────
  _fillForm(s) {
    const fields = [
      'sName','sRollNo','sGender','sDob','sPhone','sEmail',
      'sYear','sBatch','sCategory','sDept','sBlood','sAddress',
      'sGuardianName','sGuardianPhone','sAdmissionDate','sAadhaar','sActive'
    ];
    const map = {
      sName:'name', sRollNo:'rollNo', sGender:'gender', sDob:'dob',
      sPhone:'phone', sEmail:'email', sYear:'year', sBatch:'batch',
      sCategory:'category', sDept:'department', sBlood:'blood',
      sAddress:'address', sGuardianName:'guardianName',
      sGuardianPhone:'guardianPhone', sAdmissionDate:'admissionDate',
      sAadhaar:'aadhaar', sActive:'active'
    };
    fields.forEach(f => {
      const el = document.getElementById(f);
      if (!el) return;
      const key = map[f];
      if (el.type === 'checkbox') el.checked = s[key];
      else el.value = s[key] || '';
    });
    if (s.photo) {
      document.getElementById('photoPreview').innerHTML =
        `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    }
  },

  // ── Save Student ─────────────────────────────────────────────
  saveStudent() {
    const form = document.getElementById('studentForm');
    const name = document.getElementById('sName').value.trim();
    const rollNo = document.getElementById('sRollNo').value.trim();
    const year   = document.getElementById('sYear').value;

    if (!name || !rollNo || !year) {
      APP.toast('Please fill all required fields!', 'warning');
      return;
    }

    const data = {
      name,
      rollNo,
      gender:         document.getElementById('sGender').value,
      dob:            document.getElementById('sDob').value,
      phone:          document.getElementById('sPhone').value.trim(),
      email:          document.getElementById('sEmail').value.trim(),
      year,
      batch:          document.getElementById('sBatch').value,
      category:       document.getElementById('sCategory').value,
      department:     document.getElementById('sDept').value,
      blood:          document.getElementById('sBlood').value,
      address:        document.getElementById('sAddress').value.trim(),
      guardianName:   document.getElementById('sGuardianName').value.trim(),
      guardianPhone:  document.getElementById('sGuardianPhone').value.trim(),
      admissionDate:  document.getElementById('sAdmissionDate').value,
      aadhaar:        document.getElementById('sAadhaar').value.trim(),
      active:         document.getElementById('sActive').checked,
      photo:          this._currentPhoto || null,
    };

    const editId = form.dataset.editId;
    if (editId) {
      DB.update(DB.KEYS.STUDENTS, editId, data);
      APP.toast(`${name} updated successfully!`, 'success');
      AUTH.logActivity('STUDENT_UPDATE', `Updated student: ${name}`);
    } else {
      // Check duplicate roll number
      const exists = DB.get(DB.KEYS.STUDENTS).find(s => s.rollNo === rollNo);
      if (exists) { APP.toast('Roll number already exists!', 'error'); return; }
      DB.add(DB.KEYS.STUDENTS, data);
      APP.toast(`${name} added successfully!`, 'success');
      AUTH.logActivity('STUDENT_ADD', `Added student: ${name}`);
    }

    this._currentPhoto = null;
    document.getElementById('studentModal').classList.add('hidden');
    this.renderList(this._currentFilter || {});
    this.updateStats();
  },

  // ── Delete Student ───────────────────────────────────────────
  deleteStudent(id) {
    const s = DB.findById(DB.KEYS.STUDENTS, id);
    if (!s) return;
    APP.confirm(
      `Delete student <strong>${s.name}</strong> (${s.rollNo})?<br/>
       <span style="color:var(--danger);font-size:0.82rem">
         This will also remove attendance & fee records.
       </span>`,
      () => {
        DB.delete(DB.KEYS.STUDENTS, id);
        APP.toast(`${s.name} deleted!`, 'success');
        AUTH.logActivity('STUDENT_DELETE', `Deleted: ${s.name}`);
        this.renderList(this._currentFilter || {});
        this.updateStats();
      }
    );
  },

  // ── View Student Profile ─────────────────────────────────────
  viewStudent(id) {
    const s = DB.findById(DB.KEYS.STUDENTS, id);
    if (!s) return;
    const depts = DB.get(DB.KEYS.DEPARTMENTS);
    const dept  = depts.find(d => d.id === s.department)?.name || s.department;

    // Attendance summary
    const attRecords = DB.get(DB.KEYS.ATTENDANCE)
      .filter(a => a.studentId === id);
    const present = attRecords.filter(a => a.status === 'present').length;
    const attPct  = attRecords.length
      ? Math.round((present / attRecords.length) * 100) : 0;

    // Fee summary
    const feeRecords = DB.get(DB.KEYS.FEES).filter(f => f.studentId === id);
    const totalPaid  = feeRecords.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
    const totalDue   = feeRecords.reduce((sum, f) => sum + (f.amountDue  || 0), 0);

    document.getElementById('viewModalBody').innerHTML = `
      <div class="student-profile">
        <div class="profile-header">
          <div class="profile-photo-lg">
            ${s.photo
              ? `<img src="${s.photo}" alt="${s.name}"/>`
              : `<div class="profile-avatar-lg">${APP.Utils.getInitials(s.name)}</div>`
            }
          </div>
          <div class="profile-head-info">
            <h2>${s.name}</h2>
            <p class="roll">${s.rollNo}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
              <span class="badge badge-blue">${s.year} Year BAMS</span>
              <span class="badge badge-orange">${s.batch || '-'}</span>
              <span class="badge ${s.active ? 'badge-green':'badge-red'}">${s.active?'Active':'Inactive'}</span>
              <span class="badge badge-purple">${s.category}</span>
            </div>
          </div>
        </div>

        <div class="profile-stats-row">
          <div class="profile-stat">
            <i class="fas fa-calendar-check" style="color:var(--primary)"></i>
            <div>
              <strong>${attPct}%</strong>
              <span>Attendance</span>
            </div>
          </div>
          <div class="profile-stat">
            <i class="fas fa-rupee-sign" style="color:var(--warning)"></i>
            <div>
              <strong>${APP.Utils.formatCurrency(totalPaid)}</strong>
              <span>Fee Paid</span>
            </div>
          </div>
          <div class="profile-stat">
            <i class="fas fa-exclamation-circle" style="color:var(--danger)"></i>
            <div>
              <strong>${APP.Utils.formatCurrency(totalDue)}</strong>
              <span>Fee Due</span>
            </div>
          </div>
          <div class="profile-stat">
            <i class="fas fa-book" style="color:var(--secondary)"></i>
            <div>
              <strong>${DB.get(DB.KEYS.LIB_ISSUES).filter(i=>i.studentId===id&&!i.returnDate).length}</strong>
              <span>Books Issued</span>
            </div>
          </div>
        </div>

        <div class="form-grid-2" style="margin-top:20px">
          ${this._profileRow('Gender',   s.gender)}
          ${this._profileRow('Date of Birth', APP.Utils.formatDate(s.dob) + (s.dob ? ` (Age: ${APP.Utils.calculateAge(s.dob)})` : ''))}
          ${this._profileRow('Phone',    s.phone)}
          ${this._profileRow('Email',    s.email)}
          ${this._profileRow('Department', dept)}
          ${this._profileRow('Blood Group', s.blood)}
          ${this._profileRow('Aadhaar', s.aadhaar ? `••••${s.aadhaar.slice(-4)}` : '-')}
          ${this._profileRow('Admission Date', APP.Utils.formatDate(s.admissionDate))}
          ${this._profileRow('Address',  s.address, true)}
          ${this._profileRow('Guardian', `${s.guardianName || '-'} | ${s.guardianPhone || '-'}`, true)}
        </div>

        <div class="attendance-bar-section">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:0.85rem;font-weight:500">Attendance: ${present}/${attRecords.length} classes</span>
            <span style="font-weight:700;color:${attPct>=75?'var(--success)':attPct>=60?'var(--warning)':'var(--danger)'}">${attPct}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${attPct>=75?'green':attPct>=60?'orange':'red'}"
              style="width:${attPct}%"></div>
          </div>
          ${attPct < 75 ? '<p style="font-size:0.78rem;color:var(--danger);margin-top:6px">⚠️ Below 75% — Attendance shortage!</p>' : ''}
        </div>
      </div>
    `;
    document.getElementById('viewStudentModal').classList.remove('hidden');
    document.getElementById('viewStudentId').value = id;
  },

  _profileRow(label, value, full = false) {
    return `
      <div ${full ? 'style="grid-column:1/-1"' : ''} class="profile-info-row">
        <span class="profile-label">${label}</span>
        <span class="profile-value">${value || '-'}</span>
      </div>`;
  },

  // ── Print ID Card ────────────────────────────────────────────
  printIDCard(id) {
    const s = DB.findById(DB.KEYS.STUDENTS, id);
    if (!s) return;
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>ID Card — ${s.name}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5}
        .card{width:320px;background:white;border-radius:12px;overflow:hidden;
          box-shadow:0 4px 16px rgba(0,0,0,0.1);margin:auto}
        .card-top{background:linear-gradient(135deg,#1a6b3c,#1a237e);
          padding:16px;text-align:center;color:white}
        .card-top h3{font-size:0.75rem;line-height:1.4;margin:0}
        .card-top p{font-size:0.65rem;opacity:0.8;margin:2px 0 0}
        .card-body{padding:16px;text-align:center}
        .photo{width:80px;height:80px;border-radius:50%;
          border:3px solid #1a6b3c;margin:0 auto 12px;
          background:#e8f5e9;display:flex;align-items:center;
          justify-content:center;font-size:1.8rem;color:#1a6b3c;font-weight:bold}
        .photo img{width:100%;height:100%;object-fit:cover;border-radius:50%}
        .name{font-size:1.1rem;font-weight:700;color:#0f172a}
        .roll{font-size:0.75rem;color:#64748b;margin:2px 0 8px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;
          gap:6px;text-align:left;font-size:0.72rem}
        .info-item label{color:#64748b;display:block}
        .info-item span{color:#0f172a;font-weight:600}
        .card-footer{background:#f8fafc;padding:10px 16px;
          text-align:center;border-top:1px solid #e2e8f0}
        .card-footer p{font-size:0.65rem;color:#94a3b8;margin:0}
        .badge-yr{display:inline-block;background:#dbeafe;color:#1d4ed8;
          padding:2px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;margin-bottom:8px}
        .barcode{font-size:0.6rem;color:#64748b;margin-top:6px;
          font-family:monospace;letter-spacing:3px}
      </style>
      </head><body onload="window.print()">
      <div class="card">
        <div class="card-top">
          <h3>Dhanwantari Ayurved Medical College & Hospital</h3>
          <p>Udgir – 413517 | damchudgir.edu.in</p>
        </div>
        <div class="card-body">
          <div class="photo">
            ${s.photo ? `<img src="${s.photo}"/>` : APP.Utils.getInitials(s.name)}
          </div>
          <div class="name">${s.name}</div>
          <div class="roll">${s.rollNo}</div>
          <div class="badge-yr">${s.year} Year — BAMS</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Batch</label><span>${s.batch || '-'}</span>
            </div>
            <div class="info-item">
              <label>Category</label><span>${s.category || '-'}</span>
            </div>
            <div class="info-item">
              <label>Blood</label><span>${s.blood || '-'}</span>
            </div>
            <div class="info-item">
              <label>Phone</label><span>${s.phone || '-'}</span>
            </div>
          </div>
          <div class="barcode">|||||||  ${s.rollNo}  |||||||</div>
        </div>
        <div class="card-footer">
          <p>Valid for Academic Year ${s.batch || new Date().getFullYear()}</p>
          <p>Affiliated: MUHS Nashik | Approved: CCIM & AYUSH</p>
        </div>
      </div>
      </body></html>
    `);
    w.document.close();
  },

  // ── Bulk Actions ─────────────────────────────────────────────
  selectedIds: new Set(),
  toggleSelect(id) {
    this.selectedIds.has(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
    document.getElementById('bulkCount').textContent =
      this.selectedIds.size > 0
        ? `${this.selectedIds.size} selected`
        : '';
    document.getElementById('bulkActions').style.display =
      this.selectedIds.size > 0 ? 'flex' : 'none';
  },
  selectAll(cb) {
    this.selectedIds.clear();
    document.querySelectorAll('.student-check').forEach(c => {
      c.checked = cb.checked;
      if (cb.checked) this.selectedIds.add(c.value);
    });
    document.getElementById('bulkCount').textContent =
      cb.checked ? `${this.selectedIds.size} selected` : '';
    document.getElementById('bulkActions').style.display =
      cb.checked && this.selectedIds.size > 0 ? 'flex' : 'none';
  },
  bulkDelete() {
    if (!this.selectedIds.size) return;
    APP.confirm(
      `Delete <strong>${this.selectedIds.size}</strong> selected students?`,
      () => {
        this.selectedIds.forEach(id => DB.delete(DB.KEYS.STUDENTS, id));
        APP.toast(`${this.selectedIds.size} students deleted!`, 'success');
        this.selectedIds.clear();
        this.renderList(this._currentFilter || {});
        this.updateStats();
      }
    );
  },
  exportCSV() {
    const list = DB.get(DB.KEYS.STUDENTS);
    const rows = list.map(s => ({
      rollno: s.rollNo, name: s.name, gender: s.gender,
      dob: s.dob, year: s.year, batch: s.batch,
      category: s.category, phone: s.phone, email: s.email,
      address: s.address, guardianname: s.guardianName,
      guardianphone: s.guardianPhone, admissiondate: s.admissionDate,
      blood: s.blood, active: s.active ? 'Yes' : 'No'
    }));
    BACKUP.exportCSV(rows, 'DAMC_Students_' + new Date().toISOString().split('T')[0],
      ['rollno','name','gender','dob','year','batch','category',
       'phone','email','address','guardianname','guardianphone',
       'admissiondate','blood','active']
    );
    APP.toast('Students exported to CSV!', 'success');
  },

  // ── Update Stats ─────────────────────────────────────────────
  updateStats() {
    const list = DB.get(DB.KEYS.STUDENTS);
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('statTotal',    list.length);
    el('statMale',     list.filter(s => s.gender === 'Male').length);
    el('statFemale',   list.filter(s => s.gender === 'Female').length);
    el('statActive',   list.filter(s => s.active).length);
    el('stat1st',      list.filter(s => s.year === '1st').length);
    el('stat2nd',      list.filter(s => s.year === '2nd').length);
    el('stat3rd',      list.filter(s => s.year === '3rd').length);
    el('stat4th',      list.filter(s => s.year === '4th').length);
  },

  // ── Photo Upload ─────────────────────────────────────────────
  _currentPhoto: null,
  handlePhotoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      APP.toast('Photo must be less than 500KB!', 'warning'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this._currentPhoto = e.target.result;
      document.getElementById('photoPreview').innerHTML =
        `<img src="${e.target.result}"
          style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    };
    reader.readAsDataURL(file);
  },

  _currentFilter: {}
};
