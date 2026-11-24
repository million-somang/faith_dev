const CACHE_NAME = 'faithportal-v11';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png'
];

self.addEventListener('install', (event) => {
  // 새로운 서비스 워커가 즉시 대기 상태를 건너뛰고 활성화되도록 함
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // 이전 버전의 캐시를 모두 삭제
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 오디오·비디오 Range 스트리밍(/api/user/drive/stream/ 등), API 호출, Next.js RSC 라우트 전환 요청은
  // 서비스 워커가 가로채지 않고 브라우저 네이티브 네트워크 스택이 직접 처리하도록 우회
  const req = event.request;
  if (
    req.method !== 'GET' ||
    req.headers.has('range') ||
    req.url.includes('/api/') ||
    req.url.includes('/_next/')
  ) {
    return;
  }
});

// ===== Web Push Notifications =====
self.addEventListener('push', (event) => {
  let data = {
    title: '📢 [VERA 알림]',
    body: '새로운 알림이 도착했습니다.',
    url: '/mypage',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
  };
  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        data = Object.assign(data, parsed);
      }
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-192.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/mypage',
      notificationId: data.notificationId || null,
      category: data.category || 'system',
      extra: data.data || null,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/mypage';
  const notificationId = event.notification.data?.notificationId || null;
  let targetUrl;
  try {
    targetUrl = new URL(rawUrl, self.location.origin);
  } catch (e) {
    targetUrl = new URL('/mypage', self.location.origin);
  }

  const targetRelativeUrl = targetUrl.pathname + targetUrl.search + targetUrl.hash;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let sameOriginClient = null;
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin !== self.location.origin) continue;
          if (!sameOriginClient) sameOriginClient = client;

          if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            client.postMessage({
              type: 'VERA_NOTIFICATION_NAVIGATE',
              url: targetRelativeUrl,
              notificationId,
            });
            return client.focus();
          }
        } catch (e) {
          // ignore invalid client URL
        }
      }

      if (sameOriginClient) {
        if ('navigate' in sameOriginClient) {
          return sameOriginClient
            .navigate(targetUrl.href)
            .then((navigatedClient) => {
              const target = navigatedClient || sameOriginClient;
              return 'focus' in target ? target.focus() : undefined;
            })
            .catch(() => ('focus' in sameOriginClient ? sameOriginClient.focus() : undefined));
        }
        if ('focus' in sameOriginClient) {
          return sameOriginClient.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
      return undefined;
    })
  );
});
