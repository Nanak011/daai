import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitApplication, type DomainName } from '../lib/api';

const domains: DomainName[] = ['AWS DevOps', 'QA', 'Salesforce'];

export function ApplyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await submitApplication(formData);
      navigate(`/application-submitted?candidateId=${response.candidate_id}&token=${encodeURIComponent(response.verification_token)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Application submission failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Apply</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Application Form and Domain Selection</h1>
        <p className="text-lg leading-8 text-slate-600">
          Submit your personal details, attach a PDF resume, and choose the track that best matches your background. After submission, check your email for the verification step before the quiz is unlocked.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Full Name</span>
          <input name="full_name" required minLength={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="text" placeholder="Full name" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input name="email" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="email" placeholder="name@example.com" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
          <input name="phone" required minLength={7} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="tel" placeholder="Phone number" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">GitHub Link</span>
          <input name="github_link" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="url" placeholder="https://github.com/your-handle" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">LinkedIn Link</span>
          <input name="linkedin_link" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="url" placeholder="https://linkedin.com/in/your-handle" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Why do you want to join?</span>
          <textarea name="why_join" required minLength={20} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" placeholder="Tell us what motivates you to join the fellowship." />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Resume Upload (PDF)</span>
          <input name="resume" required accept="application/pdf" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-daai-50 file:px-4 file:py-2 file:font-semibold file:text-daai-700 focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="file" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Domain Selection</span>
          <select name="domain" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100">
            <option value="">Choose a track</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading} className="w-full rounded-full bg-daai-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600 disabled:cursor-not-allowed disabled:bg-daai-300">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </section>
  );
}
