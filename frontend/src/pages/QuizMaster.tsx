import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Gamepad2 } from 'lucide-react';

interface PollQuestion {
  question_id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

const QuizMaster: React.FC = () => {
  const { attendee, socket } = useAppContext();
  const [questions, setQuestions] = useState<PollQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [quizState, setQuizState] = useState<'LOBBY' | 'ACTIVE_QUESTION' | 'ANSWER_REVEAL' | 'FINISHED'>('LOBBY');
  
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch('/api/poll-questions');
      const data = await res.json();
      setQuestions(data);
    };
    fetchQuestions();

    if (socket) {
      socket.on('quizSync', (state) => {
        setQuizState(state.state);
      });
    }

    return () => {
      if (socket) socket.off('quizSync');
    };
  }, [socket]);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && quizState === 'ACTIVE_QUESTION') {
      handleRevealAnswer();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, quizState]);

  const handleHostQuiz = () => {
    if (!socket) return;
    socket.emit('hostQuiz');
    setCurrentQuestionIndex(-1);
    setQuizState('LOBBY');
  };

  const handleNextQuestion = () => {
    if (!socket) return;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      socket.emit('endQuiz');
      setQuizState('FINISHED');
      return;
    }
    
    setCurrentQuestionIndex(nextIndex);
    const q = questions[nextIndex];
    socket.emit('showQuizQuestion', { question_id: q.question_id, duration: 15 });
    setQuizState('ACTIVE_QUESTION');
    setTimer(15);
  };

  const handleRevealAnswer = () => {
    if (!socket) return;
    socket.emit('revealQuizAnswer');
    setQuizState('ANSWER_REVEAL');
    setTimer(0);
  };

  const handleEndQuiz = () => {
    if (!socket) return;
    socket.emit('endQuiz');
    setQuizState('FINISHED');
  };

  if (!attendee?.is_admin) {
    return <div className="animate-fade-in">Access Denied</div>;
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="animate-fade-in">
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <Gamepad2 color="var(--color-danger)" size={64} style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
        <h2 className="text-gradient" style={{ marginBottom: '2rem' }}>Association! Quiz Master</h2>

        {quizState === 'LOBBY' && (
          <div>
            <h3 style={{ marginBottom: '2rem' }}>Lobby is Open</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Fellows have been notified. Waiting for everyone to join...</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleHostQuiz}>Broadcast "Join Now" again</button>
              <button className="btn-primary" style={{ background: 'var(--color-success)' }} onClick={handleNextQuestion}>Start First Question</button>
            </div>
          </div>
        )}

        {quizState === 'ACTIVE_QUESTION' && currentQ && (
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Q{currentQuestionIndex + 1}: {currentQ.text}</h3>
            
            <div style={{ fontSize: '6rem', fontWeight: 'bold', color: timer <= 5 ? 'var(--color-danger)' : 'var(--color-text-main)', marginBottom: '2rem' }}>
              {timer}
            </div>

            <button className="btn-primary" style={{ background: 'var(--color-danger)' }} onClick={handleRevealAnswer}>
              Force Reveal Answer Now
            </button>
          </div>
        )}

        {quizState === 'ANSWER_REVEAL' && currentQ && (
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Q{currentQuestionIndex + 1}: {currentQ.text}</h3>
            <h4 style={{ color: 'var(--color-success)', marginBottom: '2rem', fontSize: '2rem' }}>Answer Revealed!</h4>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" style={{ background: 'var(--color-success)' }} onClick={handleNextQuestion}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'End Quiz & Show Podium'}
              </button>
            </div>
          </div>
        )}

        {quizState === 'FINISHED' && (
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Quiz Finished!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>The final scores have been added to the global leaderboard.</p>
            <Link to="/leaderboard">
              <button className="btn-primary">View Leaderboard</button>
            </Link>
          </div>
        )}

        {quizState !== 'FINISHED' && quizState !== 'LOBBY' && (
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
            <button className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleEndQuiz}>
              Emergency Stop Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export defau