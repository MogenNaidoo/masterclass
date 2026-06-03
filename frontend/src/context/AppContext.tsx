import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Attendee {
  attendee_id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
}

interface AppContextType {
  attendee: Attendee | null;
  setAttendee: (attendee: Attendee | null) => void;
  socket: Socket | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Check local storage for existing session
    const stored = localStorage.getItem('antigravity_attendee');
    if (stored) {
      setAttendee(JSON.parse(stored));
    }

    // Connect to backend
    const newSocket = io(import.meta.env.VITE_API_URL || '/', { path: '/masterclass/socket.io' });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleSetAttendee = (newAttendee: Attendee | null) => {
    setAttendee(newAttendee);
    if (newAttendee) {
      localStorage.setItem('antigravity_attendee', JSON.stringify(newAttendee));
    } else {
      localStorage.removeItem('antigravity_attendee');
    }
  };

  return (
    <AppContext.Provider value={{ attendee, setAttendee: handleSetAttendee, socket }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
