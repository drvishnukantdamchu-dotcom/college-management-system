const CACHE_NAME = 'damc-erp-v2';
const URLS_TO_CACHE = [
  '/college-management-system/',
  '/college-management-system/index.html',
  '/college-management-system/pages/dashboard.html',
  '/college-management-system/pages/students.html',
  '/college-management-system/pages/faculty.html',
  '/college-management-system/pages/attendance.html',
  '/college-management-system/pages/fees.html',
  '/college-management-system/pages/timetable.html',
  '/college-management-system/pages/exams.html',
  '/college-management-system/pages/library.html',
  '/college-management-system/pages/hostel.html',
  '/college-management-system/pages/reports.html',
  '/college-management-system/assets/css/main.css',
  '/college-management-system/assets/css/dashboard.css',
  '/college-management-system/assets/js/app.js',
  '/college-management-system/assets/js/db.js',
  '/college-management-system/assets/js/auth.js',
  '/college-management-system/assets/js/backup.js',
  '/college-management-system/assets/js/students.js',
  '/college-management-system/assets/js/faculty.js',
  '/college-management-system/assets/js/attendance.js',
  '/college-management-system/assets/js/fees.js',
  '/college-management-system/assets/js/timetable.js',
  '/college-management-system/assets/js/exams.js',
  '/college-management-system/assets/js/library.js',
  '/college-management-system/assets/js/reports.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/college-management-system/index.html'));
    })
  );
});
