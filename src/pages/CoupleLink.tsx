import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Heart, Copy, Check, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/errorUtils';

export function CoupleLink({ user }: { user: User }) {
  const [inviteCode, setInviteCode] = useState('');
  const [userInviteCode, setUserInviteCode] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'linking' | 'success'>('idle');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserInviteCode(snap.data().inviteCode);
        if (snap.data().coupleId) {
          navigate('/');
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });
    return unsub;
  }, [user, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(userInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      setError('Please enter a valid invite code');
      return;
    }
    if (inviteCode === userInviteCode) {
      setError("You can't link with yourself!");
      return;
    }

    setStatus('linking');
    setError('');

    try {
      // Find the partner
      const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode.toUpperCase()));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        setError('Invalid invite code. Please check and try again.');
        setStatus('idle');
        return;
      }

      const partnerDoc = querySnap.docs[0];
      const partnerData = partnerDoc.data();

      if (partnerData.coupleId) {
        setError('This partner is already linked to someone else.');
        setStatus('idle');
        return;
      }

      // Create Couple document
      const coupleRef = await addDoc(collection(db, 'couples'), {
        members: [user.uid, partnerDoc.id],
        createdAt: serverTimestamp(),
        currency: 'BDT'
      });

      // Update current user
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: coupleRef.id,
        partnerId: partnerDoc.id
      });

      // Update partner user
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        coupleId: coupleRef.id,
        partnerId: user.uid
      });

      setStatus('success');
      setTimeout(() => navigate('/'), 1500);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'linking_process');
      setError('An error occurred. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Connect Your Partner</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm">Share your code or enter your partner's code to link accounts.</p>
      </div>

      {/* User's Code */}
      <section className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-3xl p-8 shadow-sm text-center">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#71717A] mb-4 block">Your Invite Code</label>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-4xl font-black tracking-tighter text-[#38BDF8] letter-spacing-widest font-mono">
            {userInviteCode || '------'}
          </div>
          <button 
            onClick={handleCopy}
            className="p-3 bg-slate-50 dark:bg-[#09090B] rounded-2xl border border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#18181B] transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> 
          Waiting for your other half
        </div>
      </section>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-[#27272A]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 dark:bg-[#09090B] px-4 text-slate-400 dark:text-[#71717A] font-bold tracking-widest">OR</span>
        </div>
      </div>

      {/* Enter Partner's Code */}
      <section className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-3xl p-8 shadow-sm">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#71717A] mb-4 block">Enter Partner's Code</label>
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="E.G. AB12CD"
              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-4 pl-12 text-lg font-bold placeholder:text-slate-300 dark:placeholder:text-[#27272A] focus:ring-2 focus:ring-[#38BDF8] transition-all font-mono text-slate-900 dark:text-white"
            />
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-[#71717A]" />
          </div>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex items-center gap-2 text-rose-500 text-xs font-bold px-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <button 
            onClick={handleLink}
            disabled={status !== 'idle'}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
              status === 'success' ? "bg-emerald-500 text-white" : "bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white dark:text-[#09090B] shadow-sky-500/20"
            )}
          >
            {status === 'linking' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : status === 'success' ? (
              <>
                <Heart className="w-5 h-5 fill-white" /> Linked Successfully!
              </>
            ) : (
              "Connect Now"
            )}
          </button>
        </div>
      </section>
    </motion.div>
  );
}
