import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white',
          textAlign: 'center',
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800"
          alt="Shopping and retail"
          sx={{
            width: '100%',
            maxWidth: 600,
            height: 300,
            objectFit: 'cover',
            borderRadius: 2,
            mb: 4,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        />
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to EzBox Store
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.95 }}>
          Your One-Stop Shop for Quality Products
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', opacity: 0.9, mb: 4 }}>
          Discover our carefully curated selection of premium products. From electronics to fashion,
          home essentials to unique gifts, we bring you the best quality at unbeatable prices.
          Shop with confidence with our secure checkout and fast delivery.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingBagIcon />}
          onClick={() => navigate('/products')}
          sx={{
            backgroundColor: 'white',
            color: '#667eea',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          Shop Now
        </Button>
      </Paper>
    </Container>
  );
};