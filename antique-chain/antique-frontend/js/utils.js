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
  console.log('setAuthSession: Starting, user:', user, 'token present:', !!token);
  if (!user || !token) {
    console.log('setAuthSession: No user or token, returning');
    return null;
  }

  const sessionData = {
    ...user,
    signedInAt: new Date().toISOString()
  };

  console.log('setAuthSession: Session data created:', sessionData);

  try {
    // Clear old auth data first
    console.log('setAuthSession: Clearing old auth data');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);

    console.log('setAuthSession: Old data cleared, saving new data, rememberPreference:', rememberPreference);
    if (rememberPreference === false) {
      sessionStorage.setItem(TOKEN_SESSION_KEY, token);
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData));
    }
    console.log('setAuthSession: Data saved to storage');
  } catch (error) {
    console.error('setAuthSession: Storage error:', error);
    // Storage is best-effort
  }

  console.log('setAuthSession: Calling updateAuthUI');
  updateAuthUI();
  console.log('setAuthSession: updateAuthUI completed');
  
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
  console.log('updateAuthUI: Starting');
  const session = getAuthSession();
  console.log('updateAuthUI: Session retrieved:', !!session);
  
  const navLinks = document.querySelectorAll('.nav-links a');
  console.log('updateAuthUI: Found', navLinks.length, 'nav links');

  navLinks.forEach((link, index) => {
    console.log('updateAuthUI: Processing link', index);
    const href = link.getAttribute('href');
    if (!href) {
      console.log('updateAuthUI: Link', index, 'has no href, skipping');
      return;
    }

    const pathOnly = href.split('?')[0];
    const isDashboardLink = pathOnly.endsWith('dashboard.html');
    const isLoginLink = pathOnly.endsWith('login.html');

    if (isDashboardLink) {
      link.href = session
        ? getDashboardPath()
        : getLoginPath() + '?returnTo=' + encodeURIComponent('dashboard.html');
      console.log('updateAuthUI: Updated dashboard link');
    }

    if (isLoginLink) {
      if (session) {
        link.textContent = 'Sign Out';
        link.href = '#';
        link.dataset.authAction = 'logout';
        console.log('updateAuthUI: Updated login link to Sign Out');
      } else {
        link.textContent = 'Sign In';
        link.href = getLoginPath();
        delete link.dataset.authAction;
        console.log('updateAuthUI: Updated login link to Sign In');
      }
    }
  });

  console.log('updateAuthUI: Setting up logout handlers');
  document.querySelectorAll('[data-auth-action="logout"]').forEach(link => {
    link.onclick = event => {
      event.preventDefault();
      signOutAndRedirect();
    };
  });
  console.log('updateAuthUI: Completed');
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