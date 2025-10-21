import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/apiClient';
import { parseApiError, showErrorToast } from '@/utils/errorHandling';
import { toast } from '@/utils/toast';
import GoogleLogin from '../components/GoogleLogin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Footer from '@/components/Footer';
import logo from '@/assets/logo.png';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [agreeChecked, setAgreeChecked] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            if (!agreeChecked) {
                setShowTermsModal(true);
                return;
            }

            const response = await api.post('/api/v1/users/register', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password
            });

            toast.success(response.message);
            navigate('/email-verification', { 
                state: { 
                    email: formData.email,
                    firstName: formData.firstName 
                } 
            });
        } catch (error) {
            console.error('Registration error:', error);
            const appError = parseApiError(error);
            showErrorToast(appError, 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (data) => {
        // Redirect to dashboard after successful Google registration
        navigate('/');
    };

    const handleGoogleError = (error) => {
        console.error('Google registration error:', error);
        // The error handling is already done in GoogleLogin component
        // This is just for any additional error handling if needed
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-teal-300/20 to-emerald-300/20 rounded-full blur-2xl animate-bounce delay-2000"></div>
                <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-br from-emerald-300/20 to-green-300/20 rounded-full blur-xl animate-bounce delay-3000"></div>
            </div>

            {/* Main Content */}
            <div className="relative flex items-center justify-center min-h-[80vh] sm:min-h-screen py-10 sm:py-12 px-3 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-6 sm:space-y-8">
                    {/* Glass Card Container */}
                    <div className="backdrop-blur-xl bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-10 relative overflow-hidden">
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                            {/* Logo/Icon */}
                            <div className="flex justify-center mb-8">
                                <img 
                                    src={logo} 
                                    alt="Green Marketplace Logo" 
                                    className="h-40 w-40 object-contain"
                                />
                            </div>

                            {/* Header */}
                            <div className="text-center mb-6 sm:mb-8">
                                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 bg-clip-text text-transparent mb-3">
                                    Join Our Community
                                </h2>
                                <p className="text-emerald-600/80 text-sm sm:text-base leading-relaxed px-2">
                                    Create your account to start your sustainable journey or{' '}
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="font-semibold text-emerald-700 hover:text-emerald-600 underline decoration-2 underline-offset-2 transition-colors duration-200"
                                    >
                                        sign in to your existing account
                                    </button>
                                </p>
                            </div>

                            {/* Form */}
                            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4 sm:space-y-5">
                                    {/* Name Fields */}
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="group">
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                                First Name
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    id="firstName"
                                                    name="firstName"
                                                    type="text"
                                                    autoComplete="given-name"
                                                    required
                                                    placeholder="First name"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                             focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                             transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                             shadow-lg hover:shadow-xl"
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                                Last Name
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    id="lastName"
                                                    name="lastName"
                                                    type="text"
                                                    autoComplete="family-name"
                                                    required
                                                    placeholder="Last name"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                             focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                             transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                             shadow-lg hover:shadow-xl"
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="email" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                placeholder="Enter your email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                         focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                         transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                         shadow-lg hover:shadow-xl"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="password" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                placeholder="Password (min 6 characters)"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                         focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                         transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                         shadow-lg hover:shadow-xl"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                placeholder="Confirm password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                         focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                         transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                         shadow-lg hover:shadow-xl"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="flex items-center group">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        checked={agreeChecked}
                                        onChange={(e) => setAgreeChecked(e.target.checked)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500/50 border-emerald-300 rounded 
                                                 transition-all duration-200 shadow-sm"
                                    />
                                    <label htmlFor="terms" className="ml-3 block text-sm text-emerald-700 group-hover:text-emerald-600 transition-colors">
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 
                                                     hover:underline decoration-2 underline-offset-2"
                                            onClick={() => setShowTermsModal(true)}
                                        >
                                            Terms of Service
                                        </button>
                                        {' '}and{' '}
                                        <button
                                            type="button"
                                            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 
                                                     hover:underline decoration-2 underline-offset-2"
                                            onClick={() => window.open('/terms', '_blank')}
                                        >
                                            Privacy Policy
                                        </button>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full py-2.5 sm:py-3 px-4 border border-transparent text-base font-semibold rounded-xl 
                                             text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 
                                             hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 
                                             focus:outline-none focus:ring-4 focus:ring-emerald-200/50 
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             shadow-xl hover:shadow-2xl transform hover:scale-[1.02] 
                                             transition-all duration-300 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                                                  transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                                                  transition-transform duration-1000"></div>
                                    <div className="relative z-10">
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                                Creating account...
                                            </div>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </div>
                                </Button>
                            </form>

                            {/* Terms Modal */}
                            <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Terms and Conditions</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[50vh] overflow-y-auto space-y-3 text-sm text-slate-700">
                                  <p><strong>GREEN Marketplace – Terms and Conditions</strong></p>
                                  <p>Last Updated: {new Date().toLocaleDateString()}</p>
                                  <p>Welcome to GREEN (Goal Reaching Eco-friendly Exchange for our Nature), a web-based marketplace connecting eco-conscious consumers, upcyclers, and sustainable crafters. By accessing or using GREEN, you agree to be bound by these Terms and Conditions (“Terms”). Please read them carefully before proceeding.</p>
                                  <p><strong>1. General Provisions</strong></p>
                                  <p>1.1. GREEN serves as a digital platform facilitating the exchange of sustainable products between sellers (upcyclers and sustainable crafters) and buyers (eco-conscious consumers).</p>
                                  <p>1.2. GREEN does not manufacture, own, or directly sell the listed products unless explicitly stated.</p>
                                  <p>1.3. By using this platform, you confirm that you are at least 18 years old or accessing the site under the supervision of a parent or legal guardian.</p>
                                  <p>1.4. GREEN reserves the right to amend these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.</p>
                                  <p><strong>2. Roles and Responsibilities</strong></p>
                                  <p><strong>A. Admin</strong></p>
                                  <p>Content & Platform Management: Admin may update, edit, or remove product listings, sustainability resources, or user-generated content. Admin reserves the right to suspend or terminate any account that violates these Terms.</p>
                                  <p>Seller Verification: Admin reviews and validates seller-submitted documents, including sustainability certifications. Admin may reject applications that do not meet platform standards.</p>
                                  <p>Community Engagement: Admin may post announcements, organize sustainability projects, and facilitate community events.</p>
                                  <p>Data & Security: Admin ensures user privacy and data protection in accordance with the Data Privacy Act of 2012 (RA 10173).</p>
                                  <p><strong>B. Sellers (Upcyclers & Sustainable Crafters)</strong></p>
                                  <p>Registration & Verification: Sellers must provide accurate business details, valid IDs, and sustainability certifications (if applicable). Misrepresentation, falsification of documents, or greenwashing is strictly prohibited.</p>
                                  <p>Product Listings: Sellers must provide truthful descriptions of their products, including sourcing, eco-impact, and certifications. Sellers are responsible for updating product availability, pricing, and promotions.</p>
                                  <p>Transactions & Fulfillment: Sellers must honor all confirmed orders and deliver products in accordance with agreed timelines. Failure to fulfill orders or repeated cancellations may result in penalties or account suspension.</p>
                                  <p>Customer Relations: Sellers must respond promptly to customer inquiries, complaints, and feedback. Sellers agree not to engage in abusive, fraudulent, or misleading conduct.</p>
                                  <p><strong>C. Buyers (Eco-Conscious Consumers)</strong></p>
                                  <p>Account & Profile: Buyers must provide accurate information upon registration and are responsible for maintaining account confidentiality. Buyers are accountable for all activities under their account.</p>
                                  <p>Purchasing: Buyers agree to review product details carefully before making a purchase. Orders confirmed through the system or external links (provided by sellers) constitute binding agreements.</p>
                                  <p>Feedback & Reviews: Buyers may post ratings and reviews based on actual product experience. Offensive, false, or misleading reviews may be removed by Admin.</p>
                                  <p>Community Conduct: Buyers are expected to participate respectfully in community discussions, events, and initiatives.</p>
                                  <p><strong>3. Prohibited Activities</strong></p>
                                  <ul className="list-disc pl-5">
                                    <li>Posting false, misleading, or defamatory content.</li>
                                    <li>Misrepresentation of sustainability claims or certifications.</li>
                                    <li>Using GREEN for illegal, fraudulent, or harmful purposes.</li>
                                    <li>Attempting to hack, disrupt, or exploit system vulnerabilities.</li>
                                  </ul>
                                  <p><strong>4. Payments and External Links</strong></p>
                                  <p>4.1. GREEN may provide internal checkout options or external links to third-party seller platforms.</p>
                                  <p>4.2. Buyers acknowledge that GREEN is not responsible for the policies, delivery, or refund practices of third-party platforms.</p>
                                  <p><strong>5. Intellectual Property</strong></p>
                                  <p>5.1. All content on GREEN, including logos, branding, and educational materials, is owned by the developers unless otherwise stated.</p>
                                  <p>5.2. Users may not reproduce, distribute, or use platform content without prior written permission.</p>
                                  <p><strong>6. Limitation of Liability</strong></p>
                                  <p>6.1. GREEN provides the marketplace “as is” and does not guarantee uninterrupted or error-free services.</p>
                                  <p>6.2. GREEN is not liable for damages arising from user misconduct, third-party transactions, or sustainability misrepresentation by sellers.</p>
                                  <p><strong>7. Account Suspension and Termination</strong></p>
                                  <p>7.1. GREEN reserves the right to suspend or terminate accounts for violations of these Terms.</p>
                                  <p>7.2. Repeated violations may result in permanent banning.</p>
                                  <p><strong>8. Governing Law</strong></p>
                                  <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</p>
                                </div>
                                <DialogFooter>
                                  <div className="flex items-center justify-between w-full">
                                    <label className="flex items-center text-sm text-slate-700">
                                      <input type="checkbox" className="mr-2" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)} />
                                      I have read and agree to the Terms and Conditions
                                    </label>
                                    <div className="space-x-2">
                                      <Button variant="outline" type="button" onClick={() => setShowTermsModal(false)}>Close</Button>
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          if (!agreeChecked) return;
                                          setShowTermsModal(false);
                                          // Programmatically submit registration after agreeing if form is valid
                                          const form = document.querySelector('form');
                                          if (form) {
                                            form.requestSubmit();
                                          }
                                        }}
                                        disabled={!agreeChecked}
                                      >
                                        Agree & Continue
                                      </Button>
                                    </div>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Divider */}
                            <div className="mt-6 sm:mt-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 sm:px-4 backdrop-blur-sm bg-white/30 text-emerald-600 rounded-full font-medium text-xs sm:text-sm">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                {/* Google Login */}
                                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                                    <GoogleLogin 
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="flex justify-center space-x-2 mt-8">
                        <div className="w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-green-400/60 rounded-full animate-pulse delay-200"></div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Register; 