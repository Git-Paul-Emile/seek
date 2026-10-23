import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "@/services/socketService";

interface SocketContextValue {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = socketService.onConnected((connected) => {
      setIsConnected(connected);
      if (connected) queryClient.invalidateQueries();
    });
    socketService.connect();
    setIsConnected(socketService.isConnected());
    return unsub;
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketConnected(): boolean {
  return useContext(SocketContext).isConnected;
}
