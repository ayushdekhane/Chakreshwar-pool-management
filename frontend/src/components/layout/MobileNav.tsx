import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Waves, Users, CreditCard, FileBarChart } from 'lucide-react';
import { cn } from '../../utils';

export const MobileNav: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Sessions', path: '/sessions', icon: Waves },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 px-2 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] lg:hidden shadow-lg">
      {navItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-[#087FA5] font-semibold' : 'text-[#64748B]'
            )
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.name}</span>
        </NavLink>
      ))}

      {navItems.slice(2).map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-[#087FA5] font-semibold' : 'text-[#64748B]'
            )
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
