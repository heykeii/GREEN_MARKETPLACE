import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
// ToastProvider is mounted at root in main.jsx
import "./styles/toast.css";
import ErrorBoundary, { PageErrorBoundary } from "./components/ErrorBoundary";
import { setupGlobalErrorHandling, setupAccountValidation } from "./utils/errorHandling";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import Homepage from "./pages/Homepage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminOrderRecords from "./pages/AdminOrderRecords";
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
import Messages from './pages/Messages';
import ChatView from './pages/ChatView';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';
import CreateCampaign from './pages/CreateCampaign';
import AdminCampaignManagement from './pages/AdminCampaignManagement';
import AdminAnnouncementManagement from './pages/AdminAnnouncementManagement';
import AdminFeedback from './pages/AdminFeedback';
import SustainabilityHub from './pages/SustainabilityHub';
import SustainabilityDetail from './pages/SustainabilityDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminSustainability from './pages/AdminSustainability';
import Terms from './pages/Terms';
import LikedCampaigns from './pages/LikedCampaigns';

const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Setup account validation for automatic logout
    setupAccountValidation();
  }, []);

  return (
    <ErrorBoundary>
      <ScrollToTopOnRouteChange />
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
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<ChatView />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/liked-campaigns" element={<LikedCampaigns />} />
        <Route path="/create-campaign" element={<CreateCampaign />} />
        <Route path="/profile/followers" element={<FollowersPage />} />
        <Route path="/profile/following" element={<FollowingPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/sustainability" element={<SustainabilityHub />} />
        <Route path="/sustainability/:id" element={<SustainabilityDetail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
        <Route 
          path="/admin/campaign-management" 
          element={
            <ProtectedAdminRoute>
              <AdminCampaignManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/announcements" 
          element={
            <ProtectedAdminRoute>
              <AdminAnnouncementManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/sustainability" 
          element={
            <ProtectedAdminRoute>
              <AdminSustainability />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/feedback" 
          element={
            <ProtectedAdminRoute>
              <AdminFeedback />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/order-records" 
          element={
            <ProtectedAdminRoute>
              <AdminOrderRecords />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/" element={<Homepage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
