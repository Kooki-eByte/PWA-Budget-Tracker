const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/js/index.js",
  "/js/db.js",
  "/css/styles.css",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
];

const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE && key !== DATA_CACHE) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (evt) {
  // cache successful requests to the API
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches
        .open(DATA_CACHE)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );
  } else {
    evt.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(evt.request).then((response) => {
          return response || fetch(evt.request);
        });
      })
    );
  }

  // if the request is not for the API, serve static assets using "offline-first" approach.
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
});
