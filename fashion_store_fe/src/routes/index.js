// Layout
import { HeaderOnly } from '../components/Layout';

import HomePage from '../pages/HomePage';
import LoginPage from '~/pages/LoginPage';
import Profile from '../pages/Profile';
import Upload from '../pages/Upload';
import Product from '../pages/Product';
import ProductDetailPage from '~/pages/ProductDetailPage';
import CartDetail from '~/components/CartDetails';
import CheckOut from '~/components/CheckOut';
import Order from '~/components/Order';
import SignUp from '~/components/User/SignUp';
import Payment from '~/components/Payment';

const publicRoutes = [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, layout: HeaderOnly },
    { path: '/signup', component: SignUp, layout: HeaderOnly },
    { path: '/register', component: LoginPage, layout: HeaderOnly },
    { path: '/profile', component: Profile },
    { path: '/upload', component: Upload, layout: HeaderOnly },
    { path: '/products/category/:categoryId', component: Product },
    { path: '/products/:productId', component: ProductDetailPage, layout: HeaderOnly },
    { path: '/cart-details', component: CartDetail, layout: HeaderOnly },
    { path: '/checkout', component: CheckOut, layout: HeaderOnly },
    { path: '/order', component: Order, layout: HeaderOnly },
    { path: '/payment', component: Payment, layout: HeaderOnly },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
