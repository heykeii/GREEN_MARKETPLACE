import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Using consistent default avatar from public folder
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { FaUser, FaSignOutAlt, FaUserTie, FaStore, FaSearch, FaBars, FaTimes, FaLeaf, FaShoppingCart, FaBox, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { Sprout } from 'lucide-react';
import { FaEnvelope } from 'react-icons/fa';
import NotificationIcon from './NotificationIcon';
import logo from '@/assets/logo.png';

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

  // Chat unread count polling
  useEffect(() => {
    let intervalId;
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chat/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 200 && typeof res.data?.unreadCount === 'number') {
          const el = document.getElementById('chat-unread-badge');
          if (el) {
            const count = res.data.unreadCount;
            if (count > 0) {
              el.textContent = count > 99 ? '99+' : String(count);
              el.classList.remove('hidden');
            } else {
              el.classList.add('hidden');
            }
          }
        }
      } catch (e) {
        // silent
      }
    };
    fetchUnread();
    intervalId = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let timeoutId = null;
    
    // Cart count logic with debouncing
    const updateCartCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        let cart = [];
        
        if (currentUser && token) {
          // Only fetch from API if we don't have recent localStorage data
          const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const lastCartUpdate = localStorage.getItem('lastCartUpdate');
          const isRecentUpdate = lastCartUpdate && (Date.now() - parseInt(lastCartUpdate)) < 5000; // 5 seconds
          
          if (isRecentUpdate && Array.isArray(storedCart)) {
            cart = storedCart;
          } else {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/cart`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            cart = res.data.cart || [];
            localStorage.setItem('cart', JSON.stringify(cart));
            localStorage.setItem('lastCartUpdate', Date.now().toString());
          }
        } else {
          cart = JSON.parse(localStorage.getItem('cart') || '[]');
        }
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } catch (err) {
        console.error('Cart count update error:', err);
        // Fallback to localStorage
        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(Array.isArray(storedCart) ? storedCart.length : 0);
      }
    };
    
    // Debounced cart update function
    const debouncedCartUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateCartCount, 500); // 500ms debounce
    };
    
    updateCartCount();
    
    const onCartUpdated = debouncedCartUpdate;
    const onStorageChange = debouncedCartUpdate;
    
    window.addEventListener('cartUpdated', onCartUpdated);
    window.addEventListener('storage', onStorageChange);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('cartUpdated', onCartUpdated);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
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

  const scrollToFooter = () => {
    try {
      const el = document.getElementById('site-footer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return true;
      }
    } catch {}
    return false;
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products", onClick: onProductsClick },
    { label: "Campaigns", path: "/campaigns" },
    { label: "About Us", path: "/about", onClick: onAboutClick || scrollToFooter },
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
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img 
              src={logo} 
              alt="Green Marketplace" 
              className="h-8 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === 'Products') {
                    navigate('/products');
                    return;
                  }
                  if (item.label === 'About Us') {
                    const didScroll = item.onClick && item.onClick();
                    if (!didScroll) {
                      navigate('/');
                      setTimeout(() => scrollToFooter(), 50);
                    }
                    return;
                  }
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    navigate(item.path);
                  }
                }}
                className="px-3 py-2 text-gray-600 hover:text-emerald-600 font-medium"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </div>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Notification Icon (hide on very small screens) */}
            {user && (
              <div className="hidden sm:inline-flex">
                <NotificationIcon />
              </div>
            )}

            {/* Messages Icon */}
            {user && (
              <button
                onClick={() => navigate('/messages')}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 hidden sm:inline-flex"
                aria-label="Messages"
                title="Messages"
              >
                <FaEnvelope className="text-2xl text-emerald-600" />
                <span id="chat-unread-badge" className="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow"></span>
              </button>
            )}

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
            <div className="relative hidden md:block min-w-0">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="pl-10 pr-4 py-2 w-40 sm:w-56 lg:w-64 xl:w-80 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
              />
            </div>

            {/* User Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                    <div className="relative">
                      <img
                        src={user.avatar || '/default-avatar.svg'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.svg';
                        }}
                        alt="avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 hover:border-emerald-300 transition-colors duration-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px] rounded-xl shadow-xl border-gray-100 bg-white/95 backdrop-blur-md p-2 mt-2">
                  <DropdownMenuLabel className="font-semibold text-gray-800 text-base pb-3 border-b border-gray-100 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-200">
                      <img
                        src={user.avatar || '/default-avatar.svg'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.svg';
                        }}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
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
                  
                  <DropdownMenuItem 
                    onClick={() => navigate("/orders")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                  >
                    <FaBox className="text-emerald-600" /> My Orders
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => navigate("/sustainability")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                  >
                    <Sprout className="h-4 w-4 text-emerald-600" /> Sustainability Hub
                  </DropdownMenuItem>
                  
                                     <DropdownMenuItem 
                     onClick={() => navigate("/my-reports")}
                     className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                   >
                     <FaExclamationTriangle className="text-emerald-600" /> Reports & Complaints
                   </DropdownMenuItem>
                   
                   <DropdownMenuItem 
                     onClick={() => navigate("/messages")}
                     className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                   >
                     <FaEnvelope className="text-emerald-600" /> Messages
                   </DropdownMenuItem>
                  
                   <DropdownMenuItem 
                     onClick={() => navigate("/notifications")}
                     className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 font-medium transition-colors duration-150"
                   >
                     <FaBell className="text-emerald-600" /> Notifications
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {isMobileMenuOpen ? <FaTimes className="text-gray-600" /> : <FaBars className="text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {/* Compact user row for mobile to expose avatar */}
              {user && (
                <div className="flex items-center gap-3 px-2">
                  <img
                    src={user.avatar || '/default-avatar.svg'}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.svg'; }}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                  <div className="text-sm font-medium text-gray-800 truncate">{user.firstName} {user.lastName}</div>
                </div>
              )}
              {/* Mobile Search */}
              <form onSubmit={handleMobileSearch} className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </form>
              
              {/* Mobile Navigation */}
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'Products') {
                      navigate('/products');
                    } else if (item.label === 'About Us') {
                      const didScroll = item.onClick && item.onClick();
                      if (!didScroll) {
                        navigate('/');
                        setTimeout(() => scrollToFooter(), 50);
                      }
                    } else if (item.onClick) {
                      item.onClick();
                    } else {
                      navigate(item.path);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </div>
                </button>
              ))}
              
              {/* User-specific mobile menu items */}
              {user && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">My Account</div>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate('/orders');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => {
                        navigate('/sustainability');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                    >
                      Sustainability Hub
                    </button>
                                         <button
                       onClick={() => {
                         navigate('/my-reports');
                         setIsMobileMenuOpen(false);
                       }}
                       className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                     >
                       Reports & Complaints
                     </button>
                     <button
                       onClick={() => {
                         navigate('/messages');
                         setIsMobileMenuOpen(false);
                       }}
                       className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                     >
                       Messages
                     </button>
                     <button
                       onClick={() => {
                         navigate('/notifications');
                         setIsMobileMenuOpen(false);
                       }}
                       className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                     >
                       Notifications
                     </button>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Seller Portal</div>
                    <button
                      onClick={() => {
                        navigate('/seller/application');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                    >
                      Seller Application
                    </button>
                    {user.isSeller && user.sellerStatus === 'verified' && (
                      <button
                        onClick={() => {
                          navigate('/seller/dashboard');
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                      >
                        Seller Dashboard
                      </button>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
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
    { label: "Campaign Management", path: "/admin/campaign-management" },
    { label: "Reports & Complaints", path: "/admin/report-management" },
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')} title="Go to Admin Dashboard">
            <img 
              src={logo} 
              alt="Green Marketplace" 
              className="h-8 w-auto"
            />
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