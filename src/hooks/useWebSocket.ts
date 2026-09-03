import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || token.trim() === '') return;

    let isMounted = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws/notifications/?token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        // Connected
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
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
          // Gracefully ignore parse error
        }
      };

      socket.onerror = () => {
        // Silent error handle to avoid noisy console interruptions during page reload
      };

      socket.onclose = () => {
        // Socket closed cleanly
      };
    } catch (e) {
      // WebSocket creation error handled
    }

    return () => {
      isMounted = false;
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        ws.current.close(1000, 'Page unmounted');
      }
      ws.current = null;
    };
  }, []);
}
