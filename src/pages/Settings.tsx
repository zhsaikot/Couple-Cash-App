import React, { useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useCoupleData } from '../lib/hooks';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  CircleDollarSign, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

interface SettingsProps {
  user: User;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const currencies = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export function Settings({ user, isDarkMode, setIsDarkMode }: SettingsProps) {
  const { coupleId, couple } = useCoupleData(user);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());
    };
    fetchUser();
  }, [user]);

  const currentCurrency = couple?.currency || '৳';

  const handleUpdateCurrency = async (symbol: string) => {
    if (!coupleId) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'couples', coupleId), {
        currency: symbol
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `couples/${coupleId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      <header className="px-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-[#38BDF8]" /> Settings
        </h1>
      </header>

      {/* Profile Section */}
      <section className="bg-white dark:bg-[#18181B] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#27272A] shadow-xl">
        <div className="flex items-center gap-6 mb-8">
           <div className="relative">
             <img src={user.photoURL || ''} className="w-20 h-20 rounded-3xl border-4 border-slate-50 dark:border-[#09090B] shadow-lg" alt={user.displayName || ''} />
             <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-[#18181B] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
             </div>
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{user.displayName}</h2>
             <p className="text-sm text-slate-400 dark:text-[#71717A] mt-1">{user.email}</p>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#09090B] rounded-2xl border border-slate-100 dark:border-transparent">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                 <UserIcon className="w-5 h-5" />
               </div>
               <div>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-widest">Account Type</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Couple Member</div>
               </div>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#09090B] rounded-2xl border border-slate-100 dark:border-transparent">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#38BDF8]/10 rounded-xl flex items-center justify-center text-[#38BDF8]">
                 <Send className="w-5 h-5" />
               </div>
               <div>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-widest">Your Code</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">{userData?.inviteCode || '...'}</div>
               </div>
             </div>
             <button 
               onClick={() => {
                 if (userData?.inviteCode) {
                   navigator.clipboard.writeText(userData.inviteCode);
                 }
               }}
               className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]"
             >
               Copy
             </button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#71717A] px-2 outline-none">Preferences</h3>
        
        <div className="bg-white dark:bg-[#18181B] rounded-[2rem] border border-slate-100 dark:border-[#27272A] divide-y divide-slate-50 dark:divide-[#27272A] overflow-hidden shadow-sm">
          
          {/* Theme Toggle */}
          <div className="p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                 <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Display Theme</div>
                 <div className="text-[10px] text-slate-400 dark:text-[#71717A] font-bold uppercase tracking-widest truncate">{isDarkMode ? 'Lunar Dark' : 'Vibrant Light'}</div>
              </div>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-300",
                isDarkMode ? "bg-[#38BDF8]" : "bg-slate-200 dark:bg-[#09090B]"
              )}
            >
              <motion.div 
                animate={{ x: isDarkMode ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white dark:bg-zinc-200 rounded-full shadow-sm"
              />
            </button>
          </div>

          {/* Currency Selection */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <CircleDollarSign className="w-5 h-5" />
              </div>
              <div>
                 <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Base Currency</div>
                 <div className="text-[10px] text-slate-400 dark:text-[#71717A] font-bold uppercase tracking-widest">Shared with partner</div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleUpdateCurrency(c.symbol)}
                  disabled={isUpdating}
                  className={cn(
                    "h-12 rounded-xl border font-bold text-lg transition-all active:scale-90 flex items-center justify-center",
                    currentCurrency === c.symbol
                      ? "bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-[#09090B] border-slate-100 dark:border-transparent text-slate-400 dark:text-[#525252] hover:text-[#38BDF8]"
                  )}
                  title={c.name}
                >
                  {c.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                 <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Smart Notifications</div>
                 <div className="text-[10px] text-slate-400 dark:text-[#71717A] font-bold uppercase tracking-widest">Transaction alerts</div>
              </div>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-300",
                notifications ? "bg-emerald-500" : "bg-slate-200 dark:bg-[#09090B]"
              )}
            >
              <motion.div 
                animate={{ x: notifications ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white dark:bg-zinc-200 rounded-full shadow-sm"
              />
            </button>
          </div>

        </div>
      </section>

      {/* Logout Action */}
      <button 
        onClick={handleLogout}
        className="w-full p-6 flex items-center justify-center gap-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-[2rem] border border-rose-500/20 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-rose-500/5 active:scale-95"
      >
        <LogOut className="w-5 h-5" /> Sign Out from App
      </button>

      <div className="text-center pb-12">
        <p className="text-[10px] text-slate-400 dark:text-[#525252] font-bold uppercase tracking-widest">CoupleCash Version 1.4.2</p>
      </div>

    </motion.div>
  );
}
