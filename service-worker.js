/* globals self, Response */

// this is needed to create a binary-different file when
// I don't need to make any actual changes to this file
const VERSION = 'v1.0.0';
const WORKER = '👷';
const KEY = 'heic-app-v1';
const APP_PATHS = [
  './',
  // modules
  './src/loader.js',
  './src/toast.js',
  './src/event-emitter.js',
  './src/storage.js',
  './src/menu.js',
  './src/progress.js',
  './src/controls.js',
  './src/open.js',
  './src/convert.js',
  './src/download.js',
  // style and assets
  './src/style.css',
  './manifest.json',
  './assets/icon-512.png',
];

const CDN_PATHS = [
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://cdn.jsdelivr.net/npm/toastify-js@1.6.1/src/toastify.min.css',
  'https://cdn.jsdelivr.net/npm/toastify-js@1.6.1/src/toastify.min.js',
  'https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js',
  'https://cdn.jsdelivr.net/npm/libheif-js@1.6.2/libheif/libheif.min.js',
];

// eslint-disable-next-line no-console
const log = (first, ...args) => console.log(`${WORKER} ${VERSION} - ${first}`, ...args);

const serveShareTarget = event => {
  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect(event.request.url));

  event.waitUntil(async function () {
    const data = await event.request.formData();
    const client = await self.clients.get(event.resultingClientId);
    const file = data.get('file');
    client.postMessage({ file, action: 'load-image' });
  }());
};

const createCache = async (allowDelete = true) => {
  const cache = await caches.open(KEY);
  const keys = await cache.keys();

  let newCdnPaths = [].concat(CDN_PATHS);
  const deletePaths = [];

  keys.forEach(({ url }) => {
    // this is a CDN file that we still expect, leave it
    if (CDN_PATHS.includes(url)) {
      newCdnPaths = newCdnPaths.filter(u => u !== url);
      return;
    }

    deletePaths.push(url);
  });

  if (allowDelete) {
    log('CACHE DELETE', deletePaths);
    await Promise.all(deletePaths.map(u => cache.delete(u)));
  }

  const newCachePaths = [].concat(APP_PATHS).concat(newCdnPaths);
  log('CACHE ADD', newCachePaths);
  await cache.addAll(newCachePaths);
};

self.addEventListener('install', (event) => {
  log('INSTALL start');
  const start = Date.now();
  event.waitUntil((async () => {
    await createCache(false);
    await self.skipWaiting();
    log(`INSTALL done in ${Date.now() - start}ms`);
  })());
});

self.addEventListener('activate', (event) => {
  log('ACTIVATE start');
  const start = Date.now();
  event.waitUntil((async () => {
    await createCache();
    await self.clients.claim();
    log(`ACTIVATE done in ${Date.now() - start}ms`);
  })());
});

self.addEventListener('fetch', (event) => {
  log('fetch', event.request.method, event.request.url);
  const url = new URL(event.request.url);

  const isSameOrigin = url.origin === location.origin;
  const isShareTarget = isSameOrigin && url.searchParams.has('share-target');
  const isSharePost = isShareTarget && event.request.method === 'POST';

  if (isSharePost) {
    log('handling share target request');
    return void serveShareTarget(event);
  }

  const local = {
    host: location.hostname === 'localhost',
    ip: /^([0-9]+\.){3}[0-9]+$/.test(location.hostname)
  };
  const isLocal = local.ip;

  if (isLocal) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(KEY);
    const response = !isShareTarget ?
      await cache.match(event.request) :
      await cache.match(event.request, { ignoreSearch: true });

    if (response) {
      log('serving cache result for', event.request.method, event.request.url);
      return response;
    }

    log('serving network result for', event.request.method, event.request.url);
    return fetch(event.request);
  })());
});
