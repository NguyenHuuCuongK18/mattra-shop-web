"use client";

import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Clear cart when user logs out
      setCart({ items: [] });
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.get("/api/cart");
      setCart(response.data.cart);
    } catch (error) {
      console.error("Fetch cart error:", error);
      toast.error("Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    setLoading(true);
    try {
      // Check if the product is already in the cart
      const existingItem = cart.items.find(
        (item) =>
          item.productId._id === productId || item.productId === productId
      );

      if (existingItem) {
        // If product exists in cart, update its quantity
        const newQuantity = existingItem.quantity + quantity;
        const response = await api.put("/api/cart/update", {
          productId,
          quantity: newQuantity,
        });
        setCart(response.data.cart);
        toast.success("Cart updated");
      } else {
        // If product is not in cart, add it
        const response = await api.post("/api/cart/add", {
          productId,
          quantity,
        });
        setCart(response.data.cart);
        toast.success("Item added to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      const message =
        error.response?.data?.message || "Failed to add item to cart";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.put("/api/cart/update", {
        productId,
        quantity,
      });
      setCart(response.data.cart);
      toast.success("Cart updated");
    } catch (error) {
      console.error("Update cart error:", error);
      const message = error.response?.data?.message || "Failed to update cart";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.delete(`/api/cart/remove/${productId}`);
      setCart(response.data.cart);
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Remove from cart error:", error);
      const message =
        error.response?.data?.message || "Failed to remove item from cart";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.delete("/api/cart/clear");
      setCart(response.data.cart);
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Clear cart error:", error);
      const message = error.response?.data?.message || "Failed to clear cart";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
