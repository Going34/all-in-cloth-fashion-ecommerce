'use client';

import React from 'react';
import { Shield, Lock, Eye, Mail, Info } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "May 20, 2024";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-5xl font-serif">Privacy Policy</h1>
        <p className="text-neutral-500 italic">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-neutral-600 leading-relaxed">
        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Info size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">1. Introduction</h2>
          </div>
          <p>
            At All in cloth, we value the trust you place in us when you share your personal information. This Privacy Policy describes how we collect, use, and protect your data when you visit our website, use our AI Stylist services, or purchase products from our collections.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Eye size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">2. Information We Collect</h2>
          </div>
          <p>We collect information to provide better services to all our users. This includes:</p>
          <ul className="list-decimal pl-6 space-y-2">
            <li><strong>Personal Identification:</strong> Name, email address, shipping/billing address, and phone number provided during checkout or account creation.</li>
            <li><strong>Payment Information:</strong> Credit card details and billing information (processed securely through our encrypted payment partners).</li>
            <li><strong>Interaction Data:</strong> Conversations with our AI Stylist to improve recommendation accuracy.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and device information used to access our platform.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Lock size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">3. How We Use Your Data</h2>
          </div>
          <p>Your data is utilized for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Processing and fulfilling your fashion orders.</li>
            <li>Personalizing your shopping experience via AI-driven recommendations.</li>
            <li>Communicating order status, marketing updates (with your consent), and support inquiries.</li>
            <li>Detecting and preventing fraudulent transactions.</li>
            <li>Improving website functionality and user interface design.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Shield size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">4. Data Sharing & Third Parties</h2>
          </div>
          <p>
            All in cloth does not sell your personal data. We share information only with trusted partners necessary for our operations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Logistics Partners:</strong> To ensure your orders are delivered to the correct address.</li>
            <li><strong>Payment Processors:</strong> To handle secure financial transactions.</li>
            <li><strong>AI Service Providers:</strong> Anonymous interaction data may be processed to refine our stylist's capabilities.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif text-neutral-900">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information at any time. You may also:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Opt-out of marketing communications via the 'Unsubscribe' link in emails.</li>
            <li>Request a copy of the data we hold about you.</li>
            <li>Limit how we use your interaction history for AI training.</li>
          </ul>
        </section>

        <section className="bg-neutral-50 p-8 rounded-2xl space-y-4 border border-neutral-100">
          <div className="flex items-center space-x-3 text-neutral-900 mb-2">
            <Mail size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest m-0">Contact Privacy Team</h2>
          </div>
          <p className="text-sm">
            If you have questions about this policy or our data practices, please reach out to our dedicated privacy office:
          </p>
          <p className="font-medium text-neutral-900">privacy@allincloth.com</p>
        </section>
      </div>
    </div>
  );
}

