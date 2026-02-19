import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import { I18nProvider } from "@react-aria/i18n";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider locale="en-US">
      <main className='bg-background'>
        <RouterProvider router={router} />
      </main>
    </I18nProvider>
  </StrictMode>,
)
