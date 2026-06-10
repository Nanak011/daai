import { useEffect, useMemo, useState } from 'react';
import { fetchCurriculum, type CurriculumItem } from '../lib/api';

export function CurriculumPage() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);

  useEffect(() => {
    fetchCurriculum().then(setCurriculum).catch(() => setCurriculum([]));
  }, []);

  const grouped = useMemo(() => {
    const buckets = new Map<string, CurriculumItem[]>();
    curriculum.forEach((item) => {
      const items = buckets.get(item.track) ?? [];
      items.push(item);
      buckets.set(item.track, items);
    });
    return buckets;
  }, [curriculum]);

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Curriculum</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Fellowship curriculum and milestones</h1>
      </div>
      <div className="grid gap-6">
        {Array.from(grouped.entries()).map(([track, items]) => (
          <section key={track} className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-slate-900">{track}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/60 bg-white/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <span className="rounded-full bg-daai-50 px-3 py-1 text-xs font-semibold text-daai-700">{item.order_index}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}