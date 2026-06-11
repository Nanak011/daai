import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSiteContent, type SiteContent } from '../lib/api';

const milestones = [
  { label: 'Applications open', value: 'June 2026' },
  { label: 'Email verification', value: 'Within 24 hours' },
  { label: 'Quiz window', value: '20 minutes' },
  { label: 'Cohort start', value: 'After review' },
];

export function HomePage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteContent()
      .then(setContent)
      .catch(() => setContent([]))
      .finally(() => setLoading(false));
  }, []);

  const contentMap = new Map(content.map((item) => [item.key, item.value]));
  const heroTitle = contentMap.get('hero_title') ?? 'Build practical AI and data science skills with a focused fellowship path.';
  const heroSubtitle = contentMap.get('hero_subtitle') ?? 'The DAAI Fellowship connects motivated learners to mentorship, industry projects, and a verified selection flow.';

  // Show nothing while loading to prevent flash of default content
  if (loading) {
    return null;
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <span className="inline-flex rounded-full border border-daai-200 bg-white px-4 py-2 text-sm font-semibold text-daai-700 shadow-sm">
          DAAI Fellowship 2026
        </span>
        <div className="space-y-4">
          <h1 className="font-display text-5xl font-bold leading-tight text-slate-900 sm:text-6xl">
            {heroTitle}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            {heroSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/apply" className="rounded-full bg-daai-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600">
            Apply Now
          </Link>
          <Link to="/services" className="rounded-full border border-daai-200 bg-white px-6 py-3 text-sm font-semibold text-daai-700 transition hover:border-daai-300 hover:bg-daai-50">
            Explore Tracks
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {milestones.map((item) => (
            <article key={item.label} className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="relative overflow-hidden rounded-[2rem] border border-daai-100 bg-white p-6 shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,237,213,0.7),transparent_30%)]" />
        <div className="relative space-y-5">
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-daai-200">Selection model</p>
            <p className="mt-3 text-2xl font-semibold">Apply, verify, quiz, and score automatically.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Candidates are routed into AWS DevOps, QA, or Salesforce tracks and evaluated with a weighted score that combines quiz results, profile quality, and form completeness.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['AWS DevOps', 'QA', 'Salesforce'].map((item) => (
              <div key={item} className="rounded-2xl border border-daai-100 bg-daai-50 px-4 py-5 text-center font-semibold text-daai-800">
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
