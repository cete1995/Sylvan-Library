import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cafeApi, CafeSettings } from '../api/cafe';

/* ─────────────────────────────────────────────
   Reusable step badge
───────────────────────────────────────────── */
const Step: React.FC<{ n: number; text: string }> = ({ n, text }) => (
  <div className="flex items-start gap-3">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5"
      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
    >
      {n}
    </div>
    <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
  </div>
);

/* ─────────────────────────────────────────────
   Console card component
───────────────────────────────────────────── */
interface ConsoleCardProps {
  emoji: string;
  name: string;
  subtitle: string;
  headerGradient: string;
  accentColor: string;
  hourlyRate: string;
  happyHourStart?: string;
  happyHourRate?: string;
  happyHourNote?: string;
  desc?: string;
  features: string[];
  whatsapp: string;
}

const ConsoleCard: React.FC<ConsoleCardProps> = ({
  emoji, name, subtitle, headerGradient, accentColor,
  hourlyRate, happyHourStart, happyHourRate, happyHourNote,
  desc, features, whatsapp,
}) => (
  <div
    className="rounded-3xl overflow-hidden shadow-xl flex flex-col"
    style={{ backgroundColor: 'var(--color-panel)' }}
  >
    {/* Header */}
    <div className="relative overflow-hidden px-6 py-8" style={{ background: headerGradient }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
      <div className="relative z-10">
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="text-2xl font-extrabold text-white leading-tight">{name}</h2>
        <p className="text-sm mt-1 opacity-75 text-white">{subtitle}</p>
      </div>
    </div>

    {/* Pricing */}
    <div className="px-6 py-5 space-y-4 flex-1">
      {/* Hourly rate */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Regular Rate
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Per Hour</p>
        </div>
        <span className="text-2xl font-extrabold" style={{ color: accentColor }}>{hourlyRate}</span>
      </div>

      {/* Happy Hour */}
      {happyHourStart && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1.5px solid rgba(251,191,36,0.35)' }}
        >
          <span className="text-2xl shrink-0">⭐</span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider mb-0.5" style={{ color: '#b45309' }}>
              Happy Hour
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              From {happyHourStart} until close
            </p>
            <p className="text-xl font-extrabold mt-0.5" style={{ color: '#f59e0b' }}>{happyHourRate}</p>
            {happyHourNote && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{happyHourNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="space-y-2 pt-1">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke={accentColor} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {desc && (
        <p className="text-sm pt-1" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
      )}
    </div>

    {/* Book CTA */}
    <div className="px-6 pb-6">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-95"
        style={{ background: headerGradient, color: '#fff' }}
      >
        📲 Book {name}
      </a>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
const ConsolesPage: React.FC = () => {
  const [info, setInfo] = useState<CafeSettings | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    cafeApi.getSettings().then(setInfo).catch(() => setLoadError(true));
  }, []);

  if (!info && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <span className="text-5xl">🎮</span>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Console Rental</h2>
        <p className="max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Info is currently unavailable. Please check back soon or contact us on WhatsApp.
        </p>
      </div>
    );
  }

  // Always show both consoles — the admin `enabled` flag is for future toggling
  // but console rental is live so we treat both as always visible here.
  const ps5Enabled = true;
  const switchEnabled = true;

  const ps5Features = [
    '4K gaming on large screen TV',
    'Controller & accessories included',
    'Wide title library available',
    'Perfect for multiplayer sessions',
  ];
  const switchFeatures = [
    'Handheld or TV mode available',
    'Joy-Con controllers included',
    'Family & party game titles',
    'Great for casual group play',
  ];

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c0c2e 0%, #1a1060 40%, #2e0a45 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#818cf8' }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: '#f472b6' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.04]" style={{ backgroundColor: '#fff' }} />

        <div className="relative container mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-20 max-w-4xl">

          {/* Back breadcrumb */}
          <Link
            to="/cafe"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-8 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Café
          </Link>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ backgroundColor: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#818cf8' }} />
            Available Now
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Console{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #818cf8, #f472b6)' }}>
              Rental
            </span>
          </h1>
          <p className="text-base md:text-lg max-w-xl leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Rent a PS5 or Nintendo Switch by the hour. Happy hour deals every evening — just show up, pick a console, and play.
          </p>

          {/* Console pills */}
          <div className="flex flex-wrap gap-3">
            {ps5Enabled && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}>
                🎮 {info.ps5?.name || 'PS5'} {info.ps5?.hourlyRate ? `— ${info.ps5.hourlyRate}/hr` : ''}
              </div>
            )}
            {switchEnabled && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}>
                🕹️ {info.nintendoSwitch?.name || 'Nintendo Switch'} {info.nintendoSwitch?.hourlyRate ? `— ${info.nintendoSwitch.hourlyRate}/hr` : ''}
              </div>
            )}
            {(ps5Enabled || switchEnabled) && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.3)' }}>
                ⭐ Happy Hour deals
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl space-y-12">

        {/* Console cards */}
        {(ps5Enabled || switchEnabled) ? (
          <section>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
              Choose Your Console
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ps5Enabled && (
                <ConsoleCard
                  emoji="🎮"
                  name={info.ps5?.name || 'PlayStation 5'}
                  subtitle="Sony PlayStation 5 — 4K Gaming"
                  headerGradient="linear-gradient(135deg, #0c1445 0%, #1e2d7d 60%, #1a237e 100%)"
                  accentColor="#60a5fa"
                  hourlyRate={info.ps5?.hourlyRate || 'See staff'}
                  happyHourStart={info.ps5?.happyHourStart}
                  happyHourRate={info.ps5?.happyHourRate}
                  happyHourNote={info.ps5?.happyHourNote}
                  desc={info.ps5?.desc}
                  features={ps5Features}
                  whatsapp={info.whatsapp || '#'}
                />
              )}
              {switchEnabled && (
                <ConsoleCard
                  emoji="🕹️"
                  name={info.nintendoSwitch?.name || 'Nintendo Switch'}
                  subtitle="Nintendo Switch — Play Your Way"
                  headerGradient="linear-gradient(135deg, #4a0505 0%, #b91c1c 60%, #991b1b 100%)"
                  accentColor="#f87171"
                  hourlyRate={info.nintendoSwitch?.hourlyRate || 'See staff'}
                  happyHourStart={info.nintendoSwitch?.happyHourStart}
                  happyHourRate={info.nintendoSwitch?.happyHourRate}
                  happyHourNote={info.nintendoSwitch?.happyHourNote}
                  desc={info.nintendoSwitch?.desc}
                  features={switchFeatures}
                  whatsapp={info.whatsapp || '#'}
                />
              )}
            </div>
          </section>
        ) : null}

        {/* Happy Hour callout banner */}
        {(ps5Enabled || switchEnabled) &&
          (info.ps5?.happyHourStart || info.nintendoSwitch?.happyHourStart) && (
          <section
            className="rounded-3xl px-6 py-8 md:px-10 flex flex-col sm:flex-row items-center gap-6"
            style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #7c2d12 100%)' }}
          >
            <div className="text-5xl shrink-0">⭐</div>
            <div className="text-white text-center sm:text-left flex-1">
              <h3 className="text-xl font-extrabold mb-1">Happy Hour — Every Evening</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-sm leading-relaxed">
                Come in during happy hour for discounted hourly rates on both consoles.
                {info.ps5?.happyHourStart && ` PS5 happy hour starts from ${info.ps5.happyHourStart}.`}
                {info.nintendoSwitch?.happyHourStart && ` Switch happy hour starts from ${info.nintendoSwitch.happyHourStart}.`}
              </p>
            </div>
            <a
              href={info.whatsapp || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: '#fbbf24', color: '#78350f' }}
            >
              Book a Slot
            </a>
          </section>
        )}

        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            How It Works
          </h2>
          <div
            className="rounded-3xl p-6 md:p-8 space-y-5"
            style={{ backgroundColor: 'var(--color-panel)' }}
          >
            <Step n={1} text="Walk in or book in advance via WhatsApp — no reservation required during off-peak hours." />
            <Step n={2} text="Pick your console (PS5 or Switch) and we'll set up your station and hand you the controllers." />
            <Step n={3} text="Play! Time is measured per hour. Happy hour rates apply automatically in the evening." />
            <Step n={4} text="When you're done, just head to the counter. Pay for the time used and you're good to go." />
          </div>
        </section>

        {/* Comparison table (mobile: stacked cards, desktop: table) */}
        {ps5Enabled && switchEnabled && (
          <section>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
              Quick Comparison
            </h2>

            {/* Mobile: two stacked mini-cards */}
            <div className="md:hidden space-y-3">
              {[
                { label: 'Console', ps5: info.ps5?.name || 'PlayStation 5', sw: info.nintendoSwitch?.name || 'Nintendo Switch' },
                { label: 'Hourly Rate', ps5: info.ps5?.hourlyRate || '—', sw: info.nintendoSwitch?.hourlyRate || '—' },
                { label: 'Happy Hour Rate', ps5: info.ps5?.happyHourRate || '—', sw: info.nintendoSwitch?.happyHourRate || '—' },
                { label: 'Happy Hour From', ps5: info.ps5?.happyHourStart || '—', sw: info.nintendoSwitch?.happyHourStart || '—' },
                { label: 'Best For', ps5: 'Immersive AAA games', sw: 'Party & casual play' },
              ].map(({ label, ps5, sw }) => (
                <div
                  key={label}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
                    {label}
                  </div>
                  <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="px-4 py-3">
                      <p className="text-xs text-blue-400 font-bold mb-0.5">🎮 PS5</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{ps5}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-red-400 font-bold mb-0.5">🕹️ Switch</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{sw}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: proper table */}
            <div className="hidden md:block rounded-3xl overflow-hidden shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: 'var(--color-text-secondary)' }}>Feature</th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#60a5fa' }}>🎮 {info.ps5?.name || 'PS5'}</th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#f87171' }}>🕹️ {info.nintendoSwitch?.name || 'Switch'}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Hourly Rate', ps5: info.ps5?.hourlyRate || '—', sw: info.nintendoSwitch?.hourlyRate || '—' },
                    { label: 'Happy Hour Rate', ps5: info.ps5?.happyHourRate || '—', sw: info.nintendoSwitch?.happyHourRate || '—' },
                    { label: 'Happy Hour From', ps5: info.ps5?.happyHourStart || '—', sw: info.nintendoSwitch?.happyHourStart || '—' },
                    { label: 'Display', ps5: '4K HDMI TV', sw: 'Handheld or TV' },
                    { label: 'Best For', ps5: 'Immersive AAA games', sw: 'Party & casual play' },
                  ].map(({ label, ps5, sw }, i) => (
                    <tr key={label} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border)' }}>
                      <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</td>
                      <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--color-text)' }}>{ps5}</td>
                      <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--color-text)' }}>{sw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Do I need to book in advance?',
                a: 'No, walk-ins are welcome! For peak hours or weekends, a quick WhatsApp message to reserve a slot is recommended.',
              },
              {
                q: 'Is there a minimum rental time?',
                a: 'Minimum rental is 1 hour. After that, time is tracked hourly — no partial hour billing.',
              },
              {
                q: 'What games are available?',
                a: 'We have a rotating library of popular titles. Ask our staff for what\'s currently available on each console.',
              },
              {
                q: 'Can I bring my own games?',
                a: 'Yes! Physical game discs are welcome for PS5. Nintendo Switch cartridges and digital games on your own account are also fine.',
              },
              {
                q: 'Do I need to pay an entry fee too?',
                a: `The console rental fee is separate from the boardgame café entry fee (${info.entranceFee || 'ask at counter'}). Console rental includes access to the gaming station only.`,
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl px-5 py-4"
                style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
              >
                <p className="font-bold text-sm mb-1.5" style={{ color: 'var(--color-text)' }}>
                  {q}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Also at the café */}
        <section
          className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
          style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 100%)' }}
        >
          <div className="text-5xl shrink-0">🎲</div>
          <div className="text-white text-center md:text-left flex-1">
            <h3 className="text-xl font-extrabold mb-1">Also at Boardgame Time Café</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {info.gameCount} board games, dedicated Mahjong tables, and MTG singles — all under one roof.
            </p>
            <Link
              to="/cafe"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ backgroundColor: '#E31E24', color: '#ffffff' }}
            >
              View Café Info →
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center pt-2">
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--color-text)' }}>Ready to play?</h2>
          <p className="mb-6 max-w-md mx-auto text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Walk in anytime or send us a message to reserve your console. We'll have everything set up.
          </p>
          <a
            href={info.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            📲 Book via WhatsApp
          </a>
        </section>

      </div>
    </div>
  );
};

export default ConsolesPage;
