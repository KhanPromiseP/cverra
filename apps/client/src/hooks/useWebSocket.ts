
import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@/client/services/user';

interface WebSocketMessage {
  type: string;
  data: any;
}


// simple not using webhook 
export const useWebSocket = () => {
  return {
    isConnected: false,
    send: () => {},
    on: () => () => {}, 
    off: () => {},
    connect: () => {},
    disconnect: () => {}
  };
};

export default useWebSocket;



// export const useWebSocket = () => {
//   const { user } = useUser();
//   const [isConnected, setIsConnected] = useState(false);
//   const wsRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

//   const connect = useCallback(() => {
//     // Don't connect if already connected or connecting
//     if (wsRef.current?.readyState === WebSocket.OPEN || 
//         wsRef.current?.readyState === WebSocket.CONNECTING) {
//       return;
//     }

//     // Don't connect if no user
//     if (!user?.id) {
//       return;
//     }

//     try {
//       // Use wss:// for production, ws:// for development
//       const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//       const wsUrl = `${protocol}//${window.location.host}/ws`;
      
//       console.log('Attempting WebSocket connection to:', wsUrl);
//       const ws = new WebSocket(wsUrl);
      
//       ws.onopen = () => {
//         console.log('WebSocket connected');
//         setIsConnected(true);
        
//         // Clear any reconnect timeout
//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//           reconnectTimeoutRef.current = null;
//         }
        
//         // Send authentication
//         const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//         if (user?.id && token) {
//           ws.send(JSON.stringify({
//             type: 'auth',
//             userId: user.id,
//             token: token
//           }));
//         }
//       };

//       ws.onclose = (event) => {
//         console.log('WebSocket disconnected:', event.code, event.reason);
//         setIsConnected(false);
//         wsRef.current = null;
        
//         // Only attempt to reconnect if it wasn't a normal closure
//         if (event.code !== 1000 && user?.id) {
//           // Exponential backoff for reconnection
//           const delay = 3000; // Start with 3 seconds
//           console.log(`Attempting reconnect in ${delay}ms`);
          
//           reconnectTimeoutRef.current = setTimeout(() => {
//             connect();
//           }, delay);
//         }
//       };

//       ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setIsConnected(false);
//       };

//       ws.onmessage = (event) => {
//         try {
//           const message = JSON.parse(event.data);
//           const handlers = messageHandlersRef.current.get(message.type);
          
//           if (handlers) {
//             handlers.forEach(handler => {
//               try {
//                 handler(message.data);
//               } catch (error) {
//                 console.error('Error in WebSocket message handler:', error);
//               }
//             });
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };

//       wsRef.current = ws;
//     } catch (error) {
//       console.error('Failed to create WebSocket:', error);
//       setIsConnected(false);
      
//       // Try to reconnect after error
//       if (user?.id) {
//         reconnectTimeoutRef.current = setTimeout(() => {
//           connect();
//         }, 5000);
//       }
//     }
//   }, [user?.id]);

//   const disconnect = useCallback(() => {
//     // Clear reconnect timeout
//     if (reconnectTimeoutRef.current) {
//       clearTimeout(reconnectTimeoutRef.current);
//       reconnectTimeoutRef.current = null;
//     }
    
//     if (wsRef.current) {
//       // Only close if connection is open or connecting
//       if (wsRef.current.readyState === WebSocket.OPEN || 
//           wsRef.current.readyState === WebSocket.CONNECTING) {
//         wsRef.current.close(1000, 'Normal closure');
//       }
//       wsRef.current = null;
//     }
//     setIsConnected(false);
//   }, []);

//   const send = useCallback((message: WebSocketMessage) => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify(message));
//       return true;
//     }
//     console.warn('WebSocket not connected, cannot send message');
//     return false;
//   }, []);

//   const on = useCallback((eventType: string, callback: (data: any) => void) => {
//     if (!messageHandlersRef.current.has(eventType)) {
//       messageHandlersRef.current.set(eventType, new Set());
//     }
//     messageHandlersRef.current.get(eventType)!.add(callback);

//     // Return cleanup function
//     return () => {
//       const handlers = messageHandlersRef.current.get(eventType);
//       if (handlers) {
//         handlers.delete(callback);
//         if (handlers.size === 0) {
//           messageHandlersRef.current.delete(eventType);
//         }
//       }
//     };
//   }, []);

//   const off = useCallback((eventType: string, callback: (data: any) => void) => {
//     const handlers = messageHandlersRef.current.get(eventType);
//     if (handlers) {
//       handlers.delete(callback);
//       if (handlers.size === 0) {
//         messageHandlersRef.current.delete(eventType);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (user?.id) {
//       connect();
//     } else {
//       disconnect();
//     }

//     return () => {
//       disconnect();
//     };
//   }, [user?.id, connect, disconnect]);

//   return {
//     isConnected,
//     send,
//     on,
//     off,
//     connect,
//     disconnect
//   };
// };

// Export default
// export default useWebSocket;