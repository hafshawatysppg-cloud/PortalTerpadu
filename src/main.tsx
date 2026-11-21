import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installSafeJsonResponseGuard } from './lib/safeJson';
import { testFirestoreConnection } from './lib/firestoreHelper';
import { initOperationalFirestoreStore } from './lib/firestoreOperationalStore';

installSafeJsonResponseGuard();
initOperationalFirestoreStore();
void testFirestoreConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
