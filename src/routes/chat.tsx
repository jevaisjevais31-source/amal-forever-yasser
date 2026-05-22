import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Send, ImagePlus, Smile, UserPlus, Search, LogOut, Check, X, Heart, ArrowLeft } from "lucide-react";

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
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
};

const EMOJIS = ["❤️","😘","🥰","😍","💕","💖","💋","🤗","😊","😂","🥺","😏","😎","🔥","✨","🌹","🌸","☕","🍫","🍦","🎵","🎀","💍","🐻","🦋","💌","🌙","⭐","🥹","😇"];

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
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeFriendIdRef = useRef<string | null>(null);

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

  // presence: mark online + heartbeat + offline on unmount
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

  // load me, friendships, profiles
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
    if (map[userId]) setMe(map[userId]);
  }, [userId]);

  useEffect(() => { refreshFriendData(); }, [refreshFriendData]);

  // subscribe to friendships + profile presence
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("rt-friend-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => refreshFriendData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const p = payload.new as Profile;
        setProfiles((prev) => ({ ...prev, [p.id]: p }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, refreshFriendData]);

  // friends list (accepted) + pending
  const accepted = useMemo(() =>
    friendships.filter((f) => f.status === "accepted"), [friendships]);
  const pendingIncoming = useMemo(() =>
    friendships.filter((f) => f.status === "pending" && f.addressee_id === userId), [friendships, userId]);

  const friendIds = useMemo(() =>
    accepted.map((f) => f.requester_id === userId ? f.addressee_id : f.requester_id), [accepted, userId]);

  // load messages for active conversation
  useEffect(() => {
    if (!userId || !activeFriendId) { setMessages([]); return; }
    supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeFriendId}),and(sender_id.eq.${activeFriendId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .limit(500)
      .then(({ data }) => setMessages((data ?? []) as Message[]));
    // mark received as read
    supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("sender_id", activeFriendId).eq("receiver_id", userId).is("read_at", null).then(() => {});
  }, [userId, activeFriendId]);

  // realtime messages
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("rt-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        const involvesMe = m.sender_id === userId || m.receiver_id === userId;
        if (!involvesMe) return;
        const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (other === activeFriendIdRef.current) {
          setMessages((prev) => [...prev, m]);
          if (m.receiver_id === userId) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id).then(() => {});
          }
        } else if (m.receiver_id === userId) {
          const sender = profiles[m.sender_id];
          toast(`💌 ${sender?.display_name ?? "New message"}`, {
            description: m.content || "Sent an image",
            action: { label: "Open", onClick: () => { setActiveFriendId(m.sender_id); setShowSidebarMobile(false); } },
          });
          // simple sound notification
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880; g.gain.value = 0.05;
            o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 120);
          } catch {}
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, profiles]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeFriendId]);

  async function sendMessage(content?: string, image_url?: string) {
    if (!userId || !activeFriendId) return;
    const body = (content ?? draft).trim();
    if (!body && !image_url) return;
    setDraft("");
    setShowEmoji(false);
    const { error } = await supabase.from("messages").insert({
      sender_id: userId, receiver_id: activeFriendId,
      content: body || null, image_url: image_url ?? null,
    });
    if (error) toast.error(error.message);
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
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friendships").delete().eq("id", id);
    }
    refreshFriendData();
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

  if (!userId) return <div className="min-h-screen grid place-items-center bg-[#0b141a] text-slate-300">Loading…</div>;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0b141a] text-slate-100 font-sans flex">
      <Toaster theme="dark" position="top-right" />

      {/* Sidebar */}
      <aside className={`${showSidebarMobile ? "flex" : "hidden"} md:flex flex-col w-full md:w-[340px] border-r border-white/10 bg-[#111b21]`}>
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center font-semibold">
              {me?.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{me?.display_name ?? "…"}</div>
              <div className="text-[11px] text-emerald-400">online</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowAdd(true)} title="Add friend" className="rounded-full p-2 hover:bg-white/10"><UserPlus className="h-5 w-5" /></button>
            <button onClick={() => supabase.auth.signOut()} title="Sign out" className="rounded-full p-2 hover:bg-white/10"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

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
            const lastMsg = [...messages].reverse().find(() => fid === activeFriendId);
            const isActive = activeFriendId === fid;
            return (
              <button key={fid} onClick={() => { setActiveFriendId(fid); setShowSidebarMobile(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/[0.04] ${isActive ? "bg-white/[0.06]" : ""}`}>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 grid place-items-center font-semibold">
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                  {p.is_online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#111b21]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.display_name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {p.is_online ? "online" : `last seen ${new Date(p.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  </div>
                </div>
                {lastMsg && <span className="text-[10px] text-slate-500" />}
              </button>
            );
          })}
        </div>
        <Link to="/" className="text-center py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-white/10 flex items-center justify-center gap-1">
          <Heart className="h-3 w-3 text-rose-400" /> made with love
        </Link>
      </aside>

      {/* Conversation */}
      <main className={`${showSidebarMobile ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}
        style={{ backgroundImage: "radial-gradient(ellipse at top, rgba(16,185,129,0.06), transparent 60%), radial-gradient(ellipse at bottom, rgba(139,92,246,0.06), transparent 60%)" }}>
        {activeFriend ? (
          <>
            <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111b21]/80 backdrop-blur">
              <button onClick={() => setShowSidebarMobile(true)} className="md:hidden p-1 -ml-1"><ArrowLeft className="h-5 w-5"/></button>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 grid place-items-center font-semibold">
                  {activeFriend.display_name[0]?.toUpperCase()}
                </div>
                {activeFriend.is_online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111b21]" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{activeFriend.display_name}</div>
                <div className="text-xs text-emerald-400">{activeFriend.is_online ? "online now" : `last seen ${new Date(activeFriend.last_seen).toLocaleString()}`}</div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm mt-20">Say hi 👋</div>
              )}
              {messages.map((m, i) => {
                const mine = m.sender_id === userId;
                const prev = messages[i - 1];
                const showAvatar = !prev || prev.sender_id !== m.sender_id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 shadow ${mine ? "bg-emerald-600 text-white rounded-br-md" : "bg-[#202c33] rounded-bl-md"} ${showAvatar ? "" : "mt-0.5"}`}>
                      {m.image_url && (
                        <img src={m.image_url} alt="" className="rounded-lg mb-1 max-h-72 object-cover" />
                      )}
                      {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                      <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-emerald-100/80 justify-end" : "text-slate-400"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {mine && (m.read_at ? <span title="seen">✓✓</span> : <span title="sent">✓</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {showEmoji && (
              <div className="mx-3 mb-2 rounded-xl bg-[#202c33] p-2 grid grid-cols-10 gap-1 text-2xl">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setDraft((d) => d + e)} className="hover:bg-white/10 rounded p-1">{e}</button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-end gap-2 p-3 border-t border-white/10 bg-[#111b21]/80 backdrop-blur">
              <button type="button" onClick={() => setShowEmoji((v) => !v)} className="p-2 rounded-full hover:bg-white/10 text-slate-300"><Smile className="h-5 w-5"/></button>
              <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-white/10 text-slate-300"><ImagePlus className="h-5 w-5"/></button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…"
                className="flex-1 rounded-full bg-[#202c33] px-4 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"/>
              <button type="submit" className="p-3 rounded-full bg-emerald-500 text-black hover:bg-emerald-400"><Send className="h-5 w-5"/></button>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-center px-6">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold">Welcome to Whispr</h2>
              <p className="text-slate-400 mt-2 max-w-sm">Pick a friend on the left, or add someone new to start chatting in realtime.</p>
              <button onClick={() => setShowAdd(true)} className="mt-6 rounded-full bg-emerald-500 px-5 py-2.5 text-black font-medium hover:bg-emerald-400">Find friends</button>
            </div>
          </div>
        )}
      </main>

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
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 grid place-items-center font-semibold">{p.display_name[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="truncate">{p.display_name}</div>
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
