import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
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
