// Layout
import { HeaderOnly } from '../components/Layout';

import HomePage from '../pages/HomePage';
import LoginPage from '~/pages/LoginPage';
import Profile from '../pages/Profile';
import Upload from '../pages/Upload';
import Product from '../pages/Product';
import ProductDetailPage from '~/pages/ProductDetailPage';

const publicRoutes = [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, layout: HeaderOnly },
    { path: '/register', component: LoginPage, layout: HeaderOnly },
    { path: '/profile', component: Profile },
    { path: '/upload', component: Upload, layout: HeaderOnly },
    { path: '/products/category/:categoryId', component: Product },
    { path: '/products/:productId', component: ProductDetailPage, layout: HeaderOnly },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
