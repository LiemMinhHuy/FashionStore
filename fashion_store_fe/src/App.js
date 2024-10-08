// App.js
import React, { Fragment, useReducer, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes } from './routes';
import DefaultLayout from './components/Layout/DefaultLayout';
import { MyUserContext, MyDispatchContext } from '~/utils/Context/context'; // Đường dẫn tới file context của bạn
import { MyUserReducer } from '~/utils/reducers'; // Đường dẫn tới reducer của bạn
import { CartProvider } from '~/utils/Context/cartContext'; // Import CartProvider

function App() {
    // Kiểm tra `localStorage` để khôi phục trạng thái người dùng nếu đã có
    const initialUserState = JSON.parse(localStorage.getItem('user_data')) || null;

    // Sử dụng useReducer để quản lý trạng thái người dùng
    const [user, dispatch] = useReducer(MyUserReducer, initialUserState); // `dispatch` được lấy từ useReducer

    // Sử dụng useEffect để lắng nghe thay đổi của `user` và lưu vào localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('user_data', JSON.stringify(user)); // Lưu trạng thái người dùng vào localStorage
        } else {
            localStorage.removeItem('user_data'); // Xóa thông tin người dùng nếu không có
        }
    }, [user]); // Chạy mỗi khi `user` thay đổi

    return (
        <MyUserContext.Provider value={user}>
            <MyDispatchContext.Provider value={dispatch}>
                <CartProvider>
                    {' '}
                    {/* Bao bọc ứng dụng bằng CartProvider */}
                    <Router>
                        <div className="App">
                            <Routes>
                                {publicRoutes.map((route, index) => {
                                    const Page = route.component;

                                    let Layout = DefaultLayout;

                                    if (route.layout) {
                                        Layout = route.layout;
                                    } else if (route.layout === null) {
                                        Layout = Fragment;
                                    }

                                    return (
                                        <Route
                                            key={index}
                                            path={route.path}
                                            element={
                                                <Layout>
                                                    <Page />
                                                </Layout>
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
