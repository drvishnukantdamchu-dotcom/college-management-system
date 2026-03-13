/**
 * DAMC ERP — Library Management Module
 * Designed & Developed by Dr. Jadhav V R (95183 56305)
 * Book catalog, issue/return, fine calculation
 */

const LIBRARY = {

  // ── Render Book Catalog ──────────────────────────────────────
  renderBooks(filter = {}) {
    let books = DB.get(DB.KEYS.LIBRARY);
    if (filter.category) books = books.filter(b => b.category === filter.category);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      books = books.filter(b =>
        b.title?.toLowerCase().includes(q)  ||
        b.author?.toLowerCase().includes(q) ||
        b.accNo?.toLowerCase().includes(q)  ||
        b.isbn?.includes(q)
      );
    }

    const tbody = document.getElementById('bookTableBody');
    if (!tbody) return;

    if (!books.length) {
      tbody.innerHTML = `<tr><td colspan="9">
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <h4>No Books Found</h4>
          <p>Add books to the catalog or try a different search.</p>
        </div>
      </td></tr>`;
      document.getElementById('bookCount').textContent = '0 Books';
      return;
    }

    document.getElementById('bookCount').textContent =
      `${books.length} Book${books.length > 1 ? 's' : ''}`;

    tbody.innerHTML = books.map((b, i) => `
      <tr class="animate-in" style="animation-delay:${i * 0.02}s">
        <td class="text-primary text-bold">${b.accNo}</td>
        <td>
          <div>
            <strong style="font-size:0.87rem">${b.title}</strong>
            <div style="font-size:0.72rem;color:var(--text-muted)">${b.isbn || '-'}</div>
          </div>
        </td>
        <td>${b.author}</td>
        <td style="font-size:0.82rem">${b.publisher || '-'}</td>
        <td><span class="badge badge-purple">${b.category}</span></td>
        <td style="text-align:center;font-weight:700">${b.copies || 1}</td>
        <td style="text-align:center">
          <span class="badge ${b.available > 0 ? 'badge-green' : 'badge-red'}">
            ${b.available || 0} / ${b.copies || 1}
          </span>
        </td>
        <td style="font-size:0.78rem">${b.location || '-'}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-sm btn-primary"
              title="Issue Book"
              onclick="LIBRARY.openIssue('${b.id}')"
              ${b.available <= 0 ? 'disabled style="opacity:0.5"' : ''}>
              <i class="fas fa-hand-holding-heart"></i> Issue
            </button>
            <button class="btn btn-sm btn-outline"
              title="Edit"
              onclick="LIBRARY.editBook('${b.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger"
              title="Delete"
              onclick="LIBRARY.deleteBook('${b.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    this.updateStats();
  },

  // ── Render Issued Books ───────────────────────────────────────
  renderIssued(filter = {}) {
    let issues = DB.get(DB.KEYS.LIB_ISSUES);
    if (filter.status === 'active')   issues = issues.filter(i => !i.returnDate);
    if (filter.status === 'returned') issues = issues.filter(i =>  i.returnDate);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      issues = issues.filter(i =>
        i.studentName?.toLowerCase().includes(q) ||
        i.rollNo?.toLowerCase().includes(q)      ||
        i.bookTitle?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('issuedTableBody');
    if (!tbody) return;

    if (!issues.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty-state">
          <i class="fas fa-book"></i>
          <h4>No issued books found</h4>
        </div>
      </td></tr>`;
      return;
    }

    const today = new Date();
    tbody.innerHTML = issues.map(issue => {
      const dueDate  = new Date(issue.dueDate);
      const isOverdue = !issue.returnDate && today > dueDate;
      const daysDiff  = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      const fine      = isOverdue ? Math.max(0, daysDiff) * 2 : 0; // ₹2/day

      return `
        <tr class="${isOverdue ? 'row-absent' : ''}">
          <td>
            <div>
              <strong style="font-size:0.85rem">${issue.studentName}</strong>
              <div style="font-size:0.72rem;color:var(--text-muted)">${issue.rollNo}</div>
            </div>
          </td>
          <td>
            <div>
              <strong style="font-size:0.83rem">${issue.bookTitle}</strong>
              <div style="font-size:0.72rem;color:var(--text-muted)">${issue.accNo}</div>
            </div>
          </td>
          <td>${APP.Utils.formatDate(issue.issueDate)}</td>
          <td>
            <span style="color:${isOverdue ? 'var(--danger)' : 'var(--text-primary)'}">
              ${APP.Utils.formatDate(issue.dueDate)}
            </span>
          </td>
          <td>
            ${issue.returnDate
              ? `<span class="badge badge-green">
                   <i class="fas fa-check"></i>
                   ${APP.Utils.formatDate(issue.returnDate)}
                 </span>`
              : isOverdue
                ? `<span class="badge badge-red">
                     <i class="fas fa-exclamation-circle"></i>
                     Overdue ${daysDiff}d
                   </span>`
                : `<span class="badge badge-orange">Pending</span>`
            }
          </td>
          <td>
            <span style="color:${fine > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:700">
              ${fine > 0 ? APP.Utils.formatCurrency(fine) : '₹0'}
            </span>
          </td>
          <td>
            ${!issue.returnDate
              ? `<button class="btn btn-sm btn-success"
                   onclick="LIBRARY.returnBook('${issue.id}',${fine})">
                   <i class="fas fa-undo"></i> Return
                 </button>`
              : '<span class="badge badge-green">Returned</span>'
            }
          </td>
          <td>
            <button class="btn btn-sm btn-outline"
              onclick="LIBRARY.printSlip('${issue.id}')">
              <i class="fas fa-print"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ── Open Issue Modal ──────────────────────────────────────────
  openIssue(bookId) {
    const book = DB.findById(DB.KEYS.LIBRARY, bookId);
    if (!book) return;
    if (book.available <= 0) {
      APP.toast('No copies available for issue!', 'warning');
      return;
    }

    document.getElementById('issueBookTitle').textContent = book.title;
    document.getElementById('issueAccNo').textContent     = book.accNo;
    document.getElementById('issueBookId').value          = bookId;

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const due   = new Date();
    due.setDate(due.getDate() + 14); // 14 days default
    document.getElementById('issueDate').value =
      today;
    document.getElementById('issueDueDate').value =
      due.toISOString().split('T')[0];

    // Populate student dropdown
    const sel = document.getElementById('issueStudentSel');
    sel.innerHTML = '<option value="">Select Student</option>';
    DB.get(DB.KEYS.STUDENTS).filter(s => s.active).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.rollNo})`;
      sel.appendChild(opt);
    });

    document.getElementById('issueModal').classList.remove('hidden');
  },

  // ── Save Issue ────────────────────────────────────────────────
  saveIssue() {
    const bookId    = document.getElementById('issueBookId').value;
    const studentId = document.getElementById('issueStudentSel').value;
    const issueDate = document.getElementById('issueDate').value;
    const dueDate   = document.getElementById('issueDueDate').value;

    if (!studentId) {
      APP.toast('Please select a student!', 'warning');
      return;
    }

    const book    = DB.findById(DB.KEYS.LIBRARY, bookId);
    const student = DB.findById(DB.KEYS.STUDENTS, studentId);
    if (!book || !student) return;

    // Check if student already has this book
    const alreadyIssued = DB.get(DB.KEYS.LIB_ISSUES).find(
      i => i.studentId === studentId &&
           i.bookId === bookId &&
           !i.returnDate
    );
    if (alreadyIssued) {
      APP.toast('This student already has this book!', 'warning');
      return;
    }

    // Create issue record
    DB.add(DB.KEYS.LIB_ISSUES, {
      bookId,
      bookTitle:   book.title,
      accNo:       book.accNo,
      studentId,
      studentName: student.name,
      rollNo:      student.rollNo,
      year:        student.year,
      issueDate,
      dueDate,
      returnDate:  null,
      fine:        0,
      issuedBy:    AUTH.currentUser()?.name || 'Librarian'
    });

    // Reduce available copies
    DB.update(DB.KEYS.LIBRARY, bookId, {
      available: Math.max(0, (book.available || 1) - 1)
    });

    document.getElementById('issueModal').classList.add('hidden');
    APP.toast(`"${book.title}" issued to ${student.name}!`, 'success');
    AUTH.logActivity('BOOK_ISSUE',
      `Issued: ${book.title} → ${student.name}`);
    this.renderBooks(this._currentFilter || {});
    this.renderIssued();
    this.updateStats();
  },

  // ── Return Book ───────────────────────────────────────────────
  returnBook(issueId, fine) {
    const issue = DB.findById(DB.KEYS.LIB_ISSUES, issueId);
    if (!issue) return;

    const msg = fine > 0
      ? `Return book from <strong>${issue.studentName}</strong>?<br/>
         <span style="color:var(--danger);font-weight:700">
           Fine: ${APP.Utils.formatCurrency(fine)}
         </span>`
      : `Return book from <strong>${issue.studentName}</strong>?`;

    APP.confirm(msg, () => {
      const today = new Date().toISOString().split('T')[0];
      DB.update(DB.KEYS.LIB_ISSUES, issueId, {
        returnDate: today,
        fine
      });

      // Restore available copies
      const book = DB.findById(DB.KEYS.LIBRARY, issue.bookId);
      if (book) {
        DB.update(DB.KEYS.LIBRARY, issue.bookId, {
          available: Math.min(book.copies, (book.available || 0) + 1)
        });
      }

      APP.toast(
        `Book returned! ${fine > 0 ? 'Fine: ' + APP.Utils.formatCurrency(fine) : 'No fine.'}`,
        'success'
      );
      AUTH.logActivity('BOOK_RETURN',
        `Returned: ${issue.bookTitle} ← ${issue.studentName}`);
      this.renderBooks(this._currentFilter || {});
      this.renderIssued();
      this.updateStats();
    });
  },

  // ── Print Issue Slip ──────────────────────────────────────────
  printSlip(issueId) {
    const issue = DB.findById(DB.KEYS.LIB_ISSUES, issueId);
    if (!issue) return;

    const w = window.open('', '_blank', 'width=500,height=600');
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Library Slip</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
        .slip{max-width:420px;margin:auto;border:2px solid #1a6b3c;
          border-radius:10px;overflow:hidden}
        .slip-header{background:linear-gradient(135deg,#0d4a28,#1a237e);
          color:white;padding:14px 18px;text-align:center}
        .slip-header h3{font-size:0.9rem;margin:0}
        .slip-header p{font-size:0.68rem;opacity:0.8;margin:2px 0 0}
        .slip-body{padding:16px 18px}
        .slip-title{font-size:0.85rem;color:#1a6b3c;font-weight:700;
          text-transform:uppercase;letter-spacing:1px;
          border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px}
        .info-row{display:flex;justify-content:space-between;
          padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:0.82rem}
        .info-row label{color:#64748b}
        .info-row span{font-weight:600}
        .slip-footer{background:#f0fdf4;padding:12px 18px;text-align:center;
          font-size:0.72rem;color:#64748b;border-top:1px dashed #1a6b3c}
        .designed{font-size:0.62rem;color:#94a3b8;margin-top:6px}
      </style>
      </head>
      <body onload="window.print()">
      <div class="slip">
        <div class="slip-header">
          <h3>Dhanwantari Ayurved Medical College</h3>
          <p>Library Issue / Return Slip | Udgir – 413517</p>
        </div>
        <div class="slip-body">
          <div class="slip-title">📚 Library Slip</div>
          <div class="info-row">
            <label>Student Name</label>
            <span>${issue.studentName}</span>
          </div>
          <div class="info-row">
            <label>Roll No</label>
            <span>${issue.rollNo}</span>
          </div>
          <div class="info-row">
            <label>Book Title</label>
            <span>${issue.bookTitle}</span>
          </div>
          <div class="info-row">
            <label>Acc. No</label>
            <span>${issue.accNo}</span>
          </div>
          <div class="info-row">
            <label>Issue Date</label>
            <span>${APP.Utils.formatDate(issue.issueDate)}</span>
          </div>
          <div class="info-row">
            <label>Due Date</label>
            <span style="color:#dc2626">${APP.Utils.formatDate(issue.dueDate)}</span>
          </div>
          <div class="info-row">
            <label>Return Date</label>
            <span>${issue.returnDate
              ? APP.Utils.formatDate(issue.returnDate)
              : '—'}</span>
          </div>
          <div class="info-row">
            <label>Fine</label>
            <span style="color:${(issue.fine||0)>0?'#dc2626':'#16a34a'}">
              ${APP.Utils.formatCurrency(issue.fine || 0)}
            </span>
          </div>
          <div class="info-row">
            <label>Issued By</label>
            <span>${issue.issuedBy}</span>
          </div>
        </div>
        <div class="slip-footer">
          Fine: ₹2 per day after due date
          <br/>Please return books on time.
          <div class="designed">
            Designed by Dr. Jadhav V R (95183 56305) | DAMC ERP
          </div>
        </div>
      </div>
      </body></html>
    `);
    w.document.close();
  },

  // ── Add / Edit Book ───────────────────────────────────────────
  openAddBook(id = null) {
    const form  = document.getElementById('bookForm');
    const title = document.getElementById('bookModalTitle');
    form.reset();

    if (id) {
      const b = DB.findById(DB.KEYS.LIBRARY, id);
      if (!b) return;
      title.innerHTML = '<i class="fas fa-edit"></i> Edit Book';
      const map = {
        bAccNo:'accNo', bTitle:'title', bAuthor:'author',
        bPublisher:'publisher', bYear:'year', bIsbn:'isbn',
        bCategory:'category', bCopies:'copies', bLocation:'location'
      };
      Object.entries(map).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (el) el.value = b[key] || '';
      });
      form.dataset.editId = id;
    } else {
      title.innerHTML = '<i class="fas fa-plus"></i> Add New Book';
      delete form.dataset.editId;
      // Auto acc no
      const books = DB.get(DB.KEYS.LIBRARY);
      document.getElementById('bAccNo').value =
        'ACC' + String(books.length + 1).padStart(3, '0');
    }
    document.getElementById('bookModal').classList.remove('hidden');
  },

  editBook(id) { this.openAddBook(id); },

  saveBook() {
    const form  = document.getElementById('bookForm');
    const title = document.getElementById('bTitle').value.trim();
    const accNo = document.getElementById('bAccNo').value.trim();
    if (!title || !accNo) {
      APP.toast('Title and Acc. No. are required!', 'warning');
      return;
    }
    const copies = parseInt(document.getElementById('bCopies').value) || 1;
    const data = {
      accNo, title,
      author:    document.getElementById('bAuthor').value.trim(),
      publisher: document.getElementById('bPublisher').value.trim(),
      year:      document.getElementById('bYear').value,
      isbn:      document.getElementById('bIsbn').value.trim(),
      category:  document.getElementById('bCategory').value,
      copies,
      available: copies,
      location:  document.getElementById('bLocation').value.trim(),
    };

    const editId = form.dataset.editId;
    if (editId) {
      DB.update(DB.KEYS.LIBRARY, editId, data);
      APP.toast('Book updated!', 'success');
    } else {
      DB.add(DB.KEYS.LIBRARY, data);
      APP.toast('Book added!', 'success');
    }
    document.getElementById('bookModal').classList.add('hidden');
    this.renderBooks(this._currentFilter || {});
    this.updateStats();
  },

  deleteBook(id) {
    const b = DB.findById(DB.KEYS.LIBRARY, id);
    if (!b) return;
    APP.confirm(`Delete book <strong>${b.title}</strong>?`, () => {
      DB.delete(DB.KEYS.LIBRARY, id);
      APP.toast('Book deleted!', 'success');
      this.renderBooks(this._currentFilter || {});
      this.updateStats();
    });
  },

  // ── Update Stats ──────────────────────────────────────────────
  updateStats() {
    const books   = DB.get(DB.KEYS.LIBRARY);
    const issues  = DB.get(DB.KEYS.LIB_ISSUES);
    const today   = new Date();

    const totalBooks    = books.reduce((s, b) => s + (b.copies || 1), 0);
    const totalIssued   = issues.filter(i => !i.returnDate).length;
    const totalAvail    = books.reduce((s, b) => s + (b.available || 0), 0);
    const overdueCount  = issues.filter(i => {
      return !i.returnDate && new Date(i.dueDate) < today;
    }).length;
    const totalFine     = issues.reduce((s, i) => s + (i.fine || 0), 0);

    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    el('libStatTotal',    totalBooks);
    el('libStatIssued',   totalIssued);
    el('libStatAvail',    totalAvail);
    el('libStatOverdue',  overdueCount);
    el('libStatFine',     APP.Utils.formatCurrency(totalFine));
    el('libStatTitles',   books.length);
  },

  exportCSV() {
    const books = DB.get(DB.KEYS.LIBRARY);
    BACKUP.exportCSV(
      books,
      `DAMC_Library_${new Date().toISOString().split('T')[0]}`,
      ['accNo','title','author','publisher','year','isbn',
       'category','copies','available','location']
    );
    APP.toast('Library catalog exported!', 'success');
  },

  _currentFilter: {}
};
