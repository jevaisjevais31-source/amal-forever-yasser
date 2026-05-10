import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// 32 days together as of 11/05 (her birthday). Anchor start date so the counter ticks forward in real time.
const ANCHOR_DATE = new Date("2026-05-11T00:00:00");
const ANCHOR_DAYS = 32;

function useDaysCounter() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, []);
  // Smoothly accelerate from 32 days up to ~5 years (1825 days) over a short reveal animation, then keep ticking real-time
  const [phase, setPhase] = useState<"reveal" | "live">("reveal");
  const startRef = useRef<number>(Date.now());
  useEffect(() => {
    const t = setTimeout(() => setPhase("live"), 4200);
    return () => clearTimeout(t);
  }, []);
  if (phase === "reveal") {
    const elapsed = (now - startRef.current) / 4200;
    const t = Math.min(1, Math.max(0, elapsed));
    const eased = 1 - Math.pow(1 - t, 3);
    const target = 1825; // 5 years in days
    const days = ANCHOR_DAYS + (target - ANCHOR_DAYS) * eased;
    return { days, phase };
  }
  // live phase – count from anchor in real time, with sub-second precision
  const diffMs = now - ANCHOR_DATE.getTime();
  const days = ANCHOR_DAYS + diffMs / (1000 * 60 * 60 * 24);
  return { days: Math.max(ANCHOR_DAYS, days), phase };
}

function FloatingHearts() {
  const hearts = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 10,
      size: 14 + Math.random() * 22,
      opacity: 0.4 + Math.random() * 0.5,
    })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute"
          style={{
            left: `${h.left}%`,
            bottom: "-40px",
            fontSize: h.size,
            opacity: h.opacity,
            animation: `float-up ${h.duration}s linear ${h.delay}s infinite`,
          }}
        >
          💗
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const { days } = useDaysCounter();
  const whole = Math.floor(days);
  const decimals = ((days - whole) * 10000).toFixed(0).padStart(4, "0");
  const years = (days / 365).toFixed(2);
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-script text-2xl md:text-3xl text-rose animate-fade-up">to my dearest</p>
      <h1 className="mt-2 text-7xl md:text-9xl font-display font-semibold text-shimmer animate-fade-up" style={{ animationDelay: "0.2s" }}>
        Amal
      </h1>
      <p className="mt-6 text-xl md:text-2xl font-display italic text-deep animate-fade-up" style={{ animationDelay: "0.5s" }}>
        Happy Birthday, my love · 11 / 05
      </p>

      <div className="mt-14 rounded-3xl border border-rose/20 bg-card/70 backdrop-blur-md px-8 md:px-14 py-8 shadow-romantic animate-fade-up" style={{ animationDelay: "0.9s" }}>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Days since you became mine</p>
        <div className="mt-3 flex items-baseline justify-center gap-2 font-display">
          <span className="text-6xl md:text-8xl font-semibold text-primary tabular-nums">{whole}</span>
          <span className="text-2xl md:text-3xl text-rose tabular-nums">.{decimals}</span>
          <span className="ml-2 text-xl md:text-2xl text-muted-foreground">days</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">that's {years} years of you and me 💞</p>
      </div>

      <p className="mt-12 max-w-xl text-muted-foreground animate-fade-up" style={{ animationDelay: "1.2s" }}>
        Scroll down, my love — I made every inch of this for you. ↓
      </p>
    </section>
  );
}

const wishes = [
  "May you become the brilliant doctor you've always dreamed of being — the world needs your healing hands. 🩺",
  "May every patient you ever meet feel a little of the warmth I feel when I'm with you.",
  "May your white coat fit you as perfectly as you fit into my heart.",
  "May you ace every exam, every shift, every dream — and may I be there to celebrate each one.",
  "May this year bring the day we finally close the distance between us.",
  "May you always know — even from miles away — that you are deeply, ridiculously, endlessly loved.",
  "May your laugh stay as loud, your smile as bright, and your heart as soft as the day I fell for you.",
  "May 11/05 always be the most beautiful day of the year, because it's the day the world got Amal.",
];

