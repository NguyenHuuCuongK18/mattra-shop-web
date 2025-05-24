import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";

// User Pages
import ProfilePage from "./pages/user/ProfilePage";
import CartPage from "./pages/user/CartPage";
import CheckoutPage from "./pages/user/CheckoutPage";
import OrdersPage from "./pages/user/OrdersPage";
import OrderDetailPage from "./pages/user/OrderDetailPage";
import ChatPage from "./pages/user/ChatPage";
import PaymentResultPage from "./pages/user/PaymentResultPage"; // ← Added import

// Admin Pages
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminProductsPage from "./pages/admin/ProductsPage";
import AdminCategoriesPage from "./pages/admin/CategoriesPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminSubscriptionsPage from "./pages/admin/SubscriptionsPage";
import AdminVouchersPage from "./pages/admin/VouchersPage";
import AdminPromptCategoriesPage from "./pages/admin/PromptCategoriesPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  console.log("App rendering, current location:", window.location.pathname);

  return (
    <Router>
      <Routes>
        {/* Public & Protected User Routes under MainLayout */}
        <Route path="/" element={<MainLayout />}>
          {/* Public */}
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route
            path="products/:id"
            element={<ProductDetailPage />}
            onEnter={() => console.log("Matched product/:id route")}
          />
          <Route
            path="login"
            element={!user ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="register"
            element={!user ? <RegisterPage /> : <Navigate to="/" />}
          />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />

          {/* Protected User */}
          <Route
            path="profile"
            element={user ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="cart"
            element={user ? <CartPage /> : <Navigate to="/login" />}
          />
          <Route
            path="checkout"
            element={user ? <CheckoutPage /> : <Navigate to="/login" />}
          />
          <Route
            path="orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" />}
          />
          <Route
            path="orders/:id"
            element={user ? <OrderDetailPage /> : <Navigate to="/login" />}
          />
          <Route
            path="chat"
            element={user ? <ChatPage /> : <Navigate to="/login" />}
          />

          {/* VNPay return/receipt page */}
          <Route path="payment/result" element={<PaymentResultPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
          <Route
            path="prompt-categories"
            element={<AdminPromptCategoriesPage />}
          />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <div>404 - No route matched for {window.location.pathname}</div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
