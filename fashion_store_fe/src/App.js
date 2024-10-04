import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes } from './routes';
import DefaultLayout from './components/Layout/DefaultLayout';
import { Fragment, useReducer } from 'react';
import { MyUserContext, MyDispatchContext } from '~/utils/context'; // Đường dẫn tới file context của bạn
import { MyUserReducer } from '~/utils/reducers'; // Đường dẫn tới reducer của bạn

function App() {
    // Sử dụng useReducer để quản lý trạng thái người dùng
    const [user, dispatch] = useReducer(MyUserReducer, null); // `dispatch` được lấy từ useReducer

    return (
        <MyUserContext.Provider value={user}>
            <MyDispatchContext.Provider value={dispatch}>
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
            </MyDispatchContext.Provider>
        </MyUserContext.Provider>
    );
}

export default App;
