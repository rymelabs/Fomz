import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Generic hook that subscribes to a Firestore query and returns live data.
 * @param {() => import('firebase/firestore').Query} queryFactory - function returning a Firestore query
 * @param {Array} deps - dependency array to re-create the subscription
 */
export const useFirestoreQuery = (queryFactory, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof queryFactory !== 'function') return undefined;

    let unsubscribe = () => {};
    try {
      const query = queryFactory();
      if (!query) return undefined;
      setLoading(true);
      unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Firestore query error', err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Firestore query setup failed', err);
      setError(err);
      setLoading(false);
    }

    return () => unsubscribe && unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
};
