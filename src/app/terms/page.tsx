'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          Terms of Service
        </h1>

        <div className="prose prose-invert prose-lg max-w-none space-y-6">
          <p className="text-dark-100">
            Last updated: February 3, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="text-dark-100">
              By accessing and using Nexora ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
            <p className="text-dark-100">
              Nexora is an AI-powered personal life operating system that helps users manage tasks, habits, 
              goals, wellness, finances, and more. The Service includes web and mobile applications.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. User Accounts</h2>
            <p className="text-dark-100">
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. User Content</h2>
            <p className="text-dark-100">
              You retain ownership of all content you create within Nexora. By using the Service, 
              you grant us a limited license to store and process your content to provide the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Acceptable Use</h2>
            <p className="text-dark-100">
              You agree not to use the Service for any unlawful purpose or in any way that could 
              damage, disable, or impair the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Privacy</h2>
            <p className="text-dark-100">
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-neon-cyan hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Modifications</h2>
            <p className="text-dark-100">
              We reserve the right to modify these Terms at any time. We will notify users of 
              significant changes via email or through the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">8. Termination</h2>
            <p className="text-dark-100">
              We may terminate or suspend your access to the Service at any time, without prior notice, 
              for conduct that we believe violates these Terms or is harmful to other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">9. Disclaimer</h2>
            <p className="text-dark-100">
              The Service is provided "as is" without warranties of any kind. We do not guarantee 
              that the Service will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">10. Contact</h2>
            <p className="text-dark-100">
              For questions about these Terms, please contact us at support@nexora.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
