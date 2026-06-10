import { useEffect, useMemo, useState } from 'react';
import {
  createMentor,
  createCurriculumItem,
  createService,
  deleteMentor,
  deleteCurriculumItem,
  deleteService,
  fetchAdminMentors,
  fetchAdminCurriculum,
  fetchAdminServices,
  fetchApplications,
  fetchEmailOutbox,
  fetchSiteContent,
  updateMentor,
  updateCurriculumItem,
  updateService,
  updateSiteContent,
  uploadMentorImage,
  type CandidateStatus,
  type CurriculumItem,
  type EmailOutbox,
  type Mentor,
  type ServiceItem,
  type SiteContent,
} from '../lib/api';

const editableContentKeys = ['hero_title', 'hero_subtitle', 'about_summary', 'contact_email', 'contact_phone', 'contact_message'];

type Tab = 'dashboard' | 'applications' | 'mentors' | 'curriculum' | 'services' | 'content' | 'outbox';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'applications', label: 'Applications' },
  { key: 'mentors', label: 'Mentors' },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'services', label: 'Services' },
  { key: 'content', label: 'Site Content' },
  { key: 'outbox', label: 'Email Outbox' },
];

type MentorForm = { id?: number; name: string; title: string; bio: string; expertise: string; email: string; image_url: string };
type ServiceForm = { id?: number; title: string; description: string; order_index: number; active: boolean };
type CurriculumForm = { id?: number; title: string; description: string; track: string; order_index: number; active: boolean };
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [applications, setApplications] = useState<CandidateStatus[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [outbox, setOutbox] = useState<EmailOutbox[]>([]);
  const [error, setError] = useState('');

  const [mentorForm, setMentorForm] = useState<MentorForm>({ name: '', title: '', bio: '', expertise: '', email: '', image_url: '' });
  const [mentorImageFile, setMentorImageFile] = useState<File | null>(null);
  const [mentorImagePreview, setMentorImagePreview] = useState<string>('');
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ title: '', description: '', order_index: 0, active: true });
  const [curriculumForm, setCurriculumForm] = useState<CurriculumForm>({ title: '', description: '', track: 'Core', order_index: 0, active: true });
  const [contentDrafts, setContentDrafts] = useState<Record<string, string>>({});

  const contentMap = useMemo(() => new Map(content.map((item) => [item.key, item.value])), [content]);

  async function loadAll() {
    try {
      const [applicationRows, mentorRows, curriculumRows, serviceRows, contentRows, outboxRows] = await Promise.all([
        fetchApplications(),
        fetchAdminMentors(),
        fetchAdminCurriculum(),
        fetchAdminServices(),
        fetchSiteContent(),
        fetchEmailOutbox(),
      ]);
      setApplications(applicationRows);
      setMentors(mentorRows);
      setCurriculum(curriculumRows);
      setServices(serviceRows);
      setContent(contentRows);
      setOutbox(outboxRows);
      setContentDrafts(Object.fromEntries(contentRows.map((item) => [item.key, item.value])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data.');
    }
  }

  useEffect(() => { void loadAll(); }, []);

  async function saveMentor() {
    setError('');
    let image_url = mentorForm.image_url;

    // Upload new image if selected
    if (mentorImageFile) {
      const formData = new FormData();
      formData.append('image', mentorImageFile);
      const uploaded = await uploadMentorImage(formData);
      image_url = uploaded.image_url;
    }

    const payload = { name: mentorForm.name, title: mentorForm.title, bio: mentorForm.bio, expertise: mentorForm.expertise, email: mentorForm.email, image_url };
    if (mentorForm.id) { await updateMentor(mentorForm.id, payload); } else { await createMentor(payload); }
    setMentorForm({ name: '', title: '', bio: '', expertise: '', email: '', image_url: '' });
    setMentorImageFile(null);
    setMentorImagePreview('');
    await loadAll();
  }

  async function saveCurriculum() {
    setError('');
    const payload = { title: curriculumForm.title, description: curriculumForm.description, track: curriculumForm.track, order_index: curriculumForm.order_index, active: curriculumForm.active };
    if (curriculumForm.id) { await updateCurriculumItem(curriculumForm.id, payload); } else { await createCurriculumItem(payload); }
    setCurriculumForm({ title: '', description: '', track: 'Core', order_index: 0, active: true });
    await loadAll();
  }

  async function saveService() {
    setError('');
    const payload = { title: serviceForm.title, description: serviceForm.description, order_index: serviceForm.order_index, active: serviceForm.active };
    if (serviceForm.id) { await updateService(serviceForm.id, payload); } else { await createService(payload); }
    setServiceForm({ title: '', description: '', order_index: 0, active: true });
    await loadAll();
  }

  async function saveContent(key: string) {
    await updateSiteContent({ key, value: contentDrafts[key] ?? '' });
    await loadAll();
  }

  return (
    <section className="space-y-6">
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <nav className="flex flex-wrap gap-1 rounded-[2rem] border border-white bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-daai-500 text-white shadow-glow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">Overview of applications, mentors, and content.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Applications</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{applications.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Verified</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{applications.filter((a) => a.is_verified).length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Mentors</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{mentors.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Curriculum Items</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{curriculum.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Services</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{services.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Emails Sent</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{outbox.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Applications</h2>
          <div className="mt-4 space-y-4 max-h-[32rem] overflow-auto pr-2">
            {applications.map((a) => (
              <article key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{a.full_name}</h3>
                    <p className="text-sm text-slate-500">{a.email} · {a.domain}</p>
                  </div>
                  <span className="rounded-full bg-daai-50 px-3 py-1 text-xs font-semibold text-daai-700">{a.total_composite_score.toFixed(2)}%</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">Why join: {a.why_join}</p>
                <p className="mt-2 text-sm text-slate-600">MCQ: {a.mcq_score.toFixed(2)}% · Resume: {a.profile_score.toFixed(2)}% · Composite: {a.total_composite_score.toFixed(2)}%</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'mentors' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Mentors</h2>
          <div className="mt-4 space-y-4">
            <input value={mentorForm.name} onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Name" />
            <input value={mentorForm.title} onChange={(e) => setMentorForm({ ...mentorForm, title: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Title" />
            <textarea value={mentorForm.bio} onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Bio" />
            <input value={mentorForm.expertise} onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Expertise" />
            <input value={mentorForm.email} onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Profile Image</label>
              {(mentorImagePreview || mentorForm.image_url) ? (
                <img src={mentorImagePreview || mentorForm.image_url} alt="preview" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setMentorImageFile(file);
                  setMentorImagePreview(file ? URL.createObjectURL(file) : '');
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-daai-50 file:px-4 file:py-2 file:font-semibold file:text-daai-700"
              />
              <p className="text-xs text-slate-400">JPEG, PNG or WebP. Leave empty to keep existing image.</p>
            </div>
            <button type="button" onClick={() => void saveMentor()} className="rounded-full bg-daai-500 px-4 py-2 text-sm font-semibold text-white">
              {mentorForm.id ? 'Update Mentor' : 'Add Mentor'}
            </button>
          </div>
          <div className="mt-6 space-y-3 max-h-[24rem] overflow-auto pr-2">
            {mentors.map((m) => (
              <article key={m.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  {m.image_url ? <img src={m.image_url} alt={m.name} className="h-12 w-12 rounded-2xl object-cover" /> : null}
                  <div>
                    <h3 className="font-semibold text-slate-900">{m.name}</h3>
                    <p className="text-sm text-slate-500">{m.title}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => { setMentorForm({ id: m.id, name: m.name, title: m.title, bio: m.bio, expertise: m.expertise, email: m.email, image_url: m.image_url }); setMentorImageFile(null); setMentorImagePreview(''); }} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => void deleteMentor(m.id).then(loadAll)} className="rounded-full border border-red-200 px-3 py-1 text-sm text-red-700">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'curriculum' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Curriculum</h2>
          <div className="mt-4 space-y-4">
            <input value={curriculumForm.title} onChange={(e) => setCurriculumForm({ ...curriculumForm, title: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Title" />
            <input value={curriculumForm.track} onChange={(e) => setCurriculumForm({ ...curriculumForm, track: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Track" />
            <textarea value={curriculumForm.description} onChange={(e) => setCurriculumForm({ ...curriculumForm, description: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Description" />
            <input value={curriculumForm.order_index} onChange={(e) => setCurriculumForm({ ...curriculumForm, order_index: Number(e.target.value) })} type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Order" />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input checked={curriculumForm.active} onChange={(e) => setCurriculumForm({ ...curriculumForm, active: e.target.checked })} type="checkbox" /> Active
            </label>
            <button type="button" onClick={() => void saveCurriculum()} className="rounded-full bg-daai-500 px-4 py-2 text-sm font-semibold text-white">
              {curriculumForm.id ? 'Update' : 'Add Item'}
            </button>
          </div>
          <div className="mt-6 space-y-3 max-h-[24rem] overflow-auto pr-2">
            {curriculum.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.track}</p>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setCurriculumForm(item)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => void deleteCurriculumItem(item.id).then(loadAll)} className="rounded-full border border-red-200 px-3 py-1 text-sm text-red-700">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'services' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Services</h2>
          <div className="mt-4 space-y-4">
            <input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Title" />
            <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Description" />
            <input value={serviceForm.order_index} onChange={(e) => setServiceForm({ ...serviceForm, order_index: Number(e.target.value) })} type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Order" />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input checked={serviceForm.active} onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })} type="checkbox" /> Active
            </label>
            <button type="button" onClick={() => void saveService()} className="rounded-full bg-daai-500 px-4 py-2 text-sm font-semibold text-white">
              {serviceForm.id ? 'Update' : 'Add Service'}
            </button>
          </div>
          <div className="mt-6 space-y-3 max-h-[24rem] overflow-auto pr-2">
            {services.map((s) => (
              <article key={s.id} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.description}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setServiceForm(s)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => void deleteService(s.id).then(loadAll)} className="rounded-full border border-red-200 px-3 py-1 text-sm text-red-700">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'content' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Site Content</h2>
          <div className="mt-4 space-y-4">
            {editableContentKeys.map((key) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{key}</label>
                <textarea
                  value={contentDrafts[key] ?? contentMap.get(key) ?? ''}
                  onChange={(e) => setContentDrafts((c) => ({ ...c, [key]: e.target.value }))}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-daai-300 focus:ring-4 focus:ring-daai-100"
                />
                <button onClick={() => void saveContent(key)} className="rounded-full bg-daai-500 px-4 py-2 text-sm font-semibold text-white">Save</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'outbox' && (
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Email Outbox</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {outbox.map((e) => (
              <article key={e.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{e.subject}</p>
                <p className="text-sm text-slate-500">To: {e.recipient_email}</p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{e.body}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-daai-700">{e.status}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
