'use client';

import React from 'react';
import { BarChart3, PlusCircle, Table, LineChart, Settings, Calendar, TrendingUp, Lightbulb, Palette, Target, Search, FileText, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

interface MobileNavProps {
  currentPage: string;
  onPageChange: (page: 'dashboard' | 'add-trade' | 'log' | 'analytics' | 'profit-loss' | 'weekly-review' | 'data-utilities' | 'ideas' | 'add-idea' | 'advanced-analytics' | 'goals' | 'search' | 'reports' | 'emotion-analyzer') => void;
}

export default function MobileNav({ currentPage, onPageChange }: MobileNavProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'add-trade', label: 'Add', icon: PlusCircle },
    { id: 'log', label: 'Log', icon: Table },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'emotion-analyzer', label: 'Emotions', icon: Brain },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'search', label: 'Search', icon: Search },
  ];

  const [showThemeMenu, setShowThemeMenu] = React.useState(false);

  return (
    <nav className="bg-sidebar/95 backdrop-blur border-t border-border flex overflow-x-auto min-h-[72px] pb-[max(env(safe-area-inset-bottom),0px)]">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id as any)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 sm:px-2 min-w-fit transition-colors touch-none select-none',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
            title={item.label}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-medium text-center truncate max-w-[3.5rem]">{item.label}</span>
          </button>
        );
      })}
      
      {/* Theme Toggle */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 sm:px-2 min-w-fit border-l border-border group relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
          title="Theme"
        >
          <Palette className="w-5 h-5 flex-shrink-0" />
        </button>
        <span className="text-xs font-medium text-center truncate max-w-[3.5rem]">Theme</span>
        
        {/* Theme menu popup */}
        {showThemeMenu && (
          <div className="absolute bottom-16 right-0 bg-sidebar border border-border rounded-lg shadow-lg p-2 z-50">
            <ThemeToggle />
          </div>
        )}
      </div>
    </nav>
  );
}
