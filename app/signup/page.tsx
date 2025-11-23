'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, saveSession } from '@/lib/auth';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwords-no-match'));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t('auth.password-too-short'));
      return;
    }

    setLoading(true);

    try {
      const user = await register(phone, password);
      saveSession(user);
      await refreshCart();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">{t('auth.create-account')}</CardTitle>
          <CardDescription>{t('auth.signup-description')}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('auth.phone-placeholder')}
                maxLength={8}
                pattern="\d{8}"
              />
              <p className="text-xs text-muted-foreground">{t('auth.phone-help')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">{t('auth.password-min')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirm-password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? t('auth.creating-account') : t('auth.signup-button')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.have-account')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('auth.login-link')}
            </Link>
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground text-center">
            {t('auth.back-home')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
