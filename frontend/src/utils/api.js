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

// Authentication & User API
export const authAPI = {
  register: (userData) => api.post("/api/user/register", userData),
  login: (credentials) => api.post("/api/user/login", credentials),
  getProfile: () => api.get("/api/user/profile"),
  changePassword: (passwordData) =>
    api.put("/api/user/change-password", passwordData),
  requestPasswordReset: (email) =>
    api.post("/api/user/request-password-reset", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/api/user/reset-password", { token, newPassword }),
  updateProfile: (userData) => api.put("/api/user/update", userData),
  uploadAvatar: (formData) =>
    api.post("/api/user/update-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  logout: () => api.post("/api/user/logout"),
  getAllUsers: () => api.get("/api/user"),
  updateSubscriptionStatus: (userId, subscriptionData) =>
    api.put(`/api/user/${userId}/subscription`, subscriptionData),
  deleteUser: (userId) => api.delete(`/api/user/delete/${userId}`),
};

// Product API
export const productAPI = {
  getAllProducts: () => api.get("/api/product"),
  getProductById: (id) => api.get(`/api/product/${id}`),
  createProduct: (formData) =>
    api.post("/api/product/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id, formData) =>
    api.put(`/api/product/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id) => api.delete(`/api/product/delete/${id}`),
};

// Category API
export const categoryAPI = {
  getAllCategories: () => api.get("/api/category"),
  getCategoryById: (id) => api.get(`/api/category/${id}`),
  createCategory: (categoryData) =>
    api.post("/api/category/create", categoryData),
  updateCategory: (id, categoryData) =>
    api.put(`/api/category/update/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/api/category/delete/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get("/api/cart"),
  addToCart: (cartItem) => api.post("/api/cart/add", cartItem),
  updateCartItem: (cartItem) => api.put("/api/cart/update", cartItem),
  removeFromCart: (productId) => api.delete(`/api/cart/remove/${productId}`),
  clearCart: () => api.delete("/api/cart/clear"),
};

// Order API
export const orderAPI = {
  getMyOrders: () => api.get("/api/order/my-orders"),
  getAllOrders: () => api.get("/api/order"),
  createOrder: (orderData) => api.post("/api/order/create", orderData),
  updateOrderStatus: (id, statusData) =>
    api.put(`/api/order/update/${id}`, statusData),
  cancelOrder: (id) => api.delete(`/api/order/cancel/${id}`),
  confirmDelivery: (id) => api.post(`/api/order/confirm-delivery/${id}`),
};

// Subscription API
export const subscriptionAPI = {
  getAllSubscriptions: () => api.get("/api/subscription"),
  getSubscriptionById: (id) => api.get(`/api/subscription/${id}`),
  getSubscribedUsers: () => api.get("/api/subscription/subscribed-users"),
  createSubscription: (subscriptionData) =>
    api.post("/api/subscription/create", subscriptionData),
  updateSubscription: (id, subscriptionData) =>
    api.put(`/api/subscription/update/${id}`, subscriptionData),
  deleteSubscription: (id) => api.delete(`/api/subscription/delete/${id}`),
};

// Voucher API
export const voucherAPI = {
  getAllVouchers: () => api.get("/api/voucher"),
  getVoucherById: (id) => api.get(`/api/voucher/${id}`),
  getUserVouchers: () => api.get("/api/voucher/user"),
  createVoucher: (voucherData) => api.post("/api/voucher/create", voucherData),
  assignVoucher: (voucherId, userId) =>
    api.post("/api/voucher/assign", { voucherId, userId }),
  assignVoucherToAll: (voucherId) =>
    api.post("/api/voucher/assign-everyone", { voucherId }),
  assignVoucherToSubscribers: (voucherId) =>
    api.post("/api/voucher/assign-subscribers", { voucherId }),
  claimVoucher: (voucherId) => api.post("/api/voucher/claim", { voucherId }),
  updateVoucher: (id, voucherData) =>
    api.put(`/api/voucher/update/${id}`, voucherData),
  deleteVoucher: (id) => api.delete(`/api/voucher/delete/${id}`),
  validateVoucher: (code) => api.post("/api/voucher/validate", { code }),
  applyVoucher: (code) => api.post("/api/voucher/apply", { code }),
};

// Gemini AI API
export const geminiAIApi = {
  generateDefaultResponse: (promptData) =>
    api.post("/api/geminiAI/generate/default", { prompt: promptData }),
  generateCombinedResponse: (promptData, promptCategoryId) =>
    api.post("/api/geminiAI/generate/combined", {
      prompt: promptData,
      promptCategoryId,
    }),
};

// Prompt Category API
export const promptCategoryAPI = {
  getAllPromptCategories: () => api.get("/api/promptCategory"),
  getPromptCategoryById: (id) => api.get(`/api/promptCategory/${id}`),
  createPromptCategory: (categoryData) =>
    api.post("/api/promptCategory/create", categoryData),
  updatePromptCategory: (id, categoryData) =>
    api.put(`/api/promptCategory/update/${id}`, categoryData),
  deletePromptCategory: (id) => api.delete(`/api/promptCategory/delete/${id}`),
};

// Review API
export const reviewAPI = {
  createReview: (reviewData) => api.post("/api/review/create", reviewData),
  getReviewsByProduct: (productId) => api.get(`/api/review/${productId}`),
  updateReview: (reviewId, reviewData) =>
    api.put(`/api/review/update/${reviewId}`, reviewData),
  deleteReview: (reviewId) => api.delete(`/api/review/delete/${reviewId}`),
};

// Payment (VietQR) API
export const paymentAPI = {
  generateVietQR: ({ orderId }) => api.post("/api/vietqr/create", { orderId }),
  logPaymentStatus: (paymentId, status, payload) =>
    api.post("/api/vietqr/status/log", { paymentId, status, payload }),
};

export default api;
