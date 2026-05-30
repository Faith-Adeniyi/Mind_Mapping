import { useState } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'register'

type AuthError = {
  message: string
}

export function AuthGate() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsLoading(true)

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (signUpError) throw signUpError
        setNotice('Check your email for a confirmation link.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        // onAuthStateChange in App.tsx will handle the session update
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        {/* <div className="auth-card__brand">
          <p className="auth-card__logo">ClockRay</p>
          <p className="auth-card__tagline">Memory Mapping for Speakers</p>
        </div> */}

        <img
          // src="/brand/icon+wordmark_logo_blue.png"
          src="/brand/icon+wordmark_logo_white.png"
          alt=""
          className="flex items-center justify-center"
          // width={32}
          // height={20}
          loading="eager"
          decoding="async"
          aria-hidden="true"
        />

        <div className="auth-card__tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setNotice(null) }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => { setMode('register'); setError(null); setNotice(null) }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-card__form" onSubmit={(e) => { void handleSubmit(e) }}>
          <div className="field">
            <label className="field__label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="field__control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="auth-password">Password</label>
            <div className="field__password-wrap">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="field__control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                disabled={isLoading}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="field__password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <Icon icon={showPassword ? 'tabler:eye-off' : 'tabler:eye'} width={18} height={18} />
              </button>
            </div>
          </div>

          {error ? <p className="auth-card__error">{error}</p> : null}
          {notice ? <p className="auth-card__notice">{notice}</p> : null}

          <button
            type="submit"
            className="primary-button auth-card__submit"
            disabled={isLoading || !email || !password}
          >
            {isLoading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
