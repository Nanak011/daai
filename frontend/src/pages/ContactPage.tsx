import { useEffect, useState } from 'react';
import { LoadingScreen } from '../components/LoadingScreen';
import { fetchSiteContent, submitContactForm, type SiteContent } from '../lib/api';

export function ContactPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSiteContent().then(setContent).catch(() => setContent([]));
  }, []);

  const contentMap = new Map(content.map((item) => [item.key, item.value]));
  const contactEmail = contentMap.get('contact_email') ?? 'hello@daai.org';
  const contactPhone = contentMap.get('contact_phone') ?? '+1 555 0100';
  const contactMessage = contentMap.get('contact_message') ?? 'Reach out for applications, partnerships, or mentoring.';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Ensure minimum loading time for complete animation cycle
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1430));

    try {
      const submitPromise = submitContactForm(name, email, message);
      const [response] = await Promise.all([submitPromise, minLoadingTime]);
      setSuccess(response.message);
      setName('');
      setEmail('');
      setMessage('');
    } catch (submitError) {
      await minLoadingTime; // Still wait for animation to complete on error
      setError(submitError instanceof Error ? submitError.message : 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {submitting && <LoadingScreen />}
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Contact</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Get in touch with the DAAI team</h1>
        <p className="text-lg leading-8 text-slate-600">
          {contactMessage}
        </p>
        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p>Email: {contactEmail}</p>
          <p>Phone: {contactPhone}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            disabled={submitting}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100 disabled:bg-slate-50 disabled:cursor-not-allowed" 
            type="text" 
            placeholder="Your name" 
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100 disabled:bg-slate-50 disabled:cursor-not-allowed" 
            type="email" 
            placeholder="you@example.com" 
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Message</span>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            disabled={submitting}
            className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100 disabled:bg-slate-50 disabled:cursor-not-allowed" 
            placeholder="How can we help?" 
          />
        </label>
        <button 
          type="submit" 
          disabled={submitting}
          className="rounded-full bg-daai-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600 disabled:bg-daai-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </section>
    </>
  );
}
