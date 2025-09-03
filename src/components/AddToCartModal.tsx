import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton
} from '@mui/material';
import { Close, CheckCircle, ShoppingCart, ArrowForward } from '@mui/icons-material';

interface AddToCartModalProps {
  open: boolean;
  onClose: () => void;
  onViewCart: () => void;
  onContinueShopping: () => void;
  productName: string;
  quantity: number;
}

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  open,
  onClose,
  onViewCart,
  onContinueShopping,
  productName,
  quantity
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle color="success" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Added to Cart!
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Successfully added {quantity} {quantity === 1 ? 'item' : 'items'} of{' '}
          <strong>{productName}</strong> to your cart.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onContinueShopping}
          startIcon={<ArrowForward />}
          sx={{ flex: 1 }}
        >
          Continue Shopping
        </Button>
        <Button
          variant="contained"
          onClick={onViewCart}
          startIcon={<ShoppingCart />}
          sx={{ flex: 1 }}
        >
          View Cart
        </Button>
      </DialogActions>
    </Dialog>
  );
};