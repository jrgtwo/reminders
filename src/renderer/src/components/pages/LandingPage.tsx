import {
  Calendar,
  Bell,
  StickyNote,
  ListTodo,
  Shield,
  Cloud,
  Monitor,
  Smartphone,
  ChevronRight,
  Lock
} from 'lucide-react'
import logo from '../../assets/logo.svg'
import GrainOverlay from '../ui/GrainOverlay'

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendar',
    desc: 'Month and week views with drag-and-drop scheduling',
  },
  {
    icon: Bell,
    title: 'Reminders',
    desc: 'Recurring reminders with desktop notifications',
  },
  {
    icon: StickyNote,
    title: 'Notes',
    desc: 'Markdown notes organized in folders',
  },
  {
    icon: ListTodo,
    title: 'Todos',
    desc: 'Lists with due dates, priorities, and completion tracking',
  },
]

const FEATURE_DETAILS = [
  {
    icon: Calendar,
    title: 'Calendar that stays out of your way',
    points: [
      'Switch between month and week views instantly',
      'Drag and drop to reschedule reminders across days',
      'Color-coded entries so you can scan your week at a glance',
      'Click any day to see everything due — reminders, notes, and todos together',
    ],
  },
  {
    icon: Bell,
    title: 'Reminders that actually remind you',
    points: [
      'Set one-time or recurring reminders — daily, weekly, monthly, or custom',
      'Desktop notifications so you never miss a deadline',
      'Mark complete for a single occurrence or the entire series',
      'Overdue items surface automatically so nothing slips through',
    ],
  },
  {
    icon: StickyNote,
    title: 'Notes without the clutter',
    points: [
      'Write in plain text or Markdown — formatting is up to you',
      'Organize into folders and drag to reorder',
      'Pin notes to specific calendar dates for context',
      'Search across all your notes instantly',
    ],
  },
  {
    icon: ListTodo,
    title: 'Todos that keep you moving',
    points: [
      'Create multiple lists for different projects or areas of your life',
      'Drag and drop to prioritize within and across lists',
      'Add descriptions to flesh out tasks without losing the overview',
      'Organize lists into folders when things grow',
    ],
  },
]

const TIERS = [
  {
    name: 'No Account',
    price: 'Free',
    highlight: false,
    features: [
      'Unlimited reminders, notes & todos',
      'Works entirely offline',
      'Data stays on your device',
      'All themes included'
    ],
    cta: 'Get Started'
  },
  {
    name: 'Free Account',
    price: 'Free',
    highlight: false,
    features: [
      'Everything in No Account',
      'End-to-end encrypted data',
      'AES-256-GCM encryption at rest',
      'Your data is unreadable without your key'
    ],
    icon: Lock
  },
  {
    name: 'Pro',
    price: '$5/mo',
    annual: '$45/yr',
    highlight: true,
    features: [
      'Everything in Free Account',
      'Sync across all your devices',
      'Web, desktop & mobile',
      'Priority support'
    ],
    icon: Cloud
  }
]

import { useNavigate } from 'react-router-dom'
import { isAllowed } from '../../lib/consent'

const LANDING_SEEN_KEY = 'reminder_landing_seen'

