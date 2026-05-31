import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LandingClock } from './LandingClock'
import {
  LandingIcon,
  SAMPLE_SEGMENTS,
  type LandingIconName,
} from './landingIcons'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What exactly does Clockray do with my text?',
    a: 'It reads your text and splits it into a handful of labelled segments — each with a short keyword and an icon. Those become the anchors you memorise. You choose how many: 3, 4, 6, 8, or 12. Nothing is rewritten; the original wording stays attached to every anchor.',
  },
  {
    q: 'Why a clock?',
    a: 'A clock face is a layout your brain already knows by heart. Pinning ideas to clock positions gives each one a fixed, spatial home — so recalling "what came at 3 o\'clock" is far easier than recalling "the fourth bullet point". It\'s a classic memory-palace trick, made visual.',
  },
  {
    q: "Can I change the anchors after they're generated?",
    a: 'Absolutely. Reorder them, rename any keyword, swap the icon, and edit the underlying text. The Clock, Grid, and Linear views all update together so your map stays consistent.',
  },
  {
    q: 'Is it only for speeches?',
    a: 'Not at all. People use it for lectures and exam revision, sermons and toasts, stand-ups, project briefs, and pitch rehearsals — anywhere you need to hold a structure in your head and deliver it out loud.',
  },
  {
    q: 'Can I take my map off-screen?',
    a: 'Yes — export any map to a clean PDF in A4 or A3, with the live visual style and node positions intact. Great for a printed prompt card you can glance at backstage.',
  },
]

const STEPS = [
  {
    num: 'STEP 01',
    icon: 'paste' as LandingIconName,
    title: 'Paste your text',
    body: 'Drop in a full speech, a lecture transcript, or messy project notes. Anything from a paragraph to a few thousand words.',
  },
  {
    num: 'STEP 02',
    icon: 'wand' as LandingIconName,
    title: 'It finds the anchors',
    body: 'Clockray splits your text into 3, 4, 6, 8, or 12 segments — each with a short keyword and a matching icon to hang the memory on.',
  },
  {
    num: 'STEP 03',
    icon: 'layers' as LandingIconName,
    title: 'Explore & rehearse',
    body: 'See it as a Clock, a Grid, or a Linear timeline — all in sync. Reorder, re-label, then rehearse in full-screen Present mode.',
  },
]

const CASES = [
  {
    icon: 'mic' as LandingIconName,
    tag: 'Speakers',
    title: 'Speeches & keynotes',
    body: 'Walk on stage with the whole arc in your head — hook, turns, and close — instead of clutching note cards.',
    list: ['Rehearse in Present mode', 'Never lose your place'],
  },
  {
    icon: 'grad' as LandingIconName,
    tag: 'Students & lecturers',
    title: 'Lectures & revision',
    body: 'Turn a dense lecture into anchored chunks. Revise by the clock and recall the order under exam pressure.',
    list: ['Chunk long material', 'Recall in sequence'],
  },
  {
    icon: 'notes' as LandingIconName,
    tag: 'At work',
    title: 'Notes & reviews',
    body: 'Project notes, stand-ups, and pitch decks become a shared map your team can read in seconds — then export to PDF.',
    list: ['Share a clear structure', 'Export to PDF'],
  },
]

const FEATURES = [
  {
    icon: 'present' as LandingIconName,
    title: 'Present mode',
    body: 'Full-screen rehearsal with a Companion display for your second screen.',
  },
  {
    icon: 'sync' as LandingIconName,
    title: 'Synced views',
    body: 'Select an anchor once — it stays current across Clock, Grid, and Linear.',
  },
  {
    icon: 'sparkle' as LandingIconName,
    title: 'Smart icons',
    body: 'Each anchor gets a fitting icon automatically, or pick your own.',
  },
  {
    icon: 'pdf' as LandingIconName,
    title: 'PDF export',
    body: 'Download your map as a clean A4 or A3 card for printed prompts.',
  },
]

type ViewKey = 'clock' | 'grid' | 'linear'

