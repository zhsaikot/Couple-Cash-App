import { User } from 'firebase/auth';
import { useCoupleData, useTransactions } from '../lib/hooks';
import { motion } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, History as HistoryIcon, Users as UsersIcon, CreditCard as CreditCardIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export function Dashboard({ user }: { user: User }) {
  const { coupleId, couple, loading: coupleLoading } = useCoupleData(user);
  const { transactions: recentTransactions, loading: transLoading } = useTransactions(coupleId, 5);
  const { transactions: allTransactions } = useTransactions(coupleId, 1000); // Fetch more for balance calc

  if (coupleLoading) return null;

  if (!coupleId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-white dark:bg-[#18181B] rounded-[2.5rem] border border-slate-200 dark:border-[#27272A] shadow-sm">
        <div className="w-16 h-16 bg-[#38BDF8]/10 text-[#38BDF8] rounded-2xl flex items-center justify-center mb-6">
          <UsersIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Connect with Partner</h2>
        <p className="text-[#71717A] mb-8 max-w-[240px] text-sm">
          Join forces with your partner to start tracking your shared finances.
        </p>
        <Link 
          to="/couple" 
          className="btn-primary w-full"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Individual Breakdown logic
  const members = couple?.members || [];
  const memberSpending = members.map((uid: string) => {
    const userTransactions = allTransactions.filter(t => t.userId === uid && t.type === 'expense');
    const total = userTransactions.reduce((acc, t) => acc + t.amount, 0);
    const name = userTransactions[0]?.userName || (uid === user.uid ? user.displayName : 'Partner');
    return { uid, name, total };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-center px-1">
         <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#71717A]">Financial Hub</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#FAFAFA]">Hello, {user.displayName?.split(' ')[0]}</h1>
         </div>
         <div className="flex -space-x-3">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#09090B] shadow-lg" />
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#18181B] border-2 border-white dark:border-[#09090B] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-[#A1A1AA] ring-2 ring-[#38BDF8]/20">
               +1
            </div>
         </div>
      </header>

      {/* Balance Card - Gradient Theme */}
      <section className="gradient-card p-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <WalletIcon size={140} />
         </div>
         <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#38BDF8] opacity-10 blur-[80px]"></div>
         
         <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-[0.15em]">Total Household Balance</span>
         <div className="text-4xl font-bold mt-2 mb-10 tracking-tighter tabular-nums text-white">
            ৳{balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
         </div>
         
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider mb-2">
                    <ArrowUpRight className="w-3 h-3" /> Income
                </div>
                <div className="font-bold text-xl tabular-nums text-white">৳{totalIncome.toLocaleString()}</div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[#818CF8] text-[10px] font-bold uppercase tracking-wider mb-2">
                    <ArrowDownRight className="w-3 h-3" /> Expense
                </div>
                <div className="font-bold text-xl tabular-nums text-white">৳{totalExpense.toLocaleString()}</div>
            </div>
         </div>
      </section>

      {/* Individual Contribution Breakdown */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-[#71717A]">Spending Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {memberSpending.map((m: any) => (
            <div key={m.uid} className="bg-white dark:bg-[#18181B] p-5 rounded-[1.75rem] border border-slate-100 dark:border-[#27272A] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8] text-[8px] font-black uppercase">
                  {m.name.substring(0, 2)}
                </div>
                <span className="text-[10px] font-bold text-slate-400 truncate">{m.name.split(' ')[0]}</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">৳{m.total.toLocaleString()}</div>
              <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-[#09090B] rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: totalExpense > 0 ? `${(m.total / totalExpense) * 100}%` : '0%' }}
                   className="h-full bg-[#38BDF8]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Tabs */}
      <section className="grid grid-cols-2 gap-4">
        <Link to="/transactions" className="flex items-center gap-4 p-5 bg-white dark:bg-[#18181B] rounded-[1.5rem] border border-slate-200 dark:border-[#27272A] hover:border-[#38BDF8]/50 transition-all active:scale-95 group shadow-sm">
           <div className="w-12 h-12 bg-[#38BDF8]/10 rounded-2xl flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform">
             <Plus className="w-6 h-6" />
           </div>
           <span className="font-bold text-sm tracking-tight">Add New</span>
        </Link>
        <Link to="/debts" className="flex items-center gap-4 p-5 bg-white dark:bg-[#18181B] rounded-[1.5rem] border border-slate-200 dark:border-[#27272A] hover:border-[#F43F5E]/50 transition-all active:scale-95 group shadow-sm">
           <div className="w-12 h-12 bg-[#F43F5E]/10 rounded-2xl flex items-center justify-center text-[#F43F5E] group-hover:scale-110 transition-transform">
             <CreditCardIcon className="w-6 h-6" />
           </div>
           <span className="font-bold text-sm tracking-tight">Debts</span>
        </Link>
      </section>

      {/* Recent History */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-lg tracking-tight">Financial Pulse</h3>
          <Link to="/transactions" className="text-xs font-bold text-slate-400 dark:text-[#A1A1AA] hover:text-[#38BDF8] transition-colors">See records</Link>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-[#525252] border border-dashed border-slate-200 dark:border-[#27272A] rounded-[2rem] text-sm font-medium">
              Awaiting first transaction...
            </div>
          ) : (
            recentTransactions.map((t, i) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#18181B] rounded-3xl border border-transparent shadow-sm hover:border-slate-200 dark:hover:border-[#27272A] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-[1.25rem] flex items-center justify-center",
                    t.type === 'income' ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[#F43F5E]/10 text-[#F43F5E]"
                  )}>
                    {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">{t.category}</div>
                    <div className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest mt-1">{format(new Date(t.date), 'MMMM dd, yyyy')}</div>
                  </div>
                </div>
                <div className={cn(
                  "font-black tracking-tight tabular-nums",
                  t.type === 'income' ? "text-[#34D399]" : "text-[#F43F5E]"
                )}>
                  {t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
