// pages/gamification.js
// 3ROTIX polished blueprint page — branded, with minimap + smooth animations
// Pure React + styled-jsx. Drop this file into /pages and visit /gamification.

import { useEffect, useMemo, useState } from "react";

export default function GamificationPage() {
  const sections = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "roles", label: "Roles" },
      { id: "progression", label: "Progression" },
      { id: "squads", label: "Squads" },
      { id: "knowledge", label: "Knowledge" },
      { id: "economy", label: "Economy" },
      { id: "safety", label: "Safety" },
      { id: "faq", label: "FAQ" },
    ],
    []
  );

  const [active, setActive] = useState("overview");

  // Scroll spy + reveal-on-scroll
  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );

    const revealer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal-in")),
      { rootMargin: "0px 0px -5% 0px", threshold: 0.1 }
    );

    document.querySelectorAll("section.anchor").forEach((el) => spy.observe(el));
    document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

    return () => {
      spy.disconnect();
      revealer.disconnect();
    };
  }, []);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page">
      {/* Mini-map (desktop) */}
      <nav className="minimap reveal" aria-label="Section navigation">
        <div className="mm-head">Gamification</div>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                className={`mm-link ${active === s.id ? "mm-active" : ""}`}
                onClick={() => jump(s.id)}
                aria-label={`Jump to ${s.label}`}
              >
                <span className="dot" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Hero */}
      <header className="hero reveal">
        <div className="hero-glow" />
        <h1 className="h1">3ROTIX Gamification</h1>
        <p className="sub">
          A clean blueprint for how <b>Creators</b>, <b>Supporters</b>, and <b>Builders</b> level up together.
        </p>
        <div className="pills">
          {sections.map((s) => (
            <button key={s.id} className="pill" onClick={() => jump(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      {/* Blueprint grid summary */}
      <section className="grid reveal anchor" id="overview">
        <BlueprintCard
          title="🎯 Core Idea"
          lines={["3 paths: Creator • Supporter • Builder", "Do actions → earn XP → unlock perks", "Creators can found Squads (guilds)"]}
        />
        <BlueprintCard
          title="🏆 Rewards"
          lines={["Instant: reactions & streaks", "Weekly: quests & collabs", "Long-term: badges, titles, VIP rooms"]}
        />
        <BlueprintCard
          title="📚 Knowledge Hub"
          lines={["Short lessons + quick quizzes", "IP • branding • safety • growth", "Learning unlocks better tools"]}
        />
        <BlueprintCard
          title="💬 Squads"
          lines={["Creator-branded communities", "Recruitment challenges & leaderboards", "Seasonal events keep it fresh"]}
        />
        <BlueprintCard
          title="💸 Economy"
          lines={["Tips, subs, paid drops", "Optional collectible badges", "Small, transparent platform cut"]}
        />
        <BlueprintCard
          title="🛡️ Safety"
          lines={["Reputation & strikes", "Age/ID checks where required", "Report/appeal flows & rate limits"]}
        />
      </section>

      {/* Roles */}
      <Section id="roles" title="Roles & Specializations">
        <div className="role-grid">
          <RoleCard
            name="Creator"
            blurb="Make content, build a brand, lead a Squad when you’re ready."
            perks={["Brand themes", "Analytics", "Token-gated rooms"]}
            sampleProgress={{ label: "Lv 4 → Squad unlock @ Lv 6", value: 40 }}
          />
          <RoleCard
            name="Supporter"
            blurb="Comment, share, tip, and recruit friends — be part of the rise."
            perks={["VIP access", "Flex badges", "Supporter rooms"]}
            sampleProgress={{ label: "Lv 3 → Invite bonus @ Lv 6", value: 30 }}
          />
          <RoleCard
            name="Builder"
            blurb="Ship useful tools, templates, and automations for the community."
            perks={["Beta features", "API credits", "Marketplace rev-share"]}
            sampleProgress={{ label: "Lv 2 → Beta access @ Lv 6", value: 20 }}
          />
        </div>
      </Section>

      {/* Progression */}
      <Section id="progression" title="Progression (How leveling feels)">
        <ul className="nice-list">
          <li>
            <b>Global XP</b>: any good action (like, comment, share, learn).
          </li>
          <li>
            <b>Role XP</b>: actions tied to your path (e.g., verified invite → Supporter XP).
          </li>
          <li>
            <b>Streaks</b>: daily consistency gives a small multiplier — no grind abuse.
          </li>
        </ul>
        <div className="progress-demos">
          <Progress label="Creator Lv 4" value={40} />
          <Progress label="Supporter Lv 3" value={30} />
          <Progress label="Builder Lv 2" value={20} />
        </div>
        <BadgeRow items={["Daily Quests", "Weekly Quests", "Seasonal Events"]} />
      </Section>

      {/* Squads */}
      <Section id="squads" title="Squads (Creator-led circles)">
        <p>
          When a Creator hits the unlock level, they can start a <b>Squad</b> — a branded hub with challenges, events, and a vibe.
          Supporters gain Squad XP for verified invites and participation. Squads show on leaderboards by engagement, learning, and
          revenue.
        </p>
        <ul className="nice-list">
          <li>🤝 <b>Recruitment quests</b> to grow the circle</li>
          <li>📈 <b>Leaderboards</b> (daily/weekly/seasonal)</li>
          <li>🎟️ <b>VIP rooms</b> and collab drops</li>
        </ul>
      </Section>

      {/* Knowledge */}
      <Section id="knowledge" title="Knowledge Hub (learn → unlock)">
        <div className="card plain">
          <ul className="nice-list">
            <li>📜 <b>Own Your IP</b>: contracts, licensing, red flags</li>
            <li>🧠 <b>Branding & Funnels</b>: turn fans into community</li>
            <li>🧯 <b>Safety</b>: boundaries, verification, risk checklists</li>
          </ul>
        </div>
        <p className="muted">Complete short lessons → pass quick quizzes → earn badges and unlock better tools.</p>
      </Section>

      {/* Economy */}
      <Section id="economy" title="Economy (how money flows)">
        <div className="grid-2">
          <div className="card">
            <h4>For Creators</h4>
            <ul className="nice-list">
              <li>Tips & subscriptions</li>
              <li>Paid drops & streams</li>
              <li>Optional collectible badges</li>
            </ul>
          </div>
          <div className="card">
            <h4>For the Platform</h4>
            <ul className="nice-list">
              <li>Small, transparent cut on paid actions</li>
              <li>Optional premium tools (branding, analytics)</li>
              <li>No trashy ads</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Safety */}
      <Section id="safety" title="Trust & Safety (non-negotiable)">
        <div className="grid-3">
          <Checklist label="Be excellent" items={["No harassment", "No spam", "Respect consent"]} />
          <Checklist label="Proof of age where required" items={["KYC/ID where needed", "Creator-controlled boundaries"]} />
          <Checklist label="Fair tools" items={["Report + appeal flows", "Rate limits", "Reputation system"]} />
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Quick FAQ">
        <div className="faq">
          <QA q="Is this live?" a="This page is a preview. The counters become live when we wire the backend." />
          <QA q="Do I need crypto?" a="No. Core features use normal payments. NFTs/badges are optional for flex/access." />
          <QA q="Is this pay-to-win?" a="No. Money doesn’t buy levels — helpful actions and learning do." />
        </div>
      </Section>

      <footer className="foot reveal">
        <p>We’ll connect Supabase, Livepeer, and Runpod when you’re ready. For now, this page shows the vision.</p>
      </footer>

      {/* Global fonts (safe in styled-jsx global) */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Montserrat:wght@700;800&display=swap");
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Scoped styles */}
      <style jsx>{`
        :root {
          /* 3ROTIX pink — swap if you have an exact HEX */
          --brand: #ff2a76;
          --bg: #0b0c0f;
          --text: #e8e8ea;
          --muted: #a7abb3;
          --line: #262626;
          --card: #121317;
          --chip: #1a1c22;
          --shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }

        .page {
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
          background: var(--bg);
          color: var(--text);
          padding: 24px 24px 64px;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .h1 {
          font-family: Montserrat, Inter, system-ui, sans-serif;
          font-weight: 800;
          letter-spacing: 0.2px;
          font-size: clamp(28px, 4vw, 44px);
          margin: 0 0 6px;
        }

        .hero {
          position: relative;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: clamp(18px, 3vw, 28px);
          box-shadow: var(--shadow);
          overflow: hidden;
          background:
            radial-gradient(1000px 400px at 20% -15%, rgba(255, 42, 118, 0.22), transparent),
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0));
          text-align: center;
          margin-bottom: 16px;
        }
        .hero-glow {
          position: absolute;
          inset: -40% -10% auto -20%;
          height: 50%;
          background: radial-gradient(60% 60% at 30% 50%, rgba(255, 42, 118, 0.25), transparent 70%);
          pointer-events: none;
          filter: blur(10px);
        }
        .sub { margin: 0 0 10px; color: var(--muted); }

        .pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .pill {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--card);
          font-size: 0.9rem;
          transition: transform 120ms ease, box-shadow 220ms ease, border-color 200ms ease;
        }
        .pill:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow);
          border-color: var(--brand);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin: 18px 0 6px;
        }
        .card {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--card);
          padding: 14px;
          box-shadow: var(--shadow);
        }
        .plain { background: transparent; box-shadow: none; }

        .bp h3 { margin: 0 0 6px; font-size: 1rem; letter-spacing: 0.1px; }
        .bp ul { margin: 0; padding-left: 18px; opacity: 0.95; }

        .section {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0)) var(--card);
          padding: 18px;
          margin-top: 14px;
        }
        .section h2 { margin: 0 0 10px; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.2px; }
        .anchor { scroll-margin-top: 72px; }

        .role-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
        .role h4 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; }
        .muted { color: var(--muted); }

        .nice-list { margin: 0; padding-left: 18px; }

        .progress-demos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 8px; }
        .progress { display: grid; gap: 6px; }
        .bar {
          height: 10px;
          border-radius: 999px;
          background: #1b1d23;
          position: relative;
          overflow: hidden;
          outline: 1px solid var(--line);
        }
        .bar > span {
          position: absolute; inset: 0 0 0 0;
          width: var(--val);
          background: linear-gradient(90deg, var(--brand), #ff5b98);
          border-radius: 999px;
          transform: translateZ(0);
          animation: grow 900ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }
        @keyframes grow { from { width: 0%; } to { width: var(--val); } }

        .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .badge { padding: 6px 10px; border: 1px dashed var(--line); border-radius: 999px; font-size: 0.85rem; background: var(--chip); }

        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }

        .checklist h4 { margin: 0 0 6px; }
        .checklist ul { margin: 0; padding-left: 18px; }

        .faq { display: grid; gap: 10px; }
        .qa { border-left: 3px solid var(--brand); padding-left: 10px; }
        .qa h4 { margin: 0 0 4px; font-size: 1rem; }

        .foot { text-align: center; opacity: 0.75; margin-top: 18px; }

        /* Mini-map */
        .minimap {
          position: fixed; right: 16px; top: 16px; width: 220px;
          background: rgba(18,19,23,0.9); backdrop-filter: blur(6px);
          border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow);
          padding: 10px; z-index: 40; display: none;
        }
        @media (min-width: 1100px) {
          .minimap { display: block; }
          .page { padding-right: 260px; }
        }
        .mm-head { font-weight: 800; font-size: 0.95rem; margin-bottom: 6px; letter-spacing: 0.2px; }
        .minimap ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
        .mm-link {
          width: 100%; text-align: left; padding: 8px 10px; border-radius: 10px;
          border: 1px solid var(--line); background: #0f1115; color: var(--text);
          display: flex; align-items: center; gap: 8px;
          transition: border-color 200ms ease, transform 120ms ease, background 200ms ease;
        }
        .mm-link:hover { transform: translateY(-1px); border-color: var(--brand); background: #12141a; }
        .mm-active { outline: 2px solid var(--brand); background: #141620; }
        .dot { width: 8px; height: 8px; border-radius: 999px; background: var(--brand); box-shadow: 0 0 0 3px rgba(255,42,118,0.18); }

        /* Smooth reveal animation */
        .reveal { opacity: 0; transform: translateY(10px); transition: opacity 500ms ease, transform 500ms ease; }
        .reveal-in { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}

/* ---------- Components ---------- */

function Section({ id, title, children }) {
  return (
    <section id={id} className="section anchor reveal">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function BlueprintCard({ title, lines }) {
  return (
    <div className="card bp">
      <h3>{title}</h3>
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({ name, blurb, perks = [], sampleProgress }) {
  return (
    <div className="card role">
      <h4>{name}</h4>
      <p className="muted">{blurb}</p>
      <ul className="nice-list">
        {perks.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      {sampleProgress && <Progress label={sampleProgress.label} value={sampleProgress.value} />}
    </div>
  );
}

function Progress({ label, value }) {
  // Inline CSS var for bar width (styled-jsx accepts it)
  const style = { ["--val"]: `${value}%` };
  return (
    <div className="progress card plain">
      <strong>{label}</strong>
      <div className="bar" style={style}>
        <span />
      </div>
    </div>
  );
}

function BadgeRow({ items = [] }) {
  return (
    <div className="badge-row">
      {items.map((t, i) => (
        <span key={i} className="badge">
          {t}
        </span>
      ))}
    </div>
  );
}

function Checklist({ label, items }) {
  return (
    <div className="card checklist">
      <h4>{label}</h4>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function QA({ q, a }) {
  return (
    <div className="qa">
      <h4>{q}</h4>
      <p className="muted">{a}</p>
    </div>
  );
}
