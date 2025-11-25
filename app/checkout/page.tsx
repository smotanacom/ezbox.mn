'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { getFirstImageUrl } from '@/lib/storage-client';
import { createOrder } from '@/app/actions/orders';
import { PageContainer, PageTitle, EmptyState, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Package } from 'lucide-react';
import Image from '@/components/Image';

type CheckoutStep = 'phone' | 'login' | 'register' | 'details';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, items, total, refreshCart, loading: cartLoading } = useCart();
  const { t } = useTranslation();
  const { user: currentUser, login, register } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // Form fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');

  useEffect(() => {
    if (currentUser) {
      // User is logged in, prefill form
      setStep('details');
      setPhone(currentUser.phone);
      setName(currentUser.name || '');
      setAddress(currentUser.address || '');
      setSecondaryPhone(currentUser.secondary_phone || '');
    }
  }, [currentUser]);

  const handlePhoneSubmit = async () => {
    setError('');
    setInvalidFields(new Set());

    // Validate phone number
    if (!/^\d{8}$/.test(phone)) {
      setError(t('checkout.phone-invalid'));
      setInvalidFields(new Set(['phone']));
      return;
    }

    setLoading(true);
    try {
      // Proceed to register/login step
      // User can choose to login if they have an account
      setStep('register');
    } catch (err: any) {
      setError(err.message || t('checkout.failed-check-phone'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setInvalidFields(new Set());
    setLoading(true);

    try {
      const user = await login(phone, password);

      // Refresh cart to get the merged cart items
      await refreshCart();

      // Prefill form with user data
      setName(user.name || '');
      setAddress(user.address || '');
      setSecondaryPhone(user.secondary_phone || '');

      setStep('details');
    } catch (err: any) {
      setError(err.message || t('checkout.login-failed'));
      setInvalidFields(new Set(['password']));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndCheckout = async () => {
    setError('');
    setInvalidFields(new Set());

    // Validate required fields
    const invalid = new Set<string>();
    if (!name.trim()) {
      setError(t('checkout.name-required'));
      invalid.add('name');
    }
    if (!address.trim()) {
      setError(t('checkout.address-required'));
      invalid.add('address');
    }
    if (!password) {
      setError(t('checkout.password-required'));
      invalid.add('regPassword');
    }

    if (invalid.size > 0) {
      setInvalidFields(invalid);
      return;
    }

    setLoading(true);
    try {
      // Register the user - Note: the new API doesn't support name/address/secondary_phone yet
      const user = await register(phone, password);

      // Refresh cart to get the merged cart items
      const { cart: mergedCart } = await refreshCart();

      // Validate that we have a cart with the merged items
      if (!mergedCart) {
        setError(t('checkout.no-cart'));
        return;
      }

      // Create the order (use the refreshed cart)
      const order = await createOrder(
        mergedCart.id,
        user.id,
        name,
        phone,
        address,
        secondaryPhone || undefined
      );

      // Notify that an order was created
      window.dispatchEvent(new Event('order-created'));

      // Redirect to order detail page
      // Note: No need to refresh cart here - it will refresh automatically when user navigates back
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || t('checkout.registration-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setError('');
    setInvalidFields(new Set());

    // Validate required fields
    const invalid = new Set<string>();
    if (!name.trim()) {
      setError(t('checkout.name-required'));
      invalid.add('detailsName');
    }
    if (!address.trim()) {
      setError(t('checkout.address-required'));
      invalid.add('address');
    }
    if (!cart) {
      setError(t('checkout.no-cart'));
      return;
    }

    if (invalid.size > 0) {
      setInvalidFields(invalid);
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

      // Redirect to order detail page
      // Note: No need to refresh cart here - it will refresh automatically when user navigates back
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || t('checkout.order-failed'));
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return <LoadingState />;
  }

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
                        className={invalidFields.has('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">{t('checkout.phone-help')}</p>
                    </div>

                    {error && (
                      <div className="p-3 bg-destructive text-destructive-foreground rounded-md">
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}

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
                        className={invalidFields.has('password') ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-destructive text-destructive-foreground rounded-md">
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}

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
                        className={invalidFields.has('name') ? 'border-destructive focus-visible:ring-destructive' : ''}
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
                        className={invalidFields.has('regPassword') ? 'border-destructive focus-visible:ring-destructive' : ''}
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
                        className={invalidFields.has('detailsName') ? 'border-destructive focus-visible:ring-destructive' : ''}
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
                      className={invalidFields.has('address') ? 'border-destructive focus-visible:ring-destructive' : ''}
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

                  {error && (
                    <div className="p-3 bg-destructive text-destructive-foreground rounded-md mt-6">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

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
