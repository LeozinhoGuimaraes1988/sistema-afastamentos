import { getIdTokenResult, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

// Verifica se o usuário tem autorização via claims
export const checkCustomClaims = async (user, redirectIfBlocked = false) => {
  const tokenResult = await getIdTokenResult(user);

  const claims = tokenResult.claims;

  if (!claims.autorizado) {
    console.warn('Usuário não autorizado. Acesso liberado temporariamente.');

    if (redirectIfBlocked) {
      alert('Seu acesso ainda não foi autorizado.');
      await signOut(auth);
      window.location.href = '/login';
    }

    return { autorizado: false, clienteId: null };
  }

  return {
    autorizado: true,
    clienteId: claims.clienteId || null,
  };
};
