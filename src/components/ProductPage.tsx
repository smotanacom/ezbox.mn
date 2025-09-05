import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowBack, Add, Remove } from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { Product, ProductVariant } from '../types/Product';
import { useCartStore } from '../store/cartStore';
import { AddToCartModal } from './AddToCartModal';

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { getProductById } = useProducts();
  const addItem = useCartStore(state => state.addItem);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (productId) {
      const foundProduct = getProductById(productId);
      if (foundProduct) {
        setProduct(foundProduct);
        // Initialize with first available option for each dimension
        const initialDimensions: Record<string, string> = {};
        foundProduct.dimensions.forEach(dimension => {
          if (dimension.options.length > 0) {
            initialDimensions[dimension.name] = dimension.options[0].value;
          }
        });
        setSelectedDimensions(initialDimensions);
      }
    }
  }, [productId, getProductById]);

  useEffect(() => {
    if (product && Object.keys(selectedDimensions).length > 0) {
      // Find matching variant
      const variant = product.variants.find(v => {
        return Object.entries(selectedDimensions).every(([dimName, dimValue]) => {
          return v.dimensionValues[dimName] === dimValue;
        });
      });
      setCurrentVariant(variant || null);
    }
  }, [product, selectedDimensions]);

  const handleDimensionChange = (dimensionName: string, value: string) => {
    setSelectedDimensions(prev => ({
      ...prev,
      [dimensionName]: value
    }));
  };

  // Helper function to check if a specific dimension option would result in out-of-stock
  const isOptionOutOfStock = (dimensionName: string, optionValue: string): boolean => {
    if (!product) return true;
    
    // Create a hypothetical selection with this option
    const hypotheticalSelection = {
      ...selectedDimensions,
      [dimensionName]: optionValue
    };
    
    // Check if any variant matches this selection and is in stock
    const hasInStockVariant = product.variants.some(variant => {
      const matchesAllDimensions = Object.entries(hypotheticalSelection).every(
        ([dimName, dimValue]) => variant.dimensionValues[dimName] === dimValue
      );
      return matchesAllDimensions && variant.inStock;
    });
    
    return !hasInStockVariant;
  };

  const getCurrentPrice = (): number => {
    if (currentVariant?.price) {
      return currentVariant.price;
    }
    return product?.basePrice || 0;
  };

  const getCurrentImage = (): string => {
    if (currentVariant?.image) {
      return currentVariant.image;
    }
    return product?.mainImage || 'https://placehold.co/600x400/cccccc/666666?text=No+Image';
  };

  const isInStock = (): boolean => {
    return currentVariant?.inStock || false;
  };

  const handleAddToCart = () => {
    if (product && currentVariant) {
      addItem({
        productId: product.id,
        productName: product.name,
        selectedDimensions,
        quantity,
        price: getCurrentPrice(),
        image: getCurrentImage(),
        inStock: currentVariant.inStock
      });
      setModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleViewCart = () => {
    setModalOpen(false);
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    setModalOpen(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://placehold.co/500x500/cccccc/666666?text=No+Image';
    // Ensure the fallback image also has the correct dimensions
    e.currentTarget.style.minHeight = '400px';
    e.currentTarget.style.maxHeight = '400px';
  };

  if (!product) {
    return (
      <Container>
        <Alert severity="error">Product not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            component={RouterLink}
            to="/"
            color="inherit" 
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Products
          </Link>
          <Typography color="text.primary">{product.name}</Typography>
        </Breadcrumbs>
      </Box>

      <IconButton 
        onClick={() => navigate('/')} 
        sx={{ mb: 2 }}
      >
        <ArrowBack />
      </IconButton>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Product Image */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '500px' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <img
              src={getCurrentImage()}
              alt={product.name}
              onError={handleImageError}
              style={{
                width: '100%',
                height: '400px',
                minHeight: '400px',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block'
              }}
            />
          </Paper>
        </Box>

        {/* Product Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {product.name}
          </Typography>
          
          {product.category && (
            <Chip 
              label={product.category} 
              sx={{ mb: 2, textTransform: 'capitalize' }} 
            />
          )}

          <Typography variant="h4" color="primary" sx={{ mb: 3 }}>
            ${getCurrentPrice().toFixed(2)}
            {currentVariant?.price && (
              <Typography 
                component="span" 
                variant="body2" 
                sx={{ ml: 1, textDecoration: 'line-through', color: 'text.secondary' }}
              >
                ${product.basePrice.toFixed(2)}
              </Typography>
            )}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {product.description}
          </Typography>

          {/* Dimension Selectors */}
          <Box sx={{ mb: 4 }}>
            {product.dimensions.map((dimension) => (
              <FormControl fullWidth sx={{ mb: 2 }} key={dimension.name}>
                <InputLabel sx={{ textTransform: 'capitalize' }}>
                  {dimension.name}
                </InputLabel>
                <Select
                  value={selectedDimensions[dimension.name] || ''}
                  label={dimension.name}
                  onChange={(e) => handleDimensionChange(dimension.name, e.target.value)}
                >
                  {dimension.options.map((option) => {
                    const isOutOfStock = isOptionOutOfStock(dimension.name, option.value);
                    return (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{
                          color: isOutOfStock ? 'text.disabled' : 'text.primary',
                          fontStyle: isOutOfStock ? 'italic' : 'normal',
                          opacity: isOutOfStock ? 0.6 : 1
                        }}
                      >
                        {option.name}
                        {isOutOfStock && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ 
                              ml: 1, 
                              color: 'error.main', 
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            (Out of Stock)
                          </Typography>
                        )}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            ))}
          </Box>

          {/* Stock Status */}
          {currentVariant && (
            <Box sx={{ mb: 3 }}>
              <Chip 
                label={isInStock() ? "In Stock" : "Out of Stock"} 
                color={isInStock() ? "success" : "error"}
                variant="outlined"
              />
            </Box>
          )}

          {/* Quantity Selector */}
          {isInStock() && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body1">Quantity:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Remove />
                </IconButton>
                <Typography sx={{ mx: 2, minWidth: '2ch', textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton 
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Add to Cart Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleAddToCart}
            disabled={!isInStock()}
            sx={{ py: 1.5 }}
          >
            {isInStock() ? 'Add to Cart' : 'Out of Stock'}
          </Button>

          {/* Product Tags */}
          {product.tags && product.tags.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {product.tags.map((tag) => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <AddToCartModal
        open={modalOpen}
        onClose={handleModalClose}
        onViewCart={handleViewCart}
        onContinueShopping={handleContinueShopping}
        productName={product?.name || ''}
        quantity={quantity}
      />
    </Container>
  );
};