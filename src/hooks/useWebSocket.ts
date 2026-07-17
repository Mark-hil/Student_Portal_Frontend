import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket using the token in query param
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification' && data.message) {
          const { title, body, notif_type } = data.message;
          
          if (notif_type === 'grade_posted') {
            toast.success(`${title}\n${body}`, {
              duration: 6000,
              icon: '🎉',
              style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
          } else {
            toast(`${title}\n${body}`, { duration: 4000 });
          }
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);
}
