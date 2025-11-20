'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { getCurrentUser, login, register } from '@/lib/auth';
import { getUserByPhone, createOrder } from '@/lib/api';
import { PageContainer, PageTitle, EmptyState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Package } from 'lucide-react';
import type { User } from '@/types/database';

type CheckoutStep = 'phone' | 'login' | 'register' | 'details';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, items, total, refreshCart } = useCart();

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!/^\d{8}$/.test(phone)) {
      setError('Phone number must be exactly 8 digits');
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
      setError(err.message || 'Failed to check phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(phone, password);
      setCurrentUser(user);

      // Prefill form with user data
      setName(user.name || '');
      setAddress(user.address || '');
      setSecondaryPhone(user.secondary_phone || '');

      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!address.trim()) {
      setError('Delivery address is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      // Register the user
      const user = await register(phone, password, name, address, secondaryPhone || undefined);
      setCurrentUser(user);

      // User is now registered, submit button will be shown
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!address.trim()) {
      setError('Delivery address is required');
      setLoading(false);
      return;
    }
    if (!cart) {
      setError('No active cart found');
      setLoading(false);
      return;
    }

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

      // Refresh cart to clear it
      await refreshCart();

      // Redirect to order detail page
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || items.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add some products to your cart before checking out"
          action={
            <Button onClick={() => router.push('/products')} size="lg">
              Continue Shopping
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <PageTitle icon={Package}>Checkout</PageTitle>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>Enter your delivery details to complete the order</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

              {/* Phone number step */}
              {step === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="8 digits"
                      maxLength={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Enter your 8-digit phone number</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Checking...' : 'Continue'}
                  </Button>
                </form>
              )}

              {/* Login step */}
              {step === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="px-3 py-2 bg-muted border rounded-md">
                      {phone}
                    </div>
                    <Button
                      type="button"
                      onClick={() => setStep('phone')}
                      variant="link"
                      className="p-0 h-auto text-sm"
                    >
                      Change phone number
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              )}

              {/* Registration step */}
              {step === 'register' && (
                <form onSubmit={handleRegisterAndCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="px-3 py-2 bg-muted border rounded-md">
                      {phone}
                    </div>
                    <Button
                      type="button"
                      onClick={() => setStep('phone')}
                      variant="link"
                      className="p-0 h-auto text-sm"
                    >
                      Change phone number
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Delivery Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryPhone">
                      Secondary Phone Number (Optional)
                    </Label>
                    <Input
                      type="tel"
                      id="secondaryPhone"
                      value={secondaryPhone}
                      onChange={(e) => setSecondaryPhone(e.target.value)}
                      placeholder="8 digits"
                      maxLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">
                      Create Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="password"
                      id="regPassword"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account & Continue'}
                  </Button>
                </form>
              )}

              {/* Details step (for logged in users) */}
              {step === 'details' && (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="px-3 py-2 bg-muted border rounded-md">
                      {phone}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailsName">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="detailsName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailsAddress">
                      Delivery Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="detailsAddress"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailsSecondaryPhone">
                      Secondary Phone Number (Optional)
                    </Label>
                    <Input
                      type="tel"
                      id="detailsSecondaryPhone"
                      value={secondaryPhone}
                      onChange={(e) => setSecondaryPhone(e.target.value)}
                      placeholder="8 digits"
                      maxLength={8}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                </form>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>

              <div className="max-h-96 overflow-y-auto mb-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground flex-shrink-0">{item.product?.category?.name}</span>
                      <span className="font-medium truncate">{item.product?.name}</span>
                      <span className="text-muted-foreground flex-shrink-0">(x{item.quantity})</span>
                      <span className="font-medium ml-auto flex-shrink-0">
                        {((item.product?.base_price || 0) * item.quantity).toLocaleString()}₮
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{total.toLocaleString()}₮</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between pt-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">{total.toLocaleString()}₮</span>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
