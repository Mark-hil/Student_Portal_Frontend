import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      {user
        ? <StudentPortal onLogout={() => { localStorage.clear(); setUser(null); queryClient.clear(); }} user={user} />
        : <LoginPage onSuccess={u => { localStorage.setItem('portal_user', JSON.stringify(u)); setUser(u); }} />
      }
    </QueryClientProvider>
  );
}
