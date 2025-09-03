import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { ArrowBack, Add, Remove, Delete } from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalPrice 
  } = useCartStore();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const formatDimensions = (dimensions: Record<string, string>) => {
    return Object.entries(dimensions)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1">
            Shopping Cart
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          Your cart is empty. Start shopping to add items!
        </Alert>
        
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h3" component="h1">
          Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Cart Items */}
        <Box sx={{ flex: 2 }}>
          {items.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', p: 2 }}>
                <CardMedia
                  component="img"
                  sx={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mr: 2
                  }}
                  image={item.image}
                  alt={item.productName}
                />
                
                <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
                  <Typography variant="h6" gutterBottom>
                    {item.productName}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatDimensions(item.selectedDimensions)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ mr: 2 }}>
                      ${item.price.toFixed(2)}
                    </Typography>
                    <Chip 
                      label={item.inStock ? "In Stock" : "Out of Stock"} 
                      size="small" 
                      color={item.inStock ? "success" : "error"}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        size="small"
                      >
                        <Remove />
                      </IconButton>
                      <Typography sx={{ mx: 2, minWidth: '2ch', textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        size="small"
                      >
                        <Add />
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                      <IconButton 
                        onClick={() => removeItem(item.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearCart}
              sx={{ mr: 2 }}
            >
              Clear Cart
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </Button>
          </Box>
        </Box>

        {/* Order Summary */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Order Summary
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {item.productName} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Total:
                </Typography>
                <Typography variant="h6" color="primary">
                  ${getTotalPrice().toFixed(2)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{ py: 1.5 }}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};