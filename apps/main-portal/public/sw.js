const CACHE_NAME = 'faithportal-v3';
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
  // 개발 및 실시간 배포 동기화를 위해 정적 캐싱을 완전히 우회하고 네트워크에서 최신 데이터만 로드하도록 강제 적용
  event.respondWith(fetch(event.request));
});
