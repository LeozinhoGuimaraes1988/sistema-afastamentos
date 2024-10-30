import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth.js';

import { useState, useEffect } from 'react';

export const useAuthentication = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);

  //cleanup
  //deal with memory leak
  const [cancelled, setCancelled] = useState(false);

  //pegando autenticação
  const auth = getAuth();

  //função para checar autenticação
  function checkIfIsCancelled() {
    if (cancelled) {
      return;
    }
  }
};
