import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'error' | 'success';
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose, type = 'info' }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-fade-in" style={{ background: '#1a1a24', padding: '2rem', borderRadius: '12px', border: `2px solid ${type === 'error' ? 'var(--color-danger)' : type === 'success' ? 'var(--color-success)' : 'var(--color-primary)'}`, maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h3 style={{ marginBottom: '1rem', color: type === 'error' ? 'var(--color-danger)' : type === 'success' ? 'var(--color-success)' : 'var(--color-text-main)' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>{message}</p>
        <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>OK</button>
      </div>
    </div>
  );
};

export default Modal;
