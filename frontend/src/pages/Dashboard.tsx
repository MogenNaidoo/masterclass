import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Rocket, Activity, CheckCircle, Lock } from 'lucide-react';

interface Sprint {
  sprint_id: number;
  name: string;
  description: string;
  order: number;
  is_locked: boolean;
}

const Dashboard: React.FC = () => {
  const { attendee, socket, setAttendee } = useAppContext();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [pollLocked, setPollLocked] = useState(true);
  const navigate = useNavigate();

  const fetchSprints = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints`);
      const data = await res.json();
      setSprints(data);
    } catch (err) {
      console.error('Failed to fetch sprints');
    }
  };

  useEffect(() => {
    fetchSprints();

    const fetchPollState = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/settings/poll_locked`);
        const data = await res.json();
        setPollLocked(data.locked);
      } catch (err) {}
    };
    fetchPollState();

    if (socket) {
      socket.on('sprintUnlocked', () => {
        fetchSprints();
      });
      socket.on('pollUnlocked', () => {
        setPollLocked(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('sprintUnlocked');
        socket.off('pollUnlocked');
      }
    };
  }, [socket]);

  const handleLogout = () => {
    setAttendee(null);
    navigate('/login');
  };

  const getSprintPath = (order: number) => {
    switch(order) {
      case 1: return '/sprint1';
      case 2: return '/sprint2';
      case 3: return '/sprint3';
      default: return '/';
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Rocket color="var(--color-primary)" size={32} />
          <h2 className="text-gradient">Sales Challenge</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Welcome, {attendee?.full_name}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {sprints.map((sprint, index) => {
          const isNextLocked = sprints[index + 1]?.is_locked ?? true;
          const isCompleted = !sprint.is_locked && !isNextLocked;
          const isActive = !sprint.is_locked && isNextLocked;

          return (
            <div key={sprint.sprint_id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                  {sprint.name}
                </h3>
                {sprint.is_locked ? (
                  <Lock color="var(--color-text-muted)" size={20} />
                ) : isCompleted ? (
                  <CheckCircle color="var(--color-success)" size={20} />
                ) : (
                  <Activity color="var(--color-primary)" size={20} />
                )}
              </div>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', flexGrow: 1 }}>{sprint.description}</p>
              
              {sprint.is_locked ? (
                <button className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                  Locked
                </button>
              ) : (
                <Link to={getSprintPath(sprint.order)} style={{ textDecoration: 'none', width: '100%' }}>
                  <button className={isActive ? "btn-primary" : "btn-secondary"} style={{ width: '100%' }}>
                    {isCompleted ? 'View Results' : 'Enter Lab'}
                  </button>
                </Link>
              )}
            </div>
          );
        })}
        
        {/* Objection Ping-Pong (Admin only, after Sprint 3) */}
        {attendee?.is_admin && (
          <div className="glass-panel flex-center" style={{ flexDirection: 'column', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>Objection Ping-Pong</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0', flexGrow: 1 }}>Fire rapid objections globally</p>
            <Link to="/objections" style={{ width: '100%' }}>
              <button className="btn-primary" style={{ background: 'var(--color-danger)', width: '100%' }}>Enter Module</button>
            </Link>
          </div>
        )}
        {/* Quiz Master (Admin only) */}
        {attendee?.is_admin && (
          <div className="glass-panel flex-center" style={{ flexDirection: 'column', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>Quiz Master</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0', flexGrow: 1 }}>Host Association! Game</p>
            <Link to="/quiz-master" style={{ width: '100%' }}>
              <button className="btn-primary" style={{ background: 'var(--color-danger)', width: '100%' }}>Host Game</button>
            </Link>
          </div>
        )}

        {/* Association Quiz Link */}
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
          <h3>Association! Quiz</h3>
          <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0', flexGrow: 1 }}>Join the live Knowledge Check</p>
          {pollLocked ? (
            <button className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>Locked</button>
          ) : (
            <Link to="/quiz" style={{ width: '100%' }}>
              <button className="btn-primary" style={{ width: '100%' }}>Enter Game</button>
            </Link>
          )}
        </div>
        
        {/* Global Leaderboard Link */}
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
          <h3>Global Leaderboard</h3>
          <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0', flexGrow: 1 }}>See how everyone stacks up</p>
          <Link to="/leaderboard" style={{ width: '100%' }}>
            <button className="btn-primary" style={{ width: '100%' }}>View Leaderboard</button>
          </Link>
        </div>

        {/* EIR Controls (Admin only) */}
        {attendee?.is_admin && (
          <div className="glass-panel flex-center" style={{ flexDirection: 'column', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>EIR Controls</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0', flexGrow: 1 }}>Manage sprints and timers</p>
            <Link to="/admin" style={{ width: '100%' }}>
              <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>Admin Panel</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
