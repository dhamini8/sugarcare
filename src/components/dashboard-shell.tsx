'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Droplet, 
  Activity, 
  LineChart, 
  FileText, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  AlertTriangle,
  User
} from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from './ui/button';
import { isSupabaseConfigured } from '@/lib/supabase';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isDark, setIsDark] = useState(false);

  // Load user details and theme preference
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await db.getCurrentUser();
        if (user) {
          setUserName(user.full_name || user.email.split('@')[0]);
        } else {
          // If no user session is found, redirect to landing/login
          router.push('/');
        }
      } catch (e) {
        console.error('Error fetching user', e);
      }
    }
    loadUser();

    // Dark Mode check
    const savedTheme = localStorage.getItem('color-scheme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, [router]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-scheme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-scheme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    try {
      await db.signOut();
      router.push('/');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Blood Sugar', href: '/sugar', icon: Droplet },
    { name: 'Blood Pressure', href: '/bp', icon: Activity },
    { name: 'Analytics', href: '/analytics', icon: LineChart },
    { name: 'Reports', href: '/reports', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">SugarCare</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* MOBILE MENU NAV DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-md pt-16 px-6 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-xl text-primary">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-border pt-4 pb-8 flex flex-col gap-4">
            <div className="flex items-center gap-3 px-4">
              <div className="bg-muted p-2 rounded-full text-muted-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{userName}</span>
                <span className="text-xs text-muted-foreground">Health Account</span>
              </div>
            </div>
            <Button variant="destructive" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary animate-pulse">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">SugarCare</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2 rounded-full text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs truncate max-w-[120px]">{userName}</span>
                <span className="text-[10px] text-muted-foreground">Patient Mode</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 hover:bg-muted">
              {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="ghost" className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Log Out</span>
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Connection status banner for local demo mode */}
        {!isSupabaseConfigured && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
            <span>
              <strong>Demo Mode:</strong> Supabase environment variables are missing. Readings are stored securely in <strong>localStorage</strong>.
            </span>
          </div>
        )}
        
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
