import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';

interface CheckoutForm {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  address: string;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice } = useCartStore();
  const { addOrder } = useOrderStore();
  
  const [formData, setFormData] = useState<CheckoutForm>({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    address: ''
  });
  
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Your cart is empty. Please add items before checking out.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Start Shopping
        </Button>
      </Container>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CheckoutForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `EZ${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      // Create order data
      const orderData = {
        orderNumber,
        items: items.map(item => ({
          productName: item.productName,
          selectedDimensions: item.selectedDimensions,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalPrice(),
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phoneNumber,
          address: formData.address
        },
        createdAt: new Date().toISOString()
      };

      // Save order to persistent storage
      addOrder(orderData);

      // Store order data in sessionStorage for the success page
      sessionStorage.setItem('currentOrder', JSON.stringify(orderData));

      // Navigate to success page
      navigate(`/order-success/${orderNumber}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle error (could show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/cart')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h3" component="h1">
          Checkout
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Order Summary */}
        <Box sx={{ flex: 1, minWidth: { md: '300px' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {items.map((item) => (
                <Box key={item.id} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {Object.entries(item.selectedDimensions)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2">
                      Qty: {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Total:
                </Typography>
                <Typography variant="h6" color="primary">
                  ${getTotalPrice().toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Checkout Form */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Information
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      required
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange('phoneNumber')}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Delivery Address"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    error={!!errors.address}
                    helperText={errors.address}
                    placeholder="123 Main Street, Apt 4B, City, State, ZIP"
                    required
                    multiline
                    rows={3}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/cart')}
                      sx={{ flex: 1 }}
                    >
                      Back to Cart
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ flex: 2 }}
                    >
                      {isSubmitting ? 'Processing...' : 'Complete Order'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};