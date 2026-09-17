// ══════════════════════════════════════════════
//  CHAT — Service Worker
//  Ermöglicht: Push-Benachrichtigungen, Offline-Modus
// ══════════════════════════════════════════════

const CACHE = 'chat-v1';
const ASSETS = ['/', '/index.html'];

// Installation: App-Dateien cachen
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Netzwerk-Anfragen: erst Cache, dann Netz
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push-Benachrichtigung empfangen
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'Chat';
  const options = {
    body: data.body || 'Neue Nachricht',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'chat-msg',
    renotify: true,
    silent: false,
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Öffnen' },
      { action: 'dismiss', title: 'Schließen' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Klick auf Benachrichtigung
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});

// Simulierte Push-Nachricht (da kein Server vorhanden)
// Wird von der App selbst über postMessage getriggert
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title || 'Chat', {
      body: body || 'Du hast eine neue Nachricht',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'chat',
      renotify: true,
      vibrate: [100, 50, 100],
      silent: false,
      actions: [
        { action: 'open', title: 'Öffnen' }
      ]
    });
  }
});
