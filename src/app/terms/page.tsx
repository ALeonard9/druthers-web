import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use | Druthers',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl text-paper">Terms of Use</h1>
      <p className="text-sm text-neutral-400">Last Updated: August 2026</p>

      <div className="prose prose-invert max-w-none space-y-4 text-neutral-300">
        <p>
          Welcome to Druthers. These Terms of Use govern your access to and use of druthers.io
          and its associated services (&quot;Druthers&quot;, &quot;we&quot;, &quot;our&quot;,
          or &quot;us&quot;). Druthers is an independently run personal project, not a company.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">1. Acceptance of Terms</h2>
        <p>
          By accessing or using our services, you agree to be bound by these Terms.
          If you do not agree to these Terms, you may not access or use the services.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">2. Eligibility</h2>
        <p>
          You must be at least 18 years old to use Druthers. The service is not
          intended for children, and we do not knowingly collect information from
          anyone under 18.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">3. User Accounts</h2>
        <p>
          You must create an account to use certain features. You are responsible for
          safeguarding your account credentials and for all activities that occur under your account.
        </p>
        <p>
          You can permanently delete your account from Settings. If you cannot sign in,
          email us and we can help with the request.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">4. Content and Conduct</h2>
        <p>
          You retain ownership of the data you submit, but grant us a license to host and
          display it as part of operating the service. That license exists only to run
          Druthers and ends when you delete the data or your account. You agree not to use
          the service for any unlawful purposes or to harass other users.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">5. Disclaimers and Limitations of Liability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties of any kind. Druthers is
          run as a personal project with no uptime guarantee, and we may change or
          discontinue it at any time. We shall not be liable for any indirect, incidental,
          or consequential damages arising from your use of the service.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">6. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of
          any material changes by posting the new Terms on this page.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">7. Contact Us</h2>
        <p>
          If you have any questions about these Terms, email{' '}
          <a className="text-brass hover:underline" href="mailto:Admin@druthers.io">
            Admin@druthers.io
          </a>
          .
        </p>
      </div>
    </div>
  );
}
