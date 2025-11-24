'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCurrentUser, login, register, saveSession } from '@/lib/auth';
import { getUserByPhone } from '@/lib/api';
import { getFirstImageUrl } from '@/lib/storage-client';
import { createOrder } from '@/app/actions/orders';
import { PageContainer, PageTitle, EmptyState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Package } from 'lucide-react';
import Image from '@/components/Image';
import type { User } from '@/types/database';

type CheckoutStep = 'phone' | 'login' | 'register' | 'details';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, items, total, refreshCart } = useCart();
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [step, setStep] = useState<CheckoutStep>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user) {
      // User is logged in, prefill form
      setStep('details');
      setPhone(user.phone);
      setName(user.name || '');
      setAddress(user.address || '');
      setSecondaryPhone(user.secondary_phone || '');
    }
  }, []);

  const handlePhoneSubmit = async () => {
    setError('');

    // Validate phone number
    if (!/^\d{8}$/.test(phone)) {
      setError(t('checkout.phone-invalid'));
      return;
    }

    setLoading(true);
    try {
      const existingUser = await getUserByPhone(phone);

      if (existingUser) {
        // User exists, ask for password
        setStep('login');
      } else {
        // New user, proceed to registration
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || t('checkout.failed-check-phone'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await login(phone, password);
      saveSession(user);
      setCurrentUser(user);

      // Prefill form with user data
      setName(user.name || '');
      setAddress(user.address || '');
      setSecondaryPhone(user.secondary_phone || '');

      setStep('details');
    } catch (err: any) {
      setError(err.message || t('checkout.login-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndCheckout = async () => {
    setError('');

    // Validate required fields
    if (!name.trim()) {
      setError(t('checkout.name-required'));
      return;
    }
    if (!address.trim()) {
      setError(t('checkout.address-required'));
      return;
    }
    if (!password) {
      setError(t('checkout.password-required'));
      return;
    }
    if (!cart) {
      setError(t('checkout.no-cart'));
      return;
    }

    setLoading(true);
    try {
      // Register the user
      const user = await register(phone, password, name, address, secondaryPhone || undefined);
      saveSession(user);
      setCurrentUser(user);

      // Create the order
      const order = await createOrder(
        cart.id,
        user.id,
        name,
        phone,
        address,
        secondaryPhone || undefined
      );

      // Notify that an order was created
      window.dispatchEvent(new Event('order-created'));

      // Refresh cart to clear it
      await refreshCart();

      // Redirect to order detail page
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || t('checkout.registration-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setError('');

    // Validate required fields
    if (!name.trim()) {
      setError(t('checkout.name-required'));
      return;
    }
    if (!address.trim()) {
      setError(t('checkout.address-required'));
      return;
    }
    if (!cart) {
      setError(t('checkout.no-cart'));
      return;
    }

    setLoading(true);
    try {
      // Create the order
      const order = await createOrder(
        cart.id,
        currentUser?.id || null,
        name,
        phone,
        address,
        secondaryPhone || undefined
      );

      // Notify that an order was created
      window.dispatchEvent(new Event('order-created'));

      // Refresh cart to clear it
      await refreshCart();

      // Redirect to order detail page
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || t('checkout.order-failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!cart || items.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={ShoppingBag}
          title={t('checkout.cart-empty')}
          description={t('checkout.cart-empty-description')}
          action={
            <Button onClick={() => router.push('/products')} size="lg">
              {t('checkout.continue-shopping')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const deliveryFee = 100000;
  const grandTotal = total + deliveryFee;

  return (
    <>
      <PageContainer>
        <PageTitle icon={Package}>{t('checkout.title')}</PageTitle>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.order-summary')}</CardTitle>
                <CardDescription>{t('checkout.order-summary-description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      {/* Product Image */}
                      <div className="relative flex-shrink-0 w-20 h-20 bg-white rounded-md overflow-hidden border">
                        <Image
                          src={getFirstImageUrl(item.product?.images || [])}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              {item.product?.category?.name}
                            </p>
                            <h4 className="font-medium text-sm mt-1">
                              {item.product?.name}
                            </h4>

                            {/* Selected Parameters */}
                            {item.selected_parameters && Object.keys(item.selected_parameters).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {Object.entries(item.selected_parameters).map(([groupId, paramId]) => {
                                  const group = item.product?.parameter_groups?.find(
                                    (g: any) => g.parameter_group?.id === groupId
                                  );
                                  const param = group?.parameters?.find(
                                    (p: any) => p.id === paramId
                                  );
                                  return param ? (
                                    <div key={groupId} className="text-xs text-muted-foreground">
                                      <span className="font-medium">{group?.parameter_group?.name}:</span> {param.name}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              {t('checkout.quantity')}: {item.quantity}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">
                              {((item.product?.base_price || 0) * item.quantity).toLocaleString()}₮
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Forms and Price Summary */}
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Section 1: Login/User Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.contact-info')}</CardTitle>
                <CardDescription>{t('checkout.contact-info-description')}</CardDescription>
              </CardHeader>
              <CardContent>

                {/* Phone number step */}
                {step === 'phone' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('checkout.phone')}</Label>
                      <Input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('checkout.phone-placeholder')}
                        maxLength={8}
                        required
                      />
                      <p className="text-xs text-muted-foreground">{t('checkout.phone-help')}</p>
                    </div>

                    <Button
                      onClick={handlePhoneSubmit}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? t('checkout.checking') : t('checkout.continue')}
                    </Button>
                  </div>
                )}

                {/* Login step */}
                {step === 'login' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('checkout.phone')}</Label>
                      <div className="px-3 py-2 bg-muted border rounded-md">
                        {phone}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setStep('phone')}
                        variant="link"
                        className="p-0 h-auto text-sm"
                      >
                        {t('checkout.change-phone')}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('checkout.password-enter')}
                        required
                      />
                    </div>

                    <Button
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? t('auth.logging-in') : t('auth.login-button')}
                    </Button>
                  </div>
                )}

                {/* Registration step - Contact Info */}
                {step === 'register' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('checkout.phone')}</Label>
                      <div className="px-3 py-2 bg-muted border rounded-md">
                        {phone}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setStep('phone')}
                        variant="link"
                        className="p-0 h-auto text-sm"
                      >
                        {t('checkout.change-phone')}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {t('checkout.full-name')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('checkout.full-name-placeholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryPhone">
                        {t('checkout.secondary-phone')}
                      </Label>
                      <Input
                        type="tel"
                        id="secondaryPhone"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        placeholder={t('checkout.phone-placeholder')}
                        maxLength={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword">
                        {t('checkout.create-password')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="password"
                        id="regPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('checkout.create-password-placeholder')}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Details step (for logged in users) - Contact Info */}
                {step === 'details' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('checkout.phone')}</Label>
                      <div className="px-3 py-2 bg-muted border rounded-md">
                        {phone}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="detailsName">
                        {t('checkout.full-name')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="detailsName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('checkout.full-name-placeholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="detailsSecondaryPhone">
                        {t('checkout.secondary-phone')}
                      </Label>
                      <Input
                        type="tel"
                        id="detailsSecondaryPhone"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        placeholder={t('checkout.phone-placeholder')}
                        maxLength={8}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Delivery Address */}
            {(step === 'details' || step === 'register') && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.delivery-address')}</CardTitle>
                  <CardDescription>{t('checkout.address-question')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t('checkout.address')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('checkout.address-placeholder')}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 3: Price Summary with Place Order Button */}
            {(step === 'details' || step === 'register') && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.order-total')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('checkout.subtotal')} ({items.length} {items.length === 1 ? t('checkout.item') : t('checkout.items')})</span>
                      <span className="font-medium">{total.toLocaleString()}₮</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('checkout.delivery-fee')}</span>
                      <span className="font-medium">{deliveryFee.toLocaleString()}₮</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between pt-2">
                      <span className="text-lg font-bold">{t('checkout.total')}</span>
                      <span className="text-lg font-bold">{grandTotal.toLocaleString()}₮</span>
                    </div>
                  </div>

                  <Button
                    onClick={step === 'details' ? handleCheckout : handleRegisterAndCheckout}
                    disabled={loading}
                    className="w-full mt-6 bg-secondary hover:bg-secondary/90"
                    size="lg"
                  >
                    {loading ? t('checkout.processing') : step === 'register' ? t('checkout.create-account-and-order') : t('checkout.place-order')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
