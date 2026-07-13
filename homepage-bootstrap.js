const bootstrapUrl = new URL(import.meta.url);
const appUrl = new URL('./script.js', bootstrapUrl);
const assetVersion = bootstrapUrl.searchParams.get('v');

if (assetVersion) appUrl.searchParams.set('v', assetVersion);

let started = false;

function startHomepage() {
  if (started) return;
  started = true;
  import(appUrl.href).catch((error) => {
    document.documentElement.dataset.homepageError = 'true';
    console.error('Homepage enhancement failed to load.', error);
  });
}

if ('PerformanceObserver' in window) {
  const paintObserver = new PerformanceObserver((list, observer) => {
    if (!list.getEntries().some((entry) => entry.name === 'first-contentful-paint')) return;
    observer.disconnect();
    startHomepage();
  });
  paintObserver.observe({ type: 'paint', buffered: true });
  window.setTimeout(startHomepage, 1200);
} else {
  requestAnimationFrame(() => window.setTimeout(startHomepage, 0));
}
