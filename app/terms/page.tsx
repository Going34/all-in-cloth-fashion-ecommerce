'use client';

import React from 'react';
import { FileText, Gavel, Scale, AlertTriangle, HelpCircle } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "May 20, 2024";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-5xl font-serif">Terms of Service</h1>
        <p className="text-neutral-500 italic">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-neutral-600 leading-relaxed">
        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <FileText size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">1. Acceptance of Terms</h2>
          </div>
          <p>
            By accessing and using the All in cloth website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of our platform immediately.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Gavel size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">2. User Responsibilities</h2>
          </div>
          <p>When using All in cloth, you agree to:</p>
          <ul className="list-decimal pl-6 space-y-2">
            <li>Provide accurate and current information during account registration and checkout.</li>
            <li>Maintain the confidentiality of your account credentials.</li>
            <li>Notify us immediately of any unauthorized use of your account.</li>
            <li>Use our AI Stylist in a respectful manner, avoiding any harassing or inappropriate input.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <Scale size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">3. Intellectual Property</h2>
          </div>
          <p>
            All content on this site, including but not limited to text, graphics, logos, images, and software, is the property of All in cloth and is protected by international copyright laws. Architectural silhouettes and unique garment designs displayed are proprietary to our brand.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3 text-neutral-900 mb-6">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <h2 className="text-2xl font-serif m-0">4. Limitation of Liability</h2>
          </div>
          <p>
            All in cloth provides its services "as is" without any warranties. We shall not be liable for any indirect, incidental, or consequential damages arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Inaccuracies in AI-generated style advice.</li>
            <li>Delays in shipping caused by third-party carriers.</li>
            <li>Temporary website downtime for maintenance or technical issues.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif text-neutral-900">5. Dispute Resolution</h2>
          <p>
            Any disputes arising from these terms shall be resolved through binding arbitration in the state of New York, in accordance with the rules of the American Arbitration Association.
          </p>
        </section>

        <section className="bg-neutral-900 text-white p-8 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <HelpCircle size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest m-0">Questions?</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Our legal team is available to clarify any aspect of these terms. For inquiries regarding our service conditions, please contact:
          </p>
          <p className="font-medium">legal@allincloth.com</p>
        </section>
      </div>
    </div>
  );
}

