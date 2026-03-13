/**
 * DAMC ERP — Timetable Module (Complete Fresh Version)
 * Dhanwantari Ayurved Medical College & Hospital, Udgir
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 */

const TIMETABLE = {

  state: {
    currentYear: '1st Year',
    currentDay: 'Monday',
    editingId: null,
    years: ['1st Year','2nd Year','3rd Year','4th Year','Intern'],
    days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    slots: [
      '07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00',
      '11:00-12:00','12:00-13:00','13:00-14:00','14:00-15:00',
      '15:00-16:00','16:00-17:00'
    ],
    types: ['Theory','Practical','Tutorial','Seminar','Clinical','Break','Sports']
  },

  typeColors: {
    'Theory'   : '#4361ee',
    'Practical': '#7209b7',
    'Tutorial' : '#4cc9f0',
    'Seminar'  : '#f8961e',
    'Clinical' : '#43aa8b',
    'Break'    : '#f72585',
    'Sports'   : '#ff6b35'
  },

  // ─────────────────────────── INIT ───────────────────────────
  init() {
    try {
      this.seedDefaultData();
      this.renderYearTabs();
      this.renderDayTabs();
      this.renderGrid();
      this.renderWeeklyView();
      this.renderStats();
      console.log('✅ Timetable initialized successfully');
    } catch (err) {
      console.error('❌ Timetable init error:', err);
      this.showError('Timetable लोड होताना error आली. Page refresh करा.');
    }
  },

  // ──────────────────────── SEED DATA ─────────────────────────
  seedDefaultData() {
    const existing = DB.getAll('timetable');
    if (existing && existing.length > 0) return;

    const seedData = [
      // 1st Year - Monday
      { year:'1st Year', day:'Monday',    slot:'08:00-09:00', subject:'Rachana Sharir (Anatomy)',    faculty:'Dr. A. Sharma',    room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Monday',    slot:'09:00-10:00', subject:'Kriya Sharir (Physiology)',   faculty:'Dr. B. Patil',     room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Monday',    slot:'10:00-11:00', subject:'Maulik Siddhant',             faculty:'Dr. C. Kulkarni',  room:'LH-102', type:'Theory'    },
      { year:'1st Year', day:'Monday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'1st Year', day:'Monday',    slot:'12:00-13:00', subject:'Rachana Sharir Lab',          faculty:'Dr. A. Sharma',    room:'Lab-1',  type:'Practical' },
      { year:'1st Year', day:'Monday',    slot:'13:00-14:00', subject:'Kriya Sharir Lab',            faculty:'Dr. B. Patil',     room:'Lab-2',  type:'Practical' },
      // 1st Year - Tuesday
      { year:'1st Year', day:'Tuesday',   slot:'08:00-09:00', subject:'Sanskrit',                    faculty:'Dr. D. Joshi',     room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Tuesday',   slot:'09:00-10:00', subject:'Rachana Sharir (Anatomy)',    faculty:'Dr. A. Sharma',    room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Tuesday',   slot:'10:00-11:00', subject:'Padarth Vigyan',              faculty:'Dr. E. Desai',     room:'LH-102', type:'Theory'    },
      { year:'1st Year', day:'Tuesday',   slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'1st Year', day:'Tuesday',   slot:'12:00-13:00', subject:'Maulik Siddhant Tutorial',   faculty:'Dr. C. Kulkarni',  room:'Sem-1',  type:'Tutorial'  },
      // 1st Year - Wednesday
      { year:'1st Year', day:'Wednesday', slot:'08:00-09:00', subject:'Kriya Sharir (Physiology)',   faculty:'Dr. B. Patil',     room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Wednesday', slot:'09:00-10:00', subject:'Maulik Siddhant',             faculty:'Dr. C. Kulkarni',  room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Wednesday', slot:'10:00-11:00', subject:'Sanskrit',                    faculty:'Dr. D. Joshi',     room:'LH-102', type:'Theory'    },
      { year:'1st Year', day:'Wednesday', slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'1st Year', day:'Wednesday', slot:'12:00-13:00', subject:'Sports / Physical Training',  faculty:'Mr. F. Kale',      room:'Ground', type:'Sports'    },
      // 1st Year - Thursday
      { year:'1st Year', day:'Thursday',  slot:'08:00-09:00', subject:'Rachana Sharir (Anatomy)',    faculty:'Dr. A. Sharma',    room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Thursday',  slot:'09:00-10:00', subject:'Padarth Vigyan',              faculty:'Dr. E. Desai',     room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Thursday',  slot:'10:00-11:00', subject:'Rachana Sharir Lab',          faculty:'Dr. A. Sharma',    room:'Lab-1',  type:'Practical' },
      { year:'1st Year', day:'Thursday',  slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'1st Year', day:'Thursday',  slot:'12:00-13:00', subject:'Kriya Sharir Lab',            faculty:'Dr. B. Patil',     room:'Lab-2',  type:'Practical' },
      // 1st Year - Friday
      { year:'1st Year', day:'Friday',    slot:'08:00-09:00', subject:'Maulik Siddhant',             faculty:'Dr. C. Kulkarni',  room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Friday',    slot:'09:00-10:00', subject:'Kriya Sharir (Physiology)',   faculty:'Dr. B. Patil',     room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Friday',    slot:'10:00-11:00', subject:'Seminar / Guest Lecture',     faculty:'HOD',              room:'Aud-1',  type:'Seminar'   },
      { year:'1st Year', day:'Friday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'1st Year', day:'Friday',    slot:'12:00-13:00', subject:'Library Hour',                faculty:'-',                room:'Library',type:'Tutorial'  },
      // 1st Year - Saturday
      { year:'1st Year', day:'Saturday',  slot:'08:00-09:00', subject:'Sanskrit Revision',           faculty:'Dr. D. Joshi',     room:'LH-101', type:'Tutorial'  },
      { year:'1st Year', day:'Saturday',  slot:'09:00-10:00', subject:'Weekly Test / Assessment',    faculty:'All Faculty',      room:'LH-101', type:'Theory'    },
      { year:'1st Year', day:'Saturday',  slot:'10:00-11:00', subject:'Padarth Vigyan Lab',          faculty:'Dr. E. Desai',     room:'Lab-3',  type:'Practical' },
      // 2nd Year - Monday
      { year:'2nd Year', day:'Monday',    slot:'08:00-09:00', subject:'Dravyaguna Vigyan',           faculty:'Dr. G. Mehta',     room:'LH-201', type:'Theory'    },
      { year:'2nd Year', day:'Monday',    slot:'09:00-10:00', subject:'Roga Nidan',                  faculty:'Dr. H. Wagh',      room:'LH-201', type:'Theory'    },
      { year:'2nd Year', day:'Monday',    slot:'10:00-11:00', subject:'Charaka Samhita (Poorvardha)',faculty:'Dr. I. More',      room:'LH-202', type:'Theory'    },
      { year:'2nd Year', day:'Monday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'2nd Year', day:'Monday',    slot:'12:00-13:00', subject:'Dravyaguna Lab',              faculty:'Dr. G. Mehta',     room:'Lab-4',  type:'Practical' },
      // 2nd Year - Tuesday
      { year:'2nd Year', day:'Tuesday',   slot:'08:00-09:00', subject:'Roga Nidan',                  faculty:'Dr. H. Wagh',      room:'LH-201', type:'Theory'    },
      { year:'2nd Year', day:'Tuesday',   slot:'09:00-10:00', subject:'Dravyaguna Vigyan',           faculty:'Dr. G. Mehta',     room:'LH-201', type:'Theory'    },
      { year:'2nd Year', day:'Tuesday',   slot:'10:00-11:00', subject:'Rasa Shastra',                faculty:'Dr. J. Pawar',     room:'LH-202', type:'Theory'    },
      { year:'2nd Year', day:'Tuesday',   slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'2nd Year', day:'Tuesday',   slot:'12:00-13:00', subject:'Roga Nidan Clinical',         faculty:'Dr. H. Wagh',      room:'OPD',    type:'Clinical'  },
      // 3rd Year - Monday
      { year:'3rd Year', day:'Monday',    slot:'08:00-09:00', subject:'Kayachikitsa',                faculty:'Dr. K. Sawant',    room:'LH-301', type:'Theory'    },
      { year:'3rd Year', day:'Monday',    slot:'09:00-10:00', subject:'Shalya Tantra',               faculty:'Dr. L. Gaikwad',   room:'LH-301', type:'Theory'    },
      { year:'3rd Year', day:'Monday',    slot:'10:00-11:00', subject:'Prasuti & Striroga',          faculty:'Dr. M. Nair',      room:'LH-302', type:'Theory'    },
      { year:'3rd Year', day:'Monday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'3rd Year', day:'Monday',    slot:'12:00-13:00', subject:'Kayachikitsa OPD',            faculty:'Dr. K. Sawant',    room:'OPD-1',  type:'Clinical'  },
      // 4th Year - Monday
      { year:'4th Year', day:'Monday',    slot:'08:00-09:00', subject:'Kayachikitsa (Advanced)',     faculty:'Dr. K. Sawant',    room:'LH-401', type:'Theory'    },
      { year:'4th Year', day:'Monday',    slot:'09:00-10:00', subject:'Panchakarma',                 faculty:'Dr. N. Iyer',      room:'LH-401', type:'Theory'    },
      { year:'4th Year', day:'Monday',    slot:'10:00-11:00', subject:'Shalya Tantra OT',            faculty:'Dr. L. Gaikwad',   room:'OT-1',   type:'Clinical'  },
      { year:'4th Year', day:'Monday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'4th Year', day:'Monday',    slot:'12:00-13:00', subject:'Panchakarma Practical',       faculty:'Dr. N. Iyer',      room:'PK-Lab', type:'Practical' },
      // Intern - Monday
      { year:'Intern',   day:'Monday',    slot:'08:00-09:00', subject:'Internship Posting – OPD',   faculty:'Duty Doctor',      room:'OPD',    type:'Clinical'  },
      { year:'Intern',   day:'Monday',    slot:'09:00-10:00', subject:'Ward Rounds',                 faculty:'Duty Doctor',      room:'Ward',   type:'Clinical'  },
      { year:'Intern',   day:'Monday',    slot:'10:00-11:00', subject:'Case Presentation',           faculty:'HOD',              room:'Sem-2',  type:'Seminar'   },
      { year:'Intern',   day:'Monday',    slot:'11:00-12:00', subject:'Lunch Break',                 faculty:'-',                room:'-',      type:'Break'     },
      { year:'Intern',   day:'Monday',    slot:'12:00-13:00', subject:'Emergency / Casualty',        faculty:'Duty Doctor',      room:'Casualty',type:'Clinical' },
    ];

    seedData.forEach(item => {
      DB.add('timetable', { ...item, id: DB.generateId(), createdAt: new Date().toISOString() });
    });
    console.log('✅ Timetable seed data added:', seedData.length, 'entries');
  },

  // ──────────────────────── RENDER TABS ───────────────────────
  renderYearTabs() {
    const el = document.getElementById('yearTabs');
    if (!el) return;
    el.innerHTML = this.state.years.map(y => `
      <button class="tab-btn ${y === this.state.currentYear ? 'active' : ''}"
        onclick="TIMETABLE.switchYear('${y}')">
        ${y}
      </button>
    `).join('');
  },

  renderDayTabs() {
    const el = document.getElementById('dayTabs');
    if (!el) return;
    el.innerHTML = this.state.days.map(d => `
      <button class="tab-btn day-tab ${d === this.state.currentDay ? 'active' : ''}"
        onclick="TIMETABLE.switchDay('${d}')">
        ${d.substring(0,3)}
      </button>
    `).join('');
  },

  // ────────────────────── RENDER GRID ─────────────────────────
  renderGrid() {
    const container = document.getElementById('timetableGrid');
    if (!container) { console.warn('⚠️ timetableGrid element not found'); return; }

    const all     = DB.getAll('timetable') || [];
    const entries = all.filter(e =>
      e.year === this.state.currentYear && e.day === this.state.currentDay
    );

    const entryMap = {};
    entries.forEach(e => { entryMap[e.slot] = e; });

    container.innerHTML = `
      <div class="tt-table-wrap">
        <table class="tt-table">
          <thead>
            <tr>
              <th style="width:130px">⏰ Time Slot</th>
              <th>📚 Subject</th>
              <th>👨‍⚕️ Faculty</th>
              <th>🏛️ Room</th>
              <th style="width:100px">Type</th>
              <th style="width:110px">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.slots.map(slot => {
              const e     = entryMap[slot];
              const color = e ? (this.typeColors[e.type] || '#4361ee') : '#adb5bd';
              return `
              <tr class="tt-tr ${e ? 'has-entry' : 'empty-row'}"
                  style="border-left:5px solid ${color}">
                <td><span class="tt-time-badge">${slot}</span></td>
                <td>
                  ${e
                    ? `<span class="tt-subj">${e.subject}</span>`
                    : `<span class="tt-free">— Free —</span>`}
                </td>
                <td>${e ? (e.faculty || '—') : '—'}</td>
                <td>${e ? (e.room    || '—') : '—'}</td>
                <td>
                  ${e
                    ? `<span class="tt-badge" style="background:${color}">${e.type}</span>`
                    : '—'}
                </td>
                <td class="tt-action-cell">
                  ${e
                    ? `<button class="btn btn-xs btn-primary"  onclick="TIMETABLE.openEdit('${e.id}')">✏️</button>
                       <button class="btn btn-xs btn-danger"   onclick="TIMETABLE.deleteEntry('${e.id}')">🗑️</button>`
                    : `<button class="btn btn-xs btn-success"  onclick="TIMETABLE.openAdd('${slot}')">➕</button>`}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ──────────────────── WEEKLY VIEW ───────────────────────────
  renderWeeklyView() {
    const container = document.getElementById('weeklyViewBody');
    if (!container) return;

    const all = DB.getAll('timetable') || [];
    const yearData = all.filter(e => e.year === this.state.currentYear);

    container.innerHTML = this.state.slots.map(slot => {
      const cells = this.state.days.map(day => {
        const e     = yearData.find(x => x.day === day && x.slot === slot);
        const color = e ? (this.typeColors[e.type] || '#4361ee') : 'transparent';
        return `<td class="weekly-cell ${e ? 'filled' : ''}">
          ${e
            ? `<div class="wc-inner" style="border-left:3px solid ${color}">
                 <div class="wc-subj">${e.subject}</div>
                 <div class="wc-meta">${e.faculty || ''}</div>
               </div>`
            : `<span class="wc-free">Free</span>`}
        </td>`;
      }).join('');
      return `<tr><td class="weekly-time">${slot}</td>${cells}</tr>`;
    }).join('');
  },

  // ──────────────────── RENDER STATS ──────────────────────────
  renderStats() {
    const all     = DB.getAll('timetable') || [];
    const forYear = all.filter(e => e.year === this.state.currentYear);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('ttTotalClasses', forYear.length);
    set('ttTheory',       forYear.filter(e => e.type === 'Theory').length);
    set('ttPractical',    forYear.filter(e => e.type === 'Practical').length);
    set('ttClinical',     forYear.filter(e => e.type === 'Clinical').length);
    set('ttBreaks',       forYear.filter(e => e.type === 'Break').length);
    set('ttCurrentYear',  this.state.currentYear);
  },

  // ──────────────────── SWITCH YEAR/DAY ───────────────────────
  switchYear(year) {
    this.state.currentYear = year;
    this.renderYearTabs();
    this.renderGrid();
    this.renderWeeklyView();
    this.renderStats();
  },

  switchDay(day) {
    this.state.currentDay = day;
    this.renderDayTabs();
    this.renderGrid();
  },

  // ──────────────────── TAB SWITCH (VIEW) ─────────────────────
  switchView(view) {
    document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tt-view-panel').forEach(p => p.classList.remove('active'));
    const btn = document.getElementById('viewBtn_' + view);
    const pan = document.getElementById('viewPanel_' + view);
    if (btn) btn.classList.add('active');
    if (pan) pan.classList.add('active');
    if (view === 'weekly') this.renderWeeklyView();
  },

  // ──────────────────── MODAL: ADD ────────────────────────────
  openAdd(slot) {
    this.state.editingId = null;
    document.getElementById('ttModalTitle').textContent = '➕ Add New Class';
    this.resetForm();
    if (slot) document.getElementById('ttSlot').value = slot;
    document.getElementById('ttYear').value = this.state.currentYear;
    document.getElementById('ttDay').value  = this.state.currentDay;
    this.openModal();
  },

  // ──────────────────── MODAL: EDIT ───────────────────────────
  openEdit(id) {
    const entry = DB.getById('timetable', id);
    if (!entry) { if(typeof APP!=='undefined') APP.showToast('Entry not found!','error'); return; }
    this.state.editingId = id;
    document.getElementById('ttModalTitle').textContent = '✏️ Edit Class';
    document.getElementById('ttYear').value    = entry.year    || '';
    document.getElementById('ttDay').value     = entry.day     || '';
    document.getElementById('ttSlot').value    = entry.slot    || '';
    document.getElementById('ttSubject').value = entry.subject || '';
    document.getElementById('ttFaculty').value = entry.faculty || '';
    document.getElementById('ttRoom').value    = entry.room    || '';
    document.getElementById('ttType').value    = entry.type    || 'Theory';
    document.getElementById('ttNotes').value   = entry.notes   || '';
    this.openModal();
  },

  openModal()  { document.getElementById('ttModal').style.display = 'flex'; },
  closeModal() {
    document.getElementById('ttModal').style.display = 'none';
    this.state.editingId = null;
    this.resetForm();
  },

  resetForm() {
    ['ttYear','ttDay','ttSlot','ttSubject','ttFaculty','ttRoom','ttType','ttNotes']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'ttType') el.value = 'Theory';
        else el.value = '';
      });
  },

  // ──────────────────── SAVE ENTRY ────────────────────────────
  saveEntry() {
    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const year    = get('ttYear');
    const day     = get('ttDay');
    const slot    = get('ttSlot');
    const subject = get('ttSubject');
    const faculty = get('ttFaculty');
    const room    = get('ttRoom');
    const type    = get('ttType');
    const notes   = get('ttNotes');

    if (!year || !day || !slot || !subject) {
      if(typeof APP!=='undefined') APP.showToast('Year, Day, Slot आणि Subject आवश्यक आहेत!','warning');
      return;
    }

    // Conflict check
    const all = DB.getAll('timetable') || [];
    const conflict = all.find(e =>
      e.year === year && e.day === day && e.slot === slot &&
      e.id !== this.state.editingId
    );
    if (conflict) {
      if(typeof APP!=='undefined')
        APP.showToast(`⚠️ ${year} – ${day} – ${slot} ला आधीच "${conflict.subject}" आहे!`,'error');
      return;
    }

    const data = { year, day, slot, subject, faculty, room, type, notes };

    if (this.state.editingId) {
      DB.update('timetable', this.state.editingId, data);
      if(typeof APP!=='undefined') APP.showToast('✅ Entry updated successfully!','success');
    } else {
      DB.add('timetable', { ...data, id: DB.generateId(), createdAt: new Date().toISOString() });
      if(typeof APP!=='undefined') APP.showToast('✅ Entry added successfully!','success');
    }

    this.closeModal();
    this.renderGrid();
    this.renderWeeklyView();
    this.renderStats();
  },

  // ──────────────────── DELETE ────────────────────────────────
  deleteEntry(id) {
    if (!confirm('ही timetable entry delete करायची आहे का?')) return;
    DB.delete('timetable', id);
    if(typeof APP!=='undefined') APP.showToast('🗑️ Entry deleted','info');
    this.renderGrid();
    this.renderWeeklyView();
    this.renderStats();
  },

  // ──────────────────── CLEAR YEAR ────────────────────────────
  clearYear() {
    if (!confirm(`${this.state.currentYear} चा संपूर्ण timetable delete करायचा आहे का?`)) return;
    const all  = DB.getAll('timetable') || [];
    const keep = all.filter(e => e.year !== this.state.currentYear);
    localStorage.setItem(DB.keys.timetable, JSON.stringify(keep));
    if(typeof APP!=='undefined') APP.showToast(`🗑️ ${this.state.currentYear} timetable cleared`,'info');
    this.renderGrid();
    this.renderWeeklyView();
    this.renderStats();
  },

  // ──────────────────── EXPORT CSV ────────────────────────────
  exportCSV() {
    const all = DB.getAll('timetable') || [];
    if (!all.length) { if(typeof APP!=='undefined') APP.showToast('Export करण्यासाठी data नाही!','warning'); return; }
    const rows = [['Year','Day','Time Slot','Subject','Faculty','Room','Type','Notes']];
    all.forEach(e => rows.push([e.year,e.day,e.slot,e.subject,e.faculty,e.room,e.type,e.notes||'']));
    const csv  = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'DAMC_Timetable_Export.csv';
    a.click();
    if(typeof APP!=='undefined') APP.showToast('📥 Timetable CSV exported!','success');
  },

  // ──────────────────── IMPORT CSV ────────────────────────────
  importCSV() {
    const input   = document.createElement('input');
    input.type    = 'file';
    input.accept  = '.csv';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        if(typeof APP!=='undefined') APP.showToast('CSV file empty!','error'); return;
      }
      let added = 0, skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g,'').trim());
        if (cols.length < 7) { skipped++; continue; }
        const [year, day, slot, subject, faculty, room, type, notes] = cols;
        if (!year || !day || !slot || !subject) { skipped++; continue; }
        // conflict check
        const all = DB.getAll('timetable') || [];
        const conflict = all.find(x => x.year===year && x.day===day && x.slot===slot);
        if (conflict) { skipped++; continue; }
        DB.add('timetable', {
          id: DB.generateId(), year, day, slot, subject,
          faculty, room, type: type||'Theory', notes: notes||'',
          createdAt: new Date().toISOString()
        });
        added++;
      }
      if(typeof APP!=='undefined')
        APP.showToast(`✅ ${added} entries imported, ${skipped} skipped`,'success');
      this.renderGrid();
      this.renderWeeklyView();
      this.renderStats();
    };
    input.click();
  },

  // ──────────────────── DOWNLOAD TEMPLATE ─────────────────────
  downloadTemplate() {
    const rows = [
      ['Year','Day','Time Slot','Subject','Faculty','Room','Type','Notes'],
      ['1st Year','Monday','08:00-09:00','Rachana Sharir','Dr. A. Sharma','LH-101','Theory',''],
      ['1st Year','Monday','09:00-10:00','Kriya Sharir','Dr. B. Patil','LH-101','Theory',''],
      ['1st Year','Tuesday','08:00-09:00','Rachana Sharir Lab','Dr. A. Sharma','Lab-1','Practical',''],
      ['2nd Year','Monday','08:00-09:00','Dravyaguna Vigyan','Dr. G. Mehta','LH-201','Theory',''],
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'DAMC_Timetable_Template.csv';
    a.click();
    if(typeof APP!=='undefined') APP.showToast('📄 Template downloaded!','success');
  },

  // ──────────────────── PRINT ─────────────────────────────────
  printTimetable() {
    window.print();
  },

  // ──────────────────── ERROR ─────────────────────────────────
  showError(msg) {
    const el = document.getElementById('timetableGrid');
    if (el) el.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#f72585">
        <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem"></i>
        <br/>${msg}
        <br/><button class="btn btn-primary" style="margin-top:1rem"
          onclick="location.reload()">🔄 Refresh</button>
      </div>`;
  }

};
