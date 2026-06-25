'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Activity, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { Profile } from '@/types';
import confetti from 'canvas-confetti';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHighBP, setHasHighBP] = useState(false);
  const [hasLowBP, setHasLowBP] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const u = await db.getCurrentUser();
        if (u) {
          setProfile(u);
          setFullName(u.full_name || '');
          setAge(u.age ? u.age.toString() : '');
          setHasDiabetes(u.has_diabetes || false);
          setHasHighBP(u.has_high_bp || false);
          setHasLowBP(u.has_low_bp || false);
        }
      } catch (e) {
        console.error('Error fetching profile data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const parsedAge = age ? parseInt(age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120)) {
      setError('Please enter a valid age between 0 and 120.');
      setIsSaving(false);
      return;
    }

    try {
      const updated = await db.updateProfile(fullName, parsedAge, hasDiabetes, hasHighBP, hasLowBP);
      setProfile(updated);
      setSuccess('Your profile settings have been successfully updated!');
      
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981']
      });

      // Quick reload to update shell sidebar badges
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Activity className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading profile information...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-500">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">User Profile</h2>
            <p className="text-xs text-muted-foreground">Manage your personal vitals diagnostics parameters.</p>
          </div>
        </div>

        {/* SETTINGS CARD */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Personal Health Profile</CardTitle>
            <CardDescription className="text-xs">
              Updating these values recalibrates normal and controlled vital sign thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-name">Full Name</Label>
                  <Input
                    id="prof-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-email">Email Address</Label>
                  <Input
                    id="prof-email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="rounded-xl opacity-60 bg-muted cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label htmlFor="prof-age">Age (Years)</Label>
                  <Input
                    id="prof-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="rounded-xl focus-visible:ring-primary"
                    placeholder="e.g. 35"
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              {/* HEALTH PROFILE CHECKBOXES */}
              <div className="space-y-3 pt-3 border-t border-border mt-2">
                <p className="text-xs font-semibold text-muted-foreground">Pre-existing Vitals History (recalibrates diagnostic logic):</p>
                
                <div className="flex items-center gap-2.5 mt-1">
                  <input
                    id="prof-diabetes"
                    type="checkbox"
                    checked={hasDiabetes}
                    onChange={(e) => setHasDiabetes(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <Label htmlFor="prof-diabetes" className="font-semibold text-xs text-foreground cursor-pointer">I have a history of Diabetes</Label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="prof-high-bp"
                    type="checkbox"
                    checked={hasHighBP}
                    onChange={(e) => setHasHighBP(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <Label htmlFor="prof-high-bp" className="font-semibold text-xs text-foreground cursor-pointer">I have a history of High Blood Pressure (Hypertension)</Label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="prof-low-bp"
                    type="checkbox"
                    checked={hasLowBP}
                    onChange={(e) => setHasLowBP(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <Label htmlFor="prof-low-bp" className="font-semibold text-xs text-foreground cursor-pointer">I have a history of Low Blood Pressure (Hypotension)</Label>
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full rounded-xl py-3 mt-2 shadow-sm font-semibold">
                {isSaving ? 'Saving Changes...' : 'Save Profile Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
