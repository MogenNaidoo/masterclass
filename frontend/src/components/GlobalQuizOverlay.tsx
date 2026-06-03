import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

const GlobalQuizOverlay: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (socket) {
      socket.on('quizStarted', () => {
        // Only show popup to non-admins if they aren't already on the quiz page
        if (!attendee?.is_admin && location.pathname !== '/quiz') {
          setShowPopup(true);
        }
      });
    }

    return () => {
      if (socket) socket.off('quizStarted');
    };
  }, [socket, attendee, location.pathname]);

  if (!showPopup) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'rgba(20, 20, 20, 0.95)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem', 
        textAlign: 'center',
      }}
    >
      <div className="animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--color-surface), var(--color-background))', padding: '4rem', borderRadius: '24px', border: '2px solid var(--color-primary)', maxWidth: '600px', width: '100%', boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)' }}>
        <Gamepad2 color="var(--color-primary)" size={80} style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite', margin: '0 auto' }} />
        <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>ASSOCIATION! QUIZ</h2>
        <h3 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '3rem', color: 'var(--color-text-muted)' }}>The EIR has started a live quiz!</h3>
        
        <button 
          className="btn-primary" 
          style={{ fontSize: '1.5rem', padding: '1rem 3rem', width: '100%' }}
          onClick={() => {
            setShowPopup(false);
            navigate('/quiz');
          }}
        >
          Enter Game
        </button>
      </div>
    </div>
  );
};

export default GlobalQuizOverlay;
