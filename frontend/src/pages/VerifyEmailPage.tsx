import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../lib/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const candidateId = searchParams.get('candidateId');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('A verification token is required.');
      return;
    }

    let active = true;
    setStatus('loading');

    verifyEmail(token)
      .then((response) => {
        if (!active) {
          return;
        }
        setStatus('success');
        setMessage(response.message);
        if (candidateId) {
          navigate(`/quiz?candidateId=${candidateId}`, { replace: true });
        }
      })
      .catch((verifyError) => {
        if (!active) {
          return;
        }
        setStatus('error');
        setMessage(verifyError instanceof Error ? verifyError.message : 'Verification failed.');
      });

    return () => {
      active = false;
    };
  }, [candidateId, navigate, token]);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Verify email</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Email verification</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {status === 'loading' ? 'Verifying your email address...' : message || 'Verification is required before quiz access.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {status === 'success' && candidateId ? (
            <Link to={`/quiz?candidateId=${candidateId}`} className="rounded-full bg-daai-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600">
              Go to Quiz
            </Link>
          ) : null}
          <Link to="/" className="rounded-full border border-daai-200 bg-white px-5 py-3 text-sm font-semibold text-daai-700 transition hover:bg-daai-50">
            Return Home
          </Link>
        </div>
        {status === 'error' ? <p className="mt-4 text-sm text-red-600">Verification could not be completed.</p> : null}
      </div>
    </section>
  );
}
