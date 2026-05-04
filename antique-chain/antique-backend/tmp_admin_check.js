const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // Login as admin
    const loginData = JSON.stringify({ email: 'admin@example.com', password: 'demo123456' });
    const loginRes = await request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, loginData);
    console.log('Login status', loginRes.status, loginRes.body);
    const loginJson = JSON.parse(loginRes.body);
    const token = loginJson.token;

    const pendingRes = await request({ hostname: 'localhost', port: 5000, path: '/api/auth/pending-users', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
    console.log('Pending users status', pendingRes.status, pendingRes.body);
  } catch (err) {
    console.error('Error', err);
  }
})();
