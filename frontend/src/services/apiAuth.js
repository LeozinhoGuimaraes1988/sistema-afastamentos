import { auth } from '../firebase/config.js';

let baseURL;

// 🛠️ Detecta ambiente para definir o baseURL corretamente
if (window.location.hostname.includes('localhost')) {
  // Ambiente local → backend rodando na porta 5000
  baseURL = 'http://localhost:5000/api';
} else if (window.location.hostname.includes('render')) {
  // Se você abrir o backend direto no Render
  baseURL = 'https://gestaoafastamentos-backend.onrender.com/api';
} else if (window.location.hostname.includes('web.app')) {
  // Produção (Firebase Hosting, mas backend está no Render)
  baseURL = 'https://gestaoafastamentos-backend.onrender.com/api';
} else {
  // Fallback seguro
  baseURL = 'https://gestaoafastamentos-backend.onrender.com/api';
}

export async function fetchWithAuth(endpoint, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');

  const token = await user.getIdToken(true);
  console.log('[fetchWithAuth] Chamando:', `${baseURL}${endpoint}`);

  return fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
