import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router';
import { RouterProvider } from 'react-router-dom';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className='bg-background'>
      <RouterProvider router={router} />
    </main>
  </StrictMode>,
)
