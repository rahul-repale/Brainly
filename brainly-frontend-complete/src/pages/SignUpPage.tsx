import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";
import { BrainMark, Field, TextInput, Button } from "@/components/ui";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { useLinkStore } from "@/stores/useLinkStore";

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const fetchCards = useCardStore((s) => s.fetchCards);
  const fetchTags = useTagStore((s) => s.fetchTags);
  const fetchLinks = useLinkStore((s) => s.fetchLinks);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [validationError, setValidationError] = useState("");

  const rules = [
    { label: "8-20 characters", pass: password.length >= 8 && password.length <= 20 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One lowercase letter", pass: /[a-z]/.test(password) },
    { label: "One number", pass: /[0-9]/.test(password) },
  ];

  async function submit() {
    if (username.trim().length < 3 || username.trim().length > 15) {
      setValidationError("Username should be 3-15 characters.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (!rules.every((r) => r.pass)) {
      setValidationError("Password doesn't meet the requirements yet.");
      return;
    }
    if (!age || Number(age) < 12) {
      setValidationError("You need to be at least 12 to sign up.");
      return;
    }

    setValidationError("");
    const signedUp = await signUp(username.trim(), password, email.trim(), Number(age));
    if (signedUp) {
      // Auto sign in after registration
      const signedIn = await signIn(username.trim(), password);
      if (signedIn) {
        fetchCards();
        fetchTags();
        fetchLinks();
        navigate("/dashboard");
      } else {
        navigate("/");
      }
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
          Start keeping the things you'd otherwise forget.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-paper px-6 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Create your account</h1>
            <p className="mt-1.5 text-sm text-slate">Takes less than a minute.</p>
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
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                setValidationError("");
                clearError();
              }}
              placeholder="you@example.com"
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
            />
          </Field>
          <div className="-mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
            {rules.map((r) => (
              <div
                key={r.label}
                className={`flex items-center gap-1.5 text-xs ${r.pass ? "text-green-700" : "text-slate-light"}`}
              >
                <Check size={12} />
                {r.label}
              </div>
            ))}
          </div>
          <Field label="Age">
            <TextInput
              type="number"
              value={age}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setAge(e.target.value);
                setValidationError("");
                clearError();
              }}
              placeholder="18"
            />
          </Field>
          {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}
          <Button onClick={submit} className="mt-1 w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-slate">
            Already have an account?{" "}
            <button onClick={() => navigate("/")} className="font-semibold text-brand">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
