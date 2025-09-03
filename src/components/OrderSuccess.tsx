import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import { 
  CheckCircle, 
  ContentCopy, 
  Home,
  AccountBalance,
  Receipt
} from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';

interface OrderData {
  orderNumber: string;
  items: Array<{
    productName: string;
    selectedDimensions: Record<string, string>;
    quantity: number;
    price: number;
  }>;
  total: number;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

export const OrderSuccess: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  // Bank details - in a real app, these would come from a config/environment
  const bankDetails = {
    bankName: "EzBox Banking Corp",
    accountName: "EzBox Store Ltd",
    accountNumber: "1234567890",
    swiftCode: "EZBOXUS1",
    routingNumber: "021000021"
  };

  useEffect(() => {
    // Get order data from sessionStorage
    const storedOrder = sessionStorage.getItem('currentOrder');
    if (storedOrder) {
      try {
        const order = JSON.parse(storedOrder) as OrderData;
        if (order.orderNumber === orderNumber) {
          setOrderData(order);
          // Clear cart after successful order
          clearCart();
          // Don't remove sessionStorage immediately - keep it for the session
        } else {
          // Order number doesn't match
          console.warn('Order number mismatch');
          setOrderData(null);
        }
      } catch (error) {
        console.error('Error parsing order data:', error);
        setOrderData(null);
      }
    } else {
      // No order data found
      console.warn('No order data found');
      setOrderData(null);
    }
  }, [orderNumber, navigate, clearCart]);

  // Clean up sessionStorage only when user explicitly navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('currentOrder');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(field);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  if (!orderData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Order not found. Please contact support if you believe this is an error.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            size="large"
          >
            Return Home
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Success Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Order Confirmed!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Thank you for your purchase
        </Typography>
      </Box>

      {/* Order Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Receipt sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              Order Details
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1">
              <strong>Order Number:</strong> {orderData.orderNumber}
            </Typography>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date(orderData.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              <strong>Customer:</strong> {orderData.customerInfo.name}
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong> {orderData.customerInfo.phone}
            </Typography>
            <Typography variant="body1">
              <strong>Delivery Address:</strong> {orderData.customerInfo.address}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Items Ordered:
          </Typography>
          
          {orderData.items.map((item, index) => (
            <Box key={index} sx={{ mb: 2, pl: 2 }}>
              <Typography variant="body1" fontWeight="medium">
                {item.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.entries(item.selectedDimensions)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2">
                  Quantity: {item.quantity}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Total Amount:
            </Typography>
            <Typography variant="h6" color="primary">
              ${orderData.total.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              Payment Instructions
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Please complete your payment via bank transfer using the details below. 
            Your order will be processed once payment is confirmed.
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bank Transfer Details:
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2 }}>
              {/* Bank Name */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Bank Name</Typography>
                  <Typography variant="body1" fontWeight="medium">{bankDetails.bankName}</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(bankDetails.bankName, 'bankName')}
                  color={copySuccess === 'bankName' ? 'success' : 'default'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>

              {/* Account Name */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Account Name</Typography>
                  <Typography variant="body1" fontWeight="medium">{bankDetails.accountName}</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(bankDetails.accountName, 'accountName')}
                  color={copySuccess === 'accountName' ? 'success' : 'default'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>

              {/* Account Number */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Account Number</Typography>
                  <Typography variant="body1" fontWeight="medium">{bankDetails.accountNumber}</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(bankDetails.accountNumber, 'accountNumber')}
                  color={copySuccess === 'accountNumber' ? 'success' : 'default'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>

              {/* Routing Number */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Routing Number</Typography>
                  <Typography variant="body1" fontWeight="medium">{bankDetails.routingNumber}</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(bankDetails.routingNumber, 'routingNumber')}
                  color={copySuccess === 'routingNumber' ? 'success' : 'default'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>

              {/* Transfer Amount */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '2px solid', borderColor: 'primary.200' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Transfer Amount</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${orderData.total.toFixed(2)}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(orderData.total.toFixed(2), 'amount')}
                  color={copySuccess === 'amount' ? 'success' : 'primary'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>

              {/* Reference/Memo */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Transfer Reference/Memo
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="warning.dark">
                    {orderData.orderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Please include this reference in your transfer
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => handleCopy(orderData.orderNumber, 'reference')}
                  color={copySuccess === 'reference' ? 'success' : 'default'}
                >
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {copySuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Copied to clipboard!
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Important:</strong> Please include the order number "{orderData.orderNumber}" 
            as the transfer reference/memo to ensure your payment is properly processed.
          </Alert>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Home />}
          onClick={() => navigate('/')}
          size="large"
        >
          Continue Shopping
        </Button>
        <Button
          variant="contained"
          onClick={() => window.print()}
          size="large"
        >
          Print Order Details
        </Button>
      </Box>
    </Container>
  );
};