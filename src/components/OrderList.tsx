import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Receipt,
  Visibility,
  ShoppingBag,
  CalendarToday,
  Home
} from '@mui/icons-material';
import { useOrderStore } from '../store/orderStore';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { getAllOrders } = useOrderStore();
  const orders = getAllOrders();

  const handleViewOrder = (orderNumber: string) => {
    navigate(`/order/${orderNumber}`);
  };

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Order History
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your past orders will appear here
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't placed any orders yet. Start shopping to see your order history here!
        </Alert>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingBag />}
            onClick={() => navigate('/')}
          >
            Start Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Receipt sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Order History
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Home />}
          onClick={() => navigate('/')}
        >
          Back to Shop
        </Button>
      </Box>

      {/* Orders List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {orders.map((order) => (
          <Card key={order.orderNumber} sx={{ '&:hover': { boxShadow: 3 }, transition: 'box-shadow 0.2s' }}>
            <CardContent>
                {/* Order Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Order #{order.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ textAlign: 'right', mr: 1 }}>
                      <Typography variant="h6" color="primary">
                        ${order.total.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </Typography>
                    </Box>
                    <Tooltip title="View Order Details">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewOrder(order.orderNumber)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Customer Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Customer:</strong> {order.customerInfo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Phone:</strong> {order.customerInfo.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Address:</strong> {order.customerInfo.address}
                  </Typography>
                </Box>

                {/* Items Preview */}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Items:</strong>
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        • {item.productName} 
                        {Object.entries(item.selectedDimensions).length > 0 && (
                          <span style={{ opacity: 0.7 }}>
                            {' '}({Object.entries(item.selectedDimensions)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')})
                          </span>
                        )}
                        <span> × {item.quantity}</span>
                      </Typography>
                    ))}
                    {order.items.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        ... and {order.items.length - 3} more items
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Action Button */}
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewOrder(order.orderNumber)}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Container>
  );
};