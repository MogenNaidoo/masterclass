import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, Unlock, RefreshCw, Users } from 'lucide-react';
import Modal from '../components/Modal';

interface Sprint {
  sprint_id: number;
  name: string;
  is_locked: boolean;
}

interface Attendee {
  attendee_id: number;
  full_name: string;
}

const AdminPanel: React.FC = () => {
  const { socket, attendee } = useAppContext();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [pollLocked, setPollLocked] = useState(true);
  const [modalProps, setModalProps] = useState<{isOpen: boolean, title: string, message: string, type: 'error' | 'success' | 'info'}>({ isOpen: false, title: '', message: '', type: 'info' });
  
  // Track selected attendees per sprint for assignment
  const [assignments, setAssignments] = useState<Record<number, number[]>>({});

  const fetchSprints = async () => {
    const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints`);
    const data = await res.json();
    setSprints(data);
  };

  const fetchAttendees = async () => {
    const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/attendees`);
    const data = await res.json();
    setAttendees(data);
  };

  const fetchPollState = async () => {
    const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/settings/poll_locked`);
    const data = await res.json();
    setPollLocked(data.locked);
  };

  useEffect(() => {
    fetchSprints();
    fetchAttendees();
    fetchPollState();
  }, []);

  const handleUnlock = async (sprint_id: number) => {
    if (!attendee?.is_admin) return;
    
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/sprints/${sprint_id}/unlock`, {
        method: 'POST'
      });
      if (res.ok) {
        if (socket) {
          socket.emit('sprintUnlocked', sprint_id);
        }
        fetchSprints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockPoll = async () => {
    if (!attendee?.is_admin) return;
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/settings/poll_unlock`, { method: 'POST' });
      if (res.ok) {
        if (socket) socket.emit('pollUnlocked');
        fetchPollState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssignment = (sprint_id: number, attendee_id: number) => {
    setAssignments(prev => {
      const current = prev[sprint_id] || [];
      if (current.includes(attendee_id)) {
        return { ...prev, [sprint_id]: current.filter(id => id !== attendee_id) };
      } else {
        return { ...prev, [sprint_id]: [...current, attendee_id] };
      }
    });
  };

  const handleAssign = async (sprint_id: number) => {
    const selected = assignments[sprint_id] || [];
    if (selected.length === 0) {
      setModalProps({ isOpen: true, title: 'No Fellows Selected', message: 'Please select at least one attendee to act as a Fellow.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/sprints/${sprint_id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendee_ids: selected })
      });
      if (res.ok) {
        setModalProps({ isOpen: true, title: 'Success', message: 'Fellows assigned successfully!', type: 'success' });
        if (socket) {
          socket.emit('sprintAssigned', sprint_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/export`);
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_challenge_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data', err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL scores, assignments, poll responses, and attendees (except admins). Are you sure?')) {
      return;
    }
    
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/reset`, { method: 'POST' });
      if (res.ok) {
        setModalProps({ isOpen: true, title: 'Success', message: 'All data has been reset.', type: 'success' });
        fetchSprints();
        fetchAttendees();
        fetchPollState();
      } else {
        setModalProps({ isOpen: true, title: 'Error', message: 'Failed to reset data.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to reset data', err);
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
      
      <div className="glass-panel" style={{ borderColor: 'var(--color-danger)', maxWidth: '800px' }}>
        <h2 className="text-gradient" style={{ color: 'var(--color-danger)', marginBottom: '2rem' }}>EIR Controls</h2>
        
        <h3 style={{ marginBottom: '1rem' }}>Manage Sprints & Assign Fellows</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Select which Attendees will act as Fellows for each sprint, then assign them. Once assigned, you can unlock the sprint.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
          {sprints.map(sprint => {
            const selectedCount = (assignments[sprint.sprint_id] || []).length;

            return (
              <div key={sprint.sprint_id} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem' }}>{sprint.name}</h4>
                    <span style={{ fontSize: '0.9rem', color: sprint.is_locked ? 'var(--color-text-muted)' : 'var(--color-success)' }}>
                      {sprint.is_locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                  
                  {sprint.is_locked ? (
                    <button 
                      onClick={() => handleUnlock(sprint.sprint_id)}
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      <Unlock size={16} /> Unlock
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.9rem', opacity: 0.5, cursor: 'not-allowed' }}
                    >
                      <Lock size={16} /> Locked (Already Open)
                    </button>
                  )}
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px' }}>
                  <h5 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="var(--color-primary)"/> Select Fellows
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {attendees.map(att => {
                      const isSelected = (assignments[sprint.sprint_id] || []).includes(att.attendee_id);
                      return (
                        <label 
                          key={att.attendee_id} 
                          style={{ 
                            background: isSelected ? 'var(--color-primary-glow)' : 'rgba(0,0,0,0.3)', 
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            padding: '4px 12px', 
                            borderRadius: '16px', 
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            style={{ display: 'none' }}
                            checked={isSelected}
                            onChange={() => toggleAssignment(sprint.sprint_id, att.attendee_id)}
                          />
                          {att.full_name}
                        </label>
                      )
                    })}
                  </div>
                  <button 
                    onClick={() => handleAssign(sprint.sprint_id)}
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    Assign {selectedCount} Fellow(s)
                  </button>
                </div>

              </div>
            );
          })}
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem' }}>Closing Poll</h4>
                <span style={{ fontSize: '0.9rem', color: pollLocked ? 'var(--color-text-muted)' : 'var(--color-success)' }}>
                  {pollLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>
              
              {pollLocked ? (
                <button 
                  onClick={handleUnlockPoll}
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <Unlock size={16} /> Unlock
                </button>
              ) : (
                <button 
                  disabled
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '0.9rem', opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <Lock size={16} /> Locked (Already Open)
                </button>
              )}
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem' }}>System Tools</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExport}>
             Export Leaderboard Data
          </button>
          <button className="btn-secondary" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleReset}>
            <RefreshCw size={16} /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
