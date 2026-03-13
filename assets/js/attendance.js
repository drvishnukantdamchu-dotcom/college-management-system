/**
 * DAMC ERP — Attendance Management Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 * Smart attendance with percentage, shortage alerts & reports
 */

const ATTENDANCE = {

  // ── Current State ────────────────────────────────────────────
  state: {
    date:    new Date().toISOString().split('T')[0],
    year:    '1st',
    subject: '',
    session: 'Morning',
    records: {}   // { studentId: 'present'|'absent'|'late' }
  },

  // ── Init Page ────────────────────────────────────────────────
  init() {
    document.getElementById('attDate').value    = this.state.date;
    document.getElementById('attYear').value    = this.state.year;
    document.getElementById('attSession').value = this.state.session;
    this.loadAttendanceSheet();
    this.renderSummaryStats();
    this.renderMonthlyChart();
    this.checkPreviousRecord();
  },

  // ── Check if today's record exists ──────────────────────────
  checkPreviousRecord() {
    const existing = DB.get(DB.KEYS.ATTENDANCE).filter(
      a => a.date === this.state.date &&
           a.year === this.state.year &&
           a.session === this.state.session
    );
    if (existing.length > 0) {
      // Pre-fill existing attendance
      existing.forEach(r => { this.state.records[r.studentId] = r.status; });
      this.updateSheetUI();
      document.getElementById('existingAlert').classList.remove('hidden');
    } else {
      document.getElementById('existingAlert').classList.add('hidden');
    }
  },

  // ── Load Attendance Sheet ─────────────────────────────────────
  loadAttendanceSheet() {
    const year     = document.getElementById('attYear').value    || '1st';
    const date     = document.getElementById('attDate').value    || this.state.date;
    const subject  = document.getElementById('attSubject').value || '';
    const session  = document.getElementById('attSession').value || 'Morning';

    this.state = { date, year, subject, session, records: {} };

    const students = DB.get(DB.KEYS.STUDENTS)
      .filter(s => s.year === year && s.active);

    const tbody = document.getElementById('attTableBody');
    if (!tbody) return;

    if (!students.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <i class="fas fa-users-slash"></i>
          <h4>No active students found for ${year} Year</h4>
        </div>
      </td></tr>`;
      return;
    }

    // Load existing for this date/year/session
    const existing = DB.get(DB.KEYS.ATTENDANCE).filter(
      a => a.date === date && a.year === year && a.session === session
    );
    existing.forEach(r => { this.state.records[r.studentId] = r.status; });

    tbody.innerHTML = students.map((s, i) => {
      const status = this.state.records[s.id] || 'present';
      return `
        <tr id="attRow-${s.id}" class="${status === 'absent' ? 'row-absent' : status === 'late' ? 'row-late' : ''}">
          <td>${i + 1}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="student-avatar" style="width:32px;height:32px;font-size:0.72rem">
                ${APP.Utils.getInitials(s.name)}
              </div>
              <div>
                <div style="font-weight:500;font-size:0.87rem">${s.name}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${s.rollNo}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="att-percentage" id="attPct-${s.id}">
              ${this._getStudentAttPct(s.id)}
            </div>
          </td>
          <td>
            <div class="att-buttons">
              <button class="att-btn present ${status === 'present' ? 'active' : ''}"
                onclick="ATTENDANCE.markStatus('${s.id}','present')"
                title="Present">
                <i class="fas fa-check"></i> P
              </button>
              <button class="att-btn absent ${status === 'absent' ? 'active' : ''}"
                onclick="ATTENDANCE.markStatus('${s.id}','absent')"
                title="Absent">
                <i class="fas fa-times"></i> A
              </button>
              <button class="att-btn late ${status === 'late' ? 'active' : ''}"
                onclick="ATTENDANCE.markStatus('${s.id}','late')"
                title="Late">
                <i class="fas fa-clock"></i> L
              </button>
              <button class="att-btn leave ${status === 'leave' ? 'active' : ''}"
                onclick="ATTENDANCE.markStatus('${s.id}','leave')"
                title="Leave">
                <i class="fas fa-calendar-times"></i> LV
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="att-remark" id="remark-${s.id}"
              placeholder="Optional remark..."
              value="${this._getRemark(s.id, date, session) || ''}"
              style="width:100%;padding:5px 8px;border:1px solid var(--border);
                border-radius:6px;font-size:0.78rem;background:var(--bg-input);color:var(--text-primary)"/>
          </td>
          <td>
            <span class="att-status-badge" id="statusBadge-${s.id}">
              ${this._statusBadge(status)}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    this.updateLiveCounter();
  },

  // ── Mark Status ───────────────────────────────────────────────
  markStatus(studentId, status) {
    this.state.records[studentId] = status;

    // Update row style
    const row = document.getElementById(`attRow-${studentId}`);
    if (row) {
      row.className = status === 'absent' ? 'row-absent' :
                      status === 'late'   ? 'row-late'   :
                      status === 'leave'  ? 'row-leave'  : '';
    }

    // Update buttons
    ['present','absent','late','leave'].forEach(s => {
      const btn = row?.querySelector(`.att-btn.${s}`);
      if (btn) btn.classList.toggle('active', s === status);
    });

    // Update badge
    const badge = document.getElementById(`statusBadge-${studentId}`);
    if (badge) badge.innerHTML = this._statusBadge(status);

    this.updateLiveCounter();
  },

  // ── Mark All ──────────────────────────────────────────────────
  markAll(status) {
    const students = DB.get(DB.KEYS.STUDENTS)
      .filter(s => s.year === this.state.year && s.active);
    students.forEach(s => this.markStatus(s.id, status));
    APP.toast(`All marked as ${status}!`, 'info');
  },

  // ── Save Attendance ───────────────────────────────────────────
  save() {
    const students = DB.get(DB.KEYS.STUDENTS)
      .filter(s => s.year === this.state.year && s.active);

    if (!students.length) {
      APP.toast('No students to save attendance for!', 'warning');
      return;
    }

    // Remove existing records for this date/year/session
    const allAtt = DB.get(DB.KEYS.ATTENDANCE).filter(
      a => !(a.date    === this.state.date &&
             a.year    === this.state.year &&
             a.session === this.state.session)
    );

    const newRecords = students.map(s => ({
      id:        DB.generateId(),
      studentId: s.id,
      studentName: s.name,
      rollNo:    s.rollNo,
      date:      this.state.date,
      year:      this.state.year,
      subject:   this.state.subject,
      session:   this.state.session,
      status:    this.state.records[s.id] || 'present',
      remark:    document.getElementById(`remark-${s.id}`)?.value || '',
      savedBy:   AUTH.currentUser()?.name || 'Admin',
      savedAt:   new Date().toISOString()
    }));

    DB.set(DB.KEYS.ATTENDANCE, [...allAtt, ...newRecords]);

    const presentCount = newRecords.filter(r => r.status === 'present').length;
    const absentCount  = newRecords.filter(r => r.status === 'absent').length;

    APP.toast(
      `Attendance saved! ✓ Present: ${presentCount} | ✗ Absent: ${absentCount}`,
      'success', 'Attendance Saved', 5000
    );
    AUTH.logActivity('ATTENDANCE_SAVE',
      `Saved attendance for ${this.state.year} Year | ${this.state.date}`);

    this.renderSummaryStats();
    document.getElementById('existingAlert').classList.remove('hidden');

    // Alert shortage students
    const shortageStudents = this._getShortageStudents();
    if (shortageStudents.length > 0) {
      setTimeout(() => {
        APP.toast(
          `⚠️ ${shortageStudents.length} students below 75% attendance!`,
          'warning', 'Attendance Alert', 6000
        );
      }, 1000);
    }
  },

  // ── Get Student Attendance % ──────────────────────────────────
  _getStudentAttPct(studentId) {
    const records = DB.get(DB.KEYS.ATTENDANCE).filter(a => a.studentId === studentId);
    if (!records.length) return '<span style="color:var(--text-muted)">New</span>';
    const present = records.filter(a =>
      a.status === 'present' || a.status === 'late'
    ).length;
    const pct = Math.round((present / records.length) * 100);
    const color = pct >= 75 ? 'var(--success)' :
                  pct >= 60 ? 'var(--warning)' : 'var(--danger)';
    return `<span style="font-weight:700;color:${color}">${pct}%</span>
            <div class="progress-bar-wrap" style="width:60px;margin-top:2px">
              <div class="progress-bar-fill ${pct>=75?'green':pct>=60?'orange':'red'}"
                style="width:${pct}%"></div>
            </div>`;
  },

  // ── Get Remark ────────────────────────────────────────────────
  _getRemark(studentId, date, session) {
    const rec = DB.get(DB.KEYS.ATTENDANCE)
      .find(a => a.studentId === studentId && a.date === date && a.session === session);
    return rec?.remark || '';
  },

  // ── Status Badge ──────────────────────────────────────────────
  _statusBadge(status) {
    const map = {
      present: '<span class="badge badge-green">✓ Present</span>',
      absent:  '<span class="badge badge-red">✗ Absent</span>',
      late:    '<span class="badge badge-orange">⏰ Late</span>',
      leave:   '<span class="badge badge-blue">📅 Leave</span>',
    };
    return map[status] || map.present;
  },

  // ── Update Sheet UI ───────────────────────────────────────────
  updateSheetUI() {
    Object.entries(this.state.records).forEach(([id, status]) => {
      this.markStatus(id, status);
    });
  },

  // ── Live Counter ──────────────────────────────────────────────
  updateLiveCounter() {
    const records = Object.values(this.state.records);
    const total   = DB.get(DB.KEYS.STUDENTS)
      .filter(s => s.year === this.state.year && s.active).length;
    const present = records.filter(r => r === 'present').length;
    const absent  = records.filter(r => r === 'absent').length;
    const late    = records.filter(r => r === 'late').length;
    const leave   = records.filter(r => r === 'leave').length;
    const unmarked = total - records.length;

    const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    el('liveTotal',    total);
    el('livePresent',  present + (records.length > 0 && unmarked > 0 ? unmarked : 0));
    el('liveAbsent',   absent);
    el('liveLate',     late);
    el('liveLeave',    leave);
    el('livePercent',  total > 0 ? Math.round(((present + late) / total) * 100) + '%' : '0%');
  },

  // ── Shortage Students ─────────────────────────────────────────
  _getShortageStudents() {
    const students = DB.get(DB.KEYS.STUDENTS).filter(s => s.active);
    return students.filter(s => {
      const records = DB.get(DB.KEYS.ATTENDANCE).filter(a => a.studentId === s.id);
      if (!records.length) return false;
      const present = records.filter(a =>
        a.status === 'present' || a.status === 'late'
      ).length;
      return (present / records.length) * 100 < 75;
    });
  },

  // ── Render Summary Stats ──────────────────────────────────────
  renderSummaryStats() {
    const allAtt  = DB.get(DB.KEYS.ATTENDANCE);
    const students = DB.get(DB.KEYS.STUDENTS).filter(s => s.active);

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = allAtt.filter(a => a.date === today);
    const todayPresent = todayAtt.filter(a => a.status === 'present').length;

    // Shortage list
    const shortageList = this._getShortageStudents();

    const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    el('summaryTotalStudents', students.length);
    el('summaryTodayPresent',  todayPresent);
    el('summaryShortage',      shortageList.length);
    el('summaryTotalClasses',  [...new Set(allAtt.map(a => a.date))].length);

    // Render shortage table
    const shortageBody = document.getElementById('shortageTableBody');
    if (shortageBody) {
      if (!shortageList.length) {
        shortageBody.innerHTML = `<tr><td colspan="5">
          <div class="empty-state" style="padding:20px">
            <i class="fas fa-check-circle" style="color:var(--success)"></i>
            <p>All students have attendance above 75%!</p>
          </div>
        </td></tr>`;
      } else {
        shortageBody.innerHTML = shortageList.map(s => {
          const records = allAtt.filter(a => a.studentId === s.id);
          const present = records.filter(a =>
            a.status === 'present' || a.status === 'late'
          ).length;
          const pct = Math.round((present / records.length) * 100);
          const needed = Math.ceil((0.75 * records.length - present) / 0.25);
          return `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td class="text-primary">${s.rollNo}</td>
              <td><span class="badge badge-blue">${s.year} Year</span></td>
              <td>
                <span style="color:var(--danger);font-weight:700">${pct}%</span>
                <span style="color:var(--text-muted);font-size:0.75rem">
                  (${present}/${records.length})
                </span>
              </td>
              <td>
                <span class="badge badge-red">
                  Need ${needed} more classes
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  // ── Monthly Chart ─────────────────────────────────────────────
  renderMonthlyChart() {
    const canvas = document.getElementById('monthlyAttChart');
    if (!canvas) return;

    const allAtt = DB.get(DB.KEYS.ATTENDANCE);
    const month  = new Date().getMonth();
    const year   = new Date().getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days    = [];
    const present = [];
    const absent  = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayRec  = allAtt.filter(a => a.date === dateStr);
      days.push(d);
      present.push(dayRec.filter(a => a.status === 'present').length);
      absent.push(dayRec.filter(a => a.status === 'absent').length);
    }

    if (window._monthlyChart) window._monthlyChart.destroy();
    window._monthlyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Present',
            data: present,
            backgroundColor: 'rgba(26,107,60,0.8)',
            borderRadius: 4, borderSkipped: false,
          },
          {
            label: 'Absent',
            data: absent,
            backgroundColor: 'rgba(220,38,38,0.7)',
            borderRadius: 4, borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false }, stacked: false },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    });
  },

  // ── Export Attendance Report ──────────────────────────────────
  exportReport() {
    const year = document.getElementById('attYear').value || '1st';
    const records = DB.get(DB.KEYS.ATTENDANCE).filter(a => a.year === year);
    if (!records.length) { APP.toast('No records to export!', 'warning'); return; }
    BACKUP.exportCSV(records,
      `DAMC_Attendance_${year}Year_${new Date().toISOString().split('T')[0]}`,
      ['date','rollNo','studentName','year','subject','session','status','remark']
    );
    APP.toast('Attendance report exported!', 'success');
  },

  // ── Date Change Handler ───────────────────────────────────────
  onDateChange() {
    this.state.date = document.getElementById('attDate').value;
    this.state.records = {};
    this.loadAttendanceSheet();
    this.checkPreviousRecord();
  },

  // ── Year/Session Change Handler ───────────────────────────────
  onFilterChange() {
    this.state.year    = document.getElementById('attYear').value;
    this.state.session = document.getElementById('attSession').value;
    this.state.records = {};
    this.loadAttendanceSheet();
    this.checkPreviousRecord();
  }
};
