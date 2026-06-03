import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardData {
  fellows: any[];
  attendees: any[];
  scores: any[];
  pollResponses: any[];
}

const Leaderboard: React.FC = () => {
  const { socket } = useAppContext();
  const [data, setData] = useState<LeaderboardData | null>(null);

  const fetchLeaderboard = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/masterclass/api/leaderboard`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchLeaderboard();

    if (socket) {
      socket.on('scoreUpdated', fetchLeaderboard);
    }

    return () => {
      if (socket) {
        socket.off('scoreUpdated', fetchLeaderboard);
      }
    };
  }, [socket]);

  if (!data) {
    return <div className="animate-fade-in"><p>Loading Leaderboard...</p></div>;
  }

  // Aggregate Fellow Scores (scores received as target)
  const fellowScores = data.attendees.map(a => {
    const receivedScores = data.scores.filter(s => s.target_attendee_id === a.attendee_id);
    const total = receivedScores.reduce((sum, s) => sum + s.points, 0);
    return { ...a, total };
  }).filter(a => !a.is_admin && a.total > 0).sort((a, b) => b.total - a.total);

  // Aggregate Attendee Scores (Polls)
  const attendeeScores = data.attendees.map(a => {
    const aResponses = data.pollResponses.filter(pr => pr.attendee_id === a.attendee_id);
    const total = aResponses.reduce((sum, pr) => sum + pr.points, 0);
    return { ...a, total };
  }).filter(a => !a.is_admin && a.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="animate-fade-in">
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Fellows Leaderboard */}
        <div className="glass-panel" style={{ flex: '1 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Trophy color="var(--color-primary)" size={32} />
            <h2 className="text-gradient">Fellows Ranking</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fellowScores.map((fellow, index) => (
              <div key={fellow.fellow_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', borderLeft: index === 0 ? '4px solid var(--color-primary)' : '4px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: index === 0 ? 'var(--color-primary)' : index === 1 ? 'var(--color-secondary)' : index === 2 ? '#fbbf24' : 'var(--color-text-muted)' }}>
                    #{index + 1}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '1.1rem' }}>{fellow.full_name}</h4>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{fellow.company}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{fellow.total}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendees Leaderboard */}
        <div className="glass-panel" style={{ flex: '1 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Medal color="var(--color-secondary)" size={32} />
            <h2 className="text-gradient" style={{ background: 'linear-gradient(135deg, var(--color-secondary), #fbbf24)', WebkitBackgroundClip: 'text' }}>Attendee Knowledge Check</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attendeeScores.length > 0 ? attendeeScores.map((attendee, index) => (
              <div key={attendee.attendee_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                    #{index + 1}
                  </span>
                  <h4 style={{ fontSize: '1.1rem' }}>{attendee.full_name}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{attendee.total}</span>
                  <Star color="var(--color-secondary)" size={16} />
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No poll responses yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
