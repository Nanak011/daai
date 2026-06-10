import { useEffect, useState } from 'react';
import { fetchServices, type ServiceItem } from '../lib/api';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]));
  }, []);

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Services</p>
        <h1 className="font-display text-4xl font-bold text-slate-900">Mentorship, research tracks, and industry projects</h1>
        <p className="text-lg leading-8 text-slate-600">
          The fellowship is organized around three service pillars that help participants move from learning to practice with a clear direction.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {services.length === 0
          ? [
              ['Mentorship', 'Regular guidance from experienced practitioners, with feedback loops around project execution and career readiness.'],
              ['Research Tracks', 'A focused path for learners who want to explore model evaluation, experimentation, and evidence-driven problem solving.'],
              ['Industry Partner Projects', 'Practical work streams that expose fellows to real product constraints, cross-functional delivery, and stakeholder communication.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-daai-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{body}</p>
              </article>
            ))
          : services.map((service) => (
              <article key={service.id} className="rounded-3xl border border-daai-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{service.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
      </div>
    </section>
  );
}
