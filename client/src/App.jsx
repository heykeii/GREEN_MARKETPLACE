import React from "react";
import { Button } from "./components/ui/button";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";

const App = () => {
  return (
    <div>
      
        <ToastContainer position="top-right" autoClose={5000} />
        <Routes>
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
        </Routes>
     
    </div>
  );
};

export default App;
