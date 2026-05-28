import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Send, ImagePlus, Smile, UserPlus, Search, LogOut, Check, X, Heart, ArrowLeft, Sparkles, Star, Settings, Award, Crown, Flame, Trophy } from "lucide-react";
import { HackMode } from "@/components/HackMode";
import { usePets, PetUnlockModal, PetsButton } from "@/components/PetRewards";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Whispr — Realtime Chat" },
      { name: "description", content: "Chat with your loved ones in realtime." },
    ],
  }),
  component: ChatPage,
});

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
  xp: number;
  level: number;
  status: string | null;
  bio: string | null;
  theme: string;
  accent_color: string;
};

type Reaction = { emoji: string; user_id: string };

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  is_favorite: boolean;
  relationship_type: string; // 'friend' | 'couple' | 'bestfriend'
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
  reactions: Reaction[];
};

const EMOJIS = ["❤️","😘","🥰","😍","💕","💖","💋","🤗","😊","😂","🥺","😏","😎","🔥","✨","🌹","🌸","☕","🍫","🍦","🎵","🎀","💍","🐻","🦋","💌","🌙","⭐","🥹","😇"];
const QUICK_REACTIONS = ["❤️","😂","😮","😢","🔥","👏"];
const STICKERS = ["🐻‍❄️","🦄","🌈","🐰","🍩","🌻","🎈","🪐","🍓","🧸","💎","🎂","☁️","🌊","🎨","🪞","🦋","🍒","🕊️","🪷"];

const THEMES: Record<string, { bg: string; bubble: string; mineColor: string; name: string; glow: string }> = {
  default: { name: "Emerald", bg: "#0b141a", bubble: "#202c33", mineColor: "bg-emerald-600", glow: "rgba(16,185,129,0.12)" },
  couple:  { name: "Couple 💕", bg: "#1a0a14", bubble: "#3d1a2a", mineColor: "bg-rose-500", glow: "rgba(244,63,94,0.18)" },
  bestie:  { name: "Best Friend 🌟", bg: "#0f0a1f", bubble: "#2a1f4a", mineColor: "bg-violet-500", glow: "rgba(139,92,246,0.18)" },
  sunset:  { name: "Sunset 🌅", bg: "#1a1208", bubble: "#3d2a14", mineColor: "bg-orange-500", glow: "rgba(249,115,22,0.18)" },
  ocean:   { name: "Ocean 🌊", bg: "#08141a", bubble: "#143a4a", mineColor: "bg-cyan-500", glow: "rgba(6,182,212,0.18)" },
};

const BADGES = (p: Profile, msgCount: number) => {
  const list: { icon: string; label: string; color: string }[] = [];
  if (p.level >= 5) list.push({ icon: "🌟", label: "Rising Star", color: "text-yellow-300" });
  if (p.level >= 10) list.push({ icon: "👑", label: "Legend", color: "text-amber-400" });
  if (p.xp >= 500) list.push({ icon: "🔥", label: "On Fire", color: "text-orange-400" });
  if (msgCount >= 100) list.push({ icon: "💬", label: "Chatterbox", color: "text-blue-300" });
  if (msgCount >= 500) list.push({ icon: "🏆", label: "Champion", color: "text-yellow-400" });
  return list;
};

function xpForLevel(level: number) { return Math.pow(level - 1, 2) * 10; }
function xpProgress(p: Profile) {
  const cur = xpForLevel(p.level);
  const next = xpForLevel(p.level + 1);
  return { cur: p.xp - cur, need: next - cur, pct: Math.min(100, Math.round(((p.xp - cur) / Math.max(1, next - cur)) * 100)) };
}

