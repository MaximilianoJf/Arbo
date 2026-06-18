import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import { I18nProvider } from "@react-aria/i18n";

// Apply the saved theme before first paint, so routes without the ThemeSwitcher
// (login/register) don't render with the light theme (invisible text on dark bg).
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider locale="en-US">
      <main className='bg-background'>
        <RouterProvider router={router} />
      </main>
    </I18nProvider>
  </StrictMode>,
)
