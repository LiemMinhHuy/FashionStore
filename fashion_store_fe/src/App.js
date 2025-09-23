import React, { useReducer, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes'; // Cập nhật import
import DefaultLayout from '~/layouts/DefaultLayout';
import { MyUserContext, MyDispatchContext } from '~/utils/Context/context';
import { MyUserReducer } from '~/utils/reducers';
import { CartProvider } from '~/utils/Context/cartContext';
import ScrollToTop from '~/components/ScrollToTop';

function App() {
    const initialUserState = JSON.parse(localStorage.getItem('user_data')) || null;
    const [user, dispatch] = useReducer(MyUserReducer, initialUserState);

    useEffect(() => {
        if (user) {
            localStorage.setItem('user_data', JSON.stringify(user));
        } else {
            localStorage.removeItem('user_data');
        }
    }, [user]);

    return (
        <MyUserContext.Provider value={user}>
            <MyDispatchContext.Provider value={dispatch}>
                <CartProvider>
                    <Router>
                        <ScrollToTop />
                        <div className="App">
                            <Routes>
                                {publicRoutes.map((route, index) => {
                                    const Page = route.component;
                                    const Layout = route.layout === null ? null : route.layout || DefaultLayout;

                                    return (
                                        <Route
                                            key={index}
                                            path={route.path}
                                            element={
                                                Layout ? (
                                                    <Layout>
                                                        <Page />
                                                    </Layout>
                                                ) : (
                                                    <Page />
                                                )
                                            }
                                        />
                                    );
                                })}
                                {privateRoutes.map((route, index) => {
                                    const Page = route.component;
                                    const Layout = route.layout === null ? null : route.layout || DefaultLayout;

                                    return (
                                        <Route
                                            key={index}
                                            path={route.path}
                                            element={
                                                Layout ? (
                                                    <Layout>
                                                        <Page />
                                                    </Layout>
                                                ) : (
                                                    <Page />
                                                )
                                            }
                                        />
                                    );
                                })}
                            </Routes>
                        </div>
                    </Router>
                </CartProvider>
            </MyDispatchContext.Provider>
        </MyUserContext.Provider>
    );
}

export default App;
