import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export function ApplicationSubmittedPage() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-[2rem] border border-daai-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Application submitted</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Check your email</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Your application has been received. We have sent a verification link to your email address — click it to unlock the quiz.
        </p>
        <div className="mt-6 rounded-2xl bg-daai-50 p-5 space-y-1">
          <p className="text-sm font-semibold text-daai-800">What happens next</p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-daai-700">
            <li>Open the verification email we just sent you.</li>
            <li>Click the verification link inside it.</li>
            <li>You will be taken directly to your quiz.</li>
          </ol>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Did not receive the email? Check your spam folder. The link expires after 12 hours.
        </p>
        {candidateId ? <p className="mt-4 text-xs text-slate-400">Candidate ID: {candidateId}</p> : null}
        <div className="mt-6">
          <Link to="/" className="rounded-full border border-daai-200 bg-white px-5 py-3 text-sm font-semibold text-daai-700 transition hover:bg-daai-50">
            Return Home
          </Link>
        </div>
      </div>
    </section>
  );
}
