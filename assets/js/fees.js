/**
 * DAMC ERP — Fee Management Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 * Complete fee collection, receipts, pending alerts
 */

const FEES = {

  // ── Render Fee List ──────────────────────────────────────────
  renderList(filter = {}) {
    let students = DB.get(DB.KEYS.STUDENTS).filter(s => s.active);
    const feeRecords  = DB.get(DB.KEYS.FEES);
    const feeStructure = DB.get(DB.KEYS.FEE_STRUCT);

    if (filter.year)  students = students.filter(s => s.year === filter.year);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      students = students.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('feeTableBody');
    if (!tbody) return;

    if (!students.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty-state">
          <i class="fas fa-rupee-sign"></i>
          <h4>No students found</h4>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = students.map((s, i) => {
      const sRecs    = feeRecords.filter(f => f.studentId === s.id);
      const totalPaid = sRecs.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
      const totalDue  = sRecs.reduce((sum, f) => sum + (f.amountDue  || 0), 0);

      // Get expected total from fee structure
      const expected = feeStructure
        .filter(fs => fs.year === s.year)
        .reduce((sum, fs) => sum + (fs.amount || 0), 0);

      const totalPending = Math.max(0, expected - totalPaid);
      const paidPct = expected > 0
        ? Math.min(100, Math.round((totalPaid / expected) * 100)) : 0;

      return `
        <tr class="animate-in" style="animation-delay:${i*0.02}s">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="student-avatar" style="width:34px;height:34px;
                font-size:0.72rem;flex-shrink:0;
                background:linear-gradient(135deg,var(--primary-light),var(--secondary-light));
                color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700">
                ${APP.Utils.getInitials(s.name)}
              </div>
              <div>
                <strong style="font-size:0.87rem">${s.name}</strong>
                <div style="font-size:0.72rem;color:var(--text-muted)">${s.rollNo}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-blue">${s.year} Year</span></td>
          <td class="text-primary text-bold">${APP.Utils.formatCurrency(totalPaid)}</td>
          <td class="${totalPending > 0 ? 'text-bold' : ''}"
            style="color:${totalPending > 0 ? 'var(--danger)' : 'var(--success)'}">
            ${APP.Utils.formatCurrency(totalPending)}
          </td>
          <td>
            <div style="min-width:120px">
              <div style="display:flex;justify-content:space-between;
                font-size:0.72rem;margin-bottom:4px">
                <span>${paidPct}% paid</span>
                <span>${APP.Utils.formatCurrency(totalPaid)}/${APP.Utils.formatCurrency(expected)}</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill ${paidPct>=100?'green':paidPct>=50?'orange':'red'}"
                  style="width:${paidPct}%"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${
              totalPending === 0 ? 'badge-green' :
              paidPct >= 50      ? 'badge-orange' : 'badge-red'
            }">
              ${totalPending === 0 ? '✓ Cleared' :
                paidPct >= 50     ? '⚡ Partial'  : '⚠ Pending'}
            </span>
          </td>
          <td style="font-size:0.78rem;color:var(--text-muted)">
            ${sRecs.length ? APP.Utils.formatDate(sRecs[sRecs.length-1].paymentDate) : 'No payment'}
          </td>
          <td>
            <div class="td-actions">
              <button class="btn btn-sm btn-primary" title="Collect Fee"
                onclick="FEES.openCollect('${s.id}')">
                <i class="fas fa-rupee-sign"></i> Collect
              </button>
              <button class="btn btn-sm btn-outline" title="Fee History"
                onclick="FEES.viewHistory('${s.id}')">
                <i class="fas fa-history"></i>
              </button>
              <button class="btn btn-sm btn-outline" title="Print Receipt"
                onclick="FEES.printReceipt(null,'${s.id}')">
                <i class="fas fa-print"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('feeStudentCount').textContent =
      `${students.length} Student${students.length > 1 ? 's' : ''}`;
    this.updateTopStats();
  },

  // ── Open Fee Collection Modal ─────────────────────────────────
  openCollect(studentId) {
    const s = DB.findById(DB.KEYS.STUDENTS, studentId);
    if (!s) return;

    const feeStructure = DB.get(DB.KEYS.FEE_STRUCT)
      .filter(fs => fs.year === s.year);
    const existingPay  = DB.get(DB.KEYS.FEES)
      .filter(f => f.studentId === studentId);

    document.getElementById('collectStudentName').textContent = s.name;
    document.getElementById('collectRollNo').textContent      = s.rollNo;
    document.getElementById('collectYear').textContent        = s.year + ' Year BAMS';

    // Build fee items
    const itemsHtml = feeStructure.map(fs => {
      const paid = existingPay
        .filter(p => p.feeTypeId === fs.id)
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      const due = Math.max(0, fs.amount - paid);
      return `
        <div class="fee-item" id="feeItem-${fs.id}">
          <div class="fee-item-info">
            <span class="fee-item-name">${fs.name}</span>
            <span class="fee-item-cat badge badge-gray">${fs.category}</span>
          </div>
          <div class="fee-item-amounts">
            <span class="fee-total">Total: ${APP.Utils.formatCurrency(fs.amount)}</span>
            <span class="fee-paid" style="color:var(--success)">
              Paid: ${APP.Utils.formatCurrency(paid)}
            </span>
            <span class="fee-due" style="color:${due > 0 ? 'var(--danger)' : 'var(--success)'}">
              Due: ${APP.Utils.formatCurrency(due)}
            </span>
          </div>
          <div class="fee-item-input">
            <div class="input-group">
              <span class="input-group-prefix">₹</span>
              <input type="number" class="fee-pay-input"
                data-fee-id="${fs.id}"
                data-fee-name="${fs.name}"
                data-max="${due}"
                placeholder="0"
                min="0" max="${due}"
                value="${due > 0 ? due : 0}"
                oninput="FEES.updateTotal()"
                ${due === 0 ? 'disabled style="background:var(--bg-table)"' : ''}/>
            </div>
            ${due === 0
              ? '<span class="badge badge-green" style="font-size:0.7rem">✓ Paid</span>'
              : `<small style="color:var(--text-muted)">Max: ${APP.Utils.formatCurrency(due)}</small>`
            }
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('feeItemsList').innerHTML =
      itemsHtml || '<p style="color:var(--text-muted)">No fee structure defined for this year.</p>';

    // Receipt no
    const receiptNo = 'DAMC/' + new Date().getFullYear() + '/' +
      String(DB.get(DB.KEYS.FEES).length + 1).padStart(4, '0');
    document.getElementById('collectReceiptNo').value  = receiptNo;
    document.getElementById('collectDate').value       = new Date().toISOString().split('T')[0];
    document.getElementById('collectStudentId').value  = studentId;
    document.getElementById('collectPayMode').value    = 'Cash';

    this.updateTotal();
    document.getElementById('collectModal').classList.remove('hidden');
  },

  // ── Update Total ─────────────────────────────────────────────
  updateTotal() {
    let total = 0;
    document.querySelectorAll('.fee-pay-input:not([disabled])').forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      const max = parseFloat(inp.dataset.max) || 0;
      if (val > max) inp.value = max;
      total += Math.min(parseFloat(inp.value) || 0, max);
    });
    document.getElementById('collectTotal').textContent =
      APP.Utils.formatCurrency(total);
    document.getElementById('collectTotalInput').value = total;
  },

  // ── Save Fee Payment ──────────────────────────────────────────
  savePayment() {
    const studentId  = document.getElementById('collectStudentId').value;
    const receiptNo  = document.getElementById('collectReceiptNo').value;
    const payDate    = document.getElementById('collectDate').value;
    const payMode    = document.getElementById('collectPayMode').value;
    const remarks    = document.getElementById('collectRemarks').value.trim();
    const totalInput = parseFloat(document.getElementById('collectTotalInput').value) || 0;

    if (totalInput <= 0) {
      APP.toast('Please enter an amount to collect!', 'warning');
      return;
    }

    const s = DB.findById(DB.KEYS.STUDENTS, studentId);
    const payments = [];

    document.querySelectorAll('.fee-pay-input:not([disabled])').forEach(inp => {
      const amt = parseFloat(inp.value) || 0;
      if (amt > 0) {
        payments.push({
          id:          DB.generateId(),
          studentId,
          studentName: s?.name || '',
          rollNo:      s?.rollNo || '',
          year:        s?.year || '',
          feeTypeId:   inp.dataset.feeId,
          feeName:     inp.dataset.feeName,
          receiptNo,
          amountPaid:  amt,
          amountDue:   Math.max(0, parseFloat(inp.dataset.max) - amt),
          paymentDate: payDate,
          paymentMode: payMode,
          remarks,
          collectedBy: AUTH.currentUser()?.name || 'Admin',
          createdAt:   new Date().toISOString()
        });
      }
    });

    if (!payments.length) {
      APP.toast('No amounts enteredAPP.toast('No amounts entered!', 'warning');
      return;
    }

    // Save all payment records
    const existing = DB.get(DB.KEYS.FEES);
    DB.set(DB.KEYS.FEES, [...existing, ...payments]);

    AUTH.logActivity('FEE_COLLECTED',
      `Fee collected: ${APP.Utils.formatCurrency(totalInput)} from ${s?.name}`);

    APP.toast(
      `✅ ₹${totalInput.toLocaleString('en-IN')} collected from ${s?.name}!`,
      'success', 'Fee Collected', 5000
    );

    document.getElementById('collectModal').classList.add('hidden');
    this.renderList(this._currentFilter || {});
    this.updateTopStats();

    // Auto print receipt
    if (document.getElementById('autoPrintReceipt')?.checked) {
      setTimeout(() => this.printReceipt(receiptNo, studentId), 500);
    }
  },

  // ── Print Receipt ─────────────────────────────────────────────
  printReceipt(receiptNo, studentId) {
    const s = DB.findById(DB.KEYS.STUDENTS, studentId);
    if (!s) return;

    let payments = DB.get(DB.KEYS.FEES).filter(f => f.studentId === studentId);
    if (receiptNo) payments = payments.filter(f => f.receiptNo === receiptNo);
    else payments = payments.slice(-5);

    if (!payments.length) {
      APP.toast('No payment records found!', 'warning');
      return;
    }

    const total = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const lastPayment = payments[payments.length - 1];

    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Fee Receipt — ${s.name}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; padding: 30px;
          color: #0f172a; background: white; }
        .receipt { max-width: 600px; margin: auto;
          border: 2px solid #1a6b3c; border-radius: 12px;
          overflow: hidden; }
        .receipt-header {
          background: linear-gradient(135deg, #0d4a28, #1a237e);
          color: white; padding: 20px 24px; text-align: center; }
        .receipt-header h2 { font-size: 1.1rem; font-weight: 700; line-height: 1.4; }
        .receipt-header p  { font-size: 0.75rem; opacity: 0.85; margin-top: 4px; }
        .receipt-title {
          background: #f0fdf4; padding: 12px 24px;
          border-bottom: 2px dashed #1a6b3c;
          display: flex; justify-content: space-between; align-items: center; }
        .receipt-title h3 { color: #1a6b3c; font-size: 1rem;
          text-transform: uppercase; letter-spacing: 1px; }
        .receipt-no { font-size: 0.78rem; color: #475569; }
        .receipt-body { padding: 20px 24px; }
        .student-info {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 20px;
          background: #f8fafc; padding: 14px;
          border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-row { display: flex; flex-direction: column; gap: 2px; }
        .info-row label { font-size: 0.65rem; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px; }
        .info-row span  { font-size: 0.85rem; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #1a6b3c; color: white; padding: 9px 12px;
          text-align: left; font-size: 0.78rem; }
        td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0;
          font-size: 0.83rem; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row {
          display: flex; justify-content: space-between;
          align-items: center; background: #0d4a28;
          color: white; padding: 14px 16px;
          border-radius: 8px; margin-bottom: 16px; }
        .total-row span { font-size: 0.85rem; opacity: 0.85; }
        .total-row strong { font-size: 1.3rem; font-weight: 800; }
        .receipt-footer { padding: 16px 24px;
          border-top: 2px dashed #1a6b3c;
          background: #f0fdf4; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; align-items: end; }
        .footer-grid p { font-size: 0.72rem; color: #64748b; }
        .sign-line {
          border-top: 1px solid #0f172a; margin-top: 24px;
          padding-top: 4px; font-size: 0.72rem;
          text-align: center; color: #475569; }
        .watermark {
          text-align: center; color: #dcfce7;
          font-size: 4rem; font-weight: 900; opacity: 0.15;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%) rotate(-30deg);
          pointer-events: none; z-index: 0;
          letter-spacing: 4px; }
        .receipt-wrap { position: relative; }
        .designed-by {
          text-align: center; font-size: 0.65rem;
          color: #94a3b8; padding: 8px; }
        @media print {
          body { padding: 10px; }
          .receipt { border: 1px solid #ccc; }
        }
      </style>
      </head>
      <body onload="window.print()">
      <div class="receipt">
        <div class="receipt-header">
          <h2>Dhanwantari Ayurved Medical College & Hospital</h2>
          <p>Degloor Road, Udgir – 413517 | Dist. Latur, Maharashtra</p>
          <p>Tel: (02385) 259825 | Email: contact@damchudgir.edu.in</p>
          <p>Affiliated: MUHS Nashik | Approved: CCIM & AYUSH</p>
        </div>
        <div class="receipt-title">
          <h3>🧾 Fee Receipt</h3>
          <div class="receipt-no">
            <div>Receipt No: <strong>${lastPayment.receiptNo}</strong></div>
            <div>Date: <strong>${APP.Utils.formatDate(lastPayment.paymentDate)}</strong></div>
          </div>
        </div>
        <div class="receipt-body">
          <div class="receipt-wrap">
            <div class="watermark">PAID</div>
            <div class="student-info">
              <div class="info-row">
                <label>Student Name</label>
                <span>${s.name}</span>
              </div>
              <div class="info-row">
                <label>Roll Number</label>
                <span>${s.rollNo}</span>
              </div>
              <div class="info-row">
                <label>Year / Batch</label>
                <span>${s.year} Year — ${s.batch || ''}</span>
              </div>
              <div class="info-row">
                <label>Category</label>
                <span>${s.category || '-'}</span>
              </div>
              <div class="info-row">
                <label>Payment Mode</label>
                <span>${lastPayment.paymentMode}</span>
              </div>
              <div class="info-row">
                <label>Collected By</label>
                <span>${lastPayment.collectedBy}</span>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fee Type</th>
                  <th>Payment Mode</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map((p, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${p.feeName}</td>
                    <td>${p.paymentMode}</td>
                    <td style="font-weight:700;color:#1a6b3c">
                      ${APP.Utils.formatCurrency(p.amountPaid)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-row">
              <span>Total Amount Paid</span>
              <strong>${APP.Utils.formatCurrency(total)}</strong>
            </div>
            ${lastPayment.remarks
              ? `<p style="font-size:0.78rem;color:#475569;margin-bottom:12px">
                  <strong>Remarks:</strong> ${lastPayment.remarks}</p>`
              : ''}
          </div>
        </div>
        <div class="receipt-footer">
          <div class="footer-grid">
            <div>
              <p>This is a computer-generated receipt.</p>
              <p>For queries: contact@damchudgir.edu.in</p>
              <p style="margin-top:8px;color:#1a6b3c;font-weight:600">
                Printed: ${new Date().toLocaleString()}
              </p>
            </div>
            <div>
              <div class="sign-line">Authorized Signatory</div>
              <div class="sign-line" style="margin-top:24px">Student Signature</div>
            </div>
          </div>
        </div>
        <div class="designed-by">
          Designed & Developed by Dr. Jadhav V R (95183 56305) | DAMC ERP v2.0
        </div>
      </div>
      </body></html>
    `);
    w.document.close();
  },

  // ── View Fee History ──────────────────────────────────────────
  viewHistory(studentId) {
    const s = DB.findById(DB.KEYS.STUDENTS, studentId);
    if (!s) return;
    const payments = DB.get(DB.KEYS.FEES)
      .filter(f => f.studentId === studentId)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    document.getElementById('historyStudentName').textContent = s.name;
    document.getElementById('historyRollNo').textContent      = s.rollNo;
    document.getElementById('historyTotalPaid').textContent   =
      APP.Utils.formatCurrency(totalPaid);

    const tbody = document.getElementById('feeHistoryBody');
    if (!payments.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state" style="padding:20px">
          <i class="fas fa-rupee-sign"></i>
          <p>No payment records found</p>
        </div>
      </td></tr>`;
    } else {
      tbody.innerHTML = payments.map(p => `
        <tr>
          <td><strong class="text-primary">${p.receiptNo}</strong></td>
          <td>${APP.Utils.formatDate(p.paymentDate)}</td>
          <td>${p.feeName}</td>
          <td>
            <span class="badge badge-gray">${p.paymentMode}</span>
          </td>
          <td class="text-bold" style="color:var(--success)">
            ${APP.Utils.formatCurrency(p.amountPaid)}
          </td>
          <td>
            <button class="btn btn-sm btn-outline"
              onclick="FEES.printReceipt('${p.receiptNo}','${studentId}')">
              <i class="fas fa-print"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    document.getElementById('feeHistoryStudentId').value = studentId;
    document.getElementById('feeHistoryModal').classList.remove('hidden');
  },

  // ── Update Top Stats ──────────────────────────────────────────
  updateTopStats() {
    const students    = DB.get(DB.KEYS.STUDENTS).filter(s => s.active);
    const payments    = DB.get(DB.KEYS.FEES);
    const feeStruct   = DB.get(DB.KEYS.FEE_STRUCT);

    const totalCollected = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
    const totalExpected  = students.reduce((sum, s) => {
      return sum + feeStruct
        .filter(fs => fs.year === s.year)
        .reduce((s2, fs) => s2 + (fs.amount || 0), 0);
    }, 0);
    const totalPending = Math.max(0, totalExpected - totalCollected);
    const cleared      = students.filter(s => {
      const paid = payments
        .filter(p => p.studentId === s.id)
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      const exp  = feeStruct
        .filter(fs => fs.year === s.year)
        .reduce((sum, fs) => sum + (fs.amount || 0), 0);
      return exp > 0 && paid >= exp;
    }).length;

    const el = (id, val) => {
      const e = document.getElementById(id);
      if (e) e.textContent = val;
    };
    el('feeStatCollected', APP.Utils.formatCurrency(totalCollected));
    el('feeStatPending',   APP.Utils.formatCurrency(totalPending));
    el('feeStatCleared',   cleared);
    el('feeStatTotal',     students.length);

    // Today's collection
    const today = new Date().toISOString().split('T')[0];
    const todayAmt = payments
      .filter(p => p.paymentDate === today)
      .reduce((s, p) => s + (p.amountPaid || 0), 0);
    el('feeStatToday', APP.Utils.formatCurrency(todayAmt));

    this.renderFeeChart();
  },

  // ── Fee Chart ─────────────────────────────────────────────────
  renderFeeChart() {
    const canvas = document.getElementById('feeCollectionChart');
    if (!canvas) return;

    const payments = DB.get(DB.KEYS.FEES);
    const months   = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
    const year     = new Date().getFullYear();

    const monthly = months.map((m, i) => {
      const monthIdx = i >= 6 ? i - 6 : i + 6;
      return payments
        .filter(p => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === monthIdx;
        })
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    });

    if (window._feeChart) window._feeChart.destroy();
    window._feeChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Fee Collected (₹)',
          data: monthly,
          backgroundColor: 'rgba(26,107,60,0.8)',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN')
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  },

  // ── Export Fee Report ─────────────────────────────────────────
  exportReport() {
    const payments = DB.get(DB.KEYS.FEES);
    if (!payments.length) {
      APP.toast('No fee records to export!', 'warning');
      return;
    }
    BACKUP.exportCSV(
      payments,
      `DAMC_FeeReport_${new Date().toISOString().split('T')[0]}`,
      ['receiptNo','paymentDate','studentName','rollNo','year',
       'feeName','amountPaid','paymentMode','collectedBy','remarks']
    );
    APP.toast('Fee report exported to CSV!', 'success');
  },

  _currentFilter: {}
};
