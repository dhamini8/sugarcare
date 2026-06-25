'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Droplet, CheckCircle, Shield } from 'lucide-react';
import { db } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New profile state
  const [age, setAge] = useState<string>('');
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHighBP, setHasHighBP] = useState(false);
  const [hasLowBP, setHasLowBP] = useState(false);

  // Connection config checking
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check if session is active
  useEffect(() => {
    async function checkSession() {
      try {
        const user = await db.getCurrentUser();
        if (user) {
          router.push('/dashboard');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await db.signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const parsedAge = age ? parseInt(age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120)) {
      setError('Please enter a valid age between 0 and 120.');
      setIsLoading(false);
      return;
    }

    try {
      await db.signUp(email, password, fullName, parsedAge, hasDiabetes, hasHighBP, hasLowBP);
      if (isSupabaseConfigured) {
        setSuccess('Registration successful! Please check your email inbox to verify your account.');
      } else {
        // Local Demo Mode logs in automatically
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign up. Make sure the password is at least 6 characters.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await db.signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Auth is currently unavailable.');
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading SugarCare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-500/5 via-background to-emerald-500/5 flex flex-col lg:flex-row">
      {/* BRANDING HERO PANEL */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary animate-pulse">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">SugarCare</span>
        </div>

        <div className="my-auto py-12 lg:py-0 max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Monitor your vitals, <br />
            <span className="text-primary bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">take control of your health.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SugarCare is a modern healthcare tracking companion. Log blood sugar levels, blood pressure readings, and heart rates. Access insights, generate reports, and secure your health history.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-3 w-3" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Log blood sugar levels (Fasting, Meal intervals)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-3 w-3" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Track blood pressure (Systolic, Diastolic, Pulse)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-3 w-3" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Generate professional PDF reports and CSV data sheets</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>Secured with Row Level Security (RLS) policies.</span>
        </div>
      </div>

      {/* LOGIN/SIGNUP CARD PANEL */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-[440px] rounded-2xl shadow-xl shadow-primary/5 border border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in or create a health account to begin tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl font-medium mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs p-3 rounded-xl font-medium mb-4">
                {success}
              </div>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 p-1 bg-muted">
                <TabsTrigger value="login" className="rounded-lg font-medium text-xs">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-medium text-xs">Create Account</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB CONTENT */}
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-3 mt-2 shadow-sm font-semibold">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* REGISTER TAB CONTENT */}
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-age">Age (Optional)</Label>
                    <Input
                      id="reg-age"
                      type="number"
                      placeholder="e.g. 35"
                      min="0"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  
                  {/* MEDICAL PROFILE SECTION */}
                  <div className="space-y-2 pt-2 border-t border-border mt-3">
                    <p className="text-xs font-semibold text-muted-foreground">Pre-existing Health Conditions (Optional):</p>
                    
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <input
                        id="reg-diabetes"
                        type="checkbox"
                        checked={hasDiabetes}
                        onChange={(e) => setHasDiabetes(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <Label htmlFor="reg-diabetes" className="font-semibold text-xs text-foreground cursor-pointer">I have Diabetes</Label>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        id="reg-high-bp"
                        type="checkbox"
                        checked={hasHighBP}
                        onChange={(e) => setHasHighBP(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <Label htmlFor="reg-high-bp" className="font-semibold text-xs text-foreground cursor-pointer">I have High Blood Pressure</Label>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        id="reg-low-bp"
                        type="checkbox"
                        checked={hasLowBP}
                        onChange={(e) => setHasLowBP(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <Label htmlFor="reg-low-bp" className="font-semibold text-xs text-foreground cursor-pointer">I have Low Blood Pressure</Label>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-3 mt-3 shadow-sm font-semibold">
                    {isLoading ? 'Registering...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* SEPARATOR */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* OAUTH GOOGLE LOGIN BUTTON */}
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 border border-border hover:bg-muted font-medium text-xs text-foreground"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Google Authentication
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0 pb-6">
            {!isSupabaseConfigured && (
              <p className="text-[10px] text-center text-amber-500 font-semibold px-4 bg-amber-500/5 py-2 rounded-xl border border-amber-500/10">
                Offline Mode: Click Google Sign-in or fill any details and click login to instantly use the Demo Mode.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