function ViewTab({
  active,
  icon,
  title,
  body,
  onClick,
}: {
  active: boolean
  icon: LandingIconName
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="text-left rounded-[18px] p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start transition"
      style={{
        background: active ? 'var(--lp-card)' : 'transparent',
        border: `1px solid ${active ? 'var(--lp-cobalt-line)' : 'transparent'}`,
        boxShadow: active
          ? '0 1px 2px rgba(32,34,79,.04), 0 18px 40px -24px rgba(32,34,79,.30)'
          : 'none',
      }}
    >
      <span
        className="row-span-2 w-11 h-11 rounded-xl grid place-items-center"
        style={{
          background: active ? 'var(--lp-cobalt)' : 'var(--lp-cobalt-soft)',
          color: active ? '#fff' : 'var(--lp-cobalt)',
        }}
      >
        <LandingIcon name={icon} style={{ width: 22, height: 22 }} />
      </span>
      <h3
        className="font-bold text-[1.12rem] leading-tight"
        style={{ fontFamily: 'var(--lp-font-display)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p
        className="text-[0.92rem] leading-snug"
        style={{ color: 'var(--lp-ink-soft)' }}
      >
        {body}
      </p>
    </button>
  )
}

function Btn({
  href,
  to,
  variant,
  size = 'md',
  children,
  className = '',
}: {
  href?: string
  to?: string
  variant: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  children: React.ReactNode
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,box-shadow,background,border-color,color] duration-200 hover:-translate-y-0.5'
  const pad =
    size === 'lg' ? 'px-[1.9rem] py-[1.05rem] text-[1.05rem]' : 'px-6 py-[0.85rem] text-[0.96rem]'
  const style: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--lp-cobalt)',
          color: '#fff',
          border: '1px solid transparent',
          boxShadow: '0 14px 28px -14px rgba(46, 49, 146, 0.7)',
        }
      : {
          background: 'transparent',
          color: 'var(--lp-cobalt)',
          border: '1px solid var(--lp-cobalt-line)',
        }
  const cls = `${base} ${pad} ${className}`
  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={cls} style={style}>
      {children}
    </a>
  )
}

