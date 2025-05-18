"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../utils/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await authAPI.getProfile();
          setUser(response.data);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      toast.success("Registration successful!");
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      toast.success("Login successful!");
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      localStorage.removeItem("token");
      setUser(null);
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      // Still remove token and user on client side even if server logout fails
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data.user);
      toast.success("Profile updated successfully");
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Profile update failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.changePassword(passwordData);
      toast.success("Password changed successfully");
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Password change failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.requestPasswordReset(email);
      toast.success("Password reset email sent");
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Password reset request failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      toast.success("Password reset successful");
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Password reset failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isSubscriber = () => {
    return (
      user?.role === "subscriber" || user?.subscription?.status === "active"
    );
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    isAdmin,
    isSubscriber,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
