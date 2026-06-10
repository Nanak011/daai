import { useEffect, useState } from 'react';
import { AdminPage } from '../pages/AdminPage';
import { LoadingScreen } from '../components/LoadingScreen';
import { clearAdminToken, fetchAdminSession, getAdminToken, loginAdmin, logoutAdmin, setAdminToken } from '../lib/api';

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Ensure minimum loading time for complete animation cycle
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1430));
    const authCheck = fetchAdminSession()
      .then(() => setAuthenticated(true))
      .catch(() => clearAdminToken());

    Promise.all([minLoadingTime, authCheck])
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    
    // Ensure minimum loading time for complete animation cycle
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1430));
    
    try {
      const loginPromise = loginAdmin(username, password);
      const [response] = await Promise.all([loginPromise, minLoadingTime]);
      setAdminToken(response.access_token);
      setAuthenticated(true);
    } catch (loginError) {
      await minLoadingTime; // Still wait for animation to complete on error
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setLoading(true);
    
    // Ensure minimum loading time for complete animation cycle
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1430));
    const logoutPromise = logoutAdmin();
    
    Promise.all([minLoadingTime, logoutPromise])
      .finally(() => {
        clearAdminToken();
        setAuthenticated(false);
        setLoading(false);
      });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-hero-grid p-6 text-slate-900">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center">
          <form onSubmit={handleLogin} className="glass-surface w-full rounded-[2rem] p-8 shadow-[0_24px_70px_rgba(249,115,22,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-daai-600">Admin Access</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Sign in</h1>
            <p className="mt-2 text-sm text-slate-600">Login to manage curriculum, mentors, services, and applications.</p>
            {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 outline-none focus:border-daai-300 focus:ring-4 focus:ring-daai-100" />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 outline-none focus:border-daai-300 focus:ring-4 focus:ring-daai-100" />
            </label>
            <button type="submit" className="mt-6 w-full rounded-full bg-daai-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-daai-600">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-grid text-slate-900">
      <header className="border-b border-white/60 bg-white/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-display text-xl font-bold tracking-[0.22em] text-daai-600">DAAI ADMIN</p>
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Separate administration portal</p>
          </div>
          <button onClick={handleLogout} className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-900 backdrop-blur-xl transition hover:bg-white/80">
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPage />
      </main>
    </div>
  );
}