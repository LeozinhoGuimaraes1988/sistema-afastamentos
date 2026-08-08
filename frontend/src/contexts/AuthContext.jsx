import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);

  // Login inicial
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        const userClaims = tokenResult.claims;

        if (!userClaims.autorizado) {
          alert('Você não está autorizado a acessar o sistema.');
          await signOut(auth);
          setCurrentUser(null);
          return;
        }

        setCurrentUser(user);
        setClaims(userClaims);
        localStorage.setItem('loginTime', Date.now().toString());
      } else {
        setCurrentUser(null);
        setClaims({});
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Validação periódica
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentUser) return;

      const loginTime = parseInt(localStorage.getItem('loginTime'), 10);
      const now = Date.now();
      const sessionMax = 30 * 60 * 1000; // ⏱️ 30 minutos (ajuste para produção)

      if (loginTime && now - loginTime > sessionMax) {
        alert('Sessão expirada. Faça login novamente.');
        await signOut(auth);
        setCurrentUser(null);
        localStorage.removeItem('loginTime');
        window.location.href = '/login';
        return;
      }

      // Revalida token
      await currentUser.getIdToken(true);
      const tokenResult = await getIdTokenResult(currentUser);
      const updatedClaims = tokenResult.claims;

      if (!updatedClaims.autorizado) {
        alert('Permissões revogadas. Sessão encerrada.');
        await signOut(auth);
        setCurrentUser(null);
        setClaims({});
        window.location.href = '/login';
        return;
      }

      setClaims(updatedClaims);
    }, 15 * 1000); // ⏱️ Verificação a cada 15s (teste)

    return () => clearInterval(interval);
  }, [currentUser]);

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setClaims({});
    localStorage.removeItem('loginTime');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        logout,
        clienteId: claims?.clienteId || null,
        isAdmin: claims?.admin || false,
        isAutorizado: claims?.autorizado || false,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
