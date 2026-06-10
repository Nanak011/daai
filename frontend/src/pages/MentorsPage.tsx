import { useEffect, useState } from 'react';
import { fetchMentors, type Mentor } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8001';

export function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    fetchMentors().then(setMentors).catch(() => setMentors([]));
  }, []);

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Mentors</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Meet the people behind the fellowship</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {mentors.length === 0 ? <p className="text-slate-600">No mentor records have been added yet.</p> : null}
        {mentors.map((mentor) => (
          <article key={mentor.id} className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4">
              {mentor.image_url && !mentor.image_url.startsWith('data:') ? (
                <img 
                  src={mentor.image_url.startsWith('http') ? mentor.image_url : `${API_BASE}${mentor.image_url}`}
                  alt={mentor.name} 
                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{mentor.name}</h2>
                <p className="mt-1 text-sm font-medium text-daai-700">{mentor.title}</p>
              </div>
            </div>
            <p className="mt-3 leading-7 text-slate-600">{mentor.bio}</p>
            <p className="mt-3 text-sm text-slate-500">{mentor.expertise}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
