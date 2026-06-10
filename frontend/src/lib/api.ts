export type DomainName = 'AWS DevOps' | 'QA' | 'Salesforce';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export type ApplicationResponse = {
  candidate_id: number;
  verification_token: string;
  verification_url: string;
  message: string;
};

export type CandidateStatus = {
  id: number;
  full_name: string;
  email: string;
  domain: DomainName;
  is_verified: boolean;
  mcq_score: number;
  profile_score: number;
  form_completion_score: number;
  total_composite_score: number;
  verification_token: string;
  why_join: string;
};

export type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
};

export type QuizQuestionBatch = {
  candidate_id: number;
  domain: DomainName;
  total_questions: number;
  questions: QuizQuestion[];
};

export type VerificationResponse = {
  candidate_id: number;
  is_verified: boolean;
  message: string;
};

export type QuizSubmissionResponse = {
  candidate_id: number;
  mcq_score: number;
  profile_score: number;
  form_completion_score: number;
  total_composite_score: number;
  total_questions: number;
  correct_answers: number;
  message: string;
};

export type Mentor = {
  id: number;
  name: string;
  title: string;
  bio: string;
  expertise: string;
  email: string;
  image_url: string;
};

export type ServiceItem = {
  id: number;
  title: string;
  description: string;
  order_index: number;
  active: boolean;
};

export type SiteContent = {
  id: number;
  key: string;
  value: string;
};

export type EmailOutbox = {
  id: number;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
};

export type CurriculumItem = {
  id: number;
  title: string;
  description: string;
  track: string;
  order_index: number;
  active: boolean;
};

export type AdminLoginResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_at: string;
};

export type ApplicationDetail = CandidateStatus;

export type MentorPayload = Omit<Mentor, 'id'>;

export type ServicePayload = Omit<ServiceItem, 'id'>;

export type SiteContentPayload = Omit<SiteContent, 'id'>;

export type CurriculumPayload = Omit<CurriculumItem, 'id'>;

const ADMIN_TOKEN_KEY = 'daai_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminInit(init?: RequestInit): RequestInit {
  const token = getAdminToken();
  return {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

async function adminRequestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  return requestJson<T>(input, adminInit(init));
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  return response.json() as Promise<T>;
}

export async function submitApplication(formData: FormData): Promise<ApplicationResponse> {
  return requestJson<ApplicationResponse>(`${API_BASE_URL}/applications`, {
    method: 'POST',
    body: formData,
  });
}

export async function verifyEmail(token: string): Promise<VerificationResponse> {
  return requestJson<VerificationResponse>(`${API_BASE_URL}/verify?token=${encodeURIComponent(token)}`);
}

export async function fetchCandidate(candidateId: number): Promise<CandidateStatus> {
  return requestJson<CandidateStatus>(`${API_BASE_URL}/applications/${candidateId}`);
}

export async function fetchApplications(): Promise<ApplicationDetail[]> {
  return adminRequestJson<ApplicationDetail[]>(`${API_BASE_URL}/admin/applications`);
}

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResponse> {
  return requestJson<AdminLoginResponse>(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutAdmin(): Promise<{ message: string }> {
  const response = await adminRequestJson<{ message: string }>(`${API_BASE_URL}/admin/logout`, {
    method: 'POST',
  });
  clearAdminToken();
  return response;
}

export async function fetchAdminSession(): Promise<{ token: string; expires_at: string }> {
  return adminRequestJson<{ token: string; expires_at: string }>(`${API_BASE_URL}/admin/me`);
}

export async function fetchMentors(): Promise<Mentor[]> {
  return requestJson<Mentor[]>(`${API_BASE_URL}/mentors`);
}

export async function fetchAdminMentors(): Promise<Mentor[]> {
  return adminRequestJson<Mentor[]>(`${API_BASE_URL}/admin/mentors`);
}

export async function createMentor(payload: MentorPayload): Promise<Mentor> {
  return adminRequestJson<Mentor>(`${API_BASE_URL}/admin/mentors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateMentor(mentorId: number, payload: MentorPayload): Promise<Mentor> {
  return adminRequestJson<Mentor>(`${API_BASE_URL}/admin/mentors/${mentorId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteMentor(mentorId: number): Promise<{ message: string }> {
  return adminRequestJson<{ message: string }>(`${API_BASE_URL}/admin/mentors/${mentorId}`, { method: 'DELETE' });
}

export async function fetchServices(): Promise<ServiceItem[]> {
  return requestJson<ServiceItem[]>(`${API_BASE_URL}/services`);
}

export async function fetchAdminServices(): Promise<ServiceItem[]> {
  return adminRequestJson<ServiceItem[]>(`${API_BASE_URL}/admin/services`);
}

export async function createService(payload: ServicePayload): Promise<ServiceItem> {
  return adminRequestJson<ServiceItem>(`${API_BASE_URL}/admin/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateService(serviceId: number, payload: ServicePayload): Promise<ServiceItem> {
  return adminRequestJson<ServiceItem>(`${API_BASE_URL}/admin/services/${serviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteService(serviceId: number): Promise<{ message: string }> {
  return adminRequestJson<{ message: string }>(`${API_BASE_URL}/admin/services/${serviceId}`, { method: 'DELETE' });
}

export async function fetchCurriculum(): Promise<CurriculumItem[]> {
  return requestJson<CurriculumItem[]>(`${API_BASE_URL}/curriculum`);
}

export async function fetchAdminCurriculum(): Promise<CurriculumItem[]> {
  return adminRequestJson<CurriculumItem[]>(`${API_BASE_URL}/admin/curriculum`);
}

export async function createCurriculumItem(payload: CurriculumPayload): Promise<CurriculumItem> {
  return adminRequestJson<CurriculumItem>(`${API_BASE_URL}/admin/curriculum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateCurriculumItem(itemId: number, payload: CurriculumPayload): Promise<CurriculumItem> {
  return adminRequestJson<CurriculumItem>(`${API_BASE_URL}/admin/curriculum/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteCurriculumItem(itemId: number): Promise<{ message: string }> {
  return adminRequestJson<{ message: string }>(`${API_BASE_URL}/admin/curriculum/${itemId}`, { method: 'DELETE' });
}

export async function fetchSiteContent(): Promise<SiteContent[]> {
  return requestJson<SiteContent[]>(`${API_BASE_URL}/site-content`);
}

export async function updateSiteContent(payload: SiteContentPayload): Promise<SiteContent> {
  return adminRequestJson<SiteContent>(`${API_BASE_URL}/admin/site-content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchEmailOutbox(): Promise<EmailOutbox[]> {
  return adminRequestJson<EmailOutbox[]>(`${API_BASE_URL}/admin/email-outbox`);
}

export async function fetchQuizQuestions(domain: DomainName, candidateId: number): Promise<QuizQuestionBatch> {
  return requestJson<QuizQuestionBatch>(`${API_BASE_URL}/quiz/questions/${encodeURIComponent(domain)}?candidate_id=${candidateId}`);
}

export async function submitQuiz(candidateId: number, answers: number[]): Promise<QuizSubmissionResponse> {
  return requestJson<QuizSubmissionResponse>(`${API_BASE_URL}/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ candidate_id: candidateId, answers }),
  });
}
