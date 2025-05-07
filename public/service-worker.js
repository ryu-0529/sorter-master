/* eslint-disable no-restricted-globals */

// キャッシュの名前
const CACHE_NAME = 'sorter-master-cache-v1';

// キャッシュするリソース
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/images/logo.png'
];

// インストール時のイベントハンドラ
self.addEventListener('install', (event) => {
  // インストール処理を待機
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// アクティベート時のイベントハンドラ
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('古いキャッシュを削除します:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// フェッチ時のイベントハンドラ
self.addEventListener('fetch', (event) => {
  // APIリクエストやFirebaseリクエストはキャッシュしない
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにリソースがある場合
        if (response) {
          return response;
        }
        
        // リクエストのクローンを作成（リクエストは一度しか使用できないため）
        const fetchRequest = event.request.clone();
        
        // ネットワークリクエスト
        return fetch(fetchRequest)
          .then((response) => {
            // レスポンスが無効な場合
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスのクローンを作成（レスポンスは一度しか使用できないため）
            const responseToCache = response.clone();
            
            // キャッシュに追加
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // オフラインの場合、キャッシュに保存されたメインページを返す
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return null;
          });
      })
  );
});

// プッシュメッセージのイベントハンドラ
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || '新しい通知があります',
      icon: '/logo192.png',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || '仕分け職人',
        options
      )
    );
  }
});

// 通知クリック時のイベントハンドラ
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // 通知のクリックでアプリを開く
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