export default function Landing() {
  const [view, setView] = useState<ViewKey>('clock')
  const [stuck, setStuck] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const revealRefs = useRef<Set<HTMLElement>>(new Set())

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    revealRefs.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const registerReveal = (el: HTMLElement | null) => {
    if (el) revealRefs.current.add(el)
  }

  const year = new Date().getFullYear()

  return (
    <div className="lp-root" style={{ background: 'var(--lp-paper)', color: 'var(--lp-ink)' }}>
      {/* Scoped tokens + a handful of effects Tailwind can't do inline */}
      <style>{`
        .lp-root {
          --lp-paper:        #f4f1ea;
          --lp-paper-2:      #ece7db;
          --lp-card:         #fbfaf6;

          --lp-cobalt:       #2e3192;
          --lp-cobalt-bright:#474cd6;
          --lp-cobalt-deep:  #20224f;
          --lp-cobalt-soft:  rgba(46, 49, 146, 0.08);
          --lp-cobalt-line:  rgba(46, 49, 146, 0.14);

          --lp-amber:        #e8a23c;
          --lp-amber-deep:   #c97f17;

          --lp-ink:          #1c1d2b;
          --lp-ink-soft:     #54566c;
          --lp-ink-muted:    #8a8ca2;

          --lp-font-display: 'Bricolage Grotesque', 'Outfit', system-ui, sans-serif;
          --lp-font-ui: 'Outfit', system-ui, -apple-system, sans-serif;
          --lp-font-mono: 'DM Mono', ui-monospace, monospace;

          font-family: var(--lp-font-ui);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .lp-root :where(h1,h2,h3,h4,p) { margin: 0; }
        .lp-root a { color: inherit; text-decoration: none; }

        .lp-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1);
        }
        .lp-reveal.lp-in { opacity: 1; transform: none; }

        .lp-stage-dots::before {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 26px 26px;
          pointer-events: none;
        }

        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .lp-panel-in { animation: lp-fade-up .5s ease; }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 transition-[border-color,background] duration-200"
        style={{
          background: 'color-mix(in srgb, var(--lp-paper) 82%, transparent)',
          backdropFilter: 'saturate(150%) blur(14px)',
          WebkitBackdropFilter: 'saturate(150%) blur(14px)',
          borderBottom: `1px solid ${stuck ? 'var(--lp-cobalt-line)' : 'transparent'}`,
        }}
      >
        <div className="mx-auto flex items-center justify-between h-[76px] w-[min(100%-2.4rem,1180px)]">
          <a href="#top" className="inline-flex items-center gap-2" aria-label="Allison's Memory Clockray home">
            <img
              src="/brand/icon+wordmark_logo_blue.png"
              alt="Allison's Memory Clockray"
              className="h-[30px] w-auto block"
            />
          </a>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {[
              ['How it works', '#how'],
              ['The three views', '#views'],
              ['Use cases', '#cases'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[0.92rem] font-medium transition-colors hover:[color:var(--lp-cobalt)]"
                style={{ color: 'var(--lp-ink-soft)' }}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Btn href="#how" variant="ghost" className="hidden sm:inline-flex">
              See how it works
            </Btn>
            <Btn to="/app" variant="primary">
              Open the app
            </Btn>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ padding: 'clamp(3rem, 7vw, 6rem) 0 clamp(3.5rem, 6vw, 5.5rem)' }}
        >
          <div className="mx-auto grid items-center w-[min(100%-2.4rem,1180px)] gap-[clamp(2rem,5vw,4.5rem)] grid-cols-1 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="order-2 lg:order-1">
              <p
                className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase mb-[1.6rem]"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-cobalt)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-cobalt)', opacity: 0.6 }}
                />
                Visual memory for spoken words
              </p>
              <h1
                className="font-extrabold leading-[1.02]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2.6rem, 5.6vw, 4.5rem)',
                }}
              >
                Turn any talk into a memory you can{' '}
                <em className="not-italic" style={{ color: 'var(--lp-amber-deep)' }}>
                  see
                </em>
                .
              </h1>
              <p
                className="mt-[1.6rem] leading-[1.55] max-w-[33ch]"
                style={{
                  fontSize: 'clamp(1.05rem, 1.5vw, 1.28rem)',
                  color: 'var(--lp-ink-soft)',
                }}
              >
                Paste a speech, a lecture, or a wall of project notes. Memory Clockray breaks it
                into labelled anchors and arranges them around a clock — so the whole thing lives
                in your head, in order, ready to recall.
              </p>
              <div className="mt-[2.2rem] flex items-center gap-[0.9rem] flex-wrap">
                <Btn to="/app" variant="primary" size="lg">
                  Open the app
                </Btn>
                <Btn href="#how" variant="ghost" size="lg">
                  Watch it work
                </Btn>
              </div>
              <p
                className="mt-[1.4rem] flex items-center gap-2 font-mono text-[0.74rem]"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.04em',
                  color: 'var(--lp-ink-muted)',
                }}
              >
                <LandingIcon
                  name="sync"
                  strokeWidth={2.2}
                  style={{ color: 'var(--lp-cobalt)', width: '1.1em', height: '1.1em' }}
                />
                One source text,{' '}
                <b style={{ color: 'var(--lp-cobalt)', fontWeight: 500 }}>three synced views</b>.
                Free to try.
              </p>
            </div>

            <div
              className="relative grid place-items-center order-1 lg:order-2"
              style={{ minHeight: 460 }}
            >
              <div aria-hidden="true" className="absolute inset-0 grid place-items-center pointer-events-none">
                {[96, 118, 142].map((pct) => (
                  <span
                    key={pct}
                    className="absolute rounded-full"
                    style={{
                      width: `${pct}%`,
                      height: `${pct}%`,
                      border: '1px solid var(--lp-cobalt-line)',
                    }}
                  />
                ))}
              </div>
              <LandingClock />
            </div>
          </div>
        </section>

        {/* ── Proof strip ─────────────────────────────── */}
        <div className="pt-[1.4rem] pb-[0.4rem]">
          <div
            className="mx-auto w-[min(100%-2.4rem,1180px)] flex items-center gap-[1.4rem] flex-wrap justify-center font-mono text-[0.74rem]"
            style={{
              fontFamily: 'var(--lp-font-mono)',
              letterSpacing: '0.06em',
              color: 'var(--lp-ink-muted)',
            }}
          >
            <b style={{ color: 'var(--lp-ink-soft)', fontWeight: 500 }}>
              Built for anyone who has to remember what they're going to say
            </b>
            {['Keynotes', 'Lectures', 'Exam revision', 'Stand-ups & reviews', 'Sermons & toasts'].map(
              (label) => (
                <span key={label} className="inline-flex items-center gap-[1.4rem]">
                  <span
                    className="inline-block rounded-full"
                    style={{ width: 4, height: 4, background: 'var(--lp-cobalt-line)' }}
                  />
                  {label}
                </span>
              ),
            )}
          </div>
        </div>

        {/* ── How it works ───────────────────────────── */}
        <section id="how" className="py-[clamp(4rem,8vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal max-w-[640px] mb-[clamp(2.4rem,4vw,3.5rem)]"
            >
              <p
                className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-cobalt)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-cobalt)', opacity: 0.6 }}
                />
                How it works
              </p>
              <h2
                className="mt-[1.1rem] font-extrabold leading-[1.05]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                }}
              >
                From a wall of text to a map in three moves.
              </h2>
              <p
                className="mt-[1.1rem] text-[1.08rem] leading-[1.55]"
                style={{ color: 'var(--lp-ink-soft)' }}
              >
                No outlining, no flashcards, no busywork. Drop your words in and Clockray does the
                structuring — you do the remembering.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <article
                  key={step.num}
                  ref={registerReveal}
                  className="lp-reveal relative rounded-[18px] px-[1.7rem] py-[2rem]"
                  style={{
                    background: 'var(--lp-card)',
                    border: '1px solid var(--lp-cobalt-line)',
                    boxShadow: '0 1px 2px rgba(32,34,79,.04), 0 18px 40px -24px rgba(32,34,79,.30)',
                  }}
                >
                  <p
                    className="font-mono text-[0.78rem]"
                    style={{
                      fontFamily: 'var(--lp-font-mono)',
                      letterSpacing: '0.18em',
                      color: 'var(--lp-amber-deep)',
                    }}
                  >
                    {step.num}
                  </p>
                  <div
                    className="my-[1.2rem] w-[52px] h-[52px] rounded-[14px] grid place-items-center"
                    style={{
                      background: 'var(--lp-cobalt-soft)',
                      color: 'var(--lp-cobalt)',
                    }}
                  >
                    <LandingIcon name={step.icon} style={{ width: 26, height: 26 }} />
                  </div>
                  <h3
                    className="font-bold text-[1.25rem]"
                    style={{ fontFamily: 'var(--lp-font-display)', letterSpacing: '-0.01em' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="mt-[0.6rem] text-[0.98rem] leading-[1.55]"
                    style={{ color: 'var(--lp-ink-soft)' }}
                  >
                    {step.body}
                  </p>
                  {i < STEPS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="hidden md:block absolute"
                      style={{
                        top: '3.15rem',
                        right: '-0.95rem',
                        color: 'var(--lp-cobalt-line)',
                        zIndex: 2,
                      }}
                    >
                      <LandingIcon name="arrowRight" style={{ width: 22, height: 22 }} />
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── The three views ─────────────────────────── */}
        <section
          id="views"
          className="py-[clamp(4rem,8vw,7rem)]"
          style={{ background: 'var(--lp-paper-2)' }}
        >
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal max-w-[640px] mx-auto text-center mb-[clamp(2.4rem,4vw,3.5rem)]"
            >
              <p
                className="inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-amber-deep)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-amber-deep)', opacity: 0.6 }}
                />
                One source, three views
              </p>
              <h2
                className="mt-[1.1rem] font-extrabold leading-[1.05]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                }}
              >
                The same map, however your memory works.
              </h2>
              <p
                className="mt-[1.1rem] text-[1.08rem] leading-[1.55]"
                style={{ color: 'var(--lp-ink-soft)' }}
              >
                Some people remember in circles, some in grids, some as a story start to finish.
                Switch instantly — your anchors stay perfectly in sync.
              </p>
            </div>

            <div
              ref={registerReveal}
              className="lp-reveal grid gap-[clamp(1.6rem,3vw,3rem)] items-center grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]"
            >
              <div role="tablist" aria-label="View modes" className="grid gap-3">
                <ViewTab
                  active={view === 'clock'}
                  icon="clock"
                  title="Clock view"
                  body="Anchors orbit a clock face. The hands point to where you are — spatial recall by the hour."
                  onClick={() => setView('clock')}
                />
                <ViewTab
                  active={view === 'grid'}
                  icon="grid"
                  title="Grid view"
                  body="Every anchor at a glance. Perfect for scanning the whole talk before you walk on stage."
                  onClick={() => setView('grid')}
                />
                <ViewTab
                  active={view === 'linear'}
                  icon="linear"
                  title="Linear view"
                  body="A clean narrative timeline from opening line to closing call — first to last."
                  onClick={() => setView('linear')}
                />
              </div>

              <div
                className="lp-stage-dots relative overflow-hidden rounded-[28px] grid"
                style={{
                  background: 'var(--lp-cobalt-deep)',
                  padding: 'clamp(1.4rem,2.5vw,2.4rem)',
                  minHeight: 420,
                  boxShadow: '0 30px 70px -36px rgba(32,34,79,.45)',
                }}
              >
                {view === 'clock' ? (
                  <div className="lp-panel-in relative z-[1]">
                    <MiniHead kicker="Clock View" meta="6 anchors" />
                    <div className="grid place-items-center" style={{ minHeight: 320 }}>
                      <LandingClock compact autoCycle initialActive={3} />
                    </div>
                  </div>
                ) : null}

                {view === 'grid' ? (
                  <div className="lp-panel-in relative z-[1]">
                    <MiniHead kicker="Grid View" meta="Scan all anchors" />
                    <div className="grid gap-[0.7rem] grid-cols-3">
                      {SAMPLE_SEGMENTS.map((s, i) => (
                        <div
                          key={s.kw}
                          className="rounded-[12px] grid gap-[0.4rem] content-start"
                          style={{
                            background: 'rgba(255,255,255,.045)',
                            border: '1px solid rgba(255,255,255,.09)',
                            padding: '0.9rem 0.8rem',
                            minHeight: 104,
                          }}
                        >
                          <span
                            className="font-mono"
                            style={{
                              fontFamily: 'var(--lp-font-mono)',
                              fontSize: '0.58rem',
                              color: 'rgba(255,255,255,.4)',
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <LandingIcon
                            name={s.icon}
                            style={{ width: 18, height: 18, color: 'var(--lp-amber)' }}
                          />
                          <span
                            className="font-semibold"
                            style={{ color: '#fff', fontSize: '0.82rem' }}
                          >
                            {s.kw}
                          </span>
                          <span
                            style={{
                              color: 'rgba(255,255,255,.5)',
                              fontSize: '0.68rem',
                              lineHeight: 1.35,
                            }}
                          >
                            {s.prev}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {view === 'linear' ? (
                  <div className="lp-panel-in relative z-[1]">
                    <MiniHead kicker="Linear View" meta="Opening → close" />
                    <div className="relative grid gap-[0.85rem] pl-[1.4rem]">
                      <span
                        aria-hidden="true"
                        className="absolute"
                        style={{
                          left: 6,
                          top: 6,
                          bottom: 6,
                          width: 2,
                          background: 'rgba(255,255,255,.14)',
                        }}
                      />
                      {SAMPLE_SEGMENTS.map((s, i) => {
                        const active = i === 3
                        return (
                          <div
                            key={s.kw}
                            className="relative grid grid-cols-[auto_1fr] gap-[0.8rem] items-center"
                          >
                            <span
                              className="absolute rounded-full"
                              style={{
                                left: '-1.4rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 13,
                                height: 13,
                                background: active ? 'var(--lp-amber)' : 'var(--lp-cobalt-deep)',
                                border: `2px solid ${
                                  active ? 'var(--lp-amber)' : 'rgba(255,255,255,.3)'
                                }`,
                              }}
                            />
                            <div
                              className="flex items-center gap-[0.7rem] rounded-[10px]"
                              style={{
                                background: active
                                  ? 'rgba(232,162,60,.1)'
                                  : 'rgba(255,255,255,.045)',
                                border: `1px solid ${
                                  active ? 'var(--lp-amber)' : 'rgba(255,255,255,.09)'
                                }`,
                                padding: '0.7rem 0.9rem',
                                gridColumn: '1 / -1',
                              }}
                            >
                              <LandingIcon
                                name={s.icon}
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: 'var(--lp-amber)',
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <div
                                  className="font-semibold"
                                  style={{ color: '#fff', fontSize: '0.82rem' }}
                                >
                                  {s.kw}
                                </div>
                                <div
                                  style={{
                                    color: 'rgba(255,255,255,.5)',
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  {s.prev}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ── Use cases ───────────────────────────────── */}
        <section id="cases" className="py-[clamp(4rem,8vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal max-w-[640px] mb-[clamp(2.4rem,4vw,3.5rem)]"
            >
              <p
                className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-cobalt)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-cobalt)', opacity: 0.6 }}
                />
                Where it shines
              </p>
              <h2
                className="mt-[1.1rem] font-extrabold leading-[1.05]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                }}
              >
                Made for the moments you can't read off a page.
              </h2>
              <p
                className="mt-[1.1rem] text-[1.08rem] leading-[1.55]"
                style={{ color: 'var(--lp-ink-soft)' }}
              >
                When you have to speak from memory — and look like you mean it — Clockray gives you
                a structure you can actually feel.
              </p>
            </div>

            <div className="grid gap-[1.4rem] grid-cols-1 md:grid-cols-3">
              {CASES.map((c) => (
                <article
                  key={c.title}
                  ref={registerReveal}
                  className="lp-reveal relative grid content-start gap-[0.8rem] rounded-[18px] overflow-hidden"
                  style={{
                    background: 'var(--lp-card)',
                    border: '1px solid var(--lp-cobalt-line)',
                    padding: '1.9rem 1.7rem',
                    boxShadow: '0 1px 2px rgba(32,34,79,.04), 0 18px 40px -24px rgba(32,34,79,.30)',
                  }}
                >
                  <div
                    className="w-[46px] h-[46px] rounded-[13px] grid place-items-center mb-1"
                    style={{ background: 'var(--lp-cobalt)', color: '#fff' }}
                  >
                    <LandingIcon name={c.icon} style={{ width: 23, height: 23 }} />
                  </div>
                  <p
                    className="font-mono uppercase"
                    style={{
                      fontFamily: 'var(--lp-font-mono)',
                      fontSize: '0.62rem',
                      letterSpacing: '0.16em',
                      color: 'var(--lp-amber-deep)',
                    }}
                  >
                    {c.tag}
                  </p>
                  <h3
                    className="font-bold text-[1.22rem]"
                    style={{ fontFamily: 'var(--lp-font-display)' }}
                  >
                    {c.title}
                  </h3>
                  <p
                    className="text-[0.96rem] leading-[1.55]"
                    style={{ color: 'var(--lp-ink-soft)' }}
                  >
                    {c.body}
                  </p>
                  <div className="grid gap-2 mt-1">
                    {c.list.map((item) => (
                      <span
                        key={item}
                        className="flex gap-[0.55rem] items-center text-[0.88rem]"
                        style={{ color: 'var(--lp-ink-soft)' }}
                      >
                        <LandingIcon
                          name="check"
                          strokeWidth={2.4}
                          style={{
                            width: 15,
                            height: 15,
                            color: 'var(--lp-cobalt)',
                            flexShrink: 0,
                          }}
                        />
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────── */}
        <section
          className="py-[clamp(4rem,8vw,7rem)]"
          style={{ background: 'var(--lp-paper-2)' }}
        >
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal max-w-[640px] mx-auto text-center mb-[clamp(2.4rem,4vw,3.5rem)]"
            >
              <p
                className="inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-cobalt)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-cobalt)', opacity: 0.6 }}
                />
                Everything in the box
              </p>
              <h2
                className="mt-[1.1rem] font-extrabold leading-[1.05]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                }}
              >
                Small tool, surprisingly complete.
              </h2>
            </div>

            <div className="grid gap-[1.1rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  ref={registerReveal}
                  className="lp-reveal rounded-[12px]"
                  style={{
                    background: 'var(--lp-card)',
                    border: '1px solid var(--lp-cobalt-line)',
                    padding: '1.4rem 1.3rem',
                  }}
                >
                  <div className="mb-[0.9rem]" style={{ color: 'var(--lp-cobalt)' }}>
                    <LandingIcon name={f.icon} style={{ width: 24, height: 24 }} />
                  </div>
                  <h4
                    className="font-bold text-[1.02rem]"
                    style={{ fontFamily: 'var(--lp-font-display)' }}
                  >
                    {f.title}
                  </h4>
                  <p
                    className="mt-[0.35rem] text-[0.88rem] leading-[1.5]"
                    style={{ color: 'var(--lp-ink-soft)' }}
                  >
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────── */}
        <section id="faq" className="py-[clamp(4rem,8vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal max-w-[640px] mx-auto text-center mb-[clamp(2.4rem,4vw,3.5rem)]"
            >
              <p
                className="inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase"
                style={{
                  fontFamily: 'var(--lp-font-mono)',
                  letterSpacing: '0.24em',
                  color: 'var(--lp-cobalt)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 1, background: 'var(--lp-cobalt)', opacity: 0.6 }}
                />
                Questions
              </p>
              <h2
                className="mt-[1.1rem] font-extrabold leading-[1.05]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                }}
              >
                Good things to know.
              </h2>
            </div>

            <div
              ref={registerReveal}
              className="lp-reveal max-w-[780px] mx-auto grid gap-3"
            >
              {FAQS.map((f, i) => {
                const open = openFaq === i
                return (
                  <div
                    key={f.q}
                    className="rounded-[12px] overflow-hidden"
                    style={{
                      background: 'var(--lp-card)',
                      border: '1px solid var(--lp-cobalt-line)',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full text-left bg-transparent border-0 flex items-center justify-between gap-4 px-6 py-[1.3rem] font-semibold text-[1.08rem]"
                      style={{
                        fontFamily: 'var(--lp-font-display)',
                        color: 'var(--lp-ink)',
                      }}
                    >
                      <span>{f.q}</span>
                      <span
                        aria-hidden="true"
                        className="relative shrink-0"
                        style={{ width: 16, height: 16 }}
                      >
                        <span
                          className="absolute"
                          style={{
                            top: 7,
                            left: 0,
                            width: 16,
                            height: 2,
                            background: 'var(--lp-cobalt)',
                          }}
                        />
                        <span
                          className="absolute transition-transform duration-300"
                          style={{
                            left: 7,
                            top: 0,
                            width: 2,
                            height: 16,
                            background: 'var(--lp-cobalt)',
                            transform: open ? 'scaleY(0)' : 'scaleY(1)',
                          }}
                        />
                      </span>
                    </button>
                    <div
                      className="overflow-hidden transition-[max-height] duration-300"
                      style={{ maxHeight: open ? 400 : 0 }}
                    >
                      <div
                        className="px-6 pb-[1.4rem] text-[0.98rem] leading-[1.6]"
                        style={{ color: 'var(--lp-ink-soft)' }}
                      >
                        {f.a}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section id="cta" className="py-[clamp(4rem,8vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.4rem,1180px)]">
            <div
              ref={registerReveal}
              className="lp-reveal relative overflow-hidden rounded-[28px] text-center"
              style={{
                background: 'var(--lp-cobalt-deep)',
                padding: 'clamp(2.8rem,6vw,4.8rem)',
                boxShadow: '0 30px 70px -36px rgba(32,34,79,.45)',
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center pointer-events-none"
                style={{ opacity: 0.5 }}
              >
                {[280, 440, 620].map((px) => (
                  <span
                    key={px}
                    className="absolute rounded-full"
                    style={{
                      width: px,
                      height: px,
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  />
                ))}
              </div>
              <h2
                className="relative font-extrabold leading-[1.04]"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(2rem,4vw,3.1rem)',
                  color: '#fff',
                }}
              >
                Stop reading your notes.
                <br />
                <span style={{ color: 'var(--lp-amber)' }}>Start seeing them.</span>
              </h2>
              <p
                className="relative mt-[1.1rem] text-[1.1rem]"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                Paste your first talk and watch it become a memory you can walk through.
              </p>
              <div className="relative mt-[2.2rem] flex justify-center gap-[0.9rem] flex-wrap">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,box-shadow,background] duration-200 hover:-translate-y-0.5 px-[1.9rem] py-[1.05rem] text-[1.05rem]"
                  style={{
                    background: 'var(--lp-amber)',
                    color: '#3a2400',
                    boxShadow: '0 16px 30px -14px rgba(232,162,60,.7)',
                  }}
                >
                  Open the app
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,background,border-color] duration-200 hover:-translate-y-0.5 px-[1.9rem] py-[1.05rem] text-[1.05rem]"
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,.3)',
                  }}
                >
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="pt-12 pb-14">
        <div
          className="mx-auto w-[min(100%-2.4rem,1180px)] flex items-center justify-between gap-6 flex-wrap pt-[2.4rem]"
          style={{ borderTop: '1px solid var(--lp-cobalt-line)' }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/brand/icon+wordmark_logo_blue.png"
              alt="Allison's Memory Clockray"
              className="h-[26px]"
            />
          </div>
          <div className="flex gap-6">
            {[
              ['How it works', '#how'],
              ['Views', '#views'],
              ['Use cases', '#cases'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[0.88rem] transition-colors hover:[color:var(--lp-cobalt)]"
                style={{ color: 'var(--lp-ink-soft)' }}
              >
                {label}
              </a>
            ))}
          </div>
          <p
            className="font-mono text-[0.72rem]"
            style={{
              fontFamily: 'var(--lp-font-mono)',
              color: 'var(--lp-ink-muted)',
              letterSpacing: '0.03em',
            }}
          >
            © {year} Allison's Memory Clockray
          </p>
        </div>
      </footer>
    </div>
  )
}

function MiniHead({ kicker, meta }: { kicker: string; meta: string }) {
  return (
    <div className="flex items-baseline justify-between mb-[1.3rem]">
      <div>
        <p
          className="font-mono uppercase"
          style={{
            fontFamily: 'var(--lp-font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: 'var(--lp-amber)',
          }}
        >
          {kicker}
        </p>
        <p
          className="font-bold mt-1"
          style={{
            fontFamily: 'var(--lp-font-display)',
            color: '#fff',
            fontSize: '1.15rem',
          }}
        >
          The Future of Work
        </p>
      </div>
      <span
        className="font-mono"
        style={{
          fontFamily: 'var(--lp-font-mono)',
          fontSize: '0.62rem',
          color: 'rgba(255,255,255,.45)',
        }}
      >
        {meta}
      </span>
    </div>
  )
}
