import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useCoupleData, useTransactions } from '../lib/hooks';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2, ArrowUpRight, ArrowDownRight, Tag, Calendar, History as HistoryIcon, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const CATEGORIES = [
  'Food & Drink', 'Rent', 'Bills', 'Shopping', 'Travel', 'Health', 'Entertainment', 'Salary', 'Other'
];

export function Transactions({ user }: { user: User }) {
  const { coupleId, couple } = useCoupleData(user);
  const { transactions } = useTransactions(coupleId);
  const currency = couple?.currency || '৳';
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'me' | 'partner'>('all');
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Food & Drink',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !formData.amount) return;

    try {
      const userName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      if (editingId) {
        const path = `couples/${coupleId}/transactions/${editingId}`;
        await updateDoc(doc(db, 'couples', coupleId, 'transactions', editingId), {
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          date: new Date(formData.date).toISOString(),
          userName, // Update name in case it changed
          updatedAt: serverTimestamp()
        });
      } else {
        const path = `couples/${coupleId}/transactions`;
        await addDoc(collection(db, 'couples', coupleId, 'transactions'), {
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          date: new Date(formData.date).toISOString(),
          userId: user.uid,
          userName,
          coupleId,
          createdAt: serverTimestamp()
        });
      }
      handleClose();
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.WRITE, `couples/${coupleId}/transactions/${editingId || ''}`);
    }
  };

  const handleEdit = (t: any) => {
    setFormData({
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      description: t.description || '',
      date: format(new Date(t.date), 'yyyy-MM-dd')
    });
    setEditingId(t.id);
    setIsAdding(true);
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      amount: '',
      type: 'expense',
      category: 'Food & Drink',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleDelete = async (id: string) => {
    if (!coupleId) return;
    const path = `couples/${coupleId}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'couples', coupleId, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const partnerUid = couple?.members?.find((m: string) => m !== user.uid);
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'me') return t.userId === user.uid;
    if (filter === 'partner') return t.userId === partnerUid;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Records</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white dark:text-[#09090B] rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-2xl shadow-sm">
        {[
          { id: 'all', label: 'Everyone' },
          { id: 'me', label: 'Me' },
          { id: 'partner', label: 'Partner' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
              filter === btn.id 
                ? "bg-slate-900 dark:bg-[#FAFAFA] text-white dark:text-[#09090B] shadow-lg shadow-black/10" 
                : "text-slate-400 hover:text-slate-600 dark:text-[#71717A] dark:hover:text-white"
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              className="w-full max-w-sm bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 text-slate-400 dark:text-[#71717A] hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white">{editingId ? 'Edit' : 'Add'} Transaction</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[#09090B] rounded-2xl border border-slate-200 dark:border-[#27272A]">
                  {['expense', 'income'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t as any })}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold text-xs capitalize transition-all",
                        formData.type === t 
                          ? (t === 'expense' ? "bg-[#F43F5E] text-white shadow-lg shadow-rose-500/20" : "bg-[#34D399] text-white dark:text-[#09090B] shadow-lg shadow-emerald-500/20")
                          : "text-slate-400 dark:text-[#71717A]"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      autoFocus
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-5 pl-12 text-3xl font-bold placeholder:text-slate-300 dark:placeholder:text-[#27272A] focus:ring-2 focus:ring-[#38BDF8] text-slate-900 dark:text-white"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-[#71717A]">{currency}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-4 pl-10 text-xs font-bold appearance-none text-slate-900 dark:text-white"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#71717A]" />
                    </div>
                    <div className="relative">
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-4 pl-10 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#71717A] pointer-events-none" />
                    </div>
                  </div>

                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#27272A] rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-primary w-full"
                >
                  {editingId ? 'Update' : 'Save'} Entry
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-[#525252] border border-dashed border-slate-200 dark:border-[#27272A] rounded-[2rem]">
             <div className="w-16 h-16 bg-white dark:bg-[#18181B] border border-slate-100 dark:border-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm">
                <HistoryIcon className="w-8 h-8" />
             </div>
             <p className="font-bold text-sm tracking-tight text-slate-500">No {filter !== 'all' ? filter : ''} records found.</p>
          </div>
        ) : (
          filteredTransactions.map((t, i) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group p-5 bg-white dark:bg-[#18181B] rounded-3xl border border-transparent shadow-sm hover:border-slate-200 dark:hover:border-[#27272A] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  t.type === 'income' ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[#F43F5E]/10 text-[#F43F5E]"
                )}>
                  {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">{t.category}</div>
                  <div className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest mt-1">
                    {format(new Date(t.date), 'MMM dd')} • {t.description || 'SHARED'} • BY {t.userName || 'SYSTEM'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "font-black tracking-tight tabular-nums",
                  t.type === 'income' ? "text-[#34D399]" : "text-[#F43F5E]"
                )}>
                  {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 transition-opacity">
                  <button 
                    onClick={() => handleEdit(t)}
                    className="p-2 text-[#71717A] hover:text-[#38BDF8] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-[#71717A] hover:text-[#F43F5E] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
