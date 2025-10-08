import React from 'react';
import {Link as RouterLink, Route, Routes, useNavigate} from 'react-router-dom';
import {AppBar, Box, Link, Toolbar, IconButton, Badge, Button, Container} from '@mui/material';
import {ShoppingCart, Receipt, LocalOffer} from '@mui/icons-material';
import {HomePage} from './components/HomePage';
import {Specials} from './components/Specials';
import {ProductPage} from './components/ProductPage';
import {Cart} from './components/Cart';
import {Checkout} from './components/Checkout';
import {OrderSuccess} from './components/OrderSuccess';
import {OrderList} from './components/OrderList';
import {createTheme, ThemeProvider} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {useCartStore} from './store/cartStore';
import {useOrderStore} from './store/orderStore';

function AppContent() {
    const navigate = useNavigate();
    const itemCount = useCartStore(state => state.getItemCount());
    const orderCount = useOrderStore(state => state.orders.length);

    return (
        <Box>
            <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: 1 }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <Link
                            component={RouterLink}
                            to="/"
                            variant="h6"
                            sx={{cursor: 'pointer', textDecoration: 'none', color: 'text.primary', mr: 3}}
                        >
                            EzBox Store
                        </Link>
                        <Box sx={{ flexGrow: 1 }}>
                            <Button
                                component={RouterLink}
                                to="/specials"
                                startIcon={<LocalOffer />}
                                sx={{ textTransform: 'none', fontSize: '1rem', color: 'text.primary' }}
                            >
                                Specials
                            </Button>
                        </Box>
                        <IconButton
                            onClick={() => navigate('/orders')}
                            sx={{ mr: 2, color: 'text.primary' }}
                        >
                            <Badge badgeContent={orderCount} color="secondary">
                                <Receipt />
                            </Badge>
                        </IconButton>
                        <IconButton
                            onClick={() => navigate('/cart')}
                            sx={{ mr: 1, color: 'text.primary' }}
                        >
                            <Badge badgeContent={itemCount} color="secondary">
                                <ShoppingCart />
                            </Badge>
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            <Routes>
                <Route index element={<HomePage/>}/>
                <Route path="/specials" element={<Specials/>}/>
                <Route path="/product/:productId" element={<ProductPage/>}/>
                <Route path="/cart" element={<Cart/>}/>
                <Route path="/checkout" element={<Checkout/>}/>
                <Route path="/orders" element={<OrderList/>}/>
                <Route path="/order/:orderNumber" element={<OrderSuccess/>}/>
                <Route path="/order-success/:orderNumber" element={<OrderSuccess/>}/>
            </Routes>
        </Box>
    );
}

const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
    return (
        <React.StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <AppContent/>
            </ThemeProvider>
        </React.StrictMode>
    );
}

export default App;
