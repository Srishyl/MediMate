import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserProvider } from './context/UserContext';
import { PillProvider } from './context/PillContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <PillProvider>
        <App />
      </PillProvider>
    </UserProvider>
  </StrictMode>
);