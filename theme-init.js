(function () {
  try {
    var theme = window.localStorage && window.localStorage.getItem('wcx12-theme');
    if (!/^(neon|warm|mono)$/.test(theme || '')) return;
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', {
        neon: '#070914',
        warm: '#160d08',
        mono: '#050505'
      }[theme]);
    }
  } catch (error) {
    document.documentElement.dataset.theme = 'neon';
  }
}());
