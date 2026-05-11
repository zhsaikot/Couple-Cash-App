import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';

import { handleFirestoreError, OperationType } from './errorUtils';

export function useCoupleData(user: User | null) {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [couple, setCouple] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'couples'),
      where('members', 'array-contains', user.uid),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const doc = snap.docs[0];
        setCoupleId(doc.id);
        setCouple({ id: doc.id, ...doc.data() });
      } else {
        setCoupleId(null);
        setCouple(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'couples_search');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { coupleId, couple, loading };
}

export function useTransactions(coupleId: string | null, max: number = 50) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'couples', coupleId, 'transactions'),
      orderBy('date', 'desc'),
      limit(max)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `couples/${coupleId}/transactions`);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId, max]);

  return { transactions, loading };
}

export function useDebts(coupleId: string | null) {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      setDebts([]);
      return;
    }

    const q = query(
      collection(db, 'couples', coupleId, 'debts'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setDebts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `couples/${coupleId}/debts`);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  return { debts, loading };
}
