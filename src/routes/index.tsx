import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// 32 days together as of 11/05 (her birthday). Anchor so counter ticks forever.
const ANCHOR_DATE = new Date("2026-05-11T00:00:00");
const ANCHOR_DAYS = 32;

function useTogether() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => ANCHOR_DATE.getTime());
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, []);
  if (!mounted) {
    return { days: ANCHOR_DAYS, hours: 0, minutes: 0, seconds: 0, ms: 0, mounted: false };
  }
  const diffMs = now - ANCHOR_DATE.getTime();
  const totalMs = ANCHOR_DAYS * 86400000 + diffMs;
  const totalSec = Math.max(ANCHOR_DAYS * 86400, totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const ms = Math.floor((totalSec * 1000) % 1000);
  return { days, hours, minutes, seconds, ms, mounted: true };
}

function FloatingHearts() {
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; duration: number; size: number; opacity: number }[]>([]);
  useEffect(() => {
    setHearts(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 10,
        size: 14 + Math.random() * 22,
        opacity: 0.4 + Math.random() * 0.5,
      }))
    );
  }, []);
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
  const { days, hours, minutes, seconds, ms } = useTogether();
  const cells: { label: string; value: string }[] = [
    { label: "days", value: String(days) },
    { label: "hours", value: String(hours).padStart(2, "0") },
    { label: "minutes", value: String(minutes).padStart(2, "0") },
    { label: "seconds", value: String(seconds).padStart(2, "0") },
    { label: "ms", value: String(ms).padStart(3, "0") },
  ];
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-script text-2xl md:text-3xl text-rose animate-fade-up">to my dearest habibti</p>
      <h1 className="mt-2 text-7xl md:text-9xl font-display font-semibold text-shimmer animate-fade-up" style={{ animationDelay: "0.2s" }}>
        Amal
      </h1>
      <p className="mt-6 text-xl md:text-2xl font-display italic text-deep animate-fade-up" style={{ animationDelay: "0.5s" }}>
        Happy Birthday, ya hayati · 11 / 05
      </p>

      <div className="mt-14 rounded-3xl border border-rose/20 bg-card/70 backdrop-blur-md px-6 md:px-12 py-8 shadow-romantic animate-fade-up" style={{ animationDelay: "0.9s" }}>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">since you became mine</p>
        <div className="mt-4 flex flex-wrap items-end justify-center gap-3 md:gap-5 font-display">
          {cells.map((c, i) => (
            <div key={c.label} className="flex flex-col items-center min-w-[64px]">
              <span className={`tabular-nums font-semibold ${i === 0 ? "text-5xl md:text-7xl text-primary" : "text-3xl md:text-5xl text-rose"}`}>
                {c.value}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">…and counting forever 💞</p>
      </div>

      <p className="mt-12 max-w-xl text-muted-foreground animate-fade-up" style={{ animationDelay: "1.2s" }}>
        Scroll down, my love — every inch is for you. ↓
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
  "May 11/05 always be the most beautiful day of the year, kola nhar a Amal — because it's the day the world got you.",
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

type Burst = { id: number; x: number; y: number; emoji: string };

function Reasons() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(0);

  const reveal = (i: number, e: React.MouseEvent) => {
    setRevealed((s) => new Set(s).add(i));
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const emojis = ["🌸", "🌹", "💐", "💖", "🌷", "💕", "✨", "🌺"];
    const newBursts: Burst[] = Array.from({ length: 14 }, () => ({
      id: idRef.current++,
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 60,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setBursts((b) => [...b, ...newBursts]);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => !newBursts.find((n) => n.id === x.id)));
    }, 1600);
  };

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-display text-deep">9 reasons <span className="text-rose">out of infinite</span></h2>
        <p className="mt-3 font-script text-2xl text-rose">tap each card to reveal — wlh kayn bzaf 💝</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => {
            const isOpen = revealed.has(i);
            return (
              <button
                key={i}
                onClick={(e) => reveal(i, e)}
                className="group relative rounded-2xl border border-rose/20 bg-card/70 backdrop-blur p-6 text-left shadow-sm hover:shadow-romantic hover:-translate-y-1 transition-all min-h-[140px] overflow-hidden"
                style={{ animation: `fade-up 0.6s ease-out ${i * 0.08}s both` }}
              >
                <div className="text-3xl text-gold font-display">0{i + 1}</div>
                {isOpen ? (
                  <p className="mt-2 font-display text-lg text-deep italic leading-snug animate-fade-up">{r}</p>
                ) : (
                  <p className="mt-2 font-script text-xl text-rose/80">tap to reveal…</p>
                )}
                <span className="absolute top-4 right-4 text-xl">{isOpen ? "💗" : "🤍"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* burst layer */}
      <div className="pointer-events-none fixed inset-0 z-40">
        {bursts.map((b) => (
          <span
            key={b.id}
            className="absolute text-2xl"
            style={{
              left: b.x,
              top: b.y,
              animation: "burst 1.5s ease-out forwards",
              ["--bx" as string]: `${(Math.random() - 0.5) * 240}px`,
              ["--by" as string]: `${-120 - Math.random() * 160}px`,
              ["--br" as string]: `${(Math.random() - 0.5) * 540}deg`,
            }}
          >
            {b.emoji}
          </span>
        ))}
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

// ---------- MINI GAME: Catch the falling hearts ----------
type FallingHeart = { id: number; x: number; y: number; vy: number; emoji: string };

function HeartCatchGame() {
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [hearts, setHearts] = useState<FallingHeart[]>([]);
  const [best, setBest] = useState(0);
  const idRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const spawn = setInterval(() => {
      const w = areaRef.current?.clientWidth ?? 300;
      setHearts((h) => [
        ...h,
        {
          id: idRef.current++,
          x: Math.random() * (w - 40),
          y: -30,
          vy: 1 + Math.random() * 2.5,
          emoji: ["💖", "💗", "💕", "🌸", "🌹"][Math.floor(Math.random() * 5)],
        },
      ]);
    }, 380);
    const move = setInterval(() => {
      setHearts((h) => {
        const max = areaRef.current?.clientHeight ?? 360;
        return h
          .map((p) => ({ ...p, y: p.y + p.vy * 4 }))
          .filter((p) => p.y < max + 40);
      });
    }, 30);
    const tick = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setPlaying(false);
          setBest((b) => Math.max(b, score));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(move);
      clearInterval(tick);
    };
  }, [playing, score]);

  const start = () => {
    setScore(0);
    setTime(20);
    setHearts([]);
    setPlaying(true);
  };

  const catchHeart = (id: number) => {
    setHearts((h) => h.filter((p) => p.id !== id));
    setScore((s) => s + 1);
  };

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">Catch my love 💕</h2>
      <p className="mt-3 font-script text-2xl text-rose">tap as many hearts as you can in 20 seconds</p>

      <div className="mt-8 mx-auto max-w-2xl">
        <div className="flex items-center justify-between font-display text-lg text-deep px-2">
          <span>⏱ {time}s</span>
          <span>💗 {score}</span>
          <span className="text-gold">★ best {best}</span>
        </div>
        <div
          ref={areaRef}
          className="relative mt-3 h-[360px] rounded-3xl border border-rose/30 bg-card/60 backdrop-blur overflow-hidden"
        >
          {!playing && time === 20 && (
            <button
              onClick={start}
              className="absolute inset-0 m-auto h-fit w-fit rounded-full px-8 py-4 text-lg font-medium text-primary-foreground shadow-romantic"
              style={{ background: "var(--gradient-romance)" }}
            >
              ▶ Start
            </button>
          )}
          {!playing && time === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="font-display text-3xl text-deep">You caught {score} 💗</p>
              <p className="font-script text-xl text-rose">…but you've already caught all of mine.</p>
              <button
                onClick={start}
                className="mt-2 rounded-full px-6 py-3 text-primary-foreground shadow-romantic"
                style={{ background: "var(--gradient-romance)" }}
              >
                play again
              </button>
            </div>
          )}
          {hearts.map((h) => (
            <button
              key={h.id}
              onClick={() => catchHeart(h.id)}
              className="absolute text-3xl select-none active:scale-125 transition-transform"
              style={{ left: h.x, top: h.y }}
            >
              {h.emoji}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- LOVE WHEEL ----------
const wheelSlices = [
  "A long warm hug 🤗",
  "Forehead kiss 😘",
  "Late-night call all night 🌙",
  "I'll cook for you 🍝",
  "A surprise voice note 🎙️",
  "Movie night, your pick 🎬",
  "I owe you flowers 🌹",
  "Kanbghik bzaf, ya Amal 💗",
];

function LoveWheel() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    const slice = Math.floor(Math.random() * wheelSlices.length);
    const target = 360 * 6 + (360 - (slice * (360 / wheelSlices.length)) - 360 / wheelSlices.length / 2);
    setAngle((a) => a + target);
    setTimeout(() => {
      setSpinning(false);
      setResult(wheelSlices[slice]);
    }, 4200);
  };

  const seg = 360 / wheelSlices.length;
  const colors = ["var(--rose)", "var(--gold)", "var(--blush)", "var(--deep)"];

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">Wheel of love 🎡</h2>
      <p className="mt-3 font-script text-2xl text-rose">spin to see what Yasser owes you today</p>

      <div className="mt-12 mx-auto relative w-[300px] h-[300px]">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl z-10">▼</div>
        <div
          className="w-full h-full rounded-full shadow-romantic border-4 border-card"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: "transform 4s cubic-bezier(.17,.67,.2,1)",
            background: `conic-gradient(${wheelSlices
              .map((_, i) => `${colors[i % colors.length]} ${i * seg}deg ${(i + 1) * seg}deg`)
              .join(", ")})`,
          }}
        >
          {wheelSlices.map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-left text-xs text-card font-display"
              style={{ transform: `rotate(${i * seg + seg / 2}deg) translateX(40px)` }}
            >
              💗
            </div>
          ))}
        </div>
        <button
          onClick={spin}
          disabled={spinning}
          className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-card text-deep font-display text-sm shadow-romantic border-4 border-rose disabled:opacity-70"
        >
          {spinning ? "..." : "SPIN"}
        </button>
      </div>

      {result && (
        <p className="mt-8 font-display text-2xl md:text-3xl text-deep italic animate-fade-up">
          ↳ {result}
        </p>
      )}
    </section>
  );
}

