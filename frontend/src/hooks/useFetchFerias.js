import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const useFetchFerias = (docCollection) => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const collectionRef = collection(db, docCollection);

    const q = query(collectionRef, orderBy('desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setDocuments(
          querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [docCollection]);

  return { documents, loading, error };
};
