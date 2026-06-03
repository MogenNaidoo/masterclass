import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Check, AlertTriangle, Shield } from 'lucide-react';
import Modal from '../components/Modal';

interface Fellow {
  attendee_id: number;
  full_name: string;
  scenario?: string;
  defense_text?: string;
  is_completed?: boolean;
}

interface Criterion {
  criterion_id: number;
  name: string;
}

const SCENARIOS = [
  "Scenario 1: Your price point is too low and inadvertently signals weak solution value.",
  "Scenario 2: Your price point is exceptionally high but has completely failed to justify its underlying ROI architecture.",
  "Scenario 3: Your package bundles far too much scope for the listed price, creating major delivery risk.",
  "Scenario 4: Your price is accurate, but your connection to the customer's cost of inaction is completely invisible."
];

const Sprint3: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [currentFellowIndex, setCurrentFellowIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  
  const [submitted, setSubmitted] = useState(false);
  const [modalProps, setModalProps] = useState<{isOpen: boolean, title: string, message: string, type: 'error' | 'success'}>({ isOpen: false, title: '', message: '', type: 'error' });

  // Defense state
  const [defenseText, setDefenseText] = useState('');

  const fetchFellowsAndCriteria = async () => {
    const fRes = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/3/fellows`);
    const fData = await fRes.json();
    setFellows(fData);

    const cRes = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/3/criteria`);
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
        if (sprint_id === 3) fetchFellowsAndCriteria();
      });
    }

    return () => {
      if (socket) {
        socket.off('sprintAssigned');
      }
    }
  }, [socket]);

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
      await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/sprints/3/fellows/${fellows[currentFellowIndex].attendee_id}/complete`, { method: 'PUT' });
    }

    if (currentFellowIndex < fellows.length - 1) {
      setCurrentFellowIndex(prev => prev + 1);
      
      const resetScores: Record<number, number> = {};
      criteria.forEach((c) => {
        resetScores[c.criterion_id] = 0;
      });
      setScores(resetScores);
    } else {
      setSubmitted(true);
    }
  };

  const handleAssignScenario = async (scenario: string) => {
    const currentFellow = fellows[currentFellowIndex];
    await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/admin/sprints/3/fellows/${currentFellow.attendee_id}/scenario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (socket) {
      socket.emit('sprintAssigned', 3);
    }
    fetchFellowsAndCriteria();
  };

  const handleSubmitDefense = async () => {
    if (!attendee) return;
    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/sprints/3/fellows/${attendee.attendee_id}/defense`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defense_text: defenseText })
      });
      
      if (res.ok) {
        if (socket) {
          socket.emit('defenseSubmitted', { sprint_id: 3, attendee_id: attendee.attendee_id });
        }
        setModalProps({ isOpen: true, title: 'Success', message: 'Defense submitted successfully!', type: 'success' });
        fetchFellowsAndCriteria();
      }
    } catch (err) {
      setModalProps({ isOpen: true, title: 'Error', message: 'Failed to submit defense.', type: 'error' });
    }
  };

  if (fellows.length === 0 || criteria.length === 0) {
    return <div className="animate-fade-in"><p>Loading lab data...</p></div>;
  }

  if (submitted) {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Check color="var(--color-success)" size={64} style={{ marginBottom: '1rem' }} />
        <h2 className="text-gradient">Sprint 3 Complete</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          You have successfully scored all Fellows for the Pricing Lab.
        </p>
        <Link to="/">
          <button className="btn-primary">Return to Dashboard</button>
        </Link>
      </div>
    );
  }

  const currentFellow = fellows[currentFellowIndex];
  const isEIR = attendee?.is_admin;
  const isSelf = attendee?.attendee_id === currentFellow.attendee_id;
  const isCompleted = currentFellow.is_completed;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // Fellow's View
  if (!isEIR) {
    return (
      <div className="animate-fade-in">
        <Modal {...modalProps} onClose={() => setModalProps({ ...modalProps, isOpen: false })} />
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        <div className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="text-gradient">Sprint 3: Pricing Lab</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Current Hot Seat: <strong>{currentFellow.full_name}</strong></p>
          </div>

          {isSelf ? (
            <div style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Shield color="var(--color-danger)" size={32} />
                <h3 style={{ fontSize: '1.5rem' }}>Your Defense</h3>
              </div>
              
              {!currentFellow.scenario ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <AlertTriangle color="var(--color-text-muted)" size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>Waiting for the EIR to assign your pricing dysfunction scenario...</p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <h4 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>Assigned Scenario:</h4>
                    <p style={{ fontSize: '1.1rem' }}>{currentFellow.scenario}</p>
                  </div>
                  
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Enter your defense strategy:</label>
                  <textarea 
                    className="input-field" 
                    rows={6}
                    value={defenseText}
                    onChange={e => setDefenseText(e.target.value)}
                    placeholder="How will you defend your value proposition?..."
                    disabled={isCompleted}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-danger), #b91c1c)', opacity: isCompleted ? 0.5 : 1 }} onClick={handleSubmitDefense} disabled={isCompleted}>
                      {isCompleted ? 'Completed' : 'Submit Defense'}
                    </button>
                  </div>
                  {currentFellow.defense_text && (
                    <p style={{ color: 'var(--color-success)', marginTop: '1rem', textAlign: 'right' }}>Defense saved successfully!</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <AlertTriangle color="var(--color-primary)" size={64} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Watch and Learn</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {currentFellow.full_name} is currently in the hot seat.<br/>
                They are defending their pricing and handling rapid-fire objections from the EIR.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // EIR View
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <Modal {...modalProps} onClose={() => setModalProps({ ...modalProps, isOpen: false })} />
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Main Panel */}
        <div className="glass-panel" style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 className="text-gradient">Fellow {currentFellowIndex + 1} of {fellows.length}</h2>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{currentFellow.full_name}</h3>
              <p style={{ color: 'var(--color-danger)', marginTop: '0.5rem', fontWeight: 'bold' }}>EIR CONTROL PANEL</p>
            </div>
          </div>

          <div className="animate-fade-in" style={{ opacity: isCompleted ? 0.6 : 1, pointerEvents: isCompleted ? 'none' : 'auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>1. Assign Scenario</h4>
                <select 
                  className="input-field" 
                  value={currentFellow.scenario || ''} 
                  onChange={(e) => handleAssignScenario(e.target.value)}
                >
                  <option value="" disabled>Select a Pricing Dysfunction...</option>
                  {SCENARIOS.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>2. Fellow's Defense</h4>
                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', minHeight: '100px', border: '1px solid var(--color-border)' }}>
                  {currentFellow.defense_text ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{currentFellow.defense_text}</p>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)' }}><em>Waiting for fellow to submit their defense...</em></p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>3. Score Rubric (Select all that apply)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {criteria.map((criterion) => (
                    <label key={criterion.criterion_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px', border: scores[criterion.criterion_id] ? '1px solid var(--color-danger)' : '1px solid transparent', transition: 'all 0.2s' }}>
                      <input 
                        type="checkbox" 
                        checked={scores[criterion.criterion_id] >= 1}
                        onChange={() => toggleCriterion(criterion.criterion_id)}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-danger)' }}
                      />
                      <span style={{ fontSize: '1.1rem' }}>{criterion.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          {isCompleted && (
            <div style={{ textAlign: 'center', color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '1rem' }}>
              This fellow's defense has been scored and is locked.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Total Score: <span style={{ color: 'var(--color-danger)' }}>{totalScore}</span>
            </span>
            {!isCompleted && (
              <button onClick={handleNextFellow} className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-danger), #b91c1c)' }}>
                {currentFellowIndex < fellows.length - 1 ? 'Submit & Next Fellow' : 'Submit & Finish Sprint'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem' }}>Rotation List</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {fellows.map((f, i) => (
              <li key={f.attendee_id} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: i === currentFellowIndex ? 'var(--color-danger)' : i < currentFellowIndex ? 'var(--color-text-muted)' : 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

export default Sprint3;
