import { useEffect, useState } from 'react';
import { fetchSiteContent, type SiteContent } from '../lib/api';

export function ContactPage() {
  const [content, setContent] = useState<SiteContent[]>([]);

  useEffect(() => {
    fetchSiteContent().then(setContent).catch(() => setContent([]));
  }, []);

  const contentMap = new Map(content.map((item) => [item.key, item.value]));
  const contactEmail = contentMap.get('contact_email') ?? 'hello@daai.org';
  const contactPhone = contentMap.get('contact_phone') ?? '+1 555 0100';
  const contactMessage = contentMap.get('contact_message') ?? 'Reach out for applications, partnerships, or mentoring.';

  return (
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
      <form className="space-y-4 rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="text" placeholder="Your name" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" type="email" placeholder="you@example.com" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Message</span>
          <textarea className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-daai-300 focus:ring-4 focus:ring-daai-100" placeholder="How can we help?" />
        </label>
        <button type="button" className="rounded-full bg-daai-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600">
          Send Message
        </button>
      </form>
    </section>
  );
}
