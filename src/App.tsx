import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Debts } from './pages/Debts';
import { Login } from './pages/Login';
import { CoupleLink } from './pages/CoupleLink';
import { Settings } from './pages/Settings';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(pre-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce user doc exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: new Date().toISOString(),
          });
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white dark:bg-zinc-950">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      <BrowserRouter>
        {user && <Navbar />}
        <main className="container mx-auto px-4 pb-24 pt-6 max-w-lg">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/transactions" element={user ? <Transactions user={user} /> : <Navigate to="/login" />} />
              <Route path="/debts" element={user ? <Debts user={user} /> : <Navigate to="/login" />} />
              <Route path="/couple" element={user ? <CoupleLink user={user} /> : <Navigate to="/login" />} />
              <Route path="/settings" element={user ? <Settings user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /> : <Navigate to="/login" />} />
            </Routes>
          </AnimatePresence>
        </main>
        {user && (
          <footer className="fixed bottom-0 left-0 right-0 py-4 text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 z-40">
            © Ziaul Hasan Saikot
          </footer>
        )}
      </BrowserRouter>
    </div>
  );
}
