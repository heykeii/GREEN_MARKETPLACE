import React, { useState, useEffect } from "react";
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
import { FaUser, FaSignOutAlt, FaUserTie, FaStore, FaSearch, FaBars, FaTimes, FaLeaf, FaShoppingCart } from 'react-icons/fa';

const Navbar = ({ onProductsClick, onAboutClick }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Cart count logic
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products", onClick: onProductsClick },
    { label: "Campaign", path: "/campaign" },
    { label: "About Us", path: "/about", onClick: onAboutClick },
  ];

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-sm shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="relative">
              <FaLeaf className="text-2xl text-emerald-600 group-hover:text-emerald-700 transition-colors duration-200" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-teal-700 transition-all duration-200">
              Green Marketplace
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                className="relative px-3 py-2 text-gray-700 font-medium transition-all duration-200 hover:text-emerald-600 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <button
              onClick={() => user ? navigate('/cart') : null}
              className={`relative p-2 rounded-full transition-colors duration-200 ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-50'}`}
              aria-label="View cart"
              disabled={!user}
              title={!user ? 'Login to use cart' : 'View cart'}
            >
              <FaShoppingCart className="text-2xl text-emerald-600" />
              {cartCount > 0 && user && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">
                  {cartCount}
                </span>
              )}
            </button>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden sm:block relative group">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm group-focus-within:text-emerald-500 transition-colors" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
              />
            </form>

            {/* User Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                    <div className="relative">
                      <img
                        src={user.avatar || noProfile}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = noProfile;
                        }}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-emerald-300 transition-colors duration-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px] rounded-xl shadow-xl border-gray-100 bg-white/95 backdrop-blur-md p-2 mt-2">
                  <DropdownMenuLabel className="font-semibold text-gray-800 text-base pb-3 border-b border-gray-100 mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <FaUser className="text-white text-xs" />
                    </div>
                    <div>
                      <div className="font-semibold">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                  >
                    <FaUser className="text-emerald-600" /> Profile Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <div className="px-3 py-1 text-xs text-emerald-600 font-semibold uppercase tracking-wider">Seller Portal</div>
                  
                  <DropdownMenuItem 
                    onClick={() => navigate("/seller/application")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                  >
                    <FaUserTie className="text-emerald-600" /> Seller Application
                  </DropdownMenuItem>
                  
                  {user.isSeller && user.sellerStatus === 'verified' && (
                    <DropdownMenuItem 
                      onClick={() => navigate("/seller/dashboard")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                    >
                      <FaStore className="text-emerald-600" /> Seller Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-700 font-semibold transition-colors duration-150"
                  >
                    <FaSignOutAlt className="text-red-600" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  variant="ghost"
                  className="text-gray-700 font-medium hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FaTimes className="text-gray-600" /> : <FaBars className="text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleMobileSearch} className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 rounded-full"
                />
              </form>
              
              {/* Mobile Navigation */}
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const AdminNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleAdminLogout = () => {
    if (window.confirm('Are you sure you want to logout from admin panel?')) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      toast.success('Admin logged out successfully!');
      navigate("/admin/login");
    }
  };

  const adminNavItems = [
    { label: "Product Verification", path: "/admin/product-verification" },
    { label: "Seller Verification", path: "/admin/seller-verification" },
    { label: "User Management", path: "/admin/user-management" },
    { label: "Reports & Complaints", path: "/admin/reports" },
  ];

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-900/95 backdrop-blur-md shadow-xl' 
        : 'bg-slate-900/90 backdrop-blur-sm shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Admin Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <FaLeaf className="text-white text-sm" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Green Marketplace</div>
              <div className="text-xs text-emerald-400 font-medium">Admin Panel</div>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {adminNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="relative px-4 py-2 text-gray-300 font-medium hover:text-white transition-all duration-200 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Admin Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-sm font-medium">Online</span>
            </div>
            
            <Button
              onClick={handleAdminLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;