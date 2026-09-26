(function () {
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
