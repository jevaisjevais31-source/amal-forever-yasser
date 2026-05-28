import { useEffect, useMemo, useState } from "react";
import { PawPrint, Lock, Sparkles, X } from "lucide-react";

export type Pet = {
  level: number;
  emoji: string;
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  color: string;
};

export const PETS: Pet[] = [
  { level: 5, emoji: "🐣", name: "Baby Chick", rarity: "Common", color: "from-yellow-300 to-amber-400" },
  { level: 10, emoji: "🐰", name: "Lovely Bunny", rarity: "Common", color: "from-pink-300 to-rose-400" },
  { level: 15, emoji: "🦊", name: "Clever Fox", rarity: "Rare", color: "from-orange-400 to-red-500" },
  { level: 20, emoji: "🐼", name: "Cuddle Panda", rarity: "Rare", color: "from-slate-200 to-slate-500" },
  { level: 25, emoji: "🦄", name: "Magic Unicorn", rarity: "Epic", color: "from-pink-400 via-purple-400 to-indigo-400" },
  { level: 30, emoji: "🐉", name: "Tiny Dragon", rarity: "Epic", color: "from-emerald-400 to-teal-500" },
  { level: 40, emoji: "🦋", name: "Soul Butterfly", rarity: "Epic", color: "from-cyan-400 to-blue-500" },
  { level: 50, emoji: "🔥", name: "Phoenix", rarity: "Legendary", color: "from-orange-500 via-red-500 to-pink-600" },
  { level: 65, emoji: "🌙", name: "Moon Wolf", rarity: "Legendary", color: "from-indigo-500 to-purple-700" },
  { level: 80, emoji: "⭐", name: "Star Spirit", rarity: "Legendary", color: "from-yellow-400 via-amber-400 to-orange-500" },
  { level: 100, emoji: "👑", name: "Royal Guardian", rarity: "Mythic", color: "from-amber-300 via-yellow-500 to-amber-700" },
];

const STORAGE = (uid: string) => `whispr:pets:${uid}`;
const SEEN = (uid: string) => `whispr:pets-seen:${uid}`;

function loadOwned(uid: string): number[] {
  try { return JSON.parse(localStorage.getItem(STORAGE(uid)) || "[]"); } catch { return []; }
}
function saveOwned(uid: string, v: number[]) {
  localStorage.setItem(STORAGE(uid), JSON.stringify(v));
}

export function usePets(userId: string | null, currentLevel: number) {
  const [owned, setOwned] = useState<number[]>([]);
  const [newPet, setNewPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (!userId) return;
    setOwned(loadOwned(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const earned = PETS.filter((p) => currentLevel >= p.level).map((p) => p.level);
    const prev = loadOwned(userId);
    const fresh = earned.filter((lv) => !prev.includes(lv));
    if (fresh.length > 0) {
      const all = Array.from(new Set([...prev, ...earned]));
      saveOwned(userId, all);
      setOwned(all);
      const seen: number[] = JSON.parse(localStorage.getItem(SEEN(userId)) || "[]");
      const unseen = fresh.filter((lv) => !seen.includes(lv));
      if (unseen.length > 0) {
        const pet = PETS.find((p) => p.level === unseen[0]);
        if (pet) {
          setNewPet(pet);
          localStorage.setItem(SEEN(userId), JSON.stringify([...seen, ...unseen]));
        }
      }
    }
  }, [userId, currentLevel]);

  return { owned, newPet, clearNewPet: () => setNewPet(null) };
}

export function PetUnlockModal({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-sm w-full rounded-3xl p-8 text-center shadow-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900 to-slate-950" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-20 pointer-events-none animate-pulse" style={{}} />
        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5" /> New Pet Unlocked <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className={`mx-auto h-32 w-32 rounded-full bg-gradient-to-br ${pet.color} grid place-items-center text-7xl shadow-2xl animate-bounce mb-4`}>
          {pet.emoji}
        </div>
        <div className="text-2xl font-black text-white">{pet.name}</div>
        <div className="text-sm text-slate-300 mt-1">Reached Level {pet.level}</div>
        <div className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${pet.color} text-black`}>
          {pet.rarity}
        </div>
        <p className="text-xs text-slate-400 mt-4">Keep chatting to unlock more pets! 💖</p>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-white hover:opacity-90">
          Awesome!
        </button>
      </div>
    </div>
  );
}

export function PetsButton({ userId, currentLevel }: { userId: string; currentLevel: number }) {
  const [open, setOpen] = useState(false);
  const owned = useMemo(() => loadOwned(userId), [userId, open]);
  const next = PETS.find((p) => currentLevel < p.level);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-white/10 transition"
        title="My pet collection"
      >
        <PawPrint className="h-5 w-5 text-pink-300" />
        {owned.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-pink-500 text-white font-bold rounded-full h-4 min-w-4 px-1 grid place-items-center">
            {owned.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="max-w-md w-full max-h-[85vh] overflow-y-auto rounded-3xl p-6 bg-slate-950 border border-white/15 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2"><PawPrint className="h-5 w-5 text-pink-400" /> Pet Collection</h2>
                <p className="text-xs text-slate-400">{owned.length} / {PETS.length} unlocked</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
            </div>

            {next && (
              <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Next reward</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-3xl opacity-40 grayscale">{next.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{next.name}</div>
                    <div className="text-xs text-slate-400">{next.level - currentLevel} level{next.level - currentLevel === 1 ? "" : "s"} to go (Lv.{next.level})</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {PETS.map((p) => {
                const has = owned.includes(p.level);
                return (
                  <div key={p.level} className={`relative rounded-2xl p-3 text-center border ${has ? "border-white/20 bg-white/5" : "border-white/5 bg-black/30"}`}>
                    <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center text-3xl bg-gradient-to-br ${p.color} ${has ? "" : "grayscale opacity-30"}`}>
                      {has ? p.emoji : <Lock className="h-5 w-5 text-white/60" />}
                    </div>
                    <div className={`text-[11px] font-bold mt-2 truncate ${has ? "text-white" : "text-slate-500"}`}>{has ? p.name : "???"}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Lv.{p.level} · {p.rarity}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
