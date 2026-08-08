import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const useServidores = () => {
  const { currentUser } = useAuth();
  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const fetchServidores = async () => {
    setLoading(true);
    try {
      const servidoresRef = collection(db, 'servidores');
      const snapshot = await getDocs(servidoresRef);

      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      lista.sort((a, b) => a.nome.localeCompare(b.nome));
      setServidores(lista);
    } catch (err) {
      setErro('Erro ao buscar servidores.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchServidores();
    }
  }, [currentUser]);

  return { servidores, fetchServidores, loading, erro };
};

export default useServidores;
