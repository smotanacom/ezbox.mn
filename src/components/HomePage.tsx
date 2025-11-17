import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const specialsCount = products.filter(p => p.specialPrice).length;

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
          mb: 6
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
          TAvilga hiij bna
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.95 }}>
          Your One-Stop Shop for Quality Furniture
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', opacity: 0.9, mb: 4 }}>
          Discover our carefully curated selection of premium furniture. From living room essentials to bedroom comfort,
          office solutions to dining elegance, we bring you the best quality at unbeatable prices.
          Shop with confidence with our secure checkout and fast delivery.
        </Typography>
        {specialsCount > 0 && (
          <Button
            variant="contained"
            size="large"
            startIcon={<LocalOfferIcon />}
            onClick={() => navigate('/specials')}
            sx={{
              backgroundColor: '#ff4444',
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#ff6666'
              }
            }}
          >
            View {specialsCount} Special Offers
          </Button>
        )}
      </Paper>

      <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 4 }}>
        All Products
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading products...</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => handleProductClick(product.id)}
          />
        ))}
      </Box>
    </Container>
  );
};