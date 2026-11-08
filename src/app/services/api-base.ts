const esServidorAngularLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port !== '' &&
  window.location.port !== '8080';

// Angular puede elegir otro puerto cuando 4200 está ocupado. En desarrollo la
// API continúa en 5219; en la publicación 8080 y por Cloudflare se usa /api.
export const API_BASE_URL = esServidorAngularLocal
  ? 'http://localhost:5219/api'
  : '/api';