// ---------- MEMORY MATCH ----------
const memoryEmojis = ["💗", "🌹", "🌙", "✨", "🎂", "💌"];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const reset = () => {
    const deck = [...memoryEmojis, ...memoryEmojis]
      .map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5)
      .map((c, i) => ({ ...c, id: i }));
    setCards(deck);
    setPicked([]);
    setMoves(0);
    setWon(false);
  };

  useEffect(() => { reset(); }, []);

  const flip = (id: number) => {
    if (picked.length === 2) return;
    setCards((cs) => cs.map((c) => (c.id === id && !c.matched ? { ...c, flipped: true } : c)));
    const next = [...picked, id];
    setPicked(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setTimeout(() => {
        setCards((cs) => {
          const [a, b] = next;
          const ca = cs.find((c) => c.id === a)!;
          const cb = cs.find((c) => c.id === b)!;
          const match = ca.emoji === cb.emoji;
          const updated = cs.map((c) =>
            c.id === a || c.id === b ? { ...c, matched: match, flipped: match } : c
          );
          if (updated.every((c) => c.matched)) setWon(true);
          return updated;
        });
        setPicked([]);
      }, 700);
    }
  };

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">Memory of us 🧠💗</h2>
      <p className="mt-3 font-script text-2xl text-rose">match the pairs — like we matched, hadchi mektab</p>
      <p className="mt-2 text-sm text-muted-foreground">moves: {moves}</p>

      <div className="mt-8 mx-auto grid grid-cols-4 gap-3 max-w-md">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => !c.flipped && flip(c.id)}
            className="aspect-square rounded-2xl border border-rose/30 bg-card/70 backdrop-blur shadow-sm text-3xl flex items-center justify-center transition-all"
            style={{
              transform: c.flipped ? "rotateY(0deg)" : "rotateY(180deg)",
              background: c.matched ? "var(--gradient-romance)" : undefined,
            }}
          >
            {c.flipped ? c.emoji : "💝"}
          </button>
        ))}
      </div>

      {won && (
        <div className="mt-6 animate-fade-up">
          <p className="font-display text-2xl text-deep">You won in {moves} moves 🎉</p>
          <p className="font-script text-xl text-rose">…but you already won my heart in zero.</p>
          <button onClick={reset} className="mt-3 rounded-full px-5 py-2 text-primary-foreground shadow-romantic" style={{ background: "var(--gradient-romance)" }}>
            play again
          </button>
        </div>
      )}
    </section>
  );
}

