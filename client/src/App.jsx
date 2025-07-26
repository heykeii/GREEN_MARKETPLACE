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
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/create-product" element={<CreateProduct />} />
        <Route path="/cart" element={<CartPage />} />
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
        <Route path="/" element={<Homepage />} />
      </Routes>
    </>
  );
};

export default App;
