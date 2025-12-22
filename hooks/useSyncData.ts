
import { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Syncs data to Firestore if user is logged in, otherwise uses localStorage.
 * Behaves exactly like useState but with persistence.
 */
export function useSyncData<T>(key: string, initialValue: T, user: User | null, loadingAuth: boolean): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 1. Initialize state from LocalStorage first (cache-first strategy) to prevent flash
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const isFirstMount = useRef(true);
  const stateRef = useRef(state); // Keep ref to avoid stale closures in snapshot

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 2. Setup Firestore Listener
  useEffect(() => {
    if (loadingAuth) return;

    if (user && db) {
        // --- ONLINE MODE: Listen to Firestore ---
        // We store data in a subcollection: users/{uid}/data/{key}
        // This prevents the document from getting too large
        const docRef = doc(db, 'users', user.uid, 'appData', key);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().value as T;
                // Only update if data is actually different to prevent loops
                // Simple JSON stringify comparison
                if (JSON.stringify(data) !== JSON.stringify(stateRef.current)) {
                    setState(data);
                    // Also update local storage as a cache/backup
                    localStorage.setItem(key, JSON.stringify(data));
                }
            } else {
                // If doc doesn't exist in cloud yet, we might want to upload our local data?
                // For simplicity, we just keep local data. 
                // The next write trigger will sync it up.
            }
        }, (error) => {
            console.error(`Sync error for ${key}:`, error);
        });

        return () => unsubscribe();
    } else {
        // --- OFFLINE/GUEST MODE: Just LocalStorage ---
        // We already loaded from LS in useState initializer.
        // But if the user logs OUT, we might want to ensure we are looking at LS data?
        // For now, the useState initializer handled the read.
    }
  }, [user, key, loadingAuth]);

  // 3. Persist State on Change
  useEffect(() => {
    if (isFirstMount.current) {
        isFirstMount.current = false;
        // On first mount, we don't write. We wait for sync or user interaction.
        return;
    }

    // Always write to LocalStorage (as cache/fallback)
    try {
        if (state === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(state));
        }
    } catch (e) {
        console.warn('LocalStorage save failed', e);
    }

    // If logged in, write to Firestore
    if (user && db) {
        const docRef = doc(db, 'users', user.uid, 'appData', key);
        // Debouncing could be added here for high-frequency updates, 
        // but for this app's frequency, direct write is usually okay.
        setDoc(docRef, { value: state }, { merge: true }).catch(err => {
            console.error(`Cloud save failed for ${key}`, err);
        });
    }

  }, [key, state, user]);

  return [state, setState];
}
