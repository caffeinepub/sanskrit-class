import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Copy,
  Key,
  Loader2,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGenerateInviteCode, useInviteCode } from "../../hooks/useQueries";

export default function SettingsPage() {
  const { data: code, isLoading } = useInviteCode();
  const generateCode = useGenerateInviteCode();
  const [copied, setCopied] = useState(false);

  // Auto-generate a code if none exists yet
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit generateCode to avoid infinite loop
  useEffect(() => {
    if (!isLoading && code === "" && !generateCode.isPending) {
      generateCode.mutateAsync().catch(() => {});
    }
  }, [isLoading, code]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy code");
    }
  };

  const handleRegenerate = async () => {
    try {
      const newCode = await generateCode.mutateAsync();
      toast.success(`New code generated: ${newCode}`);
    } catch {
      toast.error("Failed to generate new code");
    }
  };

  const isGenerating =
    isLoading || generateCode.isPending || (code === "" && !isLoading);

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl"
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your class configuration.
          </p>
        </header>

        {/* Invite Code Card */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center">
                <Key className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">
                  Class Invite Code
                </CardTitle>
                <CardDescription>
                  Share this code with students so they can join your class.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Code</Label>
              {isGenerating ? (
                <div className="space-y-2">
                  <Skeleton
                    className="h-12 rounded-lg"
                    data-ocid="settings.loading_state"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {generateCode.isPending
                      ? "Generating your invite code…"
                      : "Loading…"}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2"
                >
                  <Input
                    data-ocid="settings.input"
                    value={code ?? ""}
                    readOnly
                    className="font-mono text-xl tracking-[0.3em] font-bold text-center bg-muted h-12"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!code}
                    data-ocid="settings.secondary_button"
                    className="gap-2 flex-shrink-0 h-12"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </motion.div>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum 10 characters — letters and numbers only.
              </p>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Regenerating will invalidate the old code. Existing students
                will not be affected.
              </p>

              {!code && !isGenerating ? (
                // Fallback manual generate button if auto-generate failed
                <Button
                  data-ocid="settings.primary_button"
                  onClick={handleRegenerate}
                  disabled={generateCode.isPending}
                  className="gap-2"
                >
                  {generateCode.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Invite Code
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      data-ocid="settings.open_modal_button"
                      disabled={generateCode.isPending || isGenerating}
                      className="gap-2"
                    >
                      {generateCode.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Regenerate Code
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="settings.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Regenerate Invite Code?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        The current code will be invalidated. Students who
                        haven't joined yet will need the new code.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="settings.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-ocid="settings.confirm_button"
                        onClick={handleRegenerate}
                      >
                        Regenerate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="shadow-card mt-4">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  How students join
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Student goes to the app homepage</li>
                  <li>Clicks "I'm a Student"</li>
                  <li>Enters the invite code and their email</li>
                  <li>Sets a display name</li>
                  <li>They're now enrolled in your class!</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
