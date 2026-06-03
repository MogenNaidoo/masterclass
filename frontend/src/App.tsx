import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';

// Pages (to be implemented)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sprint1 from './pages/Sprint1';
import Sprint2 from './pages/Sprint2';
import Sprint3 from './pages/Sprint3';
import Quiz from './pages/Quiz';
import QuizMaster from './pages/QuizMaster';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import ObjectionPingPong from './pages/ObjectionPingPong';
import GlobalObjectionOverlay from './components/GlobalObjectionOverlay';
import GlobalQuizOverlay from './components/GlobalQuizOverlay';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { attendee } = useAppContext();
  
  if (!attendee) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !attendee.is_admin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sprint1" element={<ProtectedRoute><Sprint1 /></ProtectedRoute>} />
          <Route path="/sprint2" element={<ProtectedRoute><Sprint2 /></ProtectedRoute>} />
          <Route path="/sprint3" element={<ProtectedRoute><Sprint3 /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/quiz-master" element={<ProtectedRoute adminOnly><QuizMaster /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="/objections" element={<ProtectedRoute adminOnly><ObjectionPingPong /></ProtectedRoute>} />
        </Routes>
        <GlobalObjectionOverlay />
        <GlobalQuizOverlay />
      </div>
    </Router>
  );
};

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