// ---------- SECRET VAULT ----------
function SecretVault() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [shake, setShake] = useState(false);

  const tryUnlock = () => {
    const c = code.trim().toLowerCase();
    if (c === "amal" || c === "1105" || c === "11/05" || c === "yasser") {
      setUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-4xl md:text-6xl font-display text-deep">The secret vault 🔐</h2>
      <p className="mt-3 font-script text-2xl text-rose">hint: a name, or a date you'll never forget</p>

      {!unlocked ? (
        <div
          className="mt-10 mx-auto flex flex-col sm:flex-row gap-3 justify-center max-w-md"
          style={{ animation: shake ? "burst 0.5s ease" : undefined }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
            placeholder="enter the secret…"
            className="flex-1 rounded-full border border-rose/40 bg-card px-6 py-3 text-deep text-center font-display text-lg outline-none focus:border-rose"
          />
          <button
            onClick={tryUnlock}
            className="rounded-full px-8 py-3 text-primary-foreground shadow-romantic"
            style={{ background: "var(--gradient-romance)" }}
          >
            unlock
          </button>
        </div>
      ) : (
        <div className="mt-10 mx-auto max-w-2xl rounded-3xl border border-gold/40 bg-card/80 backdrop-blur p-10 shadow-romantic animate-fade-up">
          <p className="text-5xl">🗝️💗</p>
          <p className="mt-4 font-display text-2xl md:text-3xl text-deep italic leading-relaxed">
            "If anyone ever asks me what love feels like, I'll just say your name —
            <span className="text-rose"> Amal</span> — and they'll understand everything."
          </p>
          <p className="mt-6 font-script text-xl text-rose">nti dyali, w ana dyalek. forever.</p>
        </div>
      )}
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
          <div className="absolute inset-0 rounded-lg shadow-romantic" style={{ background: "var(--gradient-romance)" }} />
          <div className="absolute inset-0 flex items-center justify-center text-6xl">{open ? "💌" : "✉️"}</div>
        </button>
      </div>
      {open && (
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-rose/20 bg-card/80 backdrop-blur p-10 text-left shadow-romantic animate-fade-up">
          <p className="font-display text-xl md:text-2xl leading-relaxed text-deep italic">
            My Amal,<br /><br />
            I'm writing this from too many kilometers away, but somehow you feel closer than the people in the same room as me.
            32 days. That's all it took for you to become the first thought when I wake and the last when I sleep.
            <br /><br />
            I know distance is hard. I know we count hours like other couples count dates. But every "good morning" from you
            is worth a hundred coffees. Every voice note is a small concert. Every photo you send is the only wallpaper my eyes care about.
            <br /><br />
            Today is your day, my love. So blow out the candles and make a wish — but know that mine is already locked in:
            <br />a long, healthy, ridiculous life with you. Doctor Amal and her favorite patient, me. 🩺💗
            <br /><br />
            Happy Birthday, Amal. Kanbghik bzaf — I love you in every language I know, and a few I'm still inventing.
          </p>
          <p className="mt-6 font-script text-3xl text-rose">— Yasser</p>
        </div>
      )}
    </section>
  );
}

// ---------- FINAL SURPRISE ----------
function playRomanticChord() {
  try {
    const AC: typeof AudioContext =
      (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    // gentle swell
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.2);
    master.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 4);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 11);

    // C major 9 — warm romantic
    const notes = [261.63, 329.63, 392.0, 493.88, 587.33];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      g.gain.value = 0.18;
      // slow vibrato
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 4 + i * 0.3;
      lfoG.gain.value = 1.5;
      lfo.connect(lfoG).connect(o.frequency);
      o.connect(g).connect(master);
      o.start();
      lfo.start();
      o.stop(ctx.currentTime + 11);
      lfo.stop(ctx.currentTime + 11);
    });
    setTimeout(() => ctx.close(), 12000);
  } catch {
    /* no audio — silent fallback */
  }
}

