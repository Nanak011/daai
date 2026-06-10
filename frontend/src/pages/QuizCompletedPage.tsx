import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { QuizSubmissionResponse } from '../lib/api';

type QuizCompletedState = {
  candidateName?: string;
  domain?: string;
  autoSubmit?: boolean;
  result?: QuizSubmissionResponse;
};

export function QuizCompletedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as QuizCompletedState | undefined;
  const result = state?.result;

  if (!result) {
    return (
      <div className="rounded-3xl border border-white bg-white p-8 text-slate-600 shadow-sm">
        No quiz result found. <Link to="/apply" className="font-semibold text-daai-700 underline">Start again</Link>.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Quiz Completed</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Your score has been calculated</h1>
        <p className="mt-3 text-lg leading-8 text-slate-600">
          {state?.candidateName ? `${state.candidateName}, ` : ''}your responses were graded immediately after submission.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-daai-50 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-daai-700">MCQ score</p>
            <p className="mt-2 text-3xl font-bold text-daai-800">{result.mcq_score.toFixed(2)}%</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-daai-200">Composite score</p>
            <p className="mt-2 text-3xl font-bold text-white">{result.total_composite_score.toFixed(2)}%</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">
          <p>Resume score: {result.profile_score.toFixed(2)}%</p>
          <p>Correct answers: {result.correct_answers} of {result.total_questions}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full bg-daai-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600"
          >
            Back to Home
          </button>
          <Link to="/services" className="rounded-full border border-daai-200 bg-white px-5 py-3 text-sm font-semibold text-daai-700 transition hover:bg-daai-50">
            Review Fellowship Tracks
          </Link>
        </div>
      </div>
    </section>
  );
}
