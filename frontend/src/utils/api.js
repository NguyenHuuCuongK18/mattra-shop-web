import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:9999",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Bearer token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  // Register a new user
  register: (userData) => api.post("/api/user/register", userData),

  // Login user
  login: (credentials) => api.post("/api/user/login", credentials),

  // Get user profile
  getProfile: () => api.get("/api/user/profile"),

  // Change password
  changePassword: (passwordData) =>
    api.put("/api/user/change-password", passwordData),

  // Request password reset
  requestPasswordReset: (email) =>
    api.post("/api/user/request-password-reset", { email }),

  // Reset password
  resetPassword: (token, newPassword) =>
    api.post("/api/user/reset-password", { token, newPassword }),

  // Update user info
  updateProfile: (userData) => api.put("/api/user/update", userData),

  // Upload avatar
  uploadAvatar: (formData) =>
    api.post("/api/user/update-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Logout user
  logout: () => api.post("/api/user/logout"),

  // Get all users (admin only)
  getAllUsers: () => api.get("/api/user"),

  // Update user subscription status (admin only)
  updateSubscriptionStatus: (userId, subscriptionData) =>
    api.put(`/api/user/${userId}/subscription`, subscriptionData),
};
export const productAPI = {
  // Get all products
  getAllProducts: () => api.get("/api/product"),

  // Get product by ID
  getProductById: (id) => api.get(`/api/product/${id}`),

  // Create product (admin only)
  createProduct: (formData) =>
    api.post("/api/product/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Update product (admin only)
  updateProduct: (id, formData) =>
    api.put(`/api/product/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Delete product (admin only)
  deleteProduct: (id) => api.delete(`/api/product/delete/${id}`),
};

export const categoryAPI = {
  // Get all categories
  getAllCategories: () => api.get("/api/category"),

  // Get category by ID
  getCategoryById: (id) => api.get(`/api/category/${id}`),

  // Create category (admin only)
  createCategory: (categoryData) =>
    api.post("/api/category/create", categoryData),

  // Update category (admin only)
  updateCategory: (id, categoryData) =>
    api.put(`/api/category/update/${id}`, categoryData),

  // Delete category (admin only)
  deleteCategory: (id) => api.delete(`/api/category/delete/${id}`),
};

export const cartAPI = {
  // Get user's cart
  getCart: () => api.get("/api/cart"),

  // Add item to cart
  addToCart: (cartItem) => api.post("/api/cart", cartItem),

  // Update cart item quantity
  updateCartItem: (cartItem) => api.put("/api/cart", cartItem),

  // Remove item from cart
  removeFromCart: (productId) => api.delete(`/api/cart/${productId}`),

  // Clear cart
  clearCart: () => api.delete("/api/cart"),
};

export const orderAPI = {
  // Get user's orders
  getOrders: () => api.get("/api/order"),

  // Get all orders (admin only)
  getAllOrders: () => api.get("/api/order/all"),

  // Get order by ID
  getOrderById: (id) => api.get(`/api/order/${id}`),

  // Create order
  createOrder: (orderData) => api.post("/api/order/create", orderData),

  // Update order status (admin only)
  updateOrderStatus: (id, statusData) =>
    api.put(`/api/order/${id}/status`, statusData),
};

export const subscriptionAPI = {
  // Get all subscriptions
  getAllSubscriptions: () => api.get("/api/subscription"),

  // Get subscription by ID
  getSubscriptionById: (id) => api.get(`/api/subscription/${id}`),

  // Create subscription (admin only)
  createSubscription: (subscriptionData) =>
    api.post("/api/subscription/create", subscriptionData),

  // Update subscription (admin only)
  updateSubscription: (id, subscriptionData) =>
    api.put(`/api/subscription/update/${id}`, subscriptionData),

  // Delete subscription (admin only)
  deleteSubscription: (id) => api.delete(`/api/subscription/delete/${id}`),
};

export const voucherAPI = {
  // Get all vouchers
  getAllVouchers: () => api.get("/api/voucher"),

  // Get voucher by ID
  getVoucherById: (id) => api.get(`/api/voucher/${id}`),

  // Create voucher (admin only)
  createVoucher: (voucherData) => api.post("/api/voucher/create", voucherData),

  // Update voucher (admin only)
  updateVoucher: (id, voucherData) =>
    api.put(`/api/voucher/${id}`, voucherData),

  // Delete voucher (admin only)
  deleteVoucher: (id) => api.delete(`/api/voucher/delete/${id}`),

  // Apply voucher to cart
  // applyVoucher: (voucherCode) =>
  //   api.post("/api/voucher/apply", { code: voucherCode }),
};

export const geminiAIApi = {
  generateDefaultResponse: (promptData) =>
    api.post("/api/geminiAI/generate/default", { prompt: promptData }),
  generateCombinedResponse: (promptData, promptCategoryId) =>
    api.post("/api/geminiAI/generate/combined", {
      prompt: promptData,
      promptCategoryId,
    }),
};

export const promptCategoryAPI = {
  // Get all prompt categories
  getAllPromptCategories: () => api.get("/api/promptCategory"),

  // Get prompt category by ID
  getPromptCategoryById: (id) => api.get(`/api/promptCategory/${id}`),

  // Create prompt category (admin only)
  createPromptCategory: (categoryData) =>
    api.post("/api/promptCategory/create", categoryData),

  // Update prompt category (admin only)
  updatePromptCategory: (id, categoryData) =>
    api.put(`/api/promptCategory/${id}`, categoryData),

  // Delete prompt category (admin only)
  deletePromptCategory: (id) => api.delete(`/api/promptCategory/${id}`),
};

export const reviewAPI = {
  // Create a new review (require token)
  createReview: (reviewData) => api.post("/api/review/create", reviewData),

  // Get all reviews of a product
  getReviewsByProduct: (productId) => api.get(`/api/review/${productId}`),

  // Update a review (require token)
  updateReview: (reviewId, reviewData) =>
    api.put(`/api/review/update/${reviewId}`, reviewData),

  // Delete a review (require token)
  deleteReview: (reviewId) => api.delete(`/api/review/delete/${reviewId}`),
};

export default api;
