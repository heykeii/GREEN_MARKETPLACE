import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import noProfile from "@/assets/no_profile.jpg";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const avatar = user && user.avatar ? user.avatar : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    
    <nav className="w-full bg-gradient-to-r from-green-600 to-green-400 border-b border-green-700 shadow-lg sticky top-0 z-50">
   
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo/Brand */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span
              className="text-2xl font-extrabold text-white tracking-tight cursor-pointer drop-shadow-md"
              onClick={() => navigate("/")}
            >
              Green Marketplace
            </span>
          </div>
          {/* Center: Nav Links */}
          <div className="hidden md:flex gap-8">
            <button
              onClick={() => navigate("/")}
              className="text-white hover:text-green-100 font-semibold transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/products")}
              className="text-white hover:text-green-100 font-semibold transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => navigate("/campaign")}
              className="text-white hover:text-green-100 font-semibold transition-colors"
            >
              Campaign
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-white hover:text-green-100 font-semibold transition-colors"
            >
              About Us
            </button>
          </div>
          {/* Right: Search + Sign In/Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-44">
              <Input
                type="text"
                placeholder="Search..."
                className="bg-white/90 text-green-900 placeholder:text-green-400 border-green-300 focus:ring-green-700 focus:border-green-700"
              />
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2 flex items-center gap-2 text-green-700 font-bold cursor-pointer rounded-full px-2 py-1 focus:outline-none">
                    <img
                      src={user.avatar || noProfile}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = noProfile;
                      }}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover border-4 border-green-300"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-semibold">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                className="ml-2 bg-white text-green-700 font-bold hover:bg-green-100 border border-green-200 shadow"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const AdminNavbar = () => {
  const navigate = useNavigate();
  
  const handleAdminLogout = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to logout from admin panel?')) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      toast.success('Admin logged out successfully!');
      navigate("/admin/login");
    }
  };

  return (
    <nav className="w-full bg-green-800 text-white shadow-md py-4 px-8 flex items-center justify-between">
      <div className="text-2xl font-bold tracking-wide">Green Marketplace</div>
      <div className="flex gap-8 text-lg font-semibold">
        <Link to="/admin/product-verification" className="hover:text-green-200 transition">Product Verification</Link>
        <Link to="/admin/seller-verification" className="hover:text-green-200 transition">Seller Verification</Link>
        <Link to="/admin/reports" className="hover:text-green-200 transition">Reports/Complaints</Link>
        <button 
          onClick={handleAdminLogout}
          className="hover:text-green-200 transition bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
