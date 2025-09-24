import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://placehold.co/300x300/cccccc/666666?text=No+Image';
    // Ensure the fallback image also has the correct dimensions
    e.currentTarget.style.minHeight = '300px';
    e.currentTarget.style.maxHeight = '300px';
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s ease-in-out'
        } : {}
      }}
      onClick={onClick}
    >
      <CardMedia
        component="img"
        height="300"
        image={product.mainImage}
        alt={product.name}
        onError={handleImageError}
        sx={{ 
          objectFit: 'cover',
          display: 'block',
          minHeight: '300px',
          maxHeight: '300px',
          width: '100%'
        }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography gutterBottom variant="h6" component="h2">
          {product.name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {product.description}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {product.specialPrice ? (
              <>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    fontSize: '1rem'
                  }}
                >
                  ${product.basePrice.toFixed(2)}
                </Typography>
                <Typography variant="h6" component="span" color="error">
                  ${product.specialPrice.toFixed(2)}
                </Typography>
                <Chip
                  label="SALE"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 'bold' }}
                />
              </>
            ) : (
              <Typography variant="h6" component="span" color="primary">
                ${product.basePrice.toFixed(2)}
              </Typography>
            )}
          </Box>
          {product.category && (
            <Chip
              label={product.category}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};