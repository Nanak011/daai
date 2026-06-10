import { useEffect, useState } from 'react';
import { fetchMentors, fetchSiteContent, type Mentor, type SiteContent } from '../lib/api';

export function AboutPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    fetchSiteContent().then(setContent).catch(() => setContent([]));
    fetchMentors().then(setMentors).catch(() => setMentors([]));
  }, []);

  const contentMap = new Map(content.map((item) => [item.key, item.value]));
  const aboutSummary = contentMap.get('about_summary') ?? 'DAAI exists to make practical AI education accessible, rigorous, and aligned with real-world hiring expectations.';

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">About Us</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Data Science & AI Institute mission and team</h1>
        <p className="text-lg leading-8 text-slate-600">
          {aboutSummary}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          ['Mission', 'Create structured opportunities for learners to build applied skills in AI and adjacent domains.'],
          ['Team', 'A multidisciplinary group spanning data science, product design, and industry mentorship.'],
          ['Approach', 'A transparent flow that combines application quality, verification, and domain-aligned assessment.'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{body}</p>
          </article>
        ))}
      </div>
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold text-slate-900">Mentors</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {mentors.length === 0 ? <p className="text-slate-600">No mentors have been added yet.</p> : null}
          {mentors.map((mentor) => (
            <article key={mentor.id} className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-4">
                {mentor.image_url ? <img src={mentor.image_url} alt={mentor.name} className="h-14 w-14 rounded-2xl object-cover" /> : null}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{mentor.name}</h3>
                  <p className="mt-1 text-sm font-medium text-daai-700">{mentor.title}</p>
                </div>
              </div>
              <p className="mt-3 leading-7 text-slate-600">{mentor.bio}</p>
              <p className="mt-3 text-sm text-slate-500">Expertise: {mentor.expertise || 'N/A'}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
