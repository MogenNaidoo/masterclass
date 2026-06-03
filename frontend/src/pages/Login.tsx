import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Rocket } from 'lucide-react';
import Modal from '../components/Modal';

const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAttendee } = useAppContext();
  const [modalProps, setModalProps] = useState<{isOpen: boolean, title: string, message: string, type: 'error' | 'success'}>({ isOpen: false, title: '', message: '', type: 'error' });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || ''}/masterclass/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAttendee(data);
        navigate('/');
      } else {
        setModalProps({ isOpen: true, title: 'Login Failed', message: data.error, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setModalProps({ isOpen: true, title: 'Connection Error', message: 'Failed to connect to server', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <Modal {...modalProps} onClose={() => setModalProps({ ...modalProps, isOpen: false })} />
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex-center" style={{ marginBottom: '1.5rem', flexDirection: 'column' }}>
          <div style={{ background: 'var(--color-primary-glow)', padding: '16px', borderRadius: '50%', marginBottom: '1rem' }}>
            <Rocket size={48} color="var(--color-primary)" />
          </div>
          <h1 className="text-gradient">Sales Challenge</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Masterclass with EIR Mogen</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="e.g. john@example.com"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Entering Orbit...' : 'Enter Masterclass'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
