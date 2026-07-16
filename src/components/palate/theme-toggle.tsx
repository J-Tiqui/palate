'use client'

import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('palate-theme', nextTheme)
  }

  return (
    <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle colour theme">
      <Moon className="theme-icon-moon" aria-hidden="true" />
      <Sun className="theme-icon-sun" aria-hidden="true" />
    </button>
  )
}
