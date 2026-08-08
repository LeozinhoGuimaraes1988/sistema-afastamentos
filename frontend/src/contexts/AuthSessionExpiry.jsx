// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  getIdTokenResult,
} from 'firebase/auth';
import { app } from '../firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // Verifica autenticação ao iniciar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser, true);
        if (!tokenResult.claims.autorizado) {
          alert('Você não está autorizado a acessar o sistema.');
          await signOut(auth);
          return;
        }
        setUser(currentUser);
        localStorage.setItem('loginTime', Date.now().toString());
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificação periódica de token + expiração
  useEffect(() => {
    const interval = setInterval(async () => {
      const loginTime = localStorage.getItem('loginTime');
      const now = Date.now();
      const maxSessionTime = 30 * 60 * 1000; // 30 minutos

      if (user && loginTime && now - parseInt(loginTime) > maxSessionTime) {
        alert('Sessão expirada. Faça login novamente.');
        await signOut(auth);
        setUser(null);
        localStorage.removeItem('loginTime');
        window.location.href = '/login';
        return;
      }

      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        if (!tokenResult.claims.autorizado) {
          alert('Permissões revogadas. Sessão encerrada.');
          await signOut(auth);
          setUser(null);
          window.location.href = '/login';
        }
      }
    }, 5 * 1000); // a cada 5 minutos

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
