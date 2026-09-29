import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './LoginPage';
import StudentPortal from './StudentPortal';
import type { User } from '../types';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('portal_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#04130d',
            color: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid rgba(250, 204, 21, 0.25)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            fontSize: '13.5px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      {user
        ? <StudentPortal onLogout={() => { localStorage.clear(); setUser(null); queryClient.clear(); }} user={user} />
        : <LoginPage onSuccess={u => { localStorage.setItem('portal_user', JSON.stringify(u)); setUser(u); }} />
      }
    </QueryClientProvider>
  );
}

