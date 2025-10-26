'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { initialData } from '@/lib/data';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function AuthPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLogin, setIsLogin] = useState(true);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!auth) return;
    // Ensure reCAPTCHA is rendered only for phone auth and if it hasn't been already
    if (authMethod === 'phone' && !recaptchaVerifierRef.current) {
      // Delay to ensure the container is in the DOM
      setTimeout(() => {
        if (document.getElementById('recaptcha-container')) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
              size: 'invisible',
            }
          );
        }
      }, 100);
    }
  }, [auth, authMethod]);

  const setupNewUser = async (userId: string) => {
    // Check if the user document already exists to prevent overwriting
    const userShopRef = doc(firestore, 'shops', userId);
    const userShopSnap = await getDoc(userShopRef);

    if (userShopSnap.exists()) {
      // User already set up, no need to do anything
      return;
    }
    
    const batch = writeBatch(firestore);
    
    // Create the main shop document
    batch.set(userShopRef, {
      id: userId,
      name: 'My New Shop',
      createdAt: serverTimestamp(),
    });
    
    // Create the shopSettings document
    const settingsDocRef = doc(firestore, `shops/${userId}/settings/shopSettings`);
    batch.set(settingsDocRef, initialData.settings);
    
    await batch.commit();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await setupNewUser(result.user.uid);
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    setIsLoading(true);
    if (!recaptchaVerifierRef.current) {
      toast({
        variant: 'destructive',
        title: 'reCAPTCHA not ready',
        description: 'Please wait a moment and try again.',
      });
      setIsLoading(false);
      return;
    }
    try {
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifierRef.current
      );
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Phone Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await setupNewUser(result.user.uid);
      // onAuthStateChanged will handle redirect
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'OTP Verification Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    if (isLogin) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
        setIsLoading(false);
      }
    } else {
      if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Passwords do not match' });
        setIsLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setupNewUser(userCredential.user.uid);
        toast({
          title: 'Signup Successful',
          description: 'Your account and shop have been created. Please log in.',
        });
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'email') {
      await handleEmailAuth();
    } else if (authMethod === 'phone') {
      if (!isOtpSent) {
        await handlePhoneSignIn();
      } else {
        await handleOtpSubmit();
      }
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {authMethod === 'email'
              ? isLogin
                ? 'Login'
                : 'Sign Up'
              : 'Sign In with Phone'}
          </CardTitle>
          <CardDescription>
            {authMethod === 'email' && isLogin
              ? 'Enter your email below to login to your account'
              : 'Enter your details to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              variant={authMethod === 'email' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setAuthMethod('email')}
            >
              Email
            </Button>
            <Button
              variant={authMethod === 'phone' ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setAuthMethod('phone')}
            >
              Phone
            </Button>
          </div>

          <form onSubmit={handleAuthAction}>
            <div className="grid gap-4">
              {authMethod === 'email' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {!isLogin && (
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!isOtpSent ? (
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 123 456 7890"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? 'Processing...'
                  : authMethod === 'email'
                  ? isLogin
                    ? 'Sign in'
                    : 'Create an account'
                  : isOtpSent
                  ? 'Verify OTP'
                  : 'Send OTP'}
              </Button>
            </div>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon />
            Sign in with Google
          </Button>

          {authMethod === 'email' && (
            <div className="mt-4 text-center text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Button
                variant="link"
                className="pl-1"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
    </main>
  );
}
