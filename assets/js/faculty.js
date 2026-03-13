/**
 * DAMC ERP — Faculty Management Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const FACULTY = {

  renderList(filter = {}) {
    let list = DB.get(DB.KEYS.FACULTY);
    if (filter.dept)       list = list.filter(f => f.department === filter.dept);
    if (filter.designation) list = list.filter(f => f.designation === filter.designation);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.empId?.toLowerCase().includes(q) ||
        f.phone?.includes(q)
      );
    }

    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty-state">
          <i class="fas fa-chalkboard-teacher"></i>
          <h4>No Faculty Found</h4>
        </div>
      </td></tr>`;
      document.getElementById('facultyCount').textContent = '0 Faculty';
      return;
    }

    document.getElementById('facultyCount').textContent =
      `${list.length} Faculty Member${list.length > 1 ? 's' : ''}`;

    tbody.innerHTML = list.map((f, i) => {
      const dept = DB.get(DB.KEYS.DEPARTMENTS)
        .find(d => d.id === f.department)?.name || f.department || '-';
      return `
        <tr class="animate-in" style="animation-delay:${i*0.03}s">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="user-avatar" style="width:38px;height:38px;
                font-size:0.8rem;flex-shrink:0;
                background:linear-gradient(135deg,var(--secondary),var(--secondary-light))">
                ${APP.Utils.getInitials(f.name)}
              </div>
              <div>
                <strong style="font-size:0.87rem">${f.name}</strong>
                <div style="font-size:0.72rem;color:var(--text-muted)">${f.email || '-'}</div>
              </div>
            </div>
          </td>
          <td class="text-primary text-bold">${f.empId || '-'}</td>
          <td>${f.designation || '-'}</td>
          <td style="font-size:0.82rem">${dept}</td>
          <td>${f.qualification || '-'}</td>
          <td>${f.phone || '-'}</td>
          <td>
            <span class="badge ${f.active ? 'badge-green':'badge-red'}">
              ${f.active ? '● Active' : '● Inactive'}
            </span>
          </td>
          <td>
            <div class="td-actions">
              <button class="btn btn-sm btn-primary"
                onclick="FACULTY.openForm('${f.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-outline"
                onclick="FACULTY.viewProfile('${f.id}')">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger"
                onclick="FACULTY.delete('${f.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.updateStats();
  },

  openForm(id = null) {
    const form  = document.getElementById('facultyForm');
    const title = document.getElementById('facultyModalTitle');
    form.reset();

    if (id) {
      const f = DB.findById(DB.KEYS.FACULTY, id);
      if (!f) return;
      title.innerHTML = '<i class="fas fa-edit"></i> Edit Faculty';
      const fields = {
        fName:'name', fEmpId:'empId', fDesignation:'designation',
        fDept:'department', fQualification:'qualification',
        fSpecialization:'specialization', fPhone:'phone',
        fEmail:'email', fDob:'dob', fJoinDate:'joinDate',
        fAddress:'address', fBlood:'blood', fActive:'active'
      };
      Object.entries(fields).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = f[key];
        else el.value = f[key] || '';
      });
      form.dataset.editId = id;
    } else {
      title.innerHTML = '<i class="fas fa-user-plus"></i> Add Faculty';
      delete form.dataset.editId;
      const empCount = DB.get(DB.KEYS.FACULTY).length + 1;
      document.getElementById('fEmpId').value =
        'DAMC/FAC/' + String(empCount).padStart(3,'0');
    }

    // Populate departments
    const deptSel = document.getElementById('fDept');
    deptSel.innerHTML = '<option value="">Select Department</option>';
    DB.get(DB.KEYS.DEPARTMENTS).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id; opt.textContent = d.name;
      deptSel.appendChild(opt);
    });

    document.getElementById('facultyModal').classList.remove('hidden');
  },

  save() {
    const form = document.getElementById('facultyForm');
    const name = document.getElementById('fName').value.trim();
    if (!name) { APP.toast('Name is required!', 'warning'); return; }

    const data = {
      name,
      empId:           document.getElementById('fEmpId').value.trim(),
      designation:     document.getElementById('fDesignation').value,
      department:      document.getElementById('fDept').value,
      qualification:   document.getElementById('fQualification').value.trim(),
      specialization:  document.getElementById('fSpecialization').value.trim(),
      phone:           document.getElementById('fPhone').value.trim(),
      email:           document.getElementById('fEmail').value.trim(),
      dob:             document.getElementById('fDob').value,
      joinDate:        document.getElementById('fJoinDate').value,
      address:         document.getElementById('fAddress').value.trim(),
      blood:           document.getElementById('fBlood').value,
      active:          document.getElementById('fActive').checked,
    };

    const editId = form.dataset.editId;
    if (editId) {
      DB.update(DB.KEYS.FACULTY, editId, data);
      APP.toast(`${name} updated!`, 'success');
    } else {
      DB.add(DB.KEYS.FACULTY, data);
      APP.toast(`${name} added!`, 'success');
    }

    AUTH.logActivity('FACULTY_SAVE', `Saved faculty: ${name}`);
    document.getElementById('facultyModal').classList.add('hidden');
    this.renderList(this._currentFilter || {});
  },

  delete(id) {
    const f = DB.findById(DB.KEYS.FACULTY, id);
    if (!f) return;
    APP.confirm(`Delete faculty <strong>${f.name}</strong>?`, () => {
      DB.delete(DB.KEYS.FACULTY, id);
      APP.toast(`${f.name} deleted!`, 'success');
      this.renderList(this._currentFilter || {});
    });
  },

  viewProfile(id) {
    const f = DB.findById(DB.KEYS.FACULTY, id);
    if (!f) return;
    const dept = DB.get(DB.KEYS.DEPARTMENTS)
      .find(d => d.id === f.department)?.name || '-';

    document.getElementById('viewFacultyBody').innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:20px;
        padding-bottom:20px;border-bottom:1px solid var(--border);margin-bottom:20px">
        <div style="width:80px;height:80px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,var(--secondary),var(--secondary-light));
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:800;font-size:1.8rem;
          border:3px solid var(--secondary)">
          ${APP.Utils.getInitials(f.name)}
        </div>
        <div>
          <h2 style="font-size:1.3rem;font-weight:700">${f.name}</h2>
          <p style="color:var(--secondary);font-weight:600">${f.empId || '-'}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <span class="badge badge-blue">${f.designation || '-'}</span>
            <span class="badge badge-purple">${dept}</span>
            <span class="badge ${f.active?'badge-green':'badge-red'}">
              ${f.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      <div class="form-grid-2">
        ${[
          ['Qualification', f.qualification],
          ['Specialization', f.specialization],
          ['Phone', f.phone],
          ['Email', f.email],
          ['Date of Birth', APP.Utils.formatDate(f.dob)],
          ['Join Date', APP.Utils.formatDate(f.joinDate)],
          ['Blood Group', f.blood],
          ['Address', f.address],
        ].map(([label, value]) => `
          <div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">${label}</div>
            <div style="font-size:0.88rem;font-weight:500;margin-top:2px">${value || '-'}</div>
          </div>
        `).join('')}
      </div>
    `;
    document.getElementById('viewFacultyModal').classList.remove('hidden');
  },

  updateStats() {
    const list = DB.get(DB.KEYS.FACULTY);
    const el   = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
    el('facStatTotal',   list.length);
    el('facStatActive',  list.filter(f => f.active).length);
    el('facStatMale',    list.filter(f => f.gender === 'Male').length);
    el('facStatFemale',  list.filter(f => f.gender === 'Female').length);
  },

  exportCSV() {
    const list = DB.get(DB.KEYS.FACULTY);
    BACKUP.exportCSV(list,
      `DAMC_Faculty_${new Date().toISOString().split('T')[0]}`,
      ['empId','name','designation','qualification','specialization','phone','email','joinDate']
    );
    APP.toast('Faculty exported!', 'success');
  },

  _currentFilter: {}
};
