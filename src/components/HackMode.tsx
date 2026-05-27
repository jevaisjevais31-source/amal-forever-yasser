import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, X, BarChart3, ListTodo, Gamepad2, HeartCrack, Sparkles, Send, Wind, RefreshCw, Trophy, Clock, MessageCircle, Heart, Plus, Trash2, Check } from "lucide-react";

type Msg = { id: string; sender_id: string; receiver_id: string; content: string | null; created_at: string };
type Props = {
  messages: Msg[];
  userId: string;
  friendId: string;
  friendName: string;
  myName: string;
  accent: string;
  sendMessage: (text: string) => void;
};

const HACK_CODE = "yasserloveamal";
const STORAGE_KEY = "hackmode_unlocked_v1";
const TODOS_KEY = (uid: string, fid: string) => `hack_todos_${uid}_${fid}`;
const SESSION_START_KEY = (uid: string, fid: string) => `hack_session_${uid}_${fid}_${new Date().toDateString()}`;

type Todo = { id: string; text: string; done: boolean; priority?: number; category?: string };

const LOVE_PATTERNS = [
  /i\s*love\s*(you|u)/i,
  /je\s*t['' ]?aime/i,
  /kan?bghi[ck]/i,
  /nb?ghi[ck]/i,
  /tanbghi[ck]/i,
];

