import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export default function JoinPage() {
  const router = useRouter();
  const { actor } = useActor();

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !actor) return;
    setCodeError("");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Code format validation
    const codeRegex = /^[a-z0-9]{1,10}$/;
    if (!codeRegex.test(code.trim())) {
      setCodeError(
        "Use lowercase letters and numbers only (max 10 characters)",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await actor.joinClass(
        code.trim(),
        email.trim(),
        displayName.trim(),
      );

      if (result.__kind__ === "err") {
        const msg = result.err;
        // Surface invalid code errors prominently next to the code field
        if (
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("code") ||
          msg.toLowerCase().includes("not found")
        ) {
          setCodeError("Class code not found. Please check and try again.");
        } else {
          toast.error(msg);
        }
        return;
      }

      // Save student session
      localStorage.setItem("studentEmail", email.trim());
      localStorage.setItem("studentName", displayName.trim());
      toast.success("Welcome to Sanskrit Class!");
      router.navigate({ to: "/student" });
    } catch (err) {
      toast.error("Failed to join class. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-texture flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => router.navigate({ to: "/" })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <Card className="shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold">
                Sanskrit Class
              </span>
            </div>
            <CardTitle className="font-display text-2xl">
              Join the Class
            </CardTitle>
            <CardDescription>
              Enter your class invite code, email, and display name
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              {/* Class Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Class Invite Code</Label>
                <Input
                  id="code"
                  data-ocid="join.code_input"
                  placeholder="e.g. sanskrit01"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toLowerCase());
                    setCodeError("");
                  }}
                  maxLength={10}
                  autoComplete="off"
                  autoFocus
                  required
                  className={
                    codeError
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {codeError ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-destructive text-xs"
                    data-ocid="join.code_error_state"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {codeError}
                  </motion.div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Max 10 characters, lowercase letters and numbers only
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  data-ocid="join.email_input"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used to identify you in this class
                </p>
              </div>

              {/* Display name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  data-ocid="join.name_input"
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be visible to your teacher
                </p>
              </div>

              <Button
                type="submit"
                data-ocid="join.submit_button"
                disabled={loading || !actor}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  "Join Class"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
