import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { AboutPage } from './pages/AboutPage';
import { ApplyPage } from './pages/ApplyPage';
import { ApplicationSubmittedPage } from './pages/ApplicationSubmittedPage';
import { ContactPage } from './pages/ContactPage';
import { CurriculumPage } from './pages/CurriculumPage';
import { HomePage } from './pages/HomePage';
import { QuizCompletedPage } from './pages/QuizCompletedPage';
import { QuizPage } from './pages/QuizPage';
import { MentorsPage } from './pages/MentorsPage';
import { ServicesPage } from './pages/ServicesPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  // Initial page load only (not on route changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1430); // Show loader for 1.43 seconds (one complete cycle)

    return () => clearTimeout(timer);
  }, []);

  // Cursor click animation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Create click effect element
      const clickEffect = document.createElement('div');
      clickEffect.className = 'cursor-click-effect';
      clickEffect.style.left = `${e.clientX - 10}px`;
      clickEffect.style.top = `${e.clientY - 10}px`;
      
      document.body.appendChild(clickEffect);
      
      // Remove after animation completes
      setTimeout(() => {
        clickEffect.remove();
      }, 400);
    }

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Show loading screen only on initial load
  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/curriculum" element={<CurriculumPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/mentors" element={<MentorsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/application-submitted" element={<ApplicationSubmittedPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz-completed" element={<QuizCompletedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
