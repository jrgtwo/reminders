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

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendar',
    desc: 'Month and week views with drag-and-drop scheduling'
  },
  {
    icon: Bell,
    title: 'Reminders',
    desc: 'Recurring reminders with desktop notifications'
  },
  {
    icon: StickyNote,
    title: 'Notes',
    desc: 'Markdown notes organized in folders'
  },
  {
    icon: ListTodo,
    title: 'Todos',
    desc: 'Lists with due dates, priorities, and completion tracking'
  }
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
import { isAllowed } from '../lib/consent'

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
    <div className="min-h-screen bg-[#0d1117] text-slate-100 overflow-auto">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center mb-6">
            <span
              className="text-[20px] md:text-[24px] text-white/40 tracking-[0.25em] uppercase font-medium"
              style={{ fontFamily: "'Bree Serif', serif" }}
            >
              Reminder
            </span>
            <span
              className="text-[56px] md:text-[72px] text-white/90 tracking-tight leading-none"
              style={{ fontFamily: "'Bree Serif', serif" }}
            >
              Today
            </span>
          </div>
          <p className="text-lg md:text-xl text-white/50 max-w-lg mb-8 leading-relaxed">
            A calm, local-first productivity app. Your calendar, reminders, notes, and todos — all
            in one place, private by default.
          </p>
          <div className="max-w-lg mb-10 px-4 py-3 rounded-lg bg-[#e8a045]/[0.08] border border-[#e8a045]/20 text-[#e8a045]/80 text-sm leading-relaxed text-left">
            <p className="font-medium text-[#e8a045] mb-1">Beta</p>
            <p>
              Access to all features is currently limited while we finish beta testing. Full
              availability will increase in the near future. During this period, data integrity may
              be affected — we recommend keeping local backups of anything important.
            </p>
          </div>
          <button
            onClick={onEnter}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] text-white/90 text-base font-medium transition-all"
          >
            Open the App
            <ChevronRight
              size={18}
              className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            />
          </button>
          <p className="text-xs text-white/25 mt-3">No account required. Works in your browser.</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <f.icon size={22} className="text-white/40" />
              <h3 className="text-sm font-semibold text-white/80">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white/80 mb-3">Works everywhere</h2>
          <p className="text-sm text-white/40 mb-8">
            Use it as a web app, download the desktop app for Mac or Windows, or install it on your
            phone.
          </p>
          <div className="flex items-center justify-center gap-8 text-white/30">
            <div className="flex flex-col items-center gap-2">
              <Monitor size={28} />
              <span className="text-xs">Desktop</span>
            </div>
            <div className="flex flex-col items-center gap-2">
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
            <div className="flex flex-col items-center gap-2">
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
          <p className="text-sm text-white/40 text-center mb-10 max-w-lg mx-auto">
            Use everything for free on a single device. Sign up to encrypt your data. Go Pro to sync
            across all devices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col p-6 rounded-xl border ${
                  tier.highlight
                    ? 'bg-white/[0.06] border-[#6498c8]/40'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#6498c8] text-white rounded-full">
                    Recommended
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white/80">{tier.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white/90">{tier.price}</span>
                    {tier.annual && <span className="text-xs text-white/30">or {tier.annual}</span>}
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                      <Shield size={13} className="shrink-0 mt-0.5 text-white/20" />
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.name === 'No Account' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] text-sm font-medium text-white/80 transition-all"
                  >
                    Get Started
                  </button>
                )}
                {tier.name === 'Free Account' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.08] text-sm font-medium text-white/80 transition-all"
                  >
                    Sign Up in Settings
                  </button>
                )}
                {tier.name === 'Pro' && (
                  <button
                    onClick={onEnter}
                    className="mt-6 w-full py-2.5 rounded-lg bg-[#6498c8]/20 hover:bg-[#6498c8]/30 border border-[#6498c8]/30 text-sm font-medium text-[#6498c8] transition-all"
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
            <Shield size={18} className="text-white/30" />
            <h3 className="text-base font-semibold text-white/70">Privacy first</h3>
          </div>
          <p className="text-xs text-white/35 leading-relaxed max-w-md mx-auto">
            Your data lives on your device. If you create an account, everything is encrypted with
            AES-256-GCM before it ever leaves your browser. We can&apos;t read your data — only you
            can.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-6 text-center text-[11px] text-white/20">
        Reminder Today
      </footer>
    </div>
  )
}
