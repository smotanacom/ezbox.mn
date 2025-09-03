import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

export const ProductList: React.FC = () => {
  const { products, loading, error } = useProducts();
  const navigate = useNavigate();

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Our Products
      </Typography>
      
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