function markLandingSeen(): void {
  localStorage.setItem(LANDING_SEEN_KEY, '1')
  if (isAllowed('functional')) {
    document.cookie = `${LANDING_SEEN_KEY}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }
}

export { LANDING_SEEN_KEY }

export default function LandingPage() {
  const navigate = useNavigate()

  const onEnter = () => {
    markLandingSeen()
    navigate('/')
  }
  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-100 overflow-auto">
      <GrainOverlay />
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <h1 className="flex flex-col items-center mb-6">
            <img src={logo} alt="Reminder Today Logo" className="w-100 mb-1" />
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-lg mb-8 leading-relaxed">
            Calendar. Reminders. Notes. Todos. One app, on your device, under your control — no
            account required.
          </p>
          <div className="max-w-lg mb-10 px-4 py-3 rounded-lg bg-[#e8a045]/[0.08] border border-[#e8a045]/20 border-b-[3px] border-b-[#e8a045]/30 text-[#e8a045]/80 text-sm leading-relaxed text-left btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-[#e8a045]/35">
            <p className="font-medium text-[#e8a045] mb-1">Beta</p>
            <p>
              Access to all features is currently limited while we finish beta testing. Full
              availability will increase in the near future. During this period, data integrity may
              be affected — we recommend keeping local backups of anything important.
            </p>
          </div>
          <button
            onClick={onEnter}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] border-b-[3px] border-b-white/[0.15] text-white/90 text-base font-medium btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20"
          >
            Open the App
            <ChevronRight
              size={18}
              className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            />
          </button>
          <p className="text-xs text-white/50 mt-3">No account required. Works in your browser.</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 p-5 rounded-xl bg-white/[0.05] border border-white/[0.06] border-b-[3px] border-b-white/[0.12] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20"
            >
              <f.icon size={22} className="text-white/60" />
              <h2 className="text-sm font-semibold text-white/80">{f.title}</h2>
              <p className="text-xs text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature details */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-white/80 text-center mb-3">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-sm text-white/50 text-center mb-12 max-w-lg mx-auto">
            Four tools built to work together. No bloat, no learning curve — just open the app and
            start.
          </p>
          <div className="flex flex-col gap-6">
            {FEATURE_DETAILS.map((f, i) => (
              <div
                key={f.title}
                className={`flex flex-col md:flex-row gap-6 items-start p-6 rounded-xl bg-white/[0.05] border border-white/[0.06] border-b-[3px] border-b-white/[0.12] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20 ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/[0.05] border border-white/[0.08] shrink-0">
                  <f.icon size={24} className="text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white/80 mb-3">{f.title}</h3>
                  <ul className="flex flex-col gap-2">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2.5 text-sm text-white/55 leading-relaxed"
                      >
                        <ChevronRight
                          size={14}
                          className="shrink-0 mt-[3px] text-white/30"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white/80 mb-3">Works everywhere</h2>
          <p className="text-sm text-white/60 mb-8">
            Use it as a web app, download the desktop app for Mac or Windows, or install it on your
            phone.
          </p>
          <div className="flex items-center justify-center gap-8 text-white/55">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] border-b-[3px] border-b-white/[0.12] bg-white/[0.05] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20">
              <Monitor size={28} />
              <span className="text-xs">Desktop</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] border-b-[3px] border-b-white/[0.12] bg-white/[0.05] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-7 h-7"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span className="text-xs">Web</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] border-b-[3px] border-b-white/[0.12] bg-white/[0.05] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20">
              <Smartphone size={28} />
              <span className="text-xs">Mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-white/80 text-center mb-3">
            Choose your path
          </h2>
          <p className="text-sm text-white/60 text-center mb-10 max-w-lg mx-auto">
            Use everything for free on a single device. Sign up to encrypt your data. Go Pro to sync
            across all devices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col p-6 rounded-xl border border-b-[3px] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20 ${
                  tier.highlight
                    ? 'bg-white/[0.08] border-[var(--accent)]/40 border-b-[var(--accent)]/50'
                    : 'bg-white/[0.05] border-white/[0.06] border-b-white/[0.12]'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent)] text-white rounded-full">
                    Recommended
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white/80">{tier.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white/90">{tier.price}</span>
                    {tier.annual && <span className="text-xs text-white/55">or {tier.annual}</span>}
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                      <Shield size={13} className="shrink-0 mt-0.5 text-white/50" />
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.name === 'No Account' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] border-b-[3px] border-b-white/[0.15] text-sm font-medium text-white/80 btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20"
                  >
                    Get Started
                  </button>
                )}
                {tier.name === 'Free Account' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] border-b-[3px] border-b-white/[0.15] text-sm font-medium text-white/80 btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-white/20"
                  >
                    Sign Up in Settings
                  </button>
                )}
                {tier.name === 'Pro' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/30 border-b-[3px] border-b-[var(--accent)]/40 text-sm font-medium text-[var(--accent)] btn-3d hover:-translate-y-[3px] hover:brightness-125 hover:border-[var(--accent)]/45"
                  >
                    Try Free, Upgrade Later
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy footer */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield size={18} className="text-white/55" />
            <h3 className="text-base font-semibold text-white/70">Privacy first</h3>
          </div>
          <p className="text-xs text-white/55 leading-relaxed max-w-md mx-auto">
            Your data lives on your device. If you create an account, everything is encrypted with
            AES-256-GCM before it ever leaves your browser. We can&apos;t read your data — only you
            can.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-6 text-center text-[11px] text-white/50 flex items-center justify-center gap-3">
        <span>Reminder Today</span>
        <span>&middot;</span>
        <a href="/privacy" className="hover:text-white/60 transition-colors">
          Privacy Policy
        </a>
        <span>&middot;</span>
        <a href="mailto:support@remindertoday.com" className="hover:text-white/60 transition-colors">
          Contact
        </a>
      </footer>
    </main>
  )
}
