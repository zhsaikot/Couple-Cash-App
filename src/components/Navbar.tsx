import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeftRight, CreditCard, Users, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface NavbarProps {
}

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Trans' },
    { path: '/debts', icon: CreditCard, label: 'Debts' },
    { path: '/couple', icon: Users, label: 'Partner' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-lg border-t border-slate-200 dark:border-[#27272A] px-6 py-2 pb-6 flex justify-between items-center z-50 max-w-lg mx-auto sm:rounded-t-3xl sm:bottom-4 sm:left-4 sm:right-4 sm:border sm:shadow-lg">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-200 relative",
              isActive ? "text-[#38BDF8]" : "text-[#71717A] hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="nav-glow"
                className="absolute -top-1 w-6 h-1 bg-[#38BDF8] rounded-full blur-[2px]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
