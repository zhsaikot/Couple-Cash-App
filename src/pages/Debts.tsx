import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useCoupleData, useDebts } from '../lib/hooks';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, CreditCard as CreditCardIcon, ArrowRight, CheckCircle2, History as HistoryIcon, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Debts({ user }: { user: User }) {
  const { coupleId, couple } = useCoupleData(user);
  const { debts } = useDebts(coupleId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRepaying, setIsRepaying] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    totalAmount: '',
    borrowerId: ''
  });

  const partner = couple?.members.find((id: string) => id !== user.uid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !formData.totalAmount || !formData.borrowerId) return;

    try {
      const userName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      if (editingId) {
        const path = `couples/${coupleId}/debts/${editingId}`;
        const amount = parseFloat(formData.totalAmount);
        
        // Find existing debt to preserve remainingAmount logic if totalAmount didn't change
        const existingDebt = debts.find(d => d.id === editingId);
        const diff = amount - (existingDebt?.totalAmount || 0);
        const newRemaining = (existingDebt?.remainingAmount || 0) + diff;

        await updateDoc(doc(db, 'couples', coupleId, 'debts', editingId), {
          title: formData.title,
          totalAmount: amount,
          remainingAmount: Math.max(0, newRemaining),
          lenderId: formData.borrowerId === user.uid ? partner : user.uid,
          borrowerId: formData.borrowerId,
          userName,
          updatedAt: serverTimestamp()
        });
      } else {
        const path = `couples/${coupleId}/debts`;
        await addDoc(collection(db, 'couples', coupleId, 'debts'), {
          title: formData.title,
          totalAmount: parseFloat(formData.totalAmount),
          remainingAmount: parseFloat(formData.totalAmount),
          lenderId: formData.borrowerId === user.uid ? partner : user.uid,
          borrowerId: formData.borrowerId,
          status: 'active',
          coupleId,
          userName,
          createdAt: serverTimestamp()
        });
      }
      handleClose();
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.WRITE, `couples/${coupleId}/debts/${editingId || ''}`);
    }
  };

  const handleEdit = (d: any) => {
    setFormData({
      title: d.title,
      totalAmount: d.totalAmount.toString(),
      borrowerId: d.borrowerId
    });
    setEditingId(d.id);
    setIsAdding(true);
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ title: '', totalAmount: '', borrowerId: '' });
  };

  const handleDelete = async (id: string) => {
    if (!coupleId) return;
    const path = `couples/${coupleId}/debts/${id}`;
    try {
      await deleteDoc(doc(db, 'couples', coupleId, 'debts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleRepay = async (debtId: string, currentRemaining: number) => {
    const amount = parseFloat(repayAmount);
    if (!coupleId || isNaN(amount) || amount <= 0) return;

    const newRemaining = Math.max(0, currentRemaining - amount);
    const newStatus = newRemaining === 0 ? 'paid' : 'active';
    const path = `couples/${coupleId}/debts/${debtId}`;

    try {
      await updateDoc(doc(db, 'couples', coupleId, 'debts', debtId), {
        remainingAmount: newRemaining,
        status: newStatus
      });
      
      const userName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      await addDoc(collection(db, 'couples', coupleId, 'debts', debtId, 'repayments'), {
        amount,
        date: new Date().toISOString(),
        userId: user.uid,
        userName
      });

      setIsRepaying(null);
      setRepayAmount('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1 text-slate-900 dark:text-white">
        <h1 className="text-3xl font-bold tracking-tight">Shared Obligations</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 bg-[#F43F5E] hover:bg-[#F43F5E]/90 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div className="w-full max-w-sm bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={handleClose} className="absolute top-6 right-6 p-2 text-slate-400 dark:text-[#71717A] hover:text-slate-900 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-[#FAFAFA]">{editingId ? 'Edit' : 'Shared'} Debt</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                   <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Purpose of debt..."
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-[#525252]"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-5 pl-12 text-3xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-[#71717A]">৳</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-[#71717A] ml-1">Who is the borrower?</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, borrowerId: user.uid})}
                         className={cn("p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", formData.borrowerId === user.uid ? "bg-[#F43F5E] text-white border-transparent shadow-lg shadow-rose-500/20" : "bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#27272A] text-slate-400 dark:text-[#71717A]")}
                       >ME</button>
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, borrowerId: partner})}
                         className={cn("p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", formData.borrowerId === partner ? "bg-[#F43F5E] text-white border-transparent shadow-lg shadow-rose-500/20" : "bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#27272A] text-slate-400 dark:text-[#71717A]")}
                       >PARTNER</button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#F43F5E] text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">
                  {editingId ? 'Update' : 'Confirm'} Debt record
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {debts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-[#525252] border border-dashed border-slate-200 dark:border-[#27272A] rounded-[2rem]">
             <div className="w-16 h-16 bg-white dark:bg-[#18181B] border border-slate-100 dark:border-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm">
                <CreditCardIcon className="w-8 h-8" />
             </div>
             <p className="font-bold text-sm tracking-tight text-slate-500">No shared debts recorded.</p>
          </div>
        ) : (
          debts.map((d, i) => {
            const isOwedToMe = d.lenderId === user.uid;
            return (
              <motion.div 
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-8 bg-white dark:bg-[#18181B] rounded-3xl border transition-all relative overflow-hidden",
                  d.status === 'paid' ? "border-transparent opacity-40 shadow-none" : "border-slate-100 dark:border-[#27272A] shadow-xl"
                )}
              >
                {d.status === 'paid' && <div className="absolute top-4 right-4"><CheckCircle2 className="w-6 h-6 text-[#34D399]" /></div>}
                
                <div className="flex justify-between items-start mb-6">
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg tracking-tight text-slate-900 dark:text-[#FAFAFA]">{d.title}</h3>
                        <div className="flex items-center gap-1 ml-2">
                           <button 
                             onClick={() => handleEdit(d)}
                             className="p-2 text-[#71717A] hover:text-[#38BDF8] transition-colors"
                           >
                             <Pencil className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDelete(d.id)}
                             className="p-2 text-[#71717A] hover:text-[#F43F5E] transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#71717A] mt-2">
                        {isOwedToMe ? <span className="text-[#34D399]">RECEIVABLE</span> : <span className="text-[#F43F5E]">PAYABLE</span>}
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-slate-400 dark:text-[#A1A1AA]">PARTNER</span>
                        <span className="ml-auto text-[8px] opacity-70">BY {d.userName || 'SYSTEM'}</span>
                      </div>
                   </div>
                    <div className="text-right">
                      <div className="text-2xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">৳{d.remainingAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 dark:text-[#A1A1AA] font-bold uppercase tracking-widest mt-1">OF ৳{d.totalAmount.toLocaleString()}</div>
                   </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-[#09090B] px-1 py-1 rounded-full mb-8 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100}%` }}
                     className="h-1.5 bg-[#38BDF8] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                   />
                </div>

                {d.status !== 'paid' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsRepaying(d.id)}
                      className="w-full py-4 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] hover:border-[#38BDF8] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group text-slate-500 dark:text-[#A1A1AA]"
                    >
                      <Plus className="w-4 h-4 text-[#38BDF8] group-hover:scale-125 transition-transform" /> Add Payment
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {isRepaying === d.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-slate-200 dark:border-[#27272A] space-y-4"
                    >
                      <div className="relative">
                        <input 
                          type="number"
                          autoFocus
                          value={repayAmount}
                          onChange={(e) => setRepayAmount(e.target.value)}
                          placeholder="Amount to pay"
                          className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-xl p-4 pl-10 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#38BDF8]"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400 dark:text-[#71717A]">৳</div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setIsRepaying(null)} className="flex-1 py-4 text-[10px] font-black tracking-widest text-slate-400 dark:text-[#71717A] uppercase transition-colors hover:text-slate-900 dark:hover:text-white">Cancel</button>
                        <button 
                          onClick={() => handleRepay(d.id, d.remainingAmount)}
                          className="flex-[2] py-4 bg-[#38BDF8] text-white dark:text-[#09090B] rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-sky-500/10"
                        >Execute payment</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
