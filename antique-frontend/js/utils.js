const TOKEN_STORAGE_KEY = 'antiqchain-token';
const USER_STORAGE_KEY = 'antiqchain-user';
const TOKEN_SESSION_KEY = 'antiqchain-token-session';
const USER_SESSION_KEY = 'antiqchain-user-session';

// ── TOAST ──
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.style.borderLeftColor = isError ? 'var(--rust-light)' : 'var(--sage-light)';
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 3500);
}

let _appConfirmResolver = null;
let _appConfirmHandlersBound = false;

function bindAppConfirmHandlers(overlay, modalEl) {
  if (_appConfirmHandlersBound) return;
  _appConfirmHandlersBound = true;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) finishAppConfirm(false);
  });

  modalEl.querySelector('[data-app-confirm-cancel]').addEventListener('click', () =>
    finishAppConfirm(false)
  );
  modalEl.querySelector('[data-app-confirm-primary]').addEventListener('click', () =>
    finishAppConfirm(true)
  );
  modalEl.querySelector('.app-confirm-close').addEventListener('click', () =>
    finishAppConfirm(false)
  );

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const o = document.getElementById('app-confirm-overlay');
    if (o && o.classList.contains('open')) finishAppConfirm(false);
  });
}

function ensureAppConfirmDialog() {
  let overlay = document.getElementById('app-confirm-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'app-confirm-overlay';
  overlay.className = 'app-confirm-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">' +
    '<div class="app-confirm-head">' +
    '<h2 id="app-confirm-title" class="app-confirm-title"></h2>' +
    '<button type="button" class="app-confirm-close" aria-label="Close">&times;</button>' +
    '</div><div class="app-confirm-body">' +
    '<p class="app-confirm-message"></p>' +
    '<div class="app-confirm-actions">' +
    '<button type="button" class="btn-sm btn-review" data-app-confirm-cancel></button>' +
    '<button type="button" class="btn-sm btn-approve" data-app-confirm-primary></button>' +
    '</div></div></div>';

  document.body.appendChild(overlay);
  bindAppConfirmHandlers(overlay, overlay.querySelector('.app-confirm-modal'));
  return overlay;
}

function finishAppConfirm(result) {
  const overlay = document.getElementById('app-confirm-overlay');
  if (!overlay || !overlay.classList.contains('open')) return;

  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');

  document.body.style.overflow = '';

  if (!_appConfirmResolver) return;

  const res = _appConfirmResolver;
  _appConfirmResolver = null;
  res(Boolean(result));
}

/**
 * Promisified confirmation dialog (replaces native confirm).
 * @param {{
 *   title?: string,
 *   message?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   danger?: boolean
 * }} opts
 */
function showAppConfirm(opts = {}) {
  return new Promise(resolve => {
    const overlay = ensureAppConfirmDialog();
    const modal = overlay.querySelector('.app-confirm-modal');
    const titleEl = modal.querySelector('.app-confirm-title');
    const msgEl = modal.querySelector('.app-confirm-message');
    const cancelBtn = modal.querySelector('[data-app-confirm-cancel]');
    const primaryBtn = modal.querySelector('[data-app-confirm-primary]');

    if (_appConfirmResolver) finishAppConfirm(false);

    titleEl.textContent = opts.title || 'Confirm';
    msgEl.textContent = opts.message || '';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';
    primaryBtn.textContent = opts.confirmLabel || 'OK';
    primaryBtn.classList.remove('btn-approve', 'btn-reject');
    primaryBtn.classList.add(opts.danger ? 'btn-reject' : 'btn-approve');

    _appConfirmResolver = resolve;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    primaryBtn.focus();
  });
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function getStoredToken() {
  return (
    sessionStorage.getItem(TOKEN_SESSION_KEY) ||
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

function getStoredUser() {
  const rawUser =
    sessionStorage.getItem(USER_SESSION_KEY) ||
    localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) return null;
  return safeParseJSON(rawUser);
}

function getAuthSession() {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) return null;

  return {
    token,
    ...user
  };
}

function setAuthSession(user, token, rememberPreference = true) {
  if (!user || !token) {
    return null;
  }

  const sessionData = {
    ...user,
    signedInAt: new Date().toISOString()
  };

  try {
    // Clear old auth data first
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);

    if (rememberPreference === false) {
      sessionStorage.setItem(TOKEN_SESSION_KEY, token);
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('setAuthSession: Storage error:', error);
    // Storage is best-effort
  }

  updateAuthUI();
  
  return {
    token,
    ...sessionData
  };
}

function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    // Ignore storage failures
  }

  updateAuthUI();
}

