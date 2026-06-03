import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Gamepad2, CheckCircle, XCircle } from 'lucide-react';

interface PollQuestion {
  question_id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

const Quiz: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [questions, setQuestions] = useState<PollQuestion[]>([]);
  const [quizState, setQuizState] = useState<{
    active: boolean;
    state: 'LOBBY' | 'ACTIVE_QUESTION' | 'ANSWER_REVEAL' | 'FINISHED';
    active_question_id: number | null;
    duration: number;
    start_time: number | null;
  }>({
    active: false,
    state: 'LOBBY',
    active_question_id: null,
    duration: 0,
    start_time: null
  });

  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/poll-questions`);
      const data = await res.json();
      setQuestions(data);
    };
    fetchQuestions();

    if (socket) {
      socket.on('quizSync', (state) => {
        setQuizState(state);
        if (state.state === 'ACTIVE_QUESTION') {
          // Calculate remaining time
          const elapsed = Math.floor((Date.now() - state.start_time) / 1000);
          const remaining = Math.max(0, state.duration - elapsed);
          setTimer(remaining);
          setHasAnswered(false);
          setLastScore(null);
          setIsCorrect(null);
        }
      });
    }

    return () => {
      if (socket) socket.off('quizSync');
    };
  }, [socket]);

  useEffect(() => {
    if (timer > 0 && quizState.state === 'ACTIVE_QUESTION') {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, quizState.state]);

  const handleSelectOption = async (option: string) => {
    if (!attendee || hasAnswered || !quizState.active_question_id) return;
    
    setHasAnswered(true);
    const timeTakenMs = Date.now() - (quizState.start_time || Date.now());

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/poll-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_id: attendee.attendee_id,
          question_id: quizState.active_question_id,
          chosen_option: option,
          time_taken_ms: timeTakenMs
        })
      });
      const data = await res.json();
      setLastScore(data.points);
      setIsCorrect(data.is_correct);
      setTotalScore(prev => prev + data.points);
    } catch (err) {
      console.error(err);
    }
  };

  if (!quizState.active && quizState.state === 'LOBBY') {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Gamepad2 color="var(--color-text-muted)" size={64} style={{ marginBottom: '1rem' }} />
        <h2>Waiting for Quiz to start...</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>The EIR hasn't hosted a game yet.</p>
      </div>
    );
  }

  if (quizState.state === 'LOBBY') {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <h2 className="text-gradient" style={{ fontSize: '3rem', animation: 'pulse 2s infinite' }}>You're In!</h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>See your nickname on screen. Waiting for EIR to start...</p>
      </div>
    );
  }

  if (quizState.state === 'FINISHED') {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <h2 className="text-gradient" style={{ fontSize: '3rem' }}>Quiz Finished!</h2>
        <h3 style={{ fontSize: '2rem', marginTop: '1rem' }}>You earned: {totalScore} points</h3>
        <Link to="/leaderboard" style={{ marginTop: '2rem' }}>
          <button className="btn-primary">View Final Leaderboard</button>
        </Link>
      </div>
    );
  }

  const currentQ = questions.find(q => q.question_id === quizState.active_question_id);

  if (quizState.state === 'ANSWER_REVEAL') {
    const isWin = isCorrect === true;
    const isLoss = isCorrect === false;

    return (
      <div 
        className="animate-fade-in flex-center" 
        style={{ 
          minHeight: '80vh', 
          flexDirection: 'column', 
          background: isWin ? 'var(--color-success)' : isLoss ? 'var(--color-danger)' : 'var(--color-surface)',
          borderRadius: '24px',
          margin: '2rem'
        }}
      >
        {isWin ? <CheckCircle color="#fff" size={80} style={{ marginBottom: '1rem' }} /> : 
         isLoss ? <XCircle color="#fff" size={80} style={{ marginBottom: '1rem' }} /> : null}
         
        <h2 style={{ fontSize: '4rem', color: '#fff', marginBottom: '1rem' }}>
          {isWin ? 'Correct!' : isLoss ? 'Incorrect!' : 'Time Up!'}
        </h2>

        {isWin && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 3rem', borderRadius: '50px' }}>
            <span style={{ fontSize: '2rem', color: '#fff', fontWeight: 'bold' }}>+{lastScore} pts</span>
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', marginTop: '2rem' }}>Waiting for next question...</p>
      </div>
    );
  }

  if (hasAnswered) {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '80vh', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '3rem' }}>Answer Sent!</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem', marginTop: '1rem' }}>Waiting for others...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>{currentQ?.text}</h3>
        <div style={{ background: 'var(--color-surface)', padding: '1rem 2rem', borderRadius: '50px', fontSize: '2rem', fontWeight: 'bold', color: timer <= 5 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
          {timer}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '60vh' }}>
        {/* Kahoot styled buttons */}
        <button 
          onClick={() => handleSelectOption('A')}
          style={{ background: '#e21b3c', border: 'none', borderRadius: '12px', color: 'white', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 8px 0 #b31631' }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(8px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.8 }}>▲</div>
          {currentQ?.option_a}
        </button>

        <button 
          onClick={() => handleSelectOption('B')}
          style={{ background: '#1368ce', border: 'none', borderRadius: '12px', color: 'white', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 8px 0 #0f52a3' }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(8px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.8 }}>◆</div>
          {currentQ?.option_b}
        </button>

        <button 
          onClick={() => handleSelectOption('C')}
          style={{ background: '#d89e00', border: 'none', borderRadius: '12px', color: 'white', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 8px 0 #ab7d00' }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(8px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.8 }}>●</div>
          {currentQ?.option_c}
        </button>

        <button 
          onClick={() => handleSelectOption('D')}
          style={{ background: '#26890c', border: 'none', borderRadius: '12px', color: 'white', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 8px 0 #1e6d0a' }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(8px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.8 }}>■</div>
          {currentQ?.option_d}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
