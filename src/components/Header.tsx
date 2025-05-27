'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { AuthModal } from './AuthModal'
import { useState } from 'react'

export function Header() {
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo">
            <div className="flag"></div>
            Only in Ellada
          </Link>
          <div className="nav-links">
            <Link href="#" className="nav-link">📝 Feedback</Link>
            <Link href="#" className="nav-link">🗺️ Roadmap</Link>
            <Link href="#" className="nav-link">❓ Help Center</Link>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user.user_metadata?.name || user.email}
              </span>
              <button 
                onClick={signOut}
                className="auth-button"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="auth-button"
            >
              Sign in / Sign up
            </button>
          )}
        </div>
      </header>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
} 