function BirthdayWish() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const next = () => {
    setIdx((i) => (i + 1) % wishes.length);
    setOpen(true);
  };
  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">A wish for you</h2>
      <p className="mt-3 font-script text-2xl text-rose">click the button — a new wish each time</p>
      <button
        onClick={next}
        className="mt-8 rounded-full px-10 py-5 text-lg font-medium text-primary-foreground shadow-romantic hover:scale-105 active:scale-95 transition-transform"
        style={{ background: "var(--gradient-romance)" }}
      >
        🎂 Birthday Wish
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-deep/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg rounded-3xl bg-card p-10 shadow-romantic animate-fade-up border border-rose/20"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl animate-heartbeat">💝</div>
            <p className="mt-4 font-display text-2xl md:text-3xl leading-relaxed text-deep">{wishes[idx]}</p>
            <p className="mt-6 font-script text-xl text-rose">— always yours, Yasser</p>
            <button onClick={() => setOpen(false)} className="mt-6 text-sm text-muted-foreground hover:text-rose">close</button>
          </div>
        </div>
      )}
    </section>
  );
}

function LoveQuestion() {
  const [yesScale, setYesScale] = useState(1);
  const [noClicks, setNoClicks] = useState(0);
  const [confessed, setConfessed] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  const noTexts = ["No", "Are you sure?", "Really?", "Think again 🥺", "Yasser is sad now…", "Plot twist?", "…", "Okay fine click yes"];

  const handleNo = () => {
    setYesScale((s) => s * 1.45);
    setNoClicks((c) => c + 1);
    // make the no button run away
    setNoPos({ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 100 });
  };

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">Do you love me, Amal?</h2>
      <p className="mt-3 font-script text-2xl text-rose">be honest 👀</p>

      {!confessed ? (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 min-h-[160px]">
          <button
            onClick={() => setConfessed(true)}
            style={{ transform: `scale(${Math.min(yesScale, 4)})` }}
            className="rounded-full px-10 py-5 text-lg font-semibold text-primary-foreground shadow-romantic transition-transform duration-300 origin-center"
          >
            <span style={{ background: "var(--gradient-romance)", padding: "1.25rem 2.5rem", borderRadius: "9999px" }}>
              Yes 💖
            </span>
          </button>

          <button
            onClick={handleNo}
            style={{ transform: `translate(${noPos.x}px, ${noPos.y}px) scale(${Math.max(0.4, 1 - noClicks * 0.1)})` }}
            className="rounded-full border border-rose/40 bg-card px-8 py-4 text-base text-muted-foreground transition-all duration-300"
          >
            {noTexts[Math.min(noClicks, noTexts.length - 1)]}
          </button>
        </div>
      ) : (
        <div className="mt-12 animate-fade-up">
          <p className="text-6xl">💞</p>
          <p className="mt-4 font-display text-3xl text-deep italic">"I knew it."</p>
          <p className="mt-2 font-script text-2xl text-rose">I love you too, Amal — more than yesterday, less than tomorrow.</p>
        </div>
      )}
    </section>
  );
}

const reasons = [
  "Your laugh — it could power a whole city.",
  "The way you talk about medicine, like you were born for it.",
  "How you make 'good morning' feel like a hug.",
  "Your patience with me, especially when the timezones get cruel.",
  "That little voice note you sent me at 2am — I still listen to it.",
  "How you remember every tiny thing I say.",
  "Your dreams. They make mine feel possible.",
  "The way you say my name.",
  "You. Just you. All of you.",
];

