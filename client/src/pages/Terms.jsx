import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-emerald-100 p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-800 mb-2">GREEN Marketplace – Terms and Conditions</h1>
        <p className="text-sm text-emerald-700 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-emerald max-w-none">
          <p>Welcome to GREEN (Goal Reaching Eco-friendly Exchange for our Nature), a web-based marketplace connecting eco-conscious consumers, upcyclers, and sustainable crafters. By accessing or using GREEN, you agree to be bound by these Terms and Conditions (“Terms”). Please read them carefully before proceeding.</p>

          <h2>1. General Provisions</h2>
          <p>1.1. GREEN serves as a digital platform facilitating the exchange of sustainable products between sellers (upcyclers and sustainable crafters) and buyers (eco-conscious consumers).</p>
          <p>1.2. GREEN does not manufacture, own, or directly sell the listed products unless explicitly stated.</p>
          <p>1.3. By using this platform, you confirm that you are at least 18 years old or accessing the site under the supervision of a parent or legal guardian.</p>
          <p>1.4. GREEN reserves the right to amend these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.</p>

          <h2>2. Roles and Responsibilities</h2>
          <h3>A. Admin</h3>
          <h4>Content & Platform Management</h4>
          <p>Admin may update, edit, or remove product listings, sustainability resources, or user-generated content.</p>
          <p>Admin reserves the right to suspend or terminate any account that violates these Terms.</p>
          <h4>Seller Verification</h4>
          <p>Admin reviews and validates seller-submitted documents, including sustainability certifications.</p>
          <p>Admin may reject applications that do not meet platform standards.</p>
          <h4>Community Engagement</h4>
          <p>Admin may post announcements, organize sustainability projects, and facilitate community events.</p>
          <h4>Data & Security</h4>
          <p>Admin ensures user privacy and data protection in accordance with the Data Privacy Act of 2012 (RA 10173).</p>

          <h3>B. Sellers (Upcyclers & Sustainable Crafters)</h3>
          <h4>Registration & Verification</h4>
          <p>Sellers must provide accurate business details, valid IDs, and sustainability certifications (if applicable).</p>
          <p>Misrepresentation, falsification of documents, or greenwashing is strictly prohibited.</p>
          <h4>Product Listings</h4>
          <p>Sellers must provide truthful descriptions of their products, including sourcing, eco-impact, and certifications.</p>
          <p>Sellers are responsible for updating product availability, pricing, and promotions.</p>
          <h4>Transactions & Fulfillment</h4>
          <p>Sellers must honor all confirmed orders and deliver products in accordance with agreed timelines.</p>
          <p>Failure to fulfill orders or repeated cancellations may result in penalties or account suspension.</p>
          <h4>Customer Relations</h4>
          <p>Sellers must respond promptly to customer inquiries, complaints, and feedback.</p>
          <p>Sellers agree not to engage in abusive, fraudulent, or misleading conduct.</p>

          <h3>C. Buyers (Eco-Conscious Consumers)</h3>
          <h4>Account & Profile</h4>
          <p>Buyers must provide accurate information upon registration and are responsible for maintaining account confidentiality.</p>
          <p>Buyers are accountable for all activities under their account.</p>
          <h4>Purchasing</h4>
          <p>Buyers agree to review product details carefully before making a purchase.</p>
          <p>Orders confirmed through the system or external links (provided by sellers) constitute binding agreements.</p>
          <h4>Feedback & Reviews</h4>
          <p>Buyers may post ratings and reviews based on actual product experience.</p>
          <p>Offensive, false, or misleading reviews may be removed by Admin.</p>
          <h4>Community Conduct</h4>
          <p>Buyers are expected to participate respectfully in community discussions, events, and initiatives.</p>

          <h2>3. Prohibited Activities</h2>
          <p>The following are strictly prohibited for all users (Admin, Sellers, Buyers):</p>
          <ul>
            <li>Posting false, misleading, or defamatory content.</li>
            <li>Misrepresentation of sustainability claims or certifications.</li>
            <li>Using GREEN for illegal, fraudulent, or harmful purposes.</li>
            <li>Attempting to hack, disrupt, or exploit system vulnerabilities.</li>
          </ul>

          <h2>4. Payments and External Links</h2>
          <p>4.1. GREEN may provide internal checkout options or external links to third-party seller platforms.</p>
          <p>4.2. Buyers acknowledge that GREEN is not responsible for the policies, delivery, or refund practices of third-party platforms.</p>

          <h2>5. Intellectual Property</h2>
          <p>5.1. All content on GREEN, including logos, branding, and educational materials, is owned by the developers unless otherwise stated.</p>
          <p>5.2. Users may not reproduce, distribute, or use platform content without prior written permission.</p>

          <h2>6. Limitation of Liability</h2>
          <p>6.1. GREEN provides the marketplace “as is” and does not guarantee uninterrupted or error-free services.</p>
          <p>6.2. GREEN is not liable for damages arising from user misconduct, third-party transactions, or sustainability misrepresentation by sellers.</p>

          <h2>7. Account Suspension and Termination</h2>
          <p>7.1. GREEN reserves the right to suspend or terminate accounts for violations of these Terms.</p>
          <p>7.2. Repeated violations may result in permanent banning.</p>

          <h2>8. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Terms;


