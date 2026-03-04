import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  Clock,
  File,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useMyAttempts, useTests } from "../../hooks/useQueries";
import { useStorageClient } from "../../hooks/useStorageClient";

function useCountdown(endTimeMs: number | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endTimeMs) return;

    const tick = () => {
      const diff = endTimeMs - Date.now();
      setRemaining(Math.max(0, diff));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTimeMs]);

  const totalMs = remaining;
  const minutes = Math.floor(totalMs / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);

  return {
    remaining,
    display: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}

export default function TestTakingPage() {
  const params = useParams({ from: "/student/test/$testId" });
  const testId = BigInt(params.testId);
  const router = useRouter();
  const { actor } = useActor();
  const storageClient = useStorageClient();
  const email = localStorage.getItem("studentEmail") ?? "";

  const { data: tests } = useTests();
  const { data: attempts, refetch: refetchAttempts } = useMyAttempts(email);

  const test = tests?.find((t) => t.id === testId);
  const attempt = attempts?.find((a) => a.testId === testId);

  // Timer state
  const startMs = test ? Number(test.startTime) / 1_000_000 : null;
  const endTimeMs = test
    ? Number(test.startTime) / 1_000_000 + Number(test.durationMinutes) * 60_000
    : null;

  const { remaining, display: timerDisplay } = useCountdown(endTimeMs);

  // Question paper URL
  const [questionPaperUrl, setQuestionPaperUrl] = useState<string | null>(null);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [paperError, setPaperError] = useState<string | null>(null);

  // Tab switch warning overlay
  const [tabWarning, setTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Answer upload
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(attempt?.isComplete ?? false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test started flag
  const [testStarted, setTestStarted] = useState(false);
  const [starting, setStarting] = useState(false);

  // Now check if test is active
  const now = Date.now();
  const isActive =
    startMs !== null && endTimeMs !== null && now >= startMs && now < endTimeMs;
  const isEnded = endTimeMs !== null && now >= endTimeMs;

  // Tab-switch detection
  const reportTabSwitch = useCallback(async () => {
    if (!actor || !email || !testId) return;
    try {
      await actor.reportTabSwitch(email, testId);
    } catch {
      /* ignore */
    }
    setTabSwitchCount((c) => c + 1);
    setTabWarning(true);
  }, [actor, email, testId]);

  useEffect(() => {
    if (!testStarted || submitted || isEnded) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportTabSwitch();
      }
    };

    const handleBlur = () => {
      reportTabSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [testStarted, submitted, isEnded, reportTabSwitch]);

  // Fetch question paper
  const fetchQuestionPaper = useCallback(async () => {
    if (!actor || !email || !testId || !storageClient) return;
    setLoadingPaper(true);
    setPaperError(null);
    try {
      const result = await actor.getQuestionPaper(email, testId);
      if (result.__kind__ === "err") {
        setPaperError(result.err);
        return;
      }
      const url = await storageClient.getDirectURL(result.ok);
      setQuestionPaperUrl(url);
    } catch (err) {
      setPaperError("Could not load question paper. Please try again.");
      console.error(err);
    } finally {
      setLoadingPaper(false);
    }
  }, [actor, email, testId, storageClient]);

  const handleStartTest = async () => {
    if (!actor || !email) return;
    setStarting(true);
    try {
      const result = await actor.startTest(email, testId);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      setTestStarted(true);
      toast.success("Test started! Good luck 🎓");
      await fetchQuestionPaper();
      await refetchAttempts();
    } catch (err) {
      toast.error("Failed to start test. Please try again.");
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  // Auto-start if already attempted (re-entering)
  useEffect(() => {
    if (attempt && !attempt.isComplete && isActive) {
      setTestStarted(true);
      fetchQuestionPaper();
    }
    if (attempt?.isComplete) {
      setSubmitted(true);
    }
  }, [attempt, isActive, fetchQuestionPaper]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerFile || !actor || !storageClient || !email) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await answerFile.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) => {
        setUploadProgress(pct);
      });

      const result = await actor.submitAnswerPaper(email, testId, hash);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }

      setSubmitted(true);
      toast.success("Answer paper submitted successfully! 🎉");
      await refetchAttempts();
    } catch (err) {
      toast.error("Submission failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Timer color
  const timerColor =
    remaining < 5 * 60_000
      ? "text-red-500"
      : remaining < 10 * 60_000
        ? "text-amber-500"
        : "text-green-600";

  // Test ended
  if (isEnded && !testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="font-display text-2xl font-semibold mb-2">
            Test Has Ended
          </h2>
          <p className="text-muted-foreground mb-6">
            This test is no longer available.
          </p>
          <Button
            variant="outline"
            onClick={() => router.navigate({ to: "/student/tests" })}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  // Not yet started
  if (!isActive && !isEnded) {
    const startDate = startMs ? new Date(startMs) : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="font-display text-2xl font-semibold mb-2">
            {test?.title ?? "Test"}
          </h2>
          <p className="text-muted-foreground mb-2">
            This test hasn't started yet.
          </p>
          {startDate && (
            <p className="text-sm text-foreground font-medium mb-6">
              Starts: {startDate.toLocaleString()}
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => router.navigate({ to: "/student/tests" })}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Tab warning overlay */}
      <AnimatePresence>
        {tabWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 tab-warning-overlay flex items-center justify-center"
            style={{ backgroundColor: "rgba(200, 50, 30, 0.88)" }}
          >
            <div className="text-center text-white p-8 rounded-2xl bg-white/10 backdrop-blur-sm max-w-md mx-4">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
              <h2 className="font-display text-2xl font-bold mb-3">
                Tab Switch Detected!
              </h2>
              <p className="text-lg mb-2">You switched tabs during the test.</p>
              <p className="text-sm opacity-80 mb-6">
                This has been recorded ({tabSwitchCount} time
                {tabSwitchCount > 1 ? "s" : ""}). You cannot switch tabs during
                a test.
              </p>
              <Button
                onClick={() => setTabWarning(false)}
                className="bg-white text-red-700 hover:bg-white/90 font-semibold"
              >
                I understand — Return to Test
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-xs sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-semibold text-lg text-foreground truncate max-w-xs">
            {test?.title ?? "Test"}
          </h1>
          {tabSwitchCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {tabSwitchCount} tab switch{tabSwitchCount > 1 ? "es" : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {!isEnded && !submitted && (
            <div
              className={`flex items-center gap-2 font-mono text-xl font-bold ${timerColor}`}
            >
              <Clock className="w-5 h-5" />
              {timerDisplay}
            </div>
          )}

          {(submitted || isEnded) && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {submitted ? "Submitted" : "Ended"}
            </Badge>
          )}
        </div>
      </header>

      {/* Main content */}
      {!testStarted ? (
        /* Start screen */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-semibold mb-3">
              Ready to Begin?
            </h2>
            <div className="text-sm text-muted-foreground space-y-1 mb-2">
              <p className="text-foreground font-medium text-base">
                {test?.title}
              </p>
              <p>Duration: {test?.durationMinutes.toString()} minutes</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important Rules
              </p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Do NOT switch tabs or minimize the window</li>
                <li>Each tab switch will be recorded and reported</li>
                <li>
                  The question paper is only accessible once during the test
                  window
                </li>
                <li>Submit your answer paper before time runs out</li>
              </ul>
            </div>
            <Button
              size="lg"
              data-ocid="test.start_button"
              onClick={handleStartTest}
              disabled={starting || !actor}
              className="gap-2 px-8"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Start Test
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Test in progress */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Question Paper - left 70% */}
          <div className="flex-1 flex flex-col border-r border-border min-h-0">
            <div className="px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground font-medium">
              Question Paper
            </div>
            {loadingPaper ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Loading question paper…
                  </p>
                </div>
              </div>
            ) : paperError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground p-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                  <p className="font-medium text-foreground mb-2">
                    Could not load question paper
                  </p>
                  <p className="text-sm mb-4">{paperError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchQuestionPaper}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : questionPaperUrl ? (
              <div className="flex-1 pdf-viewer-container">
                <iframe
                  src={questionPaperUrl}
                  title="Question Paper"
                  className="w-full h-full border-0"
                  style={{ minHeight: "calc(100vh - 120px)" }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Fetching paper…</span>
              </div>
            )}
          </div>

          {/* Answer upload - right panel */}
          <div className="lg:w-80 flex-shrink-0 flex flex-col bg-card">
            <div className="px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground font-medium">
              Answer Submission
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    Submitted!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your answer paper has been submitted. Your teacher will
                    review and assign marks.
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => router.navigate({ to: "/student/grades" })}
                  >
                    View Grades
                  </Button>
                </div>
              ) : isEnded ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Lock className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-display font-semibold text-lg mb-2">
                    Test Ended
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The test period has ended.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Upload Answer Paper
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload a photo or PDF of your written answers.
                    </p>
                  </div>

                  {/* Dropzone */}
                  <button
                    type="button"
                    data-ocid="test.dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const dropped = e.dataTransfer.files[0];
                      if (dropped) setAnswerFile(dropped);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? "dropzone-active"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        setAnswerFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {answerFile ? (
                      <div>
                        <File className="w-7 h-7 mx-auto mb-1.5 text-primary" />
                        <p className="text-xs font-medium text-foreground">
                          {answerFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(answerFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-7 h-7 mx-auto mb-1.5 text-muted-foreground" />
                        <p className="text-xs text-foreground font-medium">
                          Drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PDF or image
                        </p>
                      </div>
                    )}
                  </button>

                  {uploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <Button
                    type="submit"
                    data-ocid="test.submit_button"
                    disabled={
                      !answerFile ||
                      uploading ||
                      isEnded ||
                      !storageClient ||
                      !actor
                    }
                    className="w-full gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Submit Answer Paper
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    You can only submit once. Make sure your file is correct.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
