// Layout
import { HeaderOnly, Account } from '~/layouts';

import Home from '../pages/Home';
import Login from '~/pages/Login';
import Profile from '../pages/Profile';
import Address from '../pages/Address';
import Coupon from '../pages/Coupon';
import Cards from '../pages/Cards';
import Upload from '../pages/Upload';
import Product from '../pages/Product';
import ProductDetailPage from '~/pages/ProductDetail';
import CartDetail from '~/components/CartDetails';
import CheckOut from '~/components/CheckOut';
import Order from '~/pages/Order';
import SignUp from '~/components/User/SignUp';
import Payment from '~/components/Payment';
import News from '~/components/News';
import NewsDetail from '~/components/NewsDetail';
import PaymentSuccess from '~/pages/PaymentSuccess';
import PaymentFailed from '~/pages/PaymentFailed';

import AdminLayout from '~/Admin/components/AdminLayout';
import AdminDashboard from '~/Admin/pages/AdminDashboard';
import AdminProduct from '~/Admin/components/AdminProducts';
import AdminCategory from '~/Admin/components/AdminCategory';
import AdminUser from '~/Admin/components/AdminUser';
import AdminOrder from '~/Admin/components/AdminOrder';

const publicRoutes = [
    { path: '/', component: Home },
    { path: '/login', component: Login, layout: null },
    { path: '/signup', component: SignUp, layout: null },
    { path: '/profile', component: Profile, layout: Account },
    { path: '/address', component: Address, layout: Account },
    { path: '/coupon', component: Coupon, layout: Account },
    { path: '/cards', component: Cards, layout: Account },
    { path: '/upload', component: Upload, layout: HeaderOnly },
    { path: '/products/category/:categoryId', component: Product },
    { path: '/products/:productId', component: ProductDetailPage, layout: HeaderOnly },
    { path: '/cart-details', component: CartDetail, layout: HeaderOnly },
    { path: '/checkout', component: CheckOut, layout: HeaderOnly },
    { path: '/order', component: Order, layout: Account },
    { path: '/payment', component: Payment, layout: HeaderOnly },
    { path: '/payment-success', component: PaymentSuccess, layout: null },
    { path: '/payment-failed', component: PaymentFailed, layout: null },
    { path: '/news', component: News },
    { path: '/news/:newsId', component: NewsDetail },
    { path: '/admin/dashboard', component: AdminDashboard, layout: AdminLayout },
    { path: '/admin/products', component: AdminProduct, layout: AdminLayout },
    { path: '/admin/category', component: AdminCategory, layout: AdminLayout },
    { path: '/admin/user', component: AdminUser, layout: AdminLayout },
    { path: '/admin/order', component: AdminOrder, layout: AdminLayout },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
