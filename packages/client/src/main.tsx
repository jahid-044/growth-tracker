import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { bootstrap } from '@/lib/authActions';
import i18n from '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';

// Restore the session before the first render (persisted access token first,
// httpOnly refresh cookie as fallback). Route guards show a loading state until
// it settles. Kicked off here rather than in an effect so it fires exactly once
// and stays out of the component tree — and out of tests, which never import
// this module and seed `useAuthStore` directly instead.
void bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
