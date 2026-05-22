import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Whispr Chat" },
      { name: "description", content: "Sign in or create an account to chat in realtime." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/chat" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/chat",
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome 👋");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b141a] text-slate-100 font-sans">
      <Toaster theme="dark" position="top-center" />
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs text-slate-400 hover:text-slate-200">← back</Link>
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center text-xl">💬</div>
            <div>
              <h1 className="text-xl font-semibold">Whispr</h1>
              <p className="text-xs text-slate-400">realtime chat for two hearts</p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1 text-sm">
            <button onClick={() => setMode("signin")} className={`rounded-md py-2 ${mode === "signin" ? "bg-emerald-500 text-black font-medium" : "text-slate-300"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`rounded-md py-2 ${mode === "signup" ? "bg-emerald-500 text-black font-medium" : "text-slate-300"}`}>Sign up</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-500" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-500" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password (min 6)" className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-500" />
            <button disabled={loading} className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50">{loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
