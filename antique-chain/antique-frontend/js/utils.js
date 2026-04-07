const AUTH_STORAGE_KEY = 'antiqchain-auth';

const ROLE_PROFILES = {
  verifier: {
    role: 'verifier',
    label: 'Expert Verifier',
    displayName: 'Suman Bastola',
    id: 'VRF-009'
  },
  admin: {
    role: 'admin',
    label: 'Platform Admin',
    displayName: 'Ariadne Cole',
    id: 'ADM-001'
  },
  collector: {
    role: 'collector',
    label: 'Collector / Buyer',
    displayName: 'Maya Chen',
    id: 'COL-214'
  }
};

const ROLE_ALIASES = {
  buyer: 'collector'
};

// ── TOAST ──
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderLeftColor = isError ? 'var(--rust-light)' : 'var(--sage-light)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session) return null;

    const normalizedRole = ROLE_ALIASES[session.role] || session.role;
    if (!ROLE_PROFILES[normalizedRole]) return null;

    return {
      ...session,
      role: normalizedRole,
      roleLabel: ROLE_PROFILES[normalizedRole].label
    };
  } catch (error) {
    return null;
  }
}

function setAuthSession(role, overrides = {}) {
  const normalizedRole = ROLE_ALIASES[role] || role;
  const profile = ROLE_PROFILES[normalizedRole] || ROLE_PROFILES.verifier;
  const session = {
    role: profile.role,
    roleLabel: profile.label,
    displayName: profile.displayName,
    id: profile.id,
    signedInAt: new Date().toISOString(),
    ...overrides
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    // Storage is best-effort for this static demo.
  }

  updateAuthUI();
  return session;
}

function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures.
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

function signOutAndRedirect() {
  clearAuthSession();
  window.location.href = getHomePath();
}

function requireDashboardSession() {
  const session = getAuthSession();
  if (!session) {
    window.location.replace(getLoginPath() + '?returnTo=' + encodeURIComponent('dashboard.html'));
    return null;
  }

  return session;
}

function updateAuthUI() {
  const session = getAuthSession();
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const pathOnly = href.split('?')[0];
    const isDashboardLink = pathOnly.endsWith('dashboard.html');
    const isLoginLink = pathOnly.endsWith('login.html');

    if (isDashboardLink) {
      link.href = session ? getDashboardPath() : getLoginPath() + '?returnTo=' + encodeURIComponent('dashboard.html');
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
