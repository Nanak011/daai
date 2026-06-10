import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/curriculum', label: 'Curriculum' },
  { to: '/services', label: 'Services' },
  { to: '/mentors', label: 'Mentors' },
  { to: '/contact', label: 'Contact' },
  { to: '/apply', label: 'Apply' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-hero-grid text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="shrink-0">
            <img src="/daai.png" alt="DAAI Fellowship" className="h-11 w-auto" />
          </NavLink>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive ? 'bg-daai-500 text-white shadow-glow' : 'text-slate-600 hover:bg-daai-50 hover:text-daai-700',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/60 bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>DAAI Fellowship</p>
        </div>
      </footer>
    </div>
  );
}
