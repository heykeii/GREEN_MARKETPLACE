import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import Homepage from "./pages/Homepage";

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/" element={<Homepage />} />
      </Routes>
    </>
  );
};

export default App;
