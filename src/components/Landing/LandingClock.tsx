import { useEffect, useRef, useState } from 'react'
import { LandingIcon, SAMPLE_SEGMENTS, SAMPLE_TOPIC } from './landingIcons'

type Props = {
  compact?: boolean
  autoCycle?: boolean
  initialActive?: number
  className?: string
  style?: React.CSSProperties
}

const TICK_MS = 2600

export function LandingClock({
  compact = false,
  autoCycle = true,
  initialActive = 0,
  className = '',
  style,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(0)
  const [active, setActive] = useState(initialActive)
  const [isInView, setIsInView] = useState(false)
  const timerRef = useRef<number | null>(null)

  const n = SAMPLE_SEGMENTS.length

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? el.offsetWidth
      setSize(w)
    })
    ro.observe(el)
    setSize(el.offsetWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!autoCycle) return
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setIsInView(e.isIntersecting))
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [autoCycle])

  useEffect(() => {
    if (!autoCycle || !isInView) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = window.setInterval(() => {
      setActive((cur) => (cur + 1) % n)
    }, TICK_MS)
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [autoCycle, isInView, n])

  const orbitPct = compact ? 34.5 : 37
  const connectorPx = size > 0 ? size * (orbitPct / 100) - size * 0.135 : 0

  const nodes = SAMPLE_SEGMENTS.map((seg, i) => {
    const angTop = (i / n) * Math.PI * 2
    const x = 50 + Math.sin(angTop) * orbitPct
    const y = 50 - Math.cos(angTop) * orbitPct
    const cssAng = (angTop * 180) / Math.PI - 90
    return { seg, i, angTop, x, y, cssAng }
  })

  const activeAng = nodes[active]?.cssAng ?? -90

  const handleClickNode = (i: number) => {
    setActive(i)
    // restart cycle
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (autoCycle && isInView) {
      timerRef.current = window.setInterval(() => {
        setActive((cur) => (cur + 1) % n)
      }, TICK_MS)
    }
  }

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={`A memory clock for the talk '${SAMPLE_TOPIC}', with six labelled anchors around a clock face.`}
      className={`relative aspect-square rounded-full ${className}`}
      style={{
        width: compact ? '300px' : 'min(460px, 90%)',
        background:
          'radial-gradient(circle at 50% 42%, #fff, var(--lp-card) 70%)',
        boxShadow:
          '0 30px 70px -36px rgba(32, 34, 79, 0.45), inset 0 0 0 1px var(--lp-cobalt-line)',
        ...style,
      }}
    >
      {/* face */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '9%',
          border: '1px dashed var(--lp-cobalt-line)',
        }}
      />

      {/* numerals */}
      {Array.from({ length: 12 }, (_, idx) => {
        const h = idx + 1
        const ang = (h / 12) * Math.PI * 2 - Math.PI / 2
        return (
          <span
            key={h}
            className="absolute font-mono text-[0.7rem] font-medium"
            style={{
              left: `${50 + Math.cos(ang) * 44}%`,
              top: `${50 + Math.sin(ang) * 44}%`,
              transform: 'translate(-50%, -50%)',
              color: 'var(--lp-ink-muted)',
              fontFamily: 'var(--lp-font-mono)',
            }}
          >
            {h}
          </span>
        )
      })}

      {/* connectors */}
      {nodes.map(({ cssAng }, i) => {
        const isActive = i === active
        return (
          <span
            key={`c-${i}`}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              height: '1.5px',
              width: `${connectorPx}px`,
              transformOrigin: '0 50%',
              transform: `translateY(-50%) rotate(${cssAng}deg)`,
              background: isActive ? 'var(--lp-amber)' : 'var(--lp-cobalt-line)',
              zIndex: 1,
              transition: 'background .4s ease, opacity .4s ease',
            }}
          />
        )
      })}

      {/* nodes */}
      {nodes.map(({ seg, i, x, y }) => {
        const isActive = i === active
        const nodeSize = compact ? 72 : 92
        return (
          <button
            type="button"
            key={`n-${i}`}
            onClick={() => handleClickNode(i)}
            className="absolute grid place-items-center text-center rounded-full border"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: nodeSize,
              height: nodeSize,
              padding: 0,
              transform: `translate(-50%, -50%) ${isActive ? 'scale(1.13)' : 'scale(1)'}`,
              background: isActive ? 'var(--lp-amber)' : '#fff',
              borderColor: isActive ? 'var(--lp-amber)' : 'var(--lp-cobalt-line)',
              boxShadow: isActive
                ? '0 20px 40px -16px rgba(232,162,60,.8)'
                : '0 1px 2px rgba(32, 34, 79, 0.04), 0 18px 40px -24px rgba(32, 34, 79, 0.30)',
              zIndex: isActive ? 5 : 3,
              gap: 2,
              alignContent: 'center',
              transition:
                'transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s ease, border-color .45s ease, background .45s ease',
              cursor: 'pointer',
            }}
            aria-label={seg.kw}
          >
            <span
              className="absolute grid place-items-center rounded-full font-mono"
              style={{
                top: -7,
                left: -7,
                width: 22,
                height: 22,
                background: isActive ? '#3a2400' : 'var(--lp-cobalt)',
                color: '#fff',
                fontFamily: 'var(--lp-font-mono)',
                fontSize: '0.64rem',
                boxShadow: '0 4px 10px -4px rgba(46,49,146,.6)',
              }}
            >
              {i + 1}
            </span>
            <LandingIcon
              name={seg.icon}
              style={{
                width: 19,
                height: 19,
                color: isActive ? '#4a2c00' : 'var(--lp-cobalt)',
                transition: 'color .4s ease',
              }}
            />
            <span
              className="font-bold leading-tight"
              style={{
                fontSize: compact ? '0.58rem' : '0.66rem',
                color: isActive ? '#3a2400' : 'var(--lp-ink)',
                padding: '0 6px',
                letterSpacing: '0.01em',
              }}
            >
              {seg.kw}
            </span>
          </button>
        )
      })}

      {/* hands */}
      <span
        className="absolute rounded-full"
        style={{
          top: '50%',
          left: '50%',
          width: '26%',
          height: 3,
          background: 'var(--lp-cobalt-deep)',
          transformOrigin: '0 50%',
          transform: `rotate(${activeAng}deg)`,
          transition: 'transform 1.1s cubic-bezier(.34,1.3,.5,1)',
          zIndex: 4,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          top: '50%',
          left: '50%',
          width: '34%',
          height: 2,
          background: 'var(--lp-amber-deep)',
          transformOrigin: '0 50%',
          transform: `rotate(${activeAng + 7}deg)`,
          transition: 'transform 1.1s cubic-bezier(.34,1.3,.5,1)',
          zIndex: 4,
        }}
      />

      {/* hub */}
      <div
        className="absolute grid place-items-center text-center"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '27%',
          height: '27%',
          borderRadius: '50%',
          background: 'var(--lp-cobalt)',
          color: '#fff',
          padding: 6,
          zIndex: 4,
          boxShadow:
            '0 18px 36px -14px rgba(46,49,146,.8), inset 0 0 0 5px rgba(255,255,255,.1)',
        }}
      >
        <span>
          <span
            className="block"
            style={{
              fontFamily: 'var(--lp-font-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Topic
          </span>
          <span
            className="block mt-[3px] font-bold leading-[1.05]"
            style={{
              fontFamily: 'var(--lp-font-display)',
              fontSize: '0.82rem',
            }}
          >
            {SAMPLE_TOPIC}
          </span>
        </span>
      </div>
    </div>
  )
}
