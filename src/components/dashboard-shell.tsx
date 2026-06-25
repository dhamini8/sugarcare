'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  User,
  Scale,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from './ui/button';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Profile Popup Menu state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Deletion Modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user details and theme preference
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await db.getCurrentUser();
        if (user) {
          setProfile(user);
        } else {
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

  // Click outside listener to close profile popup menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await db.deleteAccount();
      router.push('/');
    } catch (e) {
      console.error('Delete account error', e);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Blood Sugar', href: '/sugar', icon: Droplet },
    { name: 'Blood Pressure', href: '/bp', icon: Activity },
    { name: 'Weight', href: '/weight', icon: Scale },
    { name: 'Analytics', href: '/analytics', icon: LineChart },
    { name: 'Reports', href: '/reports', icon: FileText }
  ];

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  const renderHealthTags = (isMobile = false) => {
    if (!profile) return null;
    const tags = [];
    if (profile.has_diabetes) tags.push('Diabetes');
    if (profile.has_high_bp) tags.push('High BP');
    if (profile.has_low_bp) tags.push('Low BP');

    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${isMobile ? 'justify-start' : ''}`}>
        {profile.age && (
          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">
            Age: {profile.age}
          </span>
        )}
        {tags.map((tag, idx) => (
          <span key={idx} className="text-[9px] bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">
            {tag}
          </span>
        ))}
      </div>
    );
  };

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
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-md pt-16 px-6 flex flex-col gap-4 overflow-y-auto">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-muted p-2.5 rounded-full text-muted-foreground shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-foreground">{userName}</span>
                  {renderHealthTags(true)}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 hover:bg-muted shrink-0">
                {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-muted text-foreground border border-border">
                <User className="h-3.5 w-3.5" /> Profile
              </Link>
              <Button variant="outline" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </Button>
              <Button variant="destructive" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-6 shadow-sm relative">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary animate-pulse">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">SugarCare</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
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

        {/* PROFILE CARD DRAWER WITH POPUP AT BOTTOM LEFT */}
        <div className="border-t border-border pt-4 flex flex-col gap-2 relative mt-auto" ref={menuRef}>
          {/* PROFILE EXPANDABLE POPUP MENU */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-20 left-0 right-0 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link 
                href="/profile" 
                onClick={() => setIsProfileMenuOpen(false)} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4 text-blue-500" />
                <span>Edit Profile Settings</span>
              </Link>
              
              <button 
                onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 text-left w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
              
              <button 
                onClick={() => { setIsProfileMenuOpen(false); setIsDeleteOpen(true); }} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 text-left w-full transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </button>
            </div>
          )}

          {/* USER CARD (TOGGLE) */}
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs truncate max-w-[120px]">{userName}</span>
                {renderHealthTags()}
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground shrink-0 transition-colors" />
          </div>
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

      {/* DELETE ACCOUNT DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(false)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">Delete Your Account?</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              This action is permanent. All your profile information and recorded health logs (blood sugar, blood pressure, weight history) will be deleted forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="rounded-xl">
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
