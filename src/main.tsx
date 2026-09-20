import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './features/App';
import './styles/index.css';

// Unregister any stale service workers from previous apps running on localhost:3000
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