type Particle = { id: number; left: number; delay: number; size: number; type: "heart" | "star"; dur: number; tx: number; ty: number; rot: number };

function FinalSurprise() {
  const [active, setActive] = useState(false);
  const particles = useMemo<Particle[]>(() => {
    if (!active) return [];
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      size: 18 + Math.random() * 36,
      type: Math.random() > 0.45 ? "heart" : "star",
      dur: 3 + Math.random() * 4,
      tx: (Math.random() - 0.5) * 160,
      ty: -120 - Math.random() * 280,
      rot: (Math.random() - 0.5) * 720,
    }));
  }, [active]);

  const trigger = () => {
    setActive(true);
    playRomanticChord();
  };

  return (
    <section className="relative px-6 py-24 text-center">
      <h2 className="text-3xl md:text-5xl font-display text-deep">one last thing…</h2>
      <button
        onClick={trigger}
        className="mt-8 rounded-full px-10 py-6 text-xl font-semibold text-primary-foreground shadow-romantic hover:scale-105 active:scale-95 transition-transform"
        style={{ background: "var(--gradient-romance)" }}
      >
        ✨ Click here for one last surprise ✨
      </button>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6 text-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.35 0.18 5 / 0.92) 0%, oklch(0.18 0.12 350 / 0.96) 70%, oklch(0.1 0.08 340 / 0.98) 100%)",
          }}
          onClick={() => setActive(false)}
        >
          {/* particles */}
          <div className="pointer-events-none absolute inset-0">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.left}%`,
                  bottom: "-40px",
                  fontSize: p.size,
                  animation: p.type === "star" ? `star-grow ${p.dur}s ease-out ${p.delay}s forwards` : `heart-explode ${p.dur}s ease-out ${p.delay}s forwards`,
                  ["--tx" as string]: `${p.tx}px`,
                  ["--ty" as string]: `${p.ty}px`,
                  ["--rot" as string]: `${p.rot}deg`,
                }}
              >
                {p.type === "star" ? "✨" : Math.random() > 0.5 ? "💖" : "💗"}
              </span>
            ))}
          </div>

          <div className="relative z-10 max-w-3xl animate-fade-up">
            <p className="font-script text-3xl md:text-5xl text-blush">my Amal,</p>
            <h3 className="mt-4 font-display text-4xl md:text-7xl leading-tight text-shimmer">
              You are the best thing that ever happened to me.
            </h3>
            <p className="mt-8 font-script text-2xl md:text-4xl text-blush leading-snug">
              ghakhtarek mlyar mra · kola nhar a Amal 💕
            </p>
            <p className="mt-10 text-sm text-blush/70">tap anywhere to close</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ───────── Love Note Generator ─────────
const noteStarts = ["habibti", "ya hayati", "ya 9amar", "my Amal", "my whole world"];
const noteMids = [
  "you are the reason my mornings feel soft",
  "I close my eyes and I still see you smiling",
  "even the distance kanbghik bzaf",
  "every song reminds me of your voice",
  "you are my favourite plot twist",
  "kola dakika bjiha, kantfekrek",
  "you make ordinary days feel like poetry",
];
const noteEnds = ["forever yours, Y.", "till the stars run out 🌙", "kola nhar a Amal 💞", "wlh ana dyalek 💗", "and a thousand more lifetimes."];
function LoveNotes() {
  const [note, setNote] = useState<string | null>(null);
  const generate = () => {
    const a = noteStarts[Math.floor(Math.random() * noteStarts.length)];
    const b = noteMids[Math.floor(Math.random() * noteMids.length)];
    const c = noteEnds[Math.floor(Math.random() * noteEnds.length)];
    setNote(`${a},\n${b}.\n${c}`);
  };
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-script text-3xl text-rose">a love note generator</p>
        <h2 className="mt-2 font-display text-4xl md:text-6xl text-deep">infinite tiny letters</h2>
        <p className="mt-3 text-muted-foreground">tap the envelope — a new one for every mood, ya hayati</p>
        <button
          onClick={generate}
          className="mt-10 text-7xl md:text-8xl hover:scale-110 active:scale-95 transition-transform"
          aria-label="new note"
        >
          💌
        </button>
        {note && (
          <div key={note} className="mt-10 mx-auto max-w-md rounded-3xl border border-rose/20 bg-card/80 backdrop-blur-md p-8 shadow-romantic animate-fade-up">
            <p className="font-display italic text-xl md:text-2xl text-deep whitespace-pre-line leading-relaxed">{note}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ───────── Constellation (click sky to draw stars) ─────────
function Constellation() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([]);
  const idRef = useRef(0);
  const add = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setStars((s) => [...s, { id: idRef.current++, x, y }]);
  };
  const reset = () => setStars([]);
  const points = stars.map((s) => `${s.x},${s.y}`).join(" ");
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="font-script text-3xl text-rose">our private sky</p>
        <h2 className="mt-2 font-display text-4xl md:text-6xl text-deep">draw a constellation for us</h2>
        <p className="mt-3 text-muted-foreground">click anywhere on the sky — every star is a memory ✨</p>
        <div
          onClick={add}
          className="relative mt-10 h-[60vh] w-full rounded-3xl overflow-hidden cursor-crosshair border border-rose/20 shadow-romantic"
          style={{ background: "radial-gradient(ellipse at center, oklch(0.18 0.08 280) 0%, oklch(0.08 0.05 270) 100%)" }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {stars.length > 1 && (
              <polyline points={points} fill="none" stroke="oklch(0.85 0.13 75)" strokeWidth="0.25" strokeDasharray="0.6 0.6" opacity="0.7" />
            )}
          </svg>
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl animate-sparkle"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >✨</span>
          ))}
          {stars.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center font-script text-3xl text-blush/60">tap the sky, habibti</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{stars.length} stars · {Math.max(0, stars.length - 1)} lines drawn</span>
          {stars.length > 0 && (
            <button onClick={reset} className="underline hover:text-rose">reset sky</button>
          )}
        </div>
      </div>
    </section>
  );
}

// ───────── Compliment Slot Machine ─────────
const slot1 = ["smart", "kind", "funny", "soft", "fierce", "magic", "rare", "warm"];
const slot2 = ["doctor", "dreamer", "queen", "muse", "sunshine", "trouble", "miracle", "9amar"];
const slot3 = ["💗", "🌙", "✨", "🌹", "🩺", "💞", "🍓", "👑"];
function SlotMachine() {
  const [reels, setReels] = useState<[string, string, string]>([slot1[0], slot2[0], slot3[0]]);
  const [spinning, setSpinning] = useState(false);
  const [count, setCount] = useState(0);
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    let ticks = 0;
    const id = setInterval(() => {
      setReels([
        slot1[Math.floor(Math.random() * slot1.length)],
        slot2[Math.floor(Math.random() * slot2.length)],
        slot3[Math.floor(Math.random() * slot3.length)],
      ]);
      ticks++;
      if (ticks > 18) {
        clearInterval(id);
        setSpinning(false);
        setCount((c) => c + 1);
      }
    }, 70);
  };
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-script text-3xl text-rose">compliment slot machine</p>
        <h2 className="mt-2 font-display text-4xl md:text-6xl text-deep">three reels, infinite truths</h2>
        <p className="mt-3 text-muted-foreground">because one compliment is never enough for you</p>
        <div className="mt-10 inline-flex gap-3 md:gap-5 rounded-3xl border border-gold/40 bg-card/80 backdrop-blur-md px-6 py-8 shadow-romantic">
          {reels.map((r, i) => (
            <div
              key={i}
              className="min-w-[110px] md:min-w-[150px] h-24 md:h-28 flex items-center justify-center rounded-2xl bg-gradient-to-b from-blush/40 to-rose/20 border border-rose/30"
            >
              <span className={`font-display text-2xl md:text-4xl text-deep ${spinning ? "blur-[1px]" : ""}`}>{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={spin}
            disabled={spinning}
            className="rounded-full bg-gradient-to-r from-rose to-deep text-primary-foreground font-display text-lg px-8 py-3 shadow-romantic hover:scale-105 active:scale-95 transition-transform disabled:opacity-60"
          >
            {spinning ? "spinning…" : "spin for me 🎰"}
          </button>
        </div>
        {count > 0 && !spinning && (
          <p className="mt-6 font-script text-2xl text-rose">you are {reels[0]} {reels[1]} {reels[2]} — and that's {count}× confirmed</p>
        )}
      </div>
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
      <MusicPlayer />
      <div className="relative z-10">
        <Hero />
        <BirthdayWish />
        <LoveQuestion />
        <Reasons />
        <LoveNotes />
        <HeartCatchGame />
        <SlotMachine />
        <LoveWheel />
        <MemoryMatch />
        <Constellation />
        <Timeline />
        <SecretVault />
        <Letter />
        <FinalSurprise />
        <Footer />
      </div>
    </main>
  );
}
