// Layout
import { HeaderOnly } from '../components/Layout';

import HomePage from '../pages/HomePage';
import LoginPage from '~/pages/LoginPage';
import Profile from '../pages/Profile';
import Upload from '../pages/Upload';
import Search from '../pages/Search';

const publicRoutes = [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, layout: HeaderOnly },
    { path: '/register', component: LoginPage, layout: HeaderOnly },
    { path: '/profile', component: Profile },
    { path: '/upload', component: Upload, layout: HeaderOnly },
    { path: '/search', component: Search, layout: null },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
