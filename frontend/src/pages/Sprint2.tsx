import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Clock, Check, PenTool } from 'lucide-react';

interface Fellow {
  attendee_id: number;
  full_name: string;
  is_completed?: boolean;
}

interface Criterion {
  criterion_id: number;
  name: string;
}

const Sprint2: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [currentFellowIndex, setCurrentFellowIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [timer, setTimer] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [part, setPart] = useState<'A' | 'B'>('A');
  const [submitted, setSubmitted] = useState(false);

  // Copywriting state
  const [copywriting, setCopywriting] = useState({
    promise: '',
    picture: '',
    proof: '',
    push: ''
  });

  const fetchFellowsAndCriteria = async () => {
    const fRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/2/fellows`);
    const fData = await fRes.json();
    setFellows(fData);

    const cRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/2/criteria`);
    const cData = await cRes.json();
    setCriteria(cData);
    
    const initialScores: Record<number, number> = {};
    cData.forEach((c: Criterion) => {
      initialScores[c.criterion_id] = 0;
    });
    setScores(initialScores);
  };

  useEffect(() => {
    fetchFellowsAndCriteria();

    if (socket) {
      socket.on('sprintAssigned', (sprint_id: number) => {
        if (sprint_id === 2) fetchFellowsAndCriteria();
      });
    }

    return () => {
      if (socket) socket.off('sprintAssigned');
    }
  }, [socket]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const toggleCriterion = (criterion_id: number) => {
    setScores(prev => ({
      ...prev,
      [criterion_id]: prev[criterion_id] === 0 ? 1 : 0
    }));
  };

  const handleNextFellow = async () => {
    if (!socket || !attendee) return;

    for (const [critId, points] of Object.entries(scores)) {
      socket.emit('submitScore', {
        attendee_id: attendee.attendee_id,
        target_attendee_id: fellows[currentFellowIndex].attendee_id,
        criterion_id: parseInt(critId),
        points
      });
    }

    if (attendee.is_admin) {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/sprints/2/fellows/${fellows[currentFellowIndex].attendee_id}/complete`, { method: 'PUT' });
    }

    if (currentFellowIndex < fellows.length - 1) {
      setCurrentFellowIndex(prev => prev + 1);
      setTimer(90);
      setIsTimerRunning(false);
      
      const resetScores: Record<number, number> = {};
      criteria.forEach((c) => {
        resetScores[c.criterion_id] = 0;
      });
      setScores(resetScores);
    } else {
      setSubmitted(true);
    }
  };

  if (fellows.length === 0 || criteria.length === 0) {
    return <div className="animate-fade-in"><p>Loading lab data...</p></div>;
  }

  if (submitted) {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Check color="var(--color-success)" size={64} style={{ marginBottom: '1rem' }} />
        <h2 className="text-gradient">Sprint 2 Complete</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          You have successfully scored all Fellows for the Prospecting Lab.
        </p>
        <Link to="/">
          <button className="btn-primary">Return to Dashboard</button>
        </Link>
      </div>
    );
  }

  if (part === 'A') {
    return (
      <div className="animate-fade-in">
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <PenTool color="var(--color-primary)" size={32} />
            <div>
              <h2 className="text-gradient">Part A: Copywriting</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Draft your 4 P's before pitching your proposal.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Promise (Outcome)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={copywriting.promise} 
                onChange={e => setCopywriting({...copywriting, promise: e.target.value})}
                placeholder="What is the ultimate benefit?"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Picture (Context)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={copywriting.picture} 
                onChange={e => setCopywriting({...copywriting, picture: e.target.value})}
                placeholder="Paint a picture of their current problem..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Proof (Evidence)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={copywriting.proof} 
                onChange={e => setCopywriting({...copywriting, proof: e.target.value})}
                placeholder="Data or case study to build trust..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Push (Next Step)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={copywriting.push} 
                onChange={e => setCopywriting({...copywriting, push: e.target.value})}
                placeholder="Clear, low-friction ask..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={async () => {
              if (attendee) {
                try {
                  await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/2/fellows/${attendee.attendee_id}/defense`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ defense_text: JSON.stringify(copywriting) })
                  });
                } catch (e) {
                  console.error(e);
                }
              }
              setPart('B');
            }} className="btn-primary">
              Continue to Pitch / Scoring &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentFellow = fellows[currentFellowIndex];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const isSelf = attendee?.attendee_id === currentFellow.attendee_id;
  const isCompleted = currentFellow.is_completed;

  return (
    <div className="animate-fade-in">
      <button onClick={() => setPart('A')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
        &larr; Back to Copywriting
      </button>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div className="glass-panel" style={{ flex: 2 }}>
          {isSelf ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>You are in the Hot Seat!</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>Good luck with your prospecting pitch.</p>
            </div>
          ) : (
            <>
              {isCompleted && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontWeight: 'bold' }}>
                  This fellow's pitch has been completed and scored.
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="text-gradient">Fellow {currentFellowIndex + 1} of {fellows.length}</h2>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{currentFellow.full_name}</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-surface)', padding: '16px', borderRadius: '12px' }}>
                  <Clock color={timer <= 15 ? 'var(--color-danger)' : 'var(--color-primary)'} size={24} style={{ marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timer <= 15 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                  {!isTimerRunning && timer === 90 && !isCompleted ? (
                    <button onClick={() => setIsTimerRunning(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginTop: '0.5rem' }}>Start</button>
                  ) : null}
                </div>
              </div>

              <div style={{ marginBottom: '2rem', opacity: isCompleted ? 0.5 : 1, pointerEvents: isCompleted ? 'none' : 'auto' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Score Rubric (Select all that apply)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {criteria.map((criterion) => (
                    <label key={criterion.criterion_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px', border: scores[criterion.criterion_id] ? '1px solid var(--color-primary)' : '1px solid transparent', transition: 'all 0.2s' }}>
                      <input 
                        type="checkbox" 
                        checked={scores[criterion.criterion_id] === 1}
                        onChange={() => toggleCriterion(criterion.criterion_id)}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>{criterion.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Total Score: <span style={{ color: 'var(--color-primary)' }}>{totalScore} / 3</span>
                </span>
                {!isCompleted && (
                  <button onClick={handleNextFellow} className="btn-primary">
                    {currentFellowIndex < fellows.length - 1 ? 'Submit & Next Fellow' : 'Submit & Finish Sprint'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem' }}>Rotation List</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {fellows.map((f, i) => (
              <li key={f.attendee_id} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: i === currentFellowIndex ? 'var(--color-primary)' : i < currentFellowIndex ? 'var(--color-text-muted)' : 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i < currentFellowIndex ? <Check size={16} /> : null}
                {f.full_name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sprint2;
