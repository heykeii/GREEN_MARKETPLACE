import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import Homepage from "./pages/Homepage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import SellerApplicationForm from "./pages/SellerApplicationForm";
import Profile from "./pages/Profile";
import SellerDashboard from './pages/SellerDashboard';
import CreateProduct from './pages/CreateProduct';
import AdminProductVerification from './pages/AdminProductVerification';
import PublicProfile from './pages/PublicProfile';
import CartPage from './pages/CartPage';
import ProductPage from './pages/ProductPage';
import SearchResults from './pages/SearchResults';
import AdminSellerVerification from './pages/AdminSellerVerification';
import AdminUserManagement from './pages/AdminUserManagement';
import Products from './pages/Products';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';

import AdminReportManagement from './pages/AdminReportManagement';
import MyReports from './pages/MyReports';
import SellerOrderManagement from './pages/SellerOrderManagement';
import NotificationsPage from './pages/NotificationsPage';

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/seller/application" element={<SellerApplicationForm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<PublicProfile />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/create-product" element={<CreateProduct />} />
        <Route path="/seller/orders" element={<SellerOrderManagement />} />
        <Route path="/seller/orders/:orderId" element={<SellerOrderManagement />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/product-verification" 
          element={
            <ProtectedAdminRoute>
              <AdminProductVerification />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/seller-verification" 
          element={
            <ProtectedAdminRoute>
              <AdminSellerVerification />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/user-management" 
          element={
            <ProtectedAdminRoute>
              <AdminUserManagement />
            </ProtectedAdminRoute>
          }
        />

        <Route 
          path="/admin/report-management" 
          element={
            <ProtectedAdminRoute>
              <AdminReportManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/" element={<Homepage />} />
      </Routes>
    </>
  );
};

export default App;
