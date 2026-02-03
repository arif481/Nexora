'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-500 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-dark-200 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <div className="prose prose-invert prose-lg max-w-none space-y-6">
          <p className="text-dark-100">
            Last updated: February 3, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
            <p className="text-dark-100">
              At Nexora, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
            <p className="text-dark-100">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-dark-100 space-y-2">
              <li>Account information (email, name, profile picture)</li>
              <li>Content you create (tasks, notes, journal entries, goals)</li>
              <li>Usage data (features used, time spent, preferences)</li>
              <li>Device information (browser type, operating system)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. How We Use Your Information</h2>
            <p className="text-dark-100">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-dark-100 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Personalize your experience with AI-powered insights</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve the Service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Data Storage and Security</h2>
            <p className="text-dark-100">
              Your data is stored securely using Firebase/Google Cloud infrastructure. We implement 
              industry-standard security measures to protect your information. You can enable 
              end-to-end encryption for sensitive data within the app settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Data Sharing</h2>
            <p className="text-dark-100">
              We do not sell your personal information. We may share your information only in the 
              following circumstances:
            </p>
            <ul className="list-disc list-inside text-dark-100 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our Service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. AI and Data Processing</h2>
            <p className="text-dark-100">
              Nexora uses AI to provide personalized insights and recommendations. Your data may be 
              processed by AI models to generate suggestions, but this processing occurs securely 
              and your data is not used to train external AI models without your explicit consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Your Rights</h2>
            <p className="text-dark-100">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-dark-100 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of analytics and AI features</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">8. Cookies and Tracking</h2>
            <p className="text-dark-100">
              We use essential cookies to maintain your session and preferences. Analytics cookies 
              are optional and can be disabled in your settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">9. Children's Privacy</h2>
            <p className="text-dark-100">
              Nexora is not intended for children under 13. We do not knowingly collect information 
              from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">10. Changes to This Policy</h2>
            <p className="text-dark-100">
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes via email or through the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">11. Contact Us</h2>
            <p className="text-dark-100">
              For questions about this Privacy Policy, please contact us at privacy@nexora.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
