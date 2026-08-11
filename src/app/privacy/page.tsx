import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Druthers',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Draft Notice:</strong> This is a generated first-pass draft pending legal review by Adam. It is not yet finalised or binding.
      </div>

      <h1 className="font-display text-4xl text-paper">Privacy Policy</h1>
      <p className="text-sm text-neutral-400">Last Updated: August 2026</p>

      <div className="prose prose-invert max-w-none space-y-4 text-neutral-300">
        <p>
          This Privacy Policy explains how Druthers (&quot;we&quot;, &quot;our&quot;, or
          &quot;us&quot;) collects, uses, and protects your information when you use druthers.io
          and its associated services. Druthers is an independently run personal project,
          not a company.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">1. Information We Collect</h2>
        <p>
          <strong>Account Data via Google OAuth:</strong> We use Google OAuth for sign-in. When you authenticate,
          we collect basic profile information (such as your email address and name) necessary to create and manage your account.
        </p>
        <p>
          <strong>Imported Library Data:</strong> If you choose to import your reading history, we process data from
          your Goodreads library import to populate your shelves.
        </p>
        <p>
          <strong>User Data Storage:</strong> All of your user-generated data, including rankings, watchlists,
          and profile settings, is securely stored in our Neon-hosted database infrastructure.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">2. Third-Party Integrations</h2>
        <p>
          To provide metadata and search capabilities for your shelves, our services make API calls to several third-party providers:
        </p>
        <ul className="list-inside list-disc pl-4 space-y-1">
          <li><strong>TMDB:</strong> For movies and TV shows data.</li>
          <li><strong>Open Library:</strong> For books data.</li>
          <li><strong>IGDB:</strong> For video games data.</li>
        </ul>
        <p>
          These API calls may include search queries based on your input, but we do not share your personal account information with these third-party APIs.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">3. How We Use Your Data</h2>
        <p>
          We use the information we collect to operate, maintain, and improve our services,
          to personalize your experience (such as rendering your shared Top 5 cards), and to
          communicate with you about your account.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">4. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal data. We only share information with third parties when
          necessary to provide our services (such as our Neon-hosted database) or when required by law.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">5. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You can manage
          your profile privacy settings within the app.
        </p>

        <h2 className="text-xl font-medium text-paper mt-6">6. Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy or our data practices,
          please get in touch through the contact details on druthers.io.
        </p>
      </div>
    </div>
  );
}
