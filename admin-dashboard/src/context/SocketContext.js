import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4545', {
      path: '/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('join-admin');
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 