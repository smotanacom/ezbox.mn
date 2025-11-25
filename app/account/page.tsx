'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIcon, Lock, Save } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { LoadingState } from '@/components/layout';

export default function AccountPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, updateProfile, changePassword } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password form state
  const [currentPasswordValue, setCurrentPasswordValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setName(user.name || '');
      setAddress(user.address || '');
      setSecondaryPhone(user.secondary_phone || '');
    }
  }, [user, loading, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsProfileSaving(true);

    try {
      if (!user) throw new Error('Not logged in');

      await updateProfile({
        address: address.trim() || undefined,
        phone: secondaryPhone.trim() || undefined,
      });

      setProfileSuccess(t('account.success'));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t('account.error'));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsPasswordSaving(true);

    try {
      if (!user) throw new Error('Not logged in');

      // Validate passwords
      if (newPassword.length < 6) {
        throw new Error(t('account.password-too-short'));
      }

      if (newPassword !== confirmPassword) {
        throw new Error(t('account.passwords-no-match'));
      }

      await changePassword(currentPasswordValue, newPassword);

      setPasswordSuccess(t('account.password-changed'));

      // Clear password fields
      setCurrentPasswordValue('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('account.password-error'));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('account.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('account.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <CardTitle>{t('account.profile')}</CardTitle>
              </div>
              <CardDescription>
                {t('account.profile-description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('account.phone')}</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={user.phone}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('account.phone-cannot-change')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('account.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('account.name-placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('account.address')}</Label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('account.address-placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-phone">{t('account.secondary-phone')}</Label>
                  <Input
                    id="secondary-phone"
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder={t('account.secondary-phone-placeholder')}
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('account.secondary-phone-help')}
                  </p>
                </div>

                {profileError && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
                    {profileSuccess}
                  </div>
                )}

                <Button type="submit" disabled={isProfileSaving} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {isProfileSaving ? t('account.saving') : t('account.save-changes')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>{t('account.change-password')}</CardTitle>
              </div>
              <CardDescription>
                {t('account.change-password-description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t('account.current-password')}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPasswordValue}
                    onChange={(e) => setCurrentPasswordValue(e.target.value)}
                    placeholder={t('account.current-password-placeholder')}
                    required
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('account.new-password')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('account.new-password-placeholder')}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('account.new-password-help')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('account.confirm-password')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('account.confirm-password-placeholder')}
                    required
                  />
                </div>

                {passwordError && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
                    {passwordSuccess}
                  </div>
                )}

                <Button type="submit" disabled={isPasswordSaving} className="w-full sm:w-auto">
                  <Lock className="mr-2 h-4 w-4" />
                  {isPasswordSaving ? t('account.changing') : t('account.change-password-button')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
