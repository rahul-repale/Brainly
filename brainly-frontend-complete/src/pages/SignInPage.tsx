import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";
import { BrainMark, Field, TextInput, Button } from "@/components/ui";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { useLinkStore } from "@/stores/useLinkStore";

const FEATURES = [
  "Save links, notes and tweets in one place",
  "Organize everything with tags",
  "Semantic search across your whole brain",
  "Ask AI questions with your notes as context",
];

export default function SignInPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const fetchCards = useCardStore((s) => s.fetchCards);
  const fetchTags = useTagStore((s) => s.fetchTags);
  const fetchLinks = useLinkStore((s) => s.fetchLinks);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  async function submit() {
    if (username.trim().length < 3) {
      setValidationError("Username should be at least 3 characters.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password should be at least 8 characters.");
      return;
    }
    setValidationError("");
    const success = await signIn(username.trim(), password);
    if (success) {
      // Pre-load data from backend
      fetchCards();
      fetchTags();
      fetchLinks();
      navigate("/dashboard");
    }
  }

  const errorMessage = validationError || authError;

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[420px] shrink-0 flex-col justify-center gap-8 bg-brand px-12 md:flex">
        <div className="flex items-center gap-3">
          <BrainMark size={32} />
          <span className="font-display text-2xl font-bold text-white">Brainly</span>
        </div>
        <p className="font-display text-2xl font-semibold leading-snug text-white">
          Your second brain for everything worth remembering.
        </p>
        <div className="mt-2 flex flex-col gap-4">
          {FEATURES.map((line) => (
            <div key={line} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Check size={13} color="white" />
              </div>
              <span className="text-sm text-white/90">{line}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-paper px-6">
        <div className="flex w-full max-w-[360px] flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate">Sign in to get back into your second brain.</p>
          </div>
          <Field label="Username">
            <TextInput
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setUsername(e.target.value);
                setValidationError("");
                clearError();
              }}
              placeholder="yourusername"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()}
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
                setValidationError("");
                clearError();
              }}
              placeholder="********"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()}
            />
          </Field>
          {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}
          <Button onClick={submit} className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-slate">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="font-semibold text-brand">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
