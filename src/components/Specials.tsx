import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

export const Specials: React.FC = () => {
  const { products, loading, error } = useProducts();
  const navigate = useNavigate();

  const specialProducts = products.filter(product => product.specialPrice);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const calculateSavings = (basePrice: number, specialPrice: number) => {
    const savings = basePrice - specialPrice;
    const percentage = Math.round((savings / basePrice) * 100);
    return { savings, percentage };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #ff4444 0%, #ff8888 100%)',
          borderRadius: 3,
          color: 'white',
          mb: 4,
          textAlign: 'center'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <LocalOfferIcon sx={{ fontSize: 48, mr: 2 }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Special Offers
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.95 }}>
          Limited time deals on premium furniture - Save up to 30% off!
        </Typography>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && specialProducts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No Special Offers Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Check back soon for amazing deals on furniture!
          </Typography>
        </Paper>
      )}

      {specialProducts.length > 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">
              {specialProducts.length} items on sale
            </Typography>
            {specialProducts.map(product => {
              const { percentage } = calculateSavings(product.basePrice, product.specialPrice!);
              return percentage;
            }).filter((v, i, a) => a.indexOf(v) === i).map(percentage => (
              <Chip
                key={percentage}
                label={`${percentage}% OFF`}
                color="error"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3
            }}
          >
            {specialProducts.map((product) => {
              const { savings, percentage } = calculateSavings(product.basePrice, product.specialPrice!);
              return (
                <Box key={product.id} sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 1,
                      backgroundColor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      boxShadow: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      SAVE
                    </Typography>
                    <Typography variant="h6">
                      {percentage}%
                    </Typography>
                  </Box>
                  <ProductCard
                    product={product}
                    onClick={() => handleProductClick(product.id)}
                  />
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Container>
  );
};