import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Users, Store, CheckCircle, AlertCircle, Scale, Lock } from 'lucide-react';

const Terms = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const Section = ({ id, icon: Icon, title, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded;
    
    return (
      <div className="mb-4 bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden transition-all hover:shadow-md">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Icon className="w-5 h-5 text-emerald-700" />
            </div>
            <h2 className="text-lg font-semibold text-emerald-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-emerald-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-emerald-600" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 text-gray-700 leading-relaxed space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SubSection = ({ title, children }) => (
    <div className="ml-4 pl-4 border-l-2 border-emerald-200 space-y-3">
      <h3 className="font-semibold text-emerald-800 text-base">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-10 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-100 p-8 sm:p-10 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2">
                Terms & Conditions
              </h1>
              <p className="text-emerald-700 font-medium">
                GREEN Marketplace
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Goal Reaching Eco-friendly Exchange for our Nature
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-6 pt-6 border-t border-emerald-100">
            <AlertCircle className="w-4 h-4" />
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-emerald-100 p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">
            Welcome to <span className="font-semibold text-emerald-800">GREEN</span>, a web-based marketplace connecting eco-conscious consumers, upcyclers, and sustainable crafters. By accessing or using GREEN, you agree to be bound by these Terms and Conditions. Please read them carefully before proceeding.
          </p>
        </div>

        {/* Expandable Sections */}
        <Section id="general" icon={CheckCircle} title="1. General Provisions" defaultExpanded={true}>
          <p><strong>1.1.</strong> GREEN serves as a digital platform facilitating the exchange of sustainable products between sellers (upcyclers and sustainable crafters) and buyers (eco-conscious consumers).</p>
          <p><strong>1.2.</strong> GREEN does not manufacture, own, or directly sell the listed products unless explicitly stated.</p>
          <p><strong>1.3.</strong> By using this platform, you confirm that you are at least 18 years old or accessing the site under the supervision of a parent or legal guardian.</p>
          <p><strong>1.4.</strong> GREEN reserves the right to amend these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.</p>
        </Section>

        <Section id="roles" icon={Users} title="2. Roles and Responsibilities">
          <SubSection title="A. Admin">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Content & Platform Management</h4>
                <p className="text-sm">Admin may update, edit, or remove product listings, sustainability resources, or user-generated content.</p>
                <p className="text-sm">Admin reserves the right to suspend or terminate any account that violates these Terms.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Seller Verification</h4>
                <p className="text-sm">Admin reviews and validates seller-submitted documents, including sustainability certifications.</p>
                <p className="text-sm">Admin may reject applications that do not meet platform standards.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Community Engagement</h4>
                <p className="text-sm">Admin may post announcements, organize sustainability projects, and facilitate community events.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Data & Security</h4>
                <p className="text-sm">Admin ensures user privacy and data protection in accordance with the Data Privacy Act of 2012 (RA 10173).</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="B. Sellers (Upcyclers & Sustainable Crafters)">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Registration & Verification</h4>
                <p className="text-sm">Sellers must provide accurate business details, valid IDs, and sustainability certifications (if applicable).</p>
                <p className="text-sm">Misrepresentation, falsification of documents, or greenwashing is strictly prohibited.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Product Listings</h4>
                <p className="text-sm">Sellers must provide truthful descriptions of their products, including sourcing, eco-impact, and certifications.</p>
                <p className="text-sm">Sellers are responsible for updating product availability, pricing, and promotions.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Transactions & Fulfillment</h4>
                <p className="text-sm">Sellers must honor all confirmed orders and deliver products in accordance with agreed timelines.</p>
                <p className="text-sm">Failure to fulfill orders or repeated cancellations may result in penalties or account suspension.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Customer Relations</h4>
                <p className="text-sm">Sellers must respond promptly to customer inquiries, complaints, and feedback.</p>
                <p className="text-sm">Sellers agree not to engage in abusive, fraudulent, or misleading conduct.</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="C. Buyers (Eco-Conscious Consumers)">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Account & Profile</h4>
                <p className="text-sm">Buyers must provide accurate information upon registration and are responsible for maintaining account confidentiality.</p>
                <p className="text-sm">Buyers are accountable for all activities under their account.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Purchasing</h4>
                <p className="text-sm">Buyers agree to review product details carefully before making a purchase.</p>
                <p className="text-sm">Orders confirmed through the system or external links (provided by sellers) constitute binding agreements.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Feedback & Reviews</h4>
                <p className="text-sm">Buyers may post ratings and reviews based on actual product experience.</p>
                <p className="text-sm">Offensive, false, or misleading reviews may be removed by Admin.</p>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Community Conduct</h4>
                <p className="text-sm">Buyers are expected to participate respectfully in community discussions, events, and initiatives.</p>
              </div>
            </div>
          </SubSection>
        </Section>

        <Section id="prohibited" icon={AlertCircle} title="3. Prohibited Activities">
          <p className="mb-3">The following are strictly prohibited for all users:</p>
          <div className="space-y-2 ml-4">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0"></div>
              <p className="text-sm">Posting false, misleading, or defamatory content.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0"></div>
              <p className="text-sm">Misrepresentation of sustainability claims or certifications.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0"></div>
              <p className="text-sm">Using GREEN for illegal, fraudulent, or harmful purposes.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0"></div>
              <p className="text-sm">Attempting to hack, disrupt, or exploit system vulnerabilities.</p>
            </div>
          </div>
        </Section>

        <Section id="payments" icon={Store} title="4. Payments and External Links">
          <p><strong>4.1.</strong> GREEN may provide internal checkout options or external links to third-party seller platforms.</p>
          <p><strong>4.2.</strong> Buyers acknowledge that GREEN is not responsible for the policies, delivery, or refund practices of third-party platforms.</p>
        </Section>

        <Section id="ip" icon={Lock} title="5. Intellectual Property">
          <p><strong>5.1.</strong> All content on GREEN, including logos, branding, and educational materials, is owned by the developers unless otherwise stated.</p>
          <p><strong>5.2.</strong> Users may not reproduce, distribute, or use platform content without prior written permission.</p>
        </Section>

        <Section id="liability" icon={Shield} title="6. Limitation of Liability">
          <p><strong>6.1.</strong> GREEN provides the marketplace "as is" and does not guarantee uninterrupted or error-free services.</p>
          <p><strong>6.2.</strong> GREEN is not liable for damages arising from user misconduct, third-party transactions, or sustainability misrepresentation by sellers.</p>
        </Section>

        <Section id="suspension" icon={AlertCircle} title="7. Account Suspension and Termination">
          <p><strong>7.1.</strong> GREEN reserves the right to suspend or terminate accounts for violations of these Terms.</p>
          <p><strong>7.2.</strong> Repeated violations may result in permanent banning.</p>
        </Section>

        <Section id="law" icon={Scale} title="8. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>.</p>
        </Section>

        {/* Footer Note */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 mt-6 text-center">
          <p className="text-sm text-emerald-800">
            By continuing to use GREEN Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;