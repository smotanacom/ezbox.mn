import React from 'react';
import {Link as RouterLink, Route, Routes, useNavigate} from 'react-router-dom';
import {AppBar, Box, Link, Toolbar, IconButton, Badge, Button} from '@mui/material';
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
            <AppBar position="static">
                <Toolbar>
                    <Link
                        component={RouterLink}
                        to="/"
                        variant="h6"
                        sx={{cursor: 'pointer', textDecoration: 'none', color: 'inherit', mr: 3}}
                    >
                        EzBox Store
                    </Link>
                    <Box sx={{ flexGrow: 1 }}>
                        <Button
                            color="inherit"
                            component={RouterLink}
                            to="/specials"
                            startIcon={<LocalOffer />}
                            sx={{ textTransform: 'none', fontSize: '1rem' }}
                        >
                            Specials
                        </Button>
                    </Box>
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/orders')}
                        sx={{ mr: 2 }}
                    >
                        <Badge badgeContent={orderCount} color="secondary">
                            <Receipt />
                        </Badge>
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/cart')}
                        sx={{ mr: 1 }}
                    >
                        <Badge badgeContent={itemCount} color="secondary">
                            <ShoppingCart />
                        </Badge>
                    </IconButton>
                </Toolbar>
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
