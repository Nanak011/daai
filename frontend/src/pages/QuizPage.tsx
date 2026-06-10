import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCandidate, fetchQuizQuestions, submitQuiz, type CandidateStatus, type QuizQuestionBatch } from '../lib/api';

const QUIZ_SECONDS = 5 * 60;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = Number(searchParams.get('candidateId'));
  const [candidate, setCandidate] = useState<CandidateStatus | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestionBatch | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_SECONDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!candidateId || Number.isNaN(candidateId)) {
      setError('A valid candidate ID is required to load the quiz.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadQuiz() {
      try {
        const candidateResponse = await fetchCandidate(candidateId);
        if (!candidateResponse.is_verified) {
          navigate(`/application-submitted?candidateId=${candidateId}&token=${candidateResponse.verification_token}`, { replace: true });
          return;
        }

        const quizResponse = await fetchQuizQuestions(candidateResponse.domain, candidateId);
        if (!active) {
          return;
        }

        setCandidate(candidateResponse);
        setQuiz(quizResponse);
        setAnswers(Array(quizResponse.total_questions).fill(-1));
        setLoading(false);
      } catch (quizError) {
        if (!active) {
          return;
        }
        setError(quizError instanceof Error ? quizError.message : 'Unable to load the quiz.');
        setLoading(false);
      }
    }

    loadQuiz();
    return () => {
      active = false;
    };
  }, [candidateId, navigate]);

  useEffect(() => {
    if (!quiz || submitting) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((current: number) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          void handleSubmit(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [quiz, submitting]);

  const currentQuestion = useMemo(() => quiz?.questions[currentIndex], [currentIndex, quiz]);

  async function handleSubmit(autoSubmit = false) {
    if (!quiz || !candidate) {
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const response = await submitQuiz(candidate.id, answers);
      navigate('/quiz-completed', {
        state: {
          candidateName: candidate.full_name,
          domain: candidate.domain,
          autoSubmit,
          result: response,
        },
        replace: true,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Quiz submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-white bg-white p-8 text-slate-600 shadow-sm">Loading quiz...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">{error}</div>;
  }

  if (!quiz || !candidate) {
    return null;
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Quiz</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">{candidate.domain} domain assessment</h1>
            <p className="mt-2 text-slate-600">One question at a time. The timer auto-submits when it reaches zero.</p>
          </div>
          <div className="rounded-2xl bg-daai-50 px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-daai-700">Time remaining</p>
            <p className="mt-1 text-3xl font-bold text-daai-800">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
          <span>
            Question {currentIndex + 1} of {quiz.total_questions}
          </span>
          <span>{candidate.full_name}</span>
        </div>

        <h2 className="text-2xl font-semibold leading-9 text-slate-900">{currentQuestion?.prompt}</h2>

        <div className="mt-6 grid gap-3">
          {currentQuestion?.options.map((option: string, optionIndex: number) => {
            const selected = answers[currentIndex] === optionIndex;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAnswers((currentAnswers: number[]) => {
                    const updated = [...currentAnswers];
                    updated[currentIndex] = optionIndex;
                    return updated;
                  });
                }}
                className={[
                  'rounded-2xl border px-4 py-4 text-left transition',
                  selected ? 'border-daai-500 bg-daai-50 text-daai-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-daai-200 hover:bg-daai-50',
                ].join(' ')}
              >
                <span className="font-medium">{option}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            disabled={currentIndex === 0}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.min(index + 1, quiz.total_questions - 1))}
            disabled={currentIndex >= quiz.total_questions - 1}
            className="rounded-full border border-daai-200 bg-daai-50 px-5 py-3 text-sm font-semibold text-daai-700 transition hover:bg-daai-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="ml-auto rounded-full bg-daai-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600 disabled:cursor-not-allowed disabled:bg-daai-300"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </section>
  );
}
