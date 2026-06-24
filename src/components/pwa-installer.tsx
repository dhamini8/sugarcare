'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Smartphone, Download, X } from 'lucide-react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent standard mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify user they can install PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full mx-auto px-4 sm:px-0">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xl shadow-primary/10 flex items-center justify-between gap-3 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold">Install SugarCare</p>
            <p className="text-[10px] text-muted-foreground">Add to home screen for faster, offline access.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleInstallClick} className="h-8 rounded-lg text-xs gap-1">
            <Download className="h-3 w-3" /> Install
          </Button>
        </div>
      </div>
    </div>
  );
}
