import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Zap } from 'lucide-react';
import Modal from '../components/Modal';

interface Attendee {
  attendee_id: number;
  full_name: string;
}

const OBJECTIONS = [
  "Your price is too high.",
  "We do not have budget this quarter.",
  "Send me an email.",
  "Your competitor is cheaper.",
  "We are not ready to transition.",
  "I need to speak to partners.",
  "Can you give a 20% discount?"
];

const ObjectionPingPong: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [targetId, setTargetId] = useState<number | ''>('');
  
  const [activeObjection, setActiveObjection] = useState<string | null>(null);
  const [objectionTimer, setObjectionTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalProps, setModalProps] = useState<{isOpen: boolean, title: string, message: string, type: 'error' | 'success'}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    const fetchAttendees = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/attendees`);
      const data = await res.json();
      setAttendees(data.filter((a: any) => !a.is_admin)); // Exclude admin
    };
    fetchAttendees();
  }, []);

  useEffect(() => {
    if (objectionTimer > 0) {
      timerRef.current = setTimeout(() => setObjectionTimer(t => t - 1), 1000);
    } else {
      if (activeObjection) setActiveObjection(null);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [objectionTimer, activeObjection]);

  const handleFireObjection = (objection_text: string) => {
    if (!socket || !targetId) return;
    socket.emit('fireObjection', { 
      target_attendee_id: Number(targetId), 
      objection_text 
    });
    setActiveObjection(objection_text);
    setObjectionTimer(20);
  };

  const handleScoreObjection = async (points: number) => {
    if (!socket || !attendee || !targetId) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/3/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_attendee_id: Number(targetId),
          scorer_attendee_id: attendee.attendee_id,
          scores: { '-1': points } // Use -1 as dummy criterion ID for ping-pong
        })
      });

      if (res.ok) {
        setModalProps({ isOpen: true, title: 'Score Awarded', message: `Awarded ${points} point(s) to the Fellow.`, type: 'success' });
        setObjectionTimer(0);
        setActiveObjection(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!attendee?.is_admin) {
    return <div className="animate-fade-in">Access Denied</div>;
  }

  return (
    <div className="animate-fade-in">
      <Modal {...modalProps} onClose={() => setModalProps({ ...modalProps, isOpen: false })} />
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        <div className="glass-panel" style={{ flex: 1, borderTop: '4px solid var(--color-danger)' }}>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Zap color="var(--color-danger)" size={32} />
            <h2 className="text-gradient">Objection Ping-Pong</h2>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Target any attendee and fire a rapid-fire objection. Their screen will instantly hijack with a 20-second countdown.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Select Target Fellow</h4>
            <select 
              className="input-field" 
              value={targetId} 
              onChange={(e) => setTargetId(Number(e.target.value))}
            >
              <option value="" disabled>Select an Attendee...</option>
              {attendees.map(a => (
                <option key={a.attendee_id} value={a.attendee_id}>{a.full_name}</option>
              ))}
            </select>
          </div>

          {!activeObjection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: targetId ? 1 : 0.5, pointerEvents: targetId ? 'auto' : 'none' }}>
              <h4 style={{ color: 'var(--color-text-muted)' }}>Available Objections</h4>
              {OBJECTIONS.map((obj, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid var(--color-danger)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{obj}</span>
                  <button className="btn-primary" style={{ background: 'var(--color-danger)', padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => handleFireObjection(obj)}>
                    Fire!
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-danger)', textAlign: 'center' }}>
              <Zap color="var(--color-danger)" size={48} style={{ marginBottom: '1rem', animation: 'pulse 2s infinite', margin: '0 auto' }} />
              <h3 style={{ color: 'var(--color-danger)', fontSize: '1.5rem', marginBottom: '1rem' }}>Objection Fired!</h3>
              <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>"{activeObjection}"</p>
              
              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: objectionTimer <= 5 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                  00:{objectionTimer.toString().padStart(2, '0')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-primary" style={{ background: 'var(--color-success)' }} onClick={() => handleScoreObjection(1)}>Pass (+1)</button>
                <button className="btn-secondary" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleScoreObjection(0)}>Fail (+0)</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ObjectionPingPong;
