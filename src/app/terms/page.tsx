import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Vortex AI</span>
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              By accessing or using the Vortex AI platform (&quot;Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. Vortex AI reserves the right to modify these terms at any time, and continued use constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vortex AI is an AI-powered fitness platform that provides calorie tracking, workout generation, meal planning, BMI analysis, and AI coaching. The Service uses artificial intelligence to provide recommendations but is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting any fitness or nutrition program.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration. You must be at least 13 years of age to use this Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscription & Payments</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vortex AI offers both free and paid subscription tiers. The Pro plan costs ₹50 per month and includes a 3-day free trial. Subscriptions are billed monthly. You may cancel at any time. No refunds are provided for partial months.
            </p>
          </section>

          <section id="privacy">
            <h2 className="text-xl font-semibold text-white mb-3">5. Privacy Policy</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              We collect personal information including name, email, age, height, weight, activity data, food logs, and chat messages. This data is used solely to provide and improve the Service. We do not sell your personal data to third parties. Data is stored securely using Supabase infrastructure with encryption at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Health Disclaimer</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              The information provided by Vortex AI is for general informational and educational purposes only. It is not intended as medical advice. The AI-generated recommendations are based on general scientific formulas (Mifflin-St Jeor for BMR, standard TDEE calculations) and may not be suitable for individuals with specific medical conditions. Always consult your physician before making significant changes to your diet or exercise routine.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Accuracy of AI</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              While our AI strives for accuracy, calorie estimates and nutritional information are approximations. Actual values may vary based on preparation methods, portion sizes, and ingredient variations. Users should use the data as a guide rather than absolute values.
            </p>
          </section>

          <section id="refund">
            <h2 className="text-xl font-semibold text-white mb-3">8. Refund Policy</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              If you are not satisfied with your Pro subscription within the first 7 days of your paid period, you may request a full refund by contacting our support team. After 7 days, no refunds will be issued. The 3-day free trial does not require payment and will not be charged unless you continue past the trial period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vortex AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. In no event shall our total liability exceed the amount paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              For any questions regarding these Terms, please contact us at support@vortexai.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
