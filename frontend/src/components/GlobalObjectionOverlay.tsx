import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Zap } from 'lucide-react';

const GlobalObjectionOverlay: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [activeObjection, setActiveObjection] = useState<{ text: string, target_id: number } | null>(null);
  const [objectionTimer, setObjectionTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('objectionFired', ({ target_attendee_id, objection_text }) => {
        setActiveObjection({ text: objection_text, target_id: target_attendee_id });
        setObjectionTimer(20);
      });
    }

    return () => {
      if (socket) {
        socket.off('objectionFired');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (objectionTimer > 0) {
      timerRef.current = setTimeout(() => setObjectionTimer(t => t - 1), 1000);
    } else {
      setActiveObjection(null); // Clear objection when timer ends
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [objectionTimer]);

  // Only show the overlay for non-admins, and only if they are the target
  if (attendee?.is_admin) return null;
  if (!activeObjection || objectionTimer <= 0) return null;

  const isTargeted = activeObjection.target_id === attendee?.attendee_id;
  if (!isTargeted) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'rgba(20, 20, 20, 0.95)', // Solid dark background for maximum focus
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem', 
        textAlign: 'center',
        animation: 'flashRed 2s infinite'
      }}
    >
      <style>
        {`
          @keyframes flashRed {
            0% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
            50% { box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.5); }
            100% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
          }
        `}
      </style>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '4rem', borderRadius: '24px', border: '2px solid var(--color-danger)', maxWidth: '800px', width: '100%' }}>
        <Zap color="var(--color-danger)" size={80} style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite', margin: '0 auto' }} />
        <h2 className="text-gradient" style={{ color: 'var(--color-danger)', fontSize: '3rem', marginBottom: '1rem' }}>YOU ARE TARGETED!</h2>
        <h3 style={{ fontSize: '2.5rem', marginTop: '1rem', marginBottom: '3rem', color: '#fff' }}>"{activeObjection.text}"</h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>Time to respond:</span>
          <span style={{ fontSize: '6rem', fontWeight: 'bold', color: objectionTimer <= 5 ? 'var(--color-danger)' : 'var(--color-text-main)', lineHeight: 1 }}>
            00:{objectionTimer.toString().padStart(2, '0')}
          </span>
        </div>
        <p style={{ marginTop: '3rem', color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>
          Remember: Pause &rarr; Explore &rarr; Translate to Value &rarr; Escalate
        </p>
      </div>
    </div>
  );
};

export default GlobalObjectionOverlay;