function countLove(text: string): number {
  if (!text) return 0;
  let n = 0;
  for (const p of LOVE_PATTERNS) if (p.test(text)) n++;
  return n;
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function HackMode({ messages, userId, friendId, friendName, myName, accent, sendMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [tab, setTab] = useState<"stats" | "todo" | "games" | "fight">("stats");

  // Live timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [open]);

  // Session start (per-day-per-friend, persisted)
  const sessionStart = useMemo(() => {
    const key = SESSION_START_KEY(userId, friendId);
    let v = localStorage.getItem(key);
    if (!v) { v = String(Date.now()); localStorage.setItem(key, v); }
    return Number(v);
  }, [userId, friendId]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  function tryUnlock() {
    if (codeInput.trim().toLowerCase() === HACK_CODE) {
      setUnlocked(true);
      localStorage.setItem(STORAGE_KEY, "1");
      toast.success("🔓 Hack mode unlocked");
      setCodeInput("");
    } else {
      toast.error("Wrong code 🤫");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Hack mode"
        className="p-2 rounded-full hover:bg-white/10 text-slate-300 relative"
      >
        <Lock className="h-4 w-4" />
        {unlocked && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm grid place-items-center px-3">
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-emerald-400/30 shadow-[0_0_60px_-10px_rgba(16,185,129,0.5)] flex flex-col"
            style={{ background: "linear-gradient(160deg, #0a1612 0%, #0b141a 60%, #1a0a14 100%)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-400/20 bg-black/40">
              <div className="flex items-center gap-2 font-mono text-emerald-300">
                <Lock className="h-4 w-4" />
                <span className="text-sm tracking-wider">{unlocked ? "HACK_MODE://" : "ACCESS_REQUIRED"}</span>
                <span className="inline-block h-3 w-1.5 bg-emerald-400 animate-pulse" />
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5"/></button>
            </div>

            {!unlocked ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">🔐</div>
                <p className="font-mono text-emerald-300 text-sm mb-1">Enter the secret code</p>
                <p className="text-slate-500 text-xs mb-5">Only you & her know it 🤫</p>
                <input
                  autoFocus type="password" value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                  placeholder="••••••••••"
                  className="w-full max-w-xs mx-auto block rounded-lg bg-black/60 border border-emerald-400/30 px-4 py-3 font-mono text-center text-emerald-200 outline-none focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                />
                <button onClick={tryUnlock}
                  className="mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2">
                  Unlock
                </button>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/30 overflow-x-auto">
                  {[
                    { id: "stats", icon: BarChart3, label: "Stats" },
                    { id: "todo", icon: ListTodo, label: "To-Do AI" },
                    { id: "games", icon: Gamepad2, label: "Games" },
                    { id: "fight", icon: HeartCrack, label: "Fight Mode" },
                  ].map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                        tab === t.id ? "text-emerald-300 border-b-2 border-emerald-400 bg-white/5" : "text-slate-400 hover:text-white"
                      }`}>
                      <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {tab === "stats" && <StatsPanel messages={messages} userId={userId} friendId={friendId} friendName={friendName} myName={myName} sessionStart={sessionStart} now={now} />}
                  {tab === "todo" && <TodoPanel userId={userId} friendId={friendId} accent={accent} sendMessage={sendMessage} />}
                  {tab === "games" && <GamesPanel sendMessage={sendMessage} friendName={friendName} />}
                  {tab === "fight" && <FightPanel sendMessage={sendMessage} friendName={friendName} myName={myName} />}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ============ STATS ============ */
function StatsPanel({ messages, userId, friendId, friendName, myName, sessionStart, now }: {
  messages: Msg[]; userId: string; friendId: string; friendName: string; myName: string; sessionStart: number; now: number;
}) {
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todayMsgs = messages.filter((m) => new Date(m.created_at).getTime() >= todayMs);
    const myMsgs = messages.filter((m) => m.sender_id === userId);
    const herMsgs = messages.filter((m) => m.sender_id === friendId);
    let myLove = 0, herLove = 0;
    myMsgs.forEach((m) => { myLove += countLove(m.content ?? ""); });
    herMsgs.forEach((m) => { herLove += countLove(m.content ?? ""); });

    // Avg response time (mine): for each of my messages preceded by hers
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const m = messages[i], prev = messages[i - 1];
      if (m.sender_id === userId && prev.sender_id === friendId) {
        const dt = new Date(m.created_at).getTime() - new Date(prev.created_at).getTime();
        if (dt > 0 && dt < 1000 * 60 * 60 * 6) responseTimes.push(dt);
      }
    }
    const avgMine = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const responseTimesHer: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const m = messages[i], prev = messages[i - 1];
      if (m.sender_id === friendId && prev.sender_id === userId) {
        const dt = new Date(m.created_at).getTime() - new Date(prev.created_at).getTime();
        if (dt > 0 && dt < 1000 * 60 * 60 * 6) responseTimesHer.push(dt);
      }
    }
    const avgHer = responseTimesHer.length ? responseTimesHer.reduce((a, b) => a + b, 0) / responseTimesHer.length : 0;

    // Word count
    const myWords = myMsgs.reduce((acc, m) => acc + (m.content?.split(/\s+/).filter(Boolean).length ?? 0), 0);
    const herWords = herMsgs.reduce((acc, m) => acc + (m.content?.split(/\s+/).filter(Boolean).length ?? 0), 0);

    // Longest streak day
    const days = new Set(messages.map((m) => new Date(m.created_at).toDateString()));

    return {
      todayCount: todayMsgs.length,
      totalCount: messages.length,
      myCount: myMsgs.length,
      herCount: herMsgs.length,
      myLove, herLove,
      avgMine, avgHer,
      myWords, herWords,
      activeDays: days.size,
    };
  }, [messages, userId, friendId]);

  const chatTime = now - sessionStart;
  const total = stats.myCount + stats.herCount || 1;
  const myPct = Math.round((stats.myCount / total) * 100);

  return (
    <div className="space-y-4">
      {/* Live timer hero */}
      <div className="rounded-xl p-5 text-center border border-emerald-400/30 bg-gradient-to-br from-emerald-900/40 to-black">
        <div className="text-xs text-emerald-300 font-mono mb-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3"/> SESSION TIME TODAY</div>
        <div className="text-4xl font-mono font-bold text-emerald-300 tabular-nums tracking-wider">{fmtDuration(chatTime)}</div>
        <div className="text-xs text-slate-400 mt-1">since {new Date(sessionStart).toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={MessageCircle} label="Today" value={stats.todayCount} color="text-cyan-300"/>
        <StatCard icon={MessageCircle} label="All time" value={stats.totalCount} color="text-violet-300"/>
        <StatCard icon={Heart} label={`${myName}'s "love"s`} value={stats.myLove} color="text-rose-300" hint="i love u / je t'aime / kanbghik"/>
        <StatCard icon={Heart} label={`${friendName}'s "love"s`} value={stats.herLove} color="text-pink-300" hint="i love u / je t'aime / kanbghik"/>
      </div>

      {/* Who talks more bar */}
      <div className="rounded-xl p-4 bg-white/5 border border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <span>{myName} — {stats.myCount} msgs</span>
          <span>{friendName} — {stats.herCount}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all" style={{ width: `${myPct}%` }}/>
          <div className="bg-gradient-to-r from-rose-400 to-pink-400 transition-all" style={{ width: `${100 - myPct}%` }}/>
        </div>
        <div className="text-center text-xs text-slate-400 mt-2">
          {stats.myCount > stats.herCount ? `You talk ${Math.round((stats.myCount/stats.herCount||1)*10)/10}× more 💬` :
           stats.herCount > stats.myCount ? `She talks more 🥰` : "Perfectly balanced ⚖️"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Clock} label={`${myName} replies in`} value={stats.avgMine ? fmtDuration(stats.avgMine) : "—"} color="text-amber-300"/>
        <StatCard icon={Clock} label={`${friendName} replies in`} value={stats.avgHer ? fmtDuration(stats.avgHer) : "—"} color="text-orange-300"/>
        <StatCard icon={Sparkles} label={`${myName} words`} value={stats.myWords} color="text-emerald-300"/>
        <StatCard icon={Sparkles} label={`${friendName} words`} value={stats.herWords} color="text-fuchsia-300"/>
      </div>

      <div className="rounded-xl p-4 bg-gradient-to-br from-rose-900/30 to-pink-900/20 border border-rose-400/20 text-center">
        <div className="text-3xl mb-1">💞</div>
        <div className="text-2xl font-bold text-rose-200">{stats.myLove + stats.herLove}</div>
        <div className="text-xs text-rose-300/80">total "I love you"s exchanged across {stats.activeDays} days</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
        <Icon className="h-3 w-3"/> {label}
      </div>
      <div className={`text-xl font-bold ${color} tabular-nums`}>{value}</div>
      {hint && <div className="text-[9px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

/* ============ TODO ============ */
function TodoPanel({ userId, friendId, accent, sendMessage }: { userId: string; friendId: string; accent: string; sendMessage: (t: string) => void }) {
  const key = TODOS_KEY(userId, friendId);
  const [todos, setTodos] = useState<Todo[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { localStorage.setItem(key, JSON.stringify(todos)); }, [todos, key]);

  const done = todos.filter((t) => t.done).length;
  const pct = todos.length ? Math.round((done / todos.length) * 100) : 0;
  const prevPctRef = useRef(pct);

  useEffect(() => {
    if (todos.length > 0 && pct === 100 && prevPctRef.current < 100) {
      sendMessage(`🎉 Just finished my to-do list 100%! ${todos.length} task${todos.length>1?"s":""} done 💪✨`);
      toast.success("100% — sent to chat!");
    }
    prevPctRef.current = pct;
  }, [pct, todos.length, sendMessage]);

  function add() {
    const t = input.trim();
    if (!t) return;
    setTodos((p) => [...p, { id: crypto.randomUUID(), text: t, done: false }]);
    setInput("");
  }

  function toggle(id: string) {
    setTodos((p) => p.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, done: !t.done };
      if (next.done) sendMessage(`✅ Task done: "${t.text}"`);
      return next;
    }));
  }

  function remove(id: string) { setTodos((p) => p.filter((t) => t.id !== id)); }

  async function aiOrganize() {
    if (todos.length === 0) { toast.error("Add some tasks first"); return; }
    setAiLoading(true);
    try {
      const list = todos.filter((t) => !t.done).map((t, i) => `${i+1}. ${t.text}`).join("\n");
      const r = await fetch("/api/ai-assist", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: `Reorder this to-do list from most important/urgent to least, grouped by category (gym, work, romance, errands, etc). Reply ONLY as JSON array like [{"text":"...","priority":1,"category":"gym"}]. List:\n${list}`,
        }),
      });
      const j = await r.json() as { text?: string };
      const text = j.text ?? "";
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) { toast.error("AI couldn't parse"); return; }
      const ordered = JSON.parse(match[0]) as { text: string; priority: number; category: string }[];
      const doneOnes = todos.filter((t) => t.done);
      const next = ordered
        .sort((a, b) => a.priority - b.priority)
        .map((o) => {
          const existing = todos.find((t) => t.text.toLowerCase().trim() === o.text.toLowerCase().trim());
          return existing
            ? { ...existing, priority: o.priority, category: o.category }
            : { id: crypto.randomUUID(), text: o.text, done: false, priority: o.priority, category: o.category };
        });
      setTodos([...next, ...doneOnes]);
      toast.success("✨ Organized by AI");
    } catch { toast.error("AI failed"); }
    setAiLoading(false);
  }

  // Group by category for diagram
  const byCategory = todos.reduce((acc, t) => {
    const c = t.category ?? "other";
    acc[c] = acc[c] ?? { total: 0, done: 0 };
    acc[c].total++;
    if (t.done) acc[c].done++;
    return acc;
  }, {} as Record<string, { total: number; done: number }>);

  return (
    <div className="space-y-4">
      {/* Progress ring */}
      <div className="flex items-center gap-4 rounded-xl p-4 bg-gradient-to-br from-emerald-900/30 to-cyan-900/20 border border-emerald-400/20">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${pct}, 100`} className="transition-all duration-700"/>
          </svg>
          <div className="absolute inset-0 grid place-items-center font-bold text-lg">{pct}%</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-1"><Trophy className="h-4 w-4 text-amber-400"/> {done}/{todos.length} done</div>
          <div className="text-xs text-slate-400 mt-0.5">Finish 100% → auto-shouts to her ✨</div>
          <button onClick={aiOrganize} disabled={aiLoading}
            className="mt-2 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/30 hover:bg-violet-500/30 text-xs px-3 py-1.5 inline-flex items-center gap-1 disabled:opacity-50">
            {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}
            AI organize & categorize
          </button>
        </div>
      </div>

      {/* Category diagram */}
      {Object.keys(byCategory).length > 1 && (
        <div className="rounded-xl p-3 bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-2">By category</div>
          <div className="space-y-1.5">
            {Object.entries(byCategory).map(([cat, { total, done }]) => {
              const p = total ? (done/total)*100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                    <span className="capitalize">{cat}</span><span>{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: accent }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add */}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task… (e.g. Gym at 6pm)"
          className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-emerald-400/50"/>
        <button onClick={add} className="rounded-lg bg-emerald-500 text-black font-bold px-3"><Plus className="h-4 w-4"/></button>
      </div>

      <ul className="space-y-1.5">
        {todos.map((t) => (
          <li key={t.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${t.done ? "bg-emerald-500/10 border-emerald-400/20" : "bg-white/5 border-white/10"}`}>
            <button onClick={() => toggle(t.id)}
              className={`h-5 w-5 rounded grid place-items-center shrink-0 ${t.done ? "bg-emerald-500" : "border border-white/30"}`}>
              {t.done && <Check className="h-3.5 w-3.5 text-black"/>}
            </button>
            <span className={`flex-1 text-sm ${t.done ? "line-through text-slate-500" : ""}`}>{t.text}</span>
            {t.category && <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5 capitalize">{t.category}</span>}
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5"/></button>
          </li>
        ))}
        {todos.length === 0 && <li className="text-center text-sm text-slate-500 py-6">No tasks yet — let's get productive 💪</li>}
      </ul>
    </div>
  );
}

/* ============ GAMES ============ */
const TRUTH_DARE: { type: "truth" | "dare"; text: string }[] = [
  { type: "truth", text: "What's the moment you knew you liked me?" },
  { type: "truth", text: "What's a secret fantasy you've never told me?" },
  { type: "truth", text: "When was the last time you thought about me today?" },
  { type: "truth", text: "What's something about me that drives you crazy (good way)?" },
  { type: "truth", text: "If we could do anything together right now, what?" },
  { type: "dare", text: "Send a selfie with the cutest face you can make 🥺" },
  { type: "dare", text: "Send a voice note saying 'I love you' in 3 different languages 🌍" },
  { type: "dare", text: "Send a picture of what you're wearing right now 📸" },
  { type: "dare", text: "Sing 5 seconds of our song 🎵" },
  { type: "dare", text: "Send your most embarrassing photo on your phone 😅" },
];

const WYR = [
  "Would you rather… cuddle all day in bed 🛌 OR have an adventure abroad ✈️?",
  "Would you rather… read each other's minds 🧠 OR teleport to each other anytime 💨?",
  "Would you rather… never argue again 😇 OR always win every argument 😏?",
  "Would you rather… kiss me for 1 hour straight 💋 OR slow dance for 3 hours 💃?",
  "Would you rather… have a movie made about us 🎬 OR a song written for us 🎵?",
  "Would you rather… travel the world together broke 🎒 OR live rich but never travel 💰?",
];

const Q36 = [
  "Given the choice of anyone in the world, who would you want as a dinner guest?",
  "Would you like to be famous? In what way?",
  "What would constitute a 'perfect' day for you?",
  "When did you last sing to yourself? To someone else?",
  "If you could wake up tomorrow having gained any one quality, what would it be?",
  "What do you value most in a friendship?",
  "What is your most treasured memory?",
  "If you knew you'd die in a year, would you change anything about how you live?",
  "What does friendship mean to you?",
  "What roles do love and affection play in your life?",
];

function GamesPanel({ sendMessage, friendName }: { sendMessage: (t: string) => void; friendName: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [current, setCurrent] = useState<string>("");
  const [score, setScore] = useState({ me: 0, her: 0 });
  // Tap-the-heart
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [hScore, setHScore] = useState(0);
  const [hRun, setHRun] = useState(false);
  const [hTime, setHTime] = useState(15);

  useEffect(() => {
    if (!hRun) return;
    const i = setInterval(() => {
      setHearts((p) => [...p, { id: Date.now() + Math.random(), x: Math.random()*80+10, y: Math.random()*70+15 }].slice(-8));
    }, 700);
    const t = setInterval(() => setHTime((x) => x - 1), 1000);
    return () => { clearInterval(i); clearInterval(t); };
  }, [hRun]);

  useEffect(() => {
    if (hTime <= 0 && hRun) {
      setHRun(false);
      sendMessage(`💘 Just played Catch the Heart — scored ${hScore}! Beat me?`);
    }
  }, [hTime, hRun, hScore, sendMessage]);

  function startHearts() { setHScore(0); setHTime(15); setHearts([]); setHRun(true); }

  function pick<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

  const games = [
    { id: "td", title: "Truth or Dare 🔥", desc: "Spicy edition for couples", color: "from-rose-500 to-orange-500" },
    { id: "wyr", title: "Would You Rather 🤔", desc: "Get to know each other deeper", color: "from-violet-500 to-fuchsia-500" },
    { id: "q36", title: "36 Questions 💞", desc: "The famous fall-in-love list", color: "from-pink-500 to-rose-500" },
    { id: "guess", title: "Guess The Emoji 🎬", desc: "Decode movie titles together", color: "from-cyan-500 to-blue-500" },
    { id: "tap", title: "Catch The Heart 💘", desc: "15-sec reflex challenge", color: "from-amber-500 to-rose-500" },
  ];

  const movies = [
    { e: "🦁👑", a: "The Lion King" },
    { e: "🕷️👨", a: "Spider-Man" },
    { e: "❄️👸🎶", a: "Frozen" },
    { e: "🐠🔍", a: "Finding Nemo" },
    { e: "🚢💔🧊", a: "Titanic" },
    { e: "🧙‍♂️⚡📚", a: "Harry Potter" },
  ];
  const [guess, setGuess] = useState<{ e: string; a: string } | null>(null);
  const [reveal, setReveal] = useState(false);

  if (!active) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {games.map((g) => (
          <button key={g.id} onClick={() => {
            setActive(g.id);
            if (g.id === "td") setCurrent(JSON.stringify(pick(TRUTH_DARE)));
            if (g.id === "wyr") setCurrent(pick(WYR));
            if (g.id === "q36") setCurrent(pick(Q36));
            if (g.id === "guess") { setGuess(pick(movies)); setReveal(false); }
          }}
            className={`text-left rounded-xl p-4 bg-gradient-to-br ${g.color} hover:scale-[1.02] transition-transform shadow-lg`}>
            <div className="font-bold text-white text-lg">{g.title}</div>
            <div className="text-xs text-white/80 mt-1">{g.desc}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => { setActive(null); setHRun(false); }} className="text-xs text-slate-400 hover:text-white mb-3">← All games</button>

      {active === "td" && current && (() => {
        const card = JSON.parse(current) as { type: "truth"|"dare"; text: string };
        return (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-center text-white shadow-2xl ${card.type === "truth" ? "bg-gradient-to-br from-cyan-600 to-blue-700" : "bg-gradient-to-br from-rose-600 to-orange-600"}`}>
              <div className="text-xs uppercase tracking-widest opacity-80">{card.type === "truth" ? "🤫 Truth" : "🔥 Dare"}</div>
              <div className="text-xl font-bold mt-2">{card.text}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCurrent(JSON.stringify(pick(TRUTH_DARE)))} className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm"><RefreshCw className="h-3 w-3 inline mr-1"/>Next</button>
              <button onClick={() => sendMessage(`${card.type === "truth" ? "🤫 Truth" : "🔥 Dare"}: ${card.text}`)} className="flex-1 rounded-lg bg-emerald-500 text-black font-bold py-2 text-sm"><Send className="h-3 w-3 inline mr-1"/>Send to her</button>
            </div>
          </div>
        );
      })()}

      {active === "wyr" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-center text-lg font-bold shadow-2xl">{current}</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrent(pick(WYR))} className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm">Next</button>
            <button onClick={() => sendMessage(current)} className="flex-1 rounded-lg bg-emerald-500 text-black font-bold py-2 text-sm">Send to {friendName}</button>
          </div>
        </div>
      )}

      {active === "q36" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-center text-lg font-bold shadow-2xl">{current}</div>
          <div className="text-center text-xs text-slate-400">Answer honestly. Watch what happens after Q36 💞</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrent(pick(Q36))} className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm">Next question</button>
            <button onClick={() => sendMessage(`💞 Q: ${current}`)} className="flex-1 rounded-lg bg-emerald-500 text-black font-bold py-2 text-sm">Ask her</button>
          </div>
        </div>
      )}

      {active === "guess" && guess && (
        <div className="space-y-4">
          <div className="rounded-2xl p-8 bg-gradient-to-br from-cyan-600 to-blue-700 text-white text-center shadow-2xl">
            <div className="text-6xl mb-3">{guess.e}</div>
            <div className="text-sm opacity-80">Guess the movie!</div>
            {reveal && <div className="mt-4 text-2xl font-bold">🎬 {guess.a}</div>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setReveal(true)} className="rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm">Reveal</button>
            <button onClick={() => { setGuess(pick(movies)); setReveal(false); }} className="rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm">Next</button>
            <button onClick={() => sendMessage(`🎬 Guess the movie: ${guess.e}`)} className="rounded-lg bg-emerald-500 text-black font-bold py-2 text-sm">Send</button>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <button onClick={() => setScore((s) => ({ ...s, me: s.me+1 }))}>Me: {score.me} +</button>
            <button onClick={() => setScore((s) => ({ ...s, her: s.her+1 }))}>{friendName}: {score.her} +</button>
          </div>
        </div>
      )}

      {active === "tap" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm">Score: <span className="text-2xl font-bold text-rose-400">{hScore}</span></div>
            <div className="text-sm">⏱️ <span className="font-bold">{hTime}s</span></div>
            <button onClick={startHearts} className="rounded-lg bg-rose-500 text-white px-3 py-1 text-sm font-bold">{hRun ? "Restart" : "Start"}</button>
          </div>
          <div className="relative h-72 rounded-xl bg-gradient-to-br from-rose-900/40 to-pink-900/30 border border-rose-400/20 overflow-hidden">
            {!hRun && hTime === 0 && <div className="absolute inset-0 grid place-items-center text-xl font-bold text-rose-200">Final: {hScore} ❤️</div>}
            {hearts.map((h) => (
              <button key={h.id}
                onClick={() => { setHScore((s) => s+1); setHearts((p) => p.filter((x) => x.id !== h.id)); }}
                className="absolute text-3xl animate-pulse hover:scale-150 transition-transform"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}>❤️</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ FIGHT MODE ============ */
function FightPanel({ sendMessage, friendName, myName }: { sendMessage: (t: string) => void; friendName: string; myName: string }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [breath, setBreath] = useState<"in"|"hold"|"out">("in");
  const [aiLetter, setAiLetter] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (step !== 2) return;
    const cycle = ["in", "hold", "out"] as const;
    let i = 0;
    const t = setInterval(() => { i = (i+1)%3; setBreath(cycle[i]); }, 4000);
    return () => clearInterval(t);
  }, [step]);

  async function genLetter() {
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai-assist", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: `Write a short, sincere, sweet apology message from ${myName} to ${friendName}${reason?` about: ${reason}`:""}. 3-4 sentences, warm, no excuses, take responsibility, mention how much she means. Add 2 emojis.`,
        }),
      });
      const j = await r.json() as { text?: string };
      setAiLetter(j.text ?? "Sorry, my love. I really mean it. 💗");
    } catch { toast.error("AI failed"); }
    setAiLoading(false);
  }

  if (!active) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-red-900/40 to-rose-900/30 border border-rose-400/30 text-center">
          <div className="text-5xl mb-2">💔</div>
          <h3 className="text-xl font-bold text-rose-200 mb-1">Fight Mode</h3>
          <p className="text-sm text-rose-200/70 mb-4">Activate when there's tension. Get her smiling again with a 4-step rescue plan.</p>
          <button onClick={() => { setActive(true); setStep(0); }}
            className="rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-3 shadow-lg shadow-rose-500/40">
            🚨 Activate rescue mode
          </button>
        </div>
        <div className="text-xs text-slate-500 text-center">Tip: she can activate this too — same code 🤫</div>
      </div>
    );
  }

  const steps = [
    {
      title: "1. Pause 🌬️",
      body: (
        <>
          <p className="text-slate-300 mb-3">Before reacting — take 10 seconds. Don't type yet.</p>
          <div className="flex justify-center text-6xl py-6">🫂</div>
        </>
      ),
    },
    {
      title: "2. Write it out (just for you)",
      body: (
        <>
          <p className="text-slate-300 mb-3 text-sm">What's actually bothering you? Type it — only you see this. Helps untangle.</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
            placeholder="I feel… because…"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-rose-400/50"/>
        </>
      ),
    },
    {
      title: "3. Breathe with me",
      body: (
        <div className="text-center py-4">
          <div className={`mx-auto rounded-full bg-gradient-to-br from-rose-400 to-pink-500 transition-all duration-[4000ms] ease-in-out shadow-2xl shadow-rose-500/40 grid place-items-center text-white font-bold text-xl`}
            style={{ width: breath === "in" ? 200 : breath === "hold" ? 200 : 100, height: breath === "in" ? 200 : breath === "hold" ? 200 : 100 }}>
            <Wind className="h-8 w-8"/>
          </div>
          <div className="mt-4 text-lg font-medium text-rose-200">{breath === "in" ? "Breathe in… 4s" : breath === "hold" ? "Hold… 4s" : "Out… 4s"}</div>
        </div>
      ),
    },
    {
      title: "4. The make-up message ✨",
      body: (
        <div className="space-y-3">
          <button onClick={genLetter} disabled={aiLoading}
            className="w-full rounded-lg bg-violet-500 text-white font-bold py-2.5 hover:bg-violet-400 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
            Let AI write a sweet apology
          </button>
          {aiLetter && (
            <div className="rounded-xl p-4 bg-gradient-to-br from-rose-900/30 to-pink-900/20 border border-rose-400/20 text-rose-50 italic">
              "{aiLetter}"
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              "I'm sorry. You matter to me more than being right 💗",
              "Can we hug it out? I miss you 🥺",
              "Let's restart. I love you 💕",
              `${friendName}… I was wrong. Forgive me? 🌹`,
            ].map((q) => (
              <button key={q} onClick={() => { sendMessage(q); toast.success("Sent 💗"); }}
                className="text-left text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-2.5">{q}</button>
            ))}
          </div>
          {aiLetter && (
            <button onClick={() => { sendMessage(aiLetter); toast.success("Sent the AI letter 💗"); }}
              className="w-full rounded-lg bg-emerald-500 text-black font-bold py-2.5 inline-flex items-center justify-center gap-2">
              <Send className="h-4 w-4"/> Send the AI letter
            </button>
          )}
        </div>
      ),
    },
  ];

  const s = steps[step];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-rose-200">{s.title}</h3>
        <button onClick={() => setActive(false)} className="text-xs text-slate-400 hover:text-white">✕ Exit</button>
      </div>
      <div className="rounded-2xl p-5 bg-black/30 border border-white/10 min-h-[200px]">
        {s.body}
      </div>
      <div className="flex justify-between gap-2">
        <button disabled={step===0} onClick={() => setStep((s) => s-1)}
          className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-sm disabled:opacity-30">← Back</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep((s) => s+1)} className="flex-1 rounded-lg bg-rose-500 text-white font-bold py-2 text-sm">Next →</button>
        ) : (
          <button onClick={() => { setActive(false); setStep(0); toast.success("💗"); }} className="flex-1 rounded-lg bg-emerald-500 text-black font-bold py-2 text-sm">Done 💗</button>
        )}
      </div>
      <div className="flex gap-1 justify-center">
        {steps.map((_, i) => <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-rose-400" : "bg-white/10"}`}/>)}
      </div>
    </div>
  );
}