function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRelMenu, setShowRelMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeFriendIdRef = useRef<string | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const { newPet, clearNewPet } = usePets(userId, me?.level ?? 1);

  useEffect(() => { activeFriendIdRef.current = activeFriendId; }, [activeFriendId]);

  // auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setUserId(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
      else setUserId(session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // presence
  useEffect(() => {
    if (!userId) return;
    const setOnline = (online: boolean) =>
      supabase.from("profiles").update({ is_online: online, last_seen: new Date().toISOString() }).eq("id", userId);
    setOnline(true);
    const beat = setInterval(() => setOnline(true), 25000);
    const onHide = () => { if (document.hidden) setOnline(false); else setOnline(true); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", () => { setOnline(false); });
    return () => {
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onHide);
      setOnline(false);
    };
  }, [userId]);

  const refreshFriendData = useCallback(async () => {
    if (!userId) return;
    const { data: fs } = await supabase.from("friendships").select("*");
    setFriendships((fs ?? []) as Friendship[]);
    const ids = new Set<string>([userId]);
    (fs ?? []).forEach((f: Friendship) => { ids.add(f.requester_id); ids.add(f.addressee_id); });
    const { data: ps } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
    const map: Record<string, Profile> = {};
    (ps ?? []).forEach((p) => { map[p.id] = p as Profile; });
    setProfiles(map);
    if (map[userId]) {
      setMe(map[userId]);
      if (prevLevelRef.current !== null && map[userId].level > prevLevelRef.current) {
        setLevelUpFlash(map[userId].level);
        setTimeout(() => setLevelUpFlash(null), 3000);
      }
      prevLevelRef.current = map[userId].level;
    }
  }, [userId]);

  useEffect(() => { refreshFriendData(); }, [refreshFriendData]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("rt-friend-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => refreshFriendData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const p = payload.new as Profile;
        setProfiles((prev) => ({ ...prev, [p.id]: p }));
        if (p.id === userId) {
          setMe(p);
          if (prevLevelRef.current !== null && p.level > prevLevelRef.current) {
            setLevelUpFlash(p.level);
            setTimeout(() => setLevelUpFlash(null), 3000);
          }
          prevLevelRef.current = p.level;
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, refreshFriendData]);

  const accepted = useMemo(() => friendships.filter((f) => f.status === "accepted"), [friendships]);
  const pendingIncoming = useMemo(() => friendships.filter((f) => f.status === "pending" && f.addressee_id === userId), [friendships, userId]);

  const friendIds = useMemo(() => {
    return accepted
      .map((f) => ({ id: f.requester_id === userId ? f.addressee_id : f.requester_id, fav: f.is_favorite }))
      .sort((a, b) => Number(b.fav) - Number(a.fav))
      .map((x) => x.id);
  }, [accepted, userId]);

  const activeFriendship = useMemo(() =>
    accepted.find((f) => f.requester_id === activeFriendId || f.addressee_id === activeFriendId) ?? null,
  [accepted, activeFriendId]);

  // load messages
  useEffect(() => {
    if (!userId || !activeFriendId) { setMessages([]); return; }
    supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeFriendId}),and(sender_id.eq.${activeFriendId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .limit(500)
      .then(({ data }) => setMessages(((data ?? []) as Message[]).map((m) => ({ ...m, reactions: Array.isArray(m.reactions) ? m.reactions : [] }))));
    supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("sender_id", activeFriendId).eq("receiver_id", userId).is("read_at", null).then(() => {});
  }, [userId, activeFriendId]);

  // realtime messages + reaction updates
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("rt-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        const involvesMe = m.sender_id === userId || m.receiver_id === userId;
        if (!involvesMe) return;
        const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
        const norm: Message = { ...m, reactions: Array.isArray(m.reactions) ? m.reactions : [] };
        if (other === activeFriendIdRef.current) {
          setMessages((prev) => [...prev, norm]);
          if (m.receiver_id === userId) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id).then(() => {});
          }
        } else if (m.receiver_id === userId) {
          const sender = profiles[m.sender_id];
          toast(`💌 ${sender?.display_name ?? "New message"}`, {
            description: m.content || "Sent an image",
            action: { label: "Open", onClick: () => { setActiveFriendId(m.sender_id); setShowSidebarMobile(false); } },
          });
          try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880; g.gain.value = 0.05;
            o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 120);
          } catch { /* ignore */ }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, ...m, reactions: Array.isArray(m.reactions) ? m.reactions : [] } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, profiles]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeFriendId]);

  async function sendMessage(content?: string, image_url?: string) {
    if (!userId || !activeFriendId) return;
    const body = (content ?? draft).trim();
    if (!body && !image_url) return;
    setDraft("");
    setShowEmoji(false);
    setShowStickers(false);

    // AI command: /amal <prompt>  or  @amal <prompt>
    const aiMatch = body.match(/^[/@]amal\s+(.+)$/i);
    if (aiMatch) {
      await supabase.from("messages").insert({
        sender_id: userId, receiver_id: activeFriendId,
        content: body, image_url: null,
      });
      setAiLoading(true);
      try {
        const ctx = messages.slice(-6).map((m) => `${m.sender_id === userId ? "Me" : "Them"}: ${m.content ?? "[image]"}`).join("\n");
        const r = await fetch("/api/ai-assist", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: aiMatch[1], context: ctx }),
        });
        const j = await r.json() as { text?: string; error?: string };
        if (j.error) toast.error(j.error);
        const aiText = `🤖 Amal: ${j.text ?? "…"}`;
        await supabase.from("messages").insert({
          sender_id: userId, receiver_id: activeFriendId,
          content: aiText, image_url: null,
        });
      } catch { toast.error("AI failed"); }
      setAiLoading(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: userId, receiver_id: activeFriendId,
      content: body || null, image_url: image_url ?? null,
    });
    if (error) toast.error(error.message);
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!userId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
    const existing = reactions.find((r) => r.user_id === userId && r.emoji === emoji);
    const next = existing
      ? reactions.filter((r) => !(r.user_id === userId && r.emoji === emoji))
      : [...reactions.filter((r) => r.user_id !== userId), { emoji, user_id: userId }];
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: next } : m));
    setReactingTo(null);
    const { error } = await supabase.from("messages").update({ reactions: next }).eq("id", messageId);
    if (error) toast.error("Couldn't react");
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("chat-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
    await sendMessage("", data.publicUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function doSearch() {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("*")
      .ilike("display_name", `%${searchQuery.trim()}%`).limit(15);
    setSearchResults((data ?? []).filter((p) => p.id !== userId) as Profile[]);
  }

  async function sendFriendRequest(addresseeId: string) {
    if (!userId) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: userId, addressee_id: addresseeId, status: "pending",
    });
    if (error) toast.error(error.message); else { toast.success("Friend request sent"); refreshFriendData(); }
  }

  async function respondRequest(id: string, accept: boolean) {
    if (accept) await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    else await supabase.from("friendships").delete().eq("id", id);
    refreshFriendData();
  }

  async function toggleFavorite(f: Friendship) {
    await supabase.from("friendships").update({ is_favorite: !f.is_favorite }).eq("id", f.id);
    refreshFriendData();
  }

  async function setRelationshipType(f: Friendship, type: string) {
    await supabase.from("friendships").update({ relationship_type: type }).eq("id", f.id);
    refreshFriendData();
    setShowRelMenu(false);
    toast.success(`Set as ${type === "couple" ? "💕 Couple" : type === "bestfriend" ? "🌟 Best Friend" : "Friend"}`);
  }

  async function saveProfile(patch: Partial<Profile>) {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated ✨"); refreshFriendData(); }
  }

  function friendStatusFor(otherId: string): "none" | "pending_out" | "pending_in" | "friends" {
    const f = friendships.find((x) =>
      (x.requester_id === userId && x.addressee_id === otherId) ||
      (x.requester_id === otherId && x.addressee_id === userId));
    if (!f) return "none";
    if (f.status === "accepted") return "friends";
    return f.requester_id === userId ? "pending_out" : "pending_in";
  }

  const activeFriend = activeFriendId ? profiles[activeFriendId] : null;
  const activeTheme = THEMES[activeFriendship?.relationship_type === "couple" ? "couple"
    : activeFriendship?.relationship_type === "bestfriend" ? "bestie"
    : (me?.theme ?? "default")] ?? THEMES.default;

  if (!userId) return <div className="min-h-screen grid place-items-center bg-[#0b141a] text-slate-300">Loading…</div>;

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-100 font-sans flex" style={{ background: activeTheme.bg }}>
      <Toaster theme="dark" position="top-right" />

      {/* Level up flash */}
      {levelUpFlash !== null && (
        <div className="fixed inset-0 z-[100] pointer-events-none grid place-items-center">
          <div className="animate-bounce bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-black font-black px-8 py-6 rounded-3xl shadow-2xl text-center border-4 border-yellow-200">
            <div className="text-5xl mb-1">🎉</div>
            <div className="text-2xl">LEVEL UP!</div>
            <div className="text-lg">You're level {levelUpFlash} now</div>
          </div>
        </div>
      )}

      {/* Pet unlock modal */}
      {newPet && <PetUnlockModal pet={newPet} onClose={clearNewPet} />}

      {/* Sidebar */}
      <aside className={`${showSidebarMobile ? "flex" : "hidden"} md:flex flex-col w-full md:w-[340px] border-r border-white/10`} style={{ background: "rgba(0,0,0,0.35)" }}>
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 min-w-0 hover:opacity-80">
            <div className="relative">
              <div className="h-11 w-11 rounded-full grid place-items-center font-semibold text-white" style={{ background: `linear-gradient(135deg, ${me?.accent_color ?? "#ec4899"}, #6366f1)` }}>
                {me?.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              {(me?.level ?? 1) >= 5 && <Crown className="absolute -top-1.5 -right-1 h-4 w-4 text-yellow-400 fill-yellow-400" />}
            </div>
            <div className="min-w-0 text-left">
              <div className="font-semibold truncate flex items-center gap-1.5">
                {me?.display_name ?? "…"}
                <span className="text-[10px] bg-white/10 rounded-full px-1.5 py-0.5 font-bold text-emerald-300">Lv.{me?.level ?? 1}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{me?.status || "Tap to edit profile"}</div>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {userId && <PetsButton userId={userId} currentLevel={me?.level ?? 1} />}
            <button onClick={() => setShowAdd(true)} title="Add friend" className="rounded-full p-2 hover:bg-white/10"><UserPlus className="h-5 w-5" /></button>
            <button onClick={() => supabase.auth.signOut()} title="Sign out" className="rounded-full p-2 hover:bg-white/10"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        {/* XP bar */}
        {me && (() => {
          const { cur, need, pct } = xpProgress(me);
          return (
            <div className="px-4 py-2 border-b border-white/10">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-yellow-400" /> {cur}/{need} XP</span>
                <span>Next: Lv.{me.level + 1}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${me.accent_color}, #fbbf24)` }} />
              </div>
            </div>
          );
        })()}

        {pendingIncoming.length > 0 && (
          <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Friend requests</div>
            <ul className="space-y-1">
              {pendingIncoming.map((f) => {
                const p = profiles[f.requester_id];
                return (
                  <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <span className="truncate">{p?.display_name ?? "Unknown"}</span>
                    <div className="flex gap-1">
                      <button onClick={() => respondRequest(f.id, true)} className="rounded-md bg-emerald-500/20 text-emerald-300 p-1.5 hover:bg-emerald-500/30"><Check className="h-4 w-4"/></button>
                      <button onClick={() => respondRequest(f.id, false)} className="rounded-md bg-red-500/20 text-red-300 p-1.5 hover:bg-red-500/30"><X className="h-4 w-4"/></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {friendIds.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No friends yet. Tap <UserPlus className="inline h-4 w-4" /> to find someone.
            </div>
          ) : friendIds.map((fid) => {
            const p = profiles[fid];
            if (!p) return null;
            const fship = accepted.find((f) => f.requester_id === fid || f.addressee_id === fid);
            const isActive = activeFriendId === fid;
            const relIcon = fship?.relationship_type === "couple" ? "💕" : fship?.relationship_type === "bestfriend" ? "🌟" : null;
            return (
              <button key={fid} onClick={() => { setActiveFriendId(fid); setShowSidebarMobile(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/[0.04] ${isActive ? "bg-white/[0.06]" : ""}`}>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full grid place-items-center font-semibold text-white" style={{ background: `linear-gradient(135deg, ${p.accent_color || "#ec4899"}, #6366f1)` }}>
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                  {p.is_online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2" style={{ boxShadow: "0 0 8px #10b981" }} />}
                  {fship?.is_favorite && <Star className="absolute -top-1 -left-1 h-3.5 w-3.5 text-amber-300 fill-amber-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-1.5">
                    {p.display_name}
                    {relIcon && <span>{relIcon}</span>}
                    <span className="text-[9px] bg-white/10 rounded px-1 font-bold text-slate-300">Lv{p.level}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {p.status || (p.is_online ? "online" : `last seen ${new Date(p.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <Link to="/" className="text-center py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-white/10 flex items-center justify-center gap-1">
          <Heart className="h-3 w-3 text-rose-400" /> made with love
        </Link>
      </aside>

      {/* Conversation */}
      <main className={`${showSidebarMobile ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0 relative`}
        style={{ backgroundImage: `radial-gradient(ellipse at top, ${activeTheme.glow}, transparent 60%), radial-gradient(ellipse at bottom, rgba(139,92,246,0.08), transparent 60%)` }}>
        {activeFriend && activeFriendship ? (
          <>
            <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 backdrop-blur" style={{ background: "rgba(0,0,0,0.35)" }}>
              <button onClick={() => setShowSidebarMobile(true)} className="md:hidden p-1 -ml-1"><ArrowLeft className="h-5 w-5"/></button>
              <div className="relative">
                <div className="h-10 w-10 rounded-full grid place-items-center font-semibold text-white" style={{ background: `linear-gradient(135deg, ${activeFriend.accent_color || "#ec4899"}, #6366f1)` }}>
                  {activeFriend.display_name[0]?.toUpperCase()}
                </div>
                {activeFriend.is_online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-black/50" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  {activeFriend.display_name}
                  {activeFriendship.relationship_type === "couple" && <span>💕</span>}
                  {activeFriendship.relationship_type === "bestfriend" && <span>🌟</span>}
                  <span className="text-[10px] bg-white/10 rounded-full px-1.5 py-0.5 font-bold text-emerald-300">Lv.{activeFriend.level}</span>
                </div>
                <div className="text-xs text-emerald-400 truncate">
                  {activeFriend.status || (activeFriend.is_online ? "online now" : `last seen ${new Date(activeFriend.last_seen).toLocaleString()}`)}
                </div>
              </div>
              <HackMode
                messages={messages}
                userId={userId!}
                friendId={activeFriendId!}
                friendName={activeFriend.display_name}
                myName={me?.display_name ?? "You"}
                accent={me?.accent_color ?? "#10b981"}
                sendMessage={(t) => sendMessage(t)}
              />
              <button onClick={() => toggleFavorite(activeFriendship)} title="Favorite" className="p-2 rounded-full hover:bg-white/10">
                <Star className={`h-5 w-5 ${activeFriendship.is_favorite ? "text-amber-300 fill-amber-300" : "text-slate-400"}`} />
              </button>
              <div className="relative">
                <button onClick={() => setShowHeaderMenu((v) => !v)} className="p-2 rounded-full hover:bg-white/10"><Settings className="h-5 w-5 text-slate-300"/></button>
                {showHeaderMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-[#1a262d] border border-white/10 shadow-2xl z-30 overflow-hidden">
                    <button onClick={() => { setShowRelMenu(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-400"/> Relationship mode
                    </button>
                    <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-white/10">
                      Tip: type <span className="text-emerald-300 font-mono">/amal &lt;question&gt;</span> to ask the AI
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Badges strip */}
            {(() => {
              const badges = BADGES(activeFriend, messages.length);
              if (badges.length === 0) return null;
              return (
                <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-white/5 overflow-x-auto" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {badges.map((b) => (
                    <span key={b.label} className={`text-[10px] flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 ${b.color} shrink-0`}>
                      <span>{b.icon}</span>{b.label}
                    </span>
                  ))}
                </div>
              );
            })()}

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm mt-20">
                  <div className="text-4xl mb-2">{activeFriendship.relationship_type === "couple" ? "💕" : activeFriendship.relationship_type === "bestfriend" ? "🌟" : "👋"}</div>
                  Say hi — and remember <span className="text-emerald-300 font-mono">/amal hi!</span> to chat with AI
                </div>
              )}
              {messages.map((m, i) => {
                const mine = m.sender_id === userId;
                const prev = messages[i - 1];
                const showAvatar = !prev || prev.sender_id !== m.sender_id;
                const isAi = (m.content ?? "").startsWith("🤖 Amal:");
                const reactionGroups: Record<string, number> = {};
                (m.reactions ?? []).forEach((r) => { reactionGroups[r.emoji] = (reactionGroups[r.emoji] ?? 0) + 1; });
                return (
                  <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"} relative`}>
                    <div className="relative">
                      <div onDoubleClick={() => setReactingTo(reactingTo === m.id ? null : m.id)}
                        className={`max-w-[78vw] sm:max-w-[60ch] rounded-2xl px-3.5 py-2 shadow cursor-pointer transition-transform active:scale-95 ${
                          isAi ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white" :
                          mine ? `${activeTheme.mineColor} text-white rounded-br-md` : "rounded-bl-md text-slate-100"
                        } ${showAvatar ? "" : "mt-0.5"}`}
                        style={!mine && !isAi ? { background: activeTheme.bubble } : undefined}>
                        {m.image_url && (
                          <img src={m.image_url} alt="" className="rounded-lg mb-1 max-h-72 object-cover" />
                        )}
                        {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine || isAi ? "text-white/70 justify-end" : "text-slate-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {mine && (m.read_at ? <span title="seen">✓✓</span> : <span title="sent">✓</span>)}
                        </div>
                      </div>

                      {/* Quick reaction button */}
                      <button onClick={() => setReactingTo(reactingTo === m.id ? null : m.id)}
                        className={`absolute -top-2 ${mine ? "-left-7" : "-right-7"} opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-white/10 p-1`}>
                        <Smile className="h-3.5 w-3.5 text-slate-300" />
                      </button>

                      {/* Reaction picker */}
                      {reactingTo === m.id && (
                        <div className={`absolute z-20 -top-11 ${mine ? "right-0" : "left-0"} flex gap-0.5 bg-[#1a262d] border border-white/10 rounded-full px-1.5 py-1 shadow-xl`}>
                          {QUICK_REACTIONS.map((emo) => (
                            <button key={emo} onClick={() => toggleReaction(m.id, emo)}
                              className="text-xl hover:scale-125 transition-transform p-1 rounded-full">{emo}</button>
                          ))}
                        </div>
                      )}

                      {/* Reaction chips */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className={`flex gap-0.5 mt-0.5 ${mine ? "justify-end" : "justify-start"}`}>
                          {Object.entries(reactionGroups).map(([emo, count]) => (
                            <button key={emo} onClick={() => toggleReaction(m.id, emo)}
                              className="text-xs bg-black/40 backdrop-blur border border-white/10 rounded-full px-1.5 py-0.5 hover:scale-110 transition-transform animate-in zoom-in duration-200">
                              {emo} {count > 1 && count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl rounded-bl-md px-3.5 py-2 text-white text-sm flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-white animate-bounce" />
                    <span className="inline-block h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:.15s]" />
                    <span className="inline-block h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:.3s]" />
                    Amal is thinking…
                  </div>
                </div>
              )}
            </div>

            {showEmoji && (
              <div className="mx-3 mb-2 rounded-xl bg-[#202c33] p-2 grid grid-cols-10 gap-1 text-2xl">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setDraft((d) => d + e)} className="hover:bg-white/10 rounded p-1">{e}</button>
                ))}
              </div>
            )}

            {showStickers && (
              <div className="mx-3 mb-2 rounded-xl bg-[#202c33] p-3">
                <div className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3 text-yellow-400" /> Exclusive Stickers</div>
                <div className="grid grid-cols-10 gap-1.5 text-3xl">
                  {STICKERS.map((s) => (
                    <button key={s} onClick={() => { sendMessage(s); setShowStickers(false); }} className="hover:bg-white/10 rounded-lg p-1 hover:scale-125 transition-transform">{s}</button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-end gap-2 p-3 border-t border-white/10 backdrop-blur" style={{ background: "rgba(0,0,0,0.35)" }}>
              <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowStickers(false); }} className="p-2 rounded-full hover:bg-white/10 text-slate-300"><Smile className="h-5 w-5"/></button>
              <button type="button" onClick={() => { setShowStickers((v) => !v); setShowEmoji(false); }} title="Stickers" className="p-2 rounded-full hover:bg-white/10 text-slate-300"><Sparkles className="h-5 w-5"/></button>
              <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-white/10 text-slate-300"><ImagePlus className="h-5 w-5"/></button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message… (try /amal hi!)"
                className="flex-1 rounded-full bg-white/10 px-4 py-2.5 outline-none focus:ring-2 focus:ring-offset-0" style={{ ['--tw-ring-color' as string]: me?.accent_color ?? "#10b981" } as React.CSSProperties}/>
              <button type="submit" className="p-3 rounded-full text-black font-bold hover:opacity-90 transition-opacity" style={{ background: me?.accent_color ?? "#10b981" }}><Send className="h-5 w-5"/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-center px-6">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold">Welcome to Whispr</h2>
              <p className="text-slate-400 mt-2 max-w-sm">Pick a friend on the left, level up with every message, and unlock badges as you chat.</p>
              <button onClick={() => setShowAdd(true)} className="mt-6 rounded-full bg-emerald-500 px-5 py-2.5 text-black font-medium hover:bg-emerald-400">Find friends</button>
            </div>
          </div>
        )}
      </main>

      {/* Profile modal */}
      {showProfile && me && (
        <div onClick={() => setShowProfile(false)} className="fixed inset-0 z-50 bg-black/70 grid place-items-center px-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-[#1a262d] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="h-5 w-5"/> Your Profile</h3>
              <button onClick={() => setShowProfile(false)} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5"/></button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="h-20 w-20 rounded-full grid place-items-center text-3xl font-bold text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${me.accent_color}, #6366f1)` }}>
                {me.display_name[0]?.toUpperCase()}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400"/>
                <span className="font-bold">Level {me.level}</span>
                <Flame className="h-4 w-4 text-orange-400"/>
                <span className="text-sm text-slate-300">{me.xp} XP</span>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap justify-center">
                {BADGES(me, messages.length).map((b) => (
                  <span key={b.label} className={`text-xs flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 ${b.color}`}>{b.icon} {b.label}</span>
                ))}
              </div>
            </div>

            <label className="block text-xs text-slate-400 mb-1">Display name</label>
            <input defaultValue={me.display_name} onBlur={(e) => e.target.value !== me.display_name && saveProfile({ display_name: e.target.value })}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 mb-3 outline-none focus:border-white/30"/>

            <label className="block text-xs text-slate-400 mb-1">Custom status</label>
            <input defaultValue={me.status ?? ""} placeholder="What's on your mind?"
              onBlur={(e) => e.target.value !== (me.status ?? "") && saveProfile({ status: e.target.value || null })}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 mb-3 outline-none focus:border-white/30"/>

            <label className="block text-xs text-slate-400 mb-1">Bio</label>
            <textarea defaultValue={me.bio ?? ""} placeholder="A little about you…" rows={2}
              onBlur={(e) => e.target.value !== (me.bio ?? "") && saveProfile({ bio: e.target.value || null })}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 mb-3 outline-none focus:border-white/30 resize-none"/>

            <label className="block text-xs text-slate-400 mb-1">Accent color</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["#ec4899","#f43f5e","#f97316","#eab308","#10b981","#06b6d4","#3b82f6","#8b5cf6","#a855f7"].map((c) => (
                <button key={c} onClick={() => saveProfile({ accent_color: c })}
                  className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${me.accent_color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a262d]" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>

            <label className="block text-xs text-slate-400 mb-1">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).filter(([k]) => k !== "couple" && k !== "bestie").map(([k, t]) => (
                <button key={k} onClick={() => saveProfile({ theme: k })}
                  className={`rounded-lg px-3 py-2.5 text-sm text-left transition-all ${me.theme === k ? "ring-2 ring-white/50" : "hover:bg-white/5"}`}
                  style={{ background: t.bg, border: "1px solid rgba(255,255,255,0.1)" }}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Relationship menu */}
      {showRelMenu && activeFriendship && (
        <div onClick={() => setShowRelMenu(false)} className="fixed inset-0 z-50 bg-black/70 grid place-items-center px-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-[#1a262d] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold mb-3">Relationship Mode</h3>
            <p className="text-xs text-slate-400 mb-4">Changes the chat theme for both of you ✨</p>
            <div className="space-y-2">
              {[
                { type: "friend", icon: "👥", label: "Friend", desc: "Default emerald theme" },
                { type: "couple", icon: "💕", label: "Couple", desc: "Romantic pink theme" },
                { type: "bestfriend", icon: "🌟", label: "Best Friend", desc: "Vibrant violet theme" },
              ].map((opt) => (
                <button key={opt.type} onClick={() => setRelationshipType(activeFriendship, opt.type)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    activeFriendship.relationship_type === opt.type ? "bg-white/10 ring-1 ring-white/30" : "bg-white/5 hover:bg-white/10"
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-slate-400">{opt.desc}</div>
                  </div>
                  {activeFriendship.relationship_type === opt.type && <Check className="h-5 w-5 text-emerald-400"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add friend modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} className="fixed inset-0 z-50 bg-black/60 grid place-items-center px-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-[#1a262d] border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add a friend</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5"/></button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg bg-black/40 border border-white/10 px-3">
                <Search className="h-4 w-4 text-slate-400"/>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  placeholder="Search by display name" className="flex-1 bg-transparent py-2 outline-none"/>
              </div>
              <button onClick={doSearch} className="rounded-lg bg-emerald-500 text-black px-4 font-medium hover:bg-emerald-400">Find</button>
            </div>
            <ul className="mt-4 space-y-1 max-h-72 overflow-y-auto">
              {searchResults.length === 0 && <li className="text-sm text-slate-400 text-center py-6">Type a name and press Enter.</li>}
              {searchResults.map((p) => {
                const st = friendStatusFor(p.id);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full grid place-items-center font-semibold text-white" style={{ background: `linear-gradient(135deg, ${p.accent_color || "#ec4899"}, #6366f1)` }}>{p.display_name[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="truncate flex items-center gap-1">{p.display_name} <span className="text-[9px] bg-white/10 rounded px-1 font-bold">Lv{p.level}</span></div>
                        <div className="text-xs text-slate-400">{p.is_online ? "online" : "offline"}</div>
                      </div>
                    </div>
                    {st === "none" && <button onClick={() => sendFriendRequest(p.id)} className="text-xs rounded-md bg-emerald-500/20 text-emerald-300 px-3 py-1.5 hover:bg-emerald-500/30">Add</button>}
                    {st === "pending_out" && <span className="text-xs text-slate-400">Requested</span>}
                    {st === "pending_in" && <span className="text-xs text-amber-300">Wants to be friends</span>}
                    {st === "friends" && <span className="text-xs text-emerald-400">Friends</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