function Reasons() {
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-display text-deep">9 reasons</h2>
        <p className="mt-3 font-script text-2xl text-rose">…out of an infinite list</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-rose/20 bg-card/70 backdrop-blur p-6 text-left shadow-sm hover:shadow-romantic hover:-translate-y-1 transition-all"
              style={{ animation: `fade-up 0.6s ease-out ${i * 0.08}s both` }}
            >
              <div className="text-3xl text-gold font-display">0{i + 1}</div>
              <p className="mt-2 font-display text-lg text-deep italic leading-snug">{r}</p>
              <span className="absolute top-4 right-4 text-xl opacity-0 group-hover:opacity-100 transition">💗</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const timeline = [
  { date: "10 Apr", title: "Day 0", text: "The day everything started. The day my luck began." },
  { date: "Soon", title: "Late night calls", text: "Voices traveling oceans, hearts ignoring distance." },
  { date: "Today", title: "11 / 05 — your day", text: "The world celebrates you. So do I, louder than anyone." },
  { date: "Soon", title: "Med school glory", text: "Dr. Amal. I can already see it stitched on your coat." },
  { date: "One day", title: "No more screens", text: "I'll meet you at the airport. I won't be able to speak." },
];

function Timeline() {
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-display text-deep text-center">Our story (so far)</h2>
        <p className="mt-3 text-center font-script text-2xl text-rose">the best chapters are still unwritten</p>
        <div className="mt-14 relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-rose via-gold to-rose" />
          {timeline.map((t, i) => (
            <div
              key={i}
              className={`relative mb-10 md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:ml-auto md:pl-12"}`}
              style={{ animation: `fade-up 0.6s ease-out ${i * 0.1}s both` }}
            >
              <div className={`absolute top-2 w-4 h-4 rounded-full bg-rose shadow-glow ${i % 2 === 0 ? "left-2 md:left-auto md:-right-2" : "left-2 md:-left-2"}`} />
              <div className="rounded-2xl border border-rose/20 bg-card/70 backdrop-blur p-6 shadow-sm">
                <div className="text-xs uppercase tracking-widest text-gold">{t.date}</div>
                <h3 className="mt-1 font-display text-2xl text-deep">{t.title}</h3>
                <p className="mt-2 text-muted-foreground">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Letter() {
  const [open, setOpen] = useState(false);
  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">A letter, sealed for you</h2>
      <p className="mt-3 font-script text-2xl text-rose">go on, open it</p>
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative w-72 h-48 transition-transform hover:-translate-y-1"
          aria-label="Open letter"
        >
          <div
            className="absolute inset-0 rounded-lg shadow-romantic"
            style={{ background: "var(--gradient-romance)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-6xl">{open ? "💌" : "✉️"}</div>
        </button>
      </div>
      {open && (
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-rose/20 bg-card/80 backdrop-blur p-10 text-left shadow-romantic animate-fade-up">
          <p className="font-display text-xl md:text-2xl leading-relaxed text-deep italic">
            My Amal,
            <br /><br />
            I'm writing this from too many kilometers away, but somehow you feel closer than the people in the same room as me.
            32 days. That's all it took for you to become the first thought when I wake and the last when I sleep.
            <br /><br />
            I know distance is hard. I know we count hours like other couples count dates. But every "good morning" from you
            is worth a hundred coffees. Every voice note is a small concert. Every photo you send is the only wallpaper my eyes care about.
            <br /><br />
            Today is your day, my love. So blow out the candles and make a wish — but know that mine is already locked in:
            <br />a long, healthy, ridiculous life with you. Doctor Amal and her favorite patient, me. 🩺💗
            <br /><br />
            Happy Birthday, Amal. I love you in every language I know, and a few I'm still inventing.
          </p>
          <p className="mt-6 font-script text-3xl text-rose">— Yasser</p>
        </div>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative px-6 py-16 text-center">
      <p className="font-script text-3xl text-rose">forever yours,</p>
      <p className="mt-2 font-display text-5xl md:text-6xl text-shimmer">Yasser</p>
      <p className="mt-6 text-sm text-muted-foreground">made with 💗 across a too-wide ocean — 11 / 05 / 2026</p>
    </footer>
  );
}

function Index() {
  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "radial-gradient(ellipse at top, oklch(0.95 0.05 15) 0%, oklch(0.985 0.012 20) 50%, oklch(0.92 0.06 25) 100%)" }}
    >
      <FloatingHearts />
      <div className="relative z-10">
        <Hero />
        <BirthdayWish />
        <LoveQuestion />
        <Reasons />
        <Timeline />
        <Letter />
        <Footer />
      </div>
    </main>
  );
}