function getPagePath(pageName) {
  return window.location.pathname.includes('/pages/') ? pageName : 'pages/' + pageName;
}

function getLoginPath() {
  return getPagePath('login.html');
}

function getDashboardPath() {
  return getPagePath('dashboard.html');
}

function getHomePath() {
  return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

function getPostLoginPath() {
  const search = new URLSearchParams(window.location.search);
  return search.get('returnTo') || getDashboardPath();
}

function getCurrentPageName() {
  return window.location.pathname.split('/').pop() || '';
}

function normalizeUserRole(role) {
  const raw = String(role || '').toLowerCase().trim();
  if (raw === 'user' || raw === 'collector') return 'collector';
  if (raw === 'verifier') return 'verifier';
  if (raw === 'admin') return 'admin';
  return 'collector';
}

function signOutAndRedirect() {
  clearAuthSession();
  window.location.href = getHomePath();
}

function requireDashboardSession() {
  return requirePageSession('dashboard.html');
}

function requirePageSession(returnToPage) {
  const session = getAuthSession();
  if (session) return session;

  const fallback = getCurrentPageName() || 'dashboard.html';
  const returnTo = returnToPage || fallback;

  const params = new URLSearchParams({
    returnTo: returnTo,
    unauthorized: '1'
  });

  window.location.replace(getLoginPath() + '?' + params.toString());
  return null;
}

function updateAuthUI() {
  const session = getAuthSession();
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    const pathOnly = href.split('?')[0];
    const isDashboardLink = pathOnly.endsWith('dashboard.html');
    const isLoginLink = pathOnly.endsWith('login.html');
    const isSubmitLink = pathOnly.endsWith('submit.html');
    const isTicketsLink = pathOnly.endsWith('tickets.html');

    if (isDashboardLink) {
      link.href = session
        ? getDashboardPath()
        : getLoginPath() + '?returnTo=' + encodeURIComponent('dashboard.html');
    }

    if (isTicketsLink) {
      if (!session) {
        link.href = getLoginPath() + '?returnTo=' + encodeURIComponent('tickets.html');
      } else {
        const role = normalizeUserRole(session.role);
        if (role === 'admin') {
          // Admins manage tickets from the dashboard
          link.style.display = 'none';
        } else {
          link.href = getPagePath('tickets.html');
          link.style.display = '';
        }
      }
    }

    if (isLoginLink) {
      if (session) {
        link.textContent = 'Sign Out';
        link.href = '#';
        link.dataset.authAction = 'logout';
      } else {
        link.textContent = 'Sign In';
        link.href = getLoginPath();
        delete link.dataset.authAction;
      }
    }

    if (isSubmitLink) {
      if (!session) {
        link.href = getLoginPath() + '?returnTo=' + encodeURIComponent('submit.html');
      } else {
        const role = normalizeUserRole(session.role);
        if (role !== 'collector') {
          link.href = getDashboardPath();
          link.style.display = 'none';
        } else {
          link.href = getPagePath('submit.html');
          link.style.display = '';
        }
      }
    }
  });

  document.querySelectorAll('[data-auth-action="logout"]').forEach(link => {
    link.onclick = event => {
      event.preventDefault();
      signOutAndRedirect();
    };
  });
}

// ── ACTIVE NAV LINK ──
(function () {
  const path = window.location.pathname;

  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;

    const normalizedHref = href.split('?')[0].replace(/^.*\//, '');
    if (path.endsWith(normalizedHref)) {
      a.classList.add('active');
    }
  });

  updateAuthUI();
})();