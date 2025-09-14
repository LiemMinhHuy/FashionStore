// utils/context/CartContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuthApi } from '~/utils/request';
import { MyUserContext } from './context';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentUser = useContext(MyUserContext); // Lấy thông tin người dùng từ context

    useEffect(() => {
        if (currentUser) {
            const fetchCart = async () => {
                try {
                    const response = await getAuthApi().get('/carts/');
                    setCartItems(response.data.items);
                } catch (err) {
                    console.error('Error fetching cart:', err);
                    setError('Không thể tải giỏ hàng.');
                } finally {
                    setLoading(false);
                }
            };

            fetchCart();
        } else {
            setCartItems([]);
            setLoading(false);
        }
    }, [currentUser]);

    const addToCart = async (items, quantity) => {
        try {
            const response = await getAuthApi().post('/carts/add-cart/', {
                items,
                quantity,
            });

            // Gọi lại API để lấy thông tin chi tiết của giỏ hàng sau khi thêm sản phẩm
            const updatedCart = await getAuthApi().get('/carts/');

            // Cập nhật cartItems với dữ liệu mới
            setCartItems(updatedCart.data.items);

            return response.data;
        } catch (err) {
            console.error('Error adding to cart:', err);
            throw err;
        }
    };

    const updateCartItem = async (itemId, quantity) => {
        try {
            const response = await getAuthApi().patch(
                `/carts/update-cart-item/${itemId}/`,
                { quantity },
            );
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId
                        ? {
                              ...item,
                              quantity: response.data.quantity,
                              total_price: response.data.quantity * item.product.price,
                          }
                        : item,
                ),
            );
            return response.data;
        } catch (err) {
            console.error('Error updating cart item:', err);
            throw err;
        }
    };

    const removeCartItem = async (itemId) => {
        try {
            await getAuthApi().delete(`/carts/remove/${itemId}/`);
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (err) {
            console.error('Error removing cart item:', err);
            throw err;
        }
    };

    const clearCart = async () => {
        try {
            await getAuthApi().delete('/carts/clear/');
            setCartItems([]);
        } catch (err) {
            console.error('Error clearing cart:', err);
            throw err;
        }
    };

    return (
        <CartContext.Provider
            value={{ cartItems, addToCart, updateCartItem, removeCartItem, clearCart, loading, error }}
        >
            {children}
        </CartContext.Provider>
    );
};
