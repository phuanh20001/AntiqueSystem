// ── TOAST ──
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderLeftColor = isError ? 'var(--rust-light)' : 'var(--sage-light)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── ACTIVE NAV LINK ──
(function () {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') && path.endsWith(a.getAttribute('href').replace(/^.*\//, ''))) {
      a.classList.add('active');
    }
  });
})();
