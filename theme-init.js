(function () {
  // Establish motion state before the article DOM is parsed, not after layout.
  var motionDisabled = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { motionDisabled = motionDisabled || localStorage.getItem('wcx12-motion') === 'off'; } catch (error) {}
  document.documentElement.dataset.motion = motionDisabled ? 'off' : 'on';
  document.documentElement.dataset.blogMotion = motionDisabled ? 'off' : 'on';
  // Native navigation can be cancelled before deferred modules install listeners.
  function observeTransition(event) {
    if (!event.viewTransition) return;
    ['ready', 'finished', 'updateCallbackDone'].forEach(function (name) {
      event.viewTransition[name].catch(function () {});
    });
    var disabled = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { disabled = disabled || localStorage.getItem('wcx12-motion') === 'off'; } catch (error) {}
    if (disabled) event.viewTransition.skipTransition();
  }
  window.addEventListener('pageswap', observeTransition);
  window.addEventListener('pagereveal', observeTransition);
  try {
    var theme = window.localStorage && window.localStorage.getItem('wcx12-theme');
    if (!/^(neon|warm|mono)$/.test(theme || '')) return;
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', {
        neon: '#101416',
        warm: '#191819',
        mono: '#101010'
      }[theme]);
    }
  } catch (error) {
    document.documentElement.dataset.theme = 'neon';
  }
}());
