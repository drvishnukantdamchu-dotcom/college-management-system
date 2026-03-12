/**
 * DAMC ERP — Backup & Restore Module
 * Export entire database as JSON
 * Import JSON to restore on any device
 */

const BACKUP = {

  // ─── Export Full Backup ───────────────────────────────────────────
  exportFull() {
    try {
      const backup = DB.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `DAMC_ERP_Backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      AUTH.logActivity('BACKUP', 'Full system backup exported');
      return { success: true, message: '✅ Backup downloaded successfully!' };
    } catch(e) {
      return { success: false, message: '❌ Backup failed: ' + e.message };
    }
  },

  // ─── Export Specific Module ───────────────────────────────────────
  exportModule(moduleName, key) {
    try {
      const data = {
        version: '2.0',
        module: moduleName,
        exportedAt: new Date().toISOString(),
        records: DB.get(key)
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DAMC_${moduleName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: `✅ ${moduleName} data exported!` };
    } catch(e) {
      return { success: false, message: '❌ Export failed: ' + e.message };
    }
  },

  // ─── Import / Restore Backup ──────────────────────────────────────
  importBackup(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.name.endsWith('.json')) {
        reject({ success: false, message: '❌ Please select a valid .json backup file!' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          const result = DB.importBackup(backup);
          if (result.success) {
            AUTH.logActivity('RESTORE', 'System restored from backup');
          }
          resolve(result);
        } catch(err) {
          reject({ success: false, message: '❌ Invalid JSON file: ' + err.message });
        }
      };
      reader.onerror = () => reject({ success: false, message: '❌ File read error!' });
      reader.readAsText(file);
    });
  },

  // ─── Auto Backup (Every 24 hours) ────────────────────────────────
  autoBackup() {
    const lastBackup = localStorage.getItem('damc_last_auto_backup');
    const now = Date.now();
    if (!lastBackup || (now - parseInt(lastBackup)) > 86400000) {
      const backup = DB.exportBackup();
      localStorage.setItem('damc_auto_backup', JSON.stringify(backup));
      localStorage.setItem('damc_last_auto_backup', now.toString());
      console.log('✅ Auto backup saved:', new Date().toLocaleString());
    }
  },

  // ─── Restore from Auto Backup ─────────────────────────────────────
  restoreAutoBackup() {
    const backup = localStorage.getItem('damc_auto_backup');
    if (!backup) return { success: false, message: 'No auto backup found!' };
    try {
      const result = DB.importBackup(JSON.parse(backup));
      return result;
    } catch(e) {
      return { success: false, message: 'Auto restore failed: ' + e.message };
    }
  },

  // ─── Export to CSV ────────────────────────────────────────────────
  exportCSV(data, filename, headers) {
    try {
      let csv = headers.join(',') + '\n';
      data.forEach(row => {
        const line = headers.map(h => {
          const key = h.toLowerCase().replace(/ /g,'');
          const val = row[key] || row[h] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csv += line.join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch(e) {
      return { success: false, message: e.message };
    }
  }
};

// Run auto-backup on load
BACKUP.autoBackup();
