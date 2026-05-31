import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'register'

type AuthError = {
  message: string
}

const SAMPLE_ANCHORS = [
  { kw: 'Hook', icon: 'tabler:bolt' },
  { kw: 'Shift', icon: 'tabler:trending-up' },
  { kw: 'Proof', icon: 'tabler:chart-bar' },
  { kw: 'Story', icon: 'tabler:users' },
  { kw: 'Trust', icon: 'tabler:shield-check' },
  { kw: 'Ask', icon: 'tabler:flag' },
]

function AuthClock({ activeIdx }: { activeIdx: number }) {
  const radius = 38
  const handAngle = (activeIdx / SAMPLE_ANCHORS.length) * 360 - 90
  return (
    <div className="relative aspect-square w-[min(62%,360px)] max-h-full">
      <div className="absolute inset-0 rounded-full border border-white/15" />
      <div className="absolute inset-[7%] rounded-full border border-dashed border-white/20" />

      {/* hub */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full text-white text-center shadow-2xl"
        style={{ width: '22%', aspectRatio: '1', background: '#2e3192' }}
      >
        <div>
          <span className="block font-[DM_Mono] text-[0.5rem] uppercase tracking-[0.2em] opacity-70">Topic</span>
          <strong className="block font-[Bricolage_Grotesque] text-sm font-bold leading-tight">Future of Work</strong>
        </div>
      </div>

      {/* hands */}
      <span
        className="absolute left-1/2 top-1/2 origin-left rounded-full transition-transform duration-700"
        style={{
          width: '32%',
          height: '2px',
          background: 'var(--accent)',
          transform: `translateY(-50%) rotate(${handAngle}deg)`,
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 origin-left rounded-full transition-transform duration-700"
        style={{
          width: '22%',
          height: '3px',
          background: 'rgba(255,255,255,0.7)',
          transform: `translateY(-50%) rotate(${handAngle + 14}deg)`,
        }}
      />

      {/* nodes */}
      {SAMPLE_ANCHORS.map((anchor, i) => {
        const aTop = (i / SAMPLE_ANCHORS.length) * Math.PI * 2
        const xPct = 50 + Math.sin(aTop) * radius
        const yPct = 50 - Math.cos(aTop) * radius
        const isActive = i === activeIdx
        return (
          <div
            key={anchor.kw}
            className={`absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center gap-0.5 rounded-full border text-center transition-all duration-300 ${
              isActive
                ? 'scale-110 border-transparent'
                : 'border-white/25 bg-white text-[#1c1d2b]'
            }`}
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: '17%',
              height: '17%',
              background: isActive ? 'var(--accent)' : '#ffffff',
              color: isActive ? 'var(--accent-ink)' : '#1c1d2b',
              boxShadow: isActive ? '0 14px 28px -10px rgba(142,124,246,0.55)' : '0 8px 16px -10px rgba(0,0,0,0.4)',
            }}
          >
            <Icon icon={anchor.icon} width={16} height={16} />
            <span className="text-[0.6rem] font-bold leading-none">{anchor.kw}</span>
          </div>
        )
      })}
    </div>
  )
}

export function AuthGate() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % SAMPLE_ANCHORS.length)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  const reset = () => {
    setError(null)
    setNotice(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    reset()
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
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">
        <span className="auth__rings" aria-hidden="true">
          <span style={{ width: '52%', height: '52%' }} />
          <span style={{ width: '74%', height: '74%' }} />
          <span style={{ width: '98%', height: '98%' }} />
        </span>

        <div className="auth__brand-top">
          <img src="/brand/icon+wordmark_logo_white.png" alt="Allison's Memory ClockRay" />
        </div>

        <div className="auth__brand-clock">
          <AuthClock activeIdx={activeIdx} />
        </div>

        <div className="auth__brand-copy">
          <p className="k">Visual memory for spoken words</p>
          <h2>Turn any talk into a memory you can see.</h2>
          <span>Paste a speech, lecture, or notes — and walk in with the whole thing mapped around the clock.</span>
        </div>
      </div>

      <div className="auth__form-wrap">
        <div className="auth__card">
          <div className="auth__card-head">
            <p className="k">{mode === 'login' ? 'Welcome back' : 'Get started'}</p>
            <h1>{mode === 'login' ? 'Sign in to ClockRay' : 'Create your account'}</h1>
          </div>

          <div className="auth__tabs" role="tablist">
            <button
              type="button"
              className={`auth__tab ${mode === 'login' ? 'on' : ''}`}
              onClick={() => { setMode('login'); reset() }}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth__tab ${mode === 'register' ? 'on' : ''}`}
              onClick={() => { setMode('register'); reset() }}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Create account
            </button>
          </div>

          <form className="auth__form" onSubmit={(e) => { void handleSubmit(e) }}>
            <div className="fld">
              <label className="fld__lab" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="fld">
              <label className="fld__lab" htmlFor="auth-password">Password</label>
              <div className="auth__pw">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth__pw-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon icon={showPassword ? 'tabler:eye-off' : 'tabler:eye'} width={18} height={18} />
                </button>
              </div>
            </div>

            <div className="auth__row">
              <label className="auth__check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              {mode === 'login' ? (
                <button
                  type="button"
                  className="auth__link"
                  onClick={() => setNotice('Password reset link sent (demo).')}
                >
                  Forgot password?
                </button>
              ) : null}
            </div>

            {error ? <p className="auth__msg auth__msg--err">{error}</p> : null}
            {notice ? <p className="auth__msg auth__msg--ok">{notice}</p> : null}

            <button
              type="submit"
              className="btn btn--brand auth__submit"
              disabled={isLoading || !email || !password}
            >
              {isLoading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {mode === 'register' ? (
              <p className="auth__terms">
                By creating an account you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  )
}
