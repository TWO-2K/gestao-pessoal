// public/service-worker.js
const CACHE_NAME = 'gestao-financeira-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione aqui outros recursos estáticos importantes que seu app precisa para funcionar offline.
  // Isso pode incluir CSS, JS compilado, imagens, fontes, etc.
  // Para um projeto Vite/React, os arquivos JS/CSS são geralmente gerados com hashes e não são estáticos no sentido de URL fixa.
  // Você precisaria de uma estratégia de build para listar esses arquivos ou usar uma biblioteca PWA para Vite.
  // Por enquanto, vamos incluir apenas o essencial.
  // Exemplo: '/assets/index-XXXX.css', '/assets/index-YYYY.js' (se souber os nomes gerados)
  // Como não sabemos os nomes gerados, vamos focar nos arquivos estáticos e no HTML.
  '/logo_v2.svg', // Seu favicon
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalação do Service Worker e cache de recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Service Worker: Falha ao adicionar ao cache', err))
  );
});

// Intercepta requisições e serve do cache ou da rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          return response;
        }
        // Se não estiver no cache, busca na rede
        return fetch(event.request).then(
          (response) => {
            // Verifica se recebemos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clona a resposta para poder armazená-la no cache e retorná-la
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});