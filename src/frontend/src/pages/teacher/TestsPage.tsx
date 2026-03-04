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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  ExternalLink,
  File,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Test, TestAttempt } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAssignMarks,
  useCreateTest,
  useDeleteTest,
  useTestAttempts,
  useTests,
} from "../../hooks/useQueries";
import { useStorageClient } from "../../hooks/useStorageClient";

function getTestStatus(test: Test) {
  const now = Date.now();
  const startMs = Number(test.startTime) / 1_000_000;
  const endMs = startMs + Number(test.durationMinutes) * 60_000;
  if (now < startMs) return "upcoming";
  if (now >= startMs && now < endMs) return "active";
  return "ended";
}

function AttemptsPanel({
  testId,
  storageClient,
}: {
  testId: bigint;
  storageClient: ReturnType<typeof useStorageClient>;
}) {
  const { data: attempts, isLoading } = useTestAttempts(testId);
  const assignMarks = useAssignMarks();
  const [marksValues, setMarksValues] = useState<Record<string, string>>({});
  const [savingFor, setSavingFor] = useState<string | null>(null);

  const handleSaveMarks = async (attempt: TestAttempt) => {
    const val = marksValues[attempt.studentEmail];
    if (!val || Number.isNaN(Number(val))) {
      toast.error("Enter a valid mark");
      return;
    }
    setSavingFor(attempt.studentEmail);
    try {
      await assignMarks.mutateAsync({
        testId,
        studentEmail: attempt.studentEmail,
        marks: BigInt(Math.round(Number(val))),
      });
      toast.success(`Marks saved for ${attempt.studentEmail}`);
    } catch {
      toast.error("Failed to save marks");
    } finally {
      setSavingFor(null);
    }
  };

  const handleViewAnswer = async (blobId: string) => {
    if (!storageClient) {
      toast.error("Storage not available");
      return;
    }
    try {
      const url = await storageClient.getDirectURL(blobId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open answer paper");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 pt-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div
        data-ocid="grading.empty_state"
        className="py-6 text-center text-muted-foreground text-sm"
      >
        No attempts yet for this test.
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {attempts.map((attempt, i) => (
        <div
          key={attempt.studentEmail}
          data-ocid={`grading.item.${i + 1}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {attempt.studentEmail}
            </p>
            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
              <span>{attempt.isComplete ? "Completed" : "In progress"}</span>
              {Number(attempt.tabSwitchCount) > 0 && (
                <span className="text-amber-600">
                  ⚠ {attempt.tabSwitchCount.toString()} tab switch
                  {Number(attempt.tabSwitchCount) > 1 ? "es" : ""}
                </span>
              )}
              {attempt.marks !== undefined && (
                <span className="text-green-600 font-semibold">
                  Marks: {attempt.marks.toString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {attempt.answerBlobId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  attempt.answerBlobId && handleViewAnswer(attempt.answerBlobId)
                }
                className="gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Answer
              </Button>
            )}

            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0"
                placeholder="Marks"
                data-ocid="grading.marks_input"
                className="w-20 h-8 text-xs"
                value={
                  marksValues[attempt.studentEmail] ??
                  attempt.marks?.toString() ??
                  ""
                }
                onChange={(e) =>
                  setMarksValues((prev) => ({
                    ...prev,
                    [attempt.studentEmail]: e.target.value,
                  }))
                }
              />
              <Button
                size="sm"
                data-ocid="grading.save_button"
                disabled={savingFor === attempt.studentEmail}
                onClick={() => handleSaveMarks(attempt)}
                className="h-8 px-3"
              >
                {savingFor === attempt.studentEmail ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestCard({
  test,
  onDelete,
  storageClient,
  index,
}: {
  test: Test;
  onDelete: (id: bigint) => void;
  storageClient: ReturnType<typeof useStorageClient>;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = getTestStatus(test);
  const startMs = Number(test.startTime) / 1_000_000;

  const statusColors = {
    active: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    ended: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      data-ocid={`tests.item.${index}`}
      className="border border-border rounded-xl overflow-hidden"
    >
      <div className="flex items-start gap-4 p-4 bg-card">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm text-foreground">{test.title}</p>
            <Badge className={statusColors[status]} variant="outline">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {test.durationMinutes.toString()} min
            </span>
            <span>Starts: {new Date(startMs).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            Attempts
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`tests.delete_button.${index}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="tests.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete "{test.title}"? All attempt data will also be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="tests.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="tests.confirm_button"
                  onClick={() => onDelete(test.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-muted/20 px-4 pb-4 overflow-hidden"
          >
            <AttemptsPanel testId={test.id} storageClient={storageClient} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TestsPage() {
  const { data: tests, isLoading } = useTests();
  const createTest = useCreateTest();
  const deleteTest = useDeleteTest();
  const storageClient = useStorageClient();
  const { identity } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !startDateTime) return;

    if (!identity) {
      toast.error(
        "You must be logged in with Internet Identity to create a test. Please log out and log in again.",
      );
      return;
    }

    if (!storageClient) {
      toast.error(
        "Storage service is not available. Please refresh the page and try again.",
      );
      return;
    }

    const startTimeMs = new Date(startDateTime).getTime();
    if (Number.isNaN(startTimeMs)) {
      toast.error("Invalid start date/time");
      return;
    }

    const durationMins = Number.parseInt(duration);
    if (Number.isNaN(durationMins) || durationMins < 1) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let hash: string;
      try {
        const result = await storageClient.putFile(bytes, (pct) => {
          setUploadProgress(pct);
        });
        hash = result.hash;
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        const msg =
          uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        toast.error(`Failed to upload question paper: ${msg}`);
        return;
      }

      try {
        await createTest.mutateAsync({
          title: title.trim(),
          questionBlobId: hash,
          startTime: BigInt(startTimeMs * 1_000_000),
          durationMinutes: BigInt(durationMins),
        });
      } catch (createErr) {
        console.error("Create test error:", createErr);
        const msg =
          createErr instanceof Error ? createErr.message : String(createErr);
        toast.error(`Failed to create test: ${msg}`);
        return;
      }

      toast.success("Test created! Students will be notified.");
      setCreateOpen(false);
      setTitle("");
      setStartDateTime("");
      setDuration("60");
      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error("Unexpected error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Unexpected error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteTest.mutateAsync(id);
      toast.success("Test deleted");
    } catch {
      toast.error("Failed to delete test");
    }
  };

  // Minimum datetime: now
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
              Tests
            </h1>
            <p className="text-muted-foreground">
              Create and manage online assessments.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="tests.create_button" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Create New Test
                </DialogTitle>
                <DialogDescription>
                  Upload the question paper and set the test schedule.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-title">Test Title</Label>
                  <Input
                    id="test-title"
                    placeholder="e.g. Unit 2 Sanskrit Grammar Test"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Date & Time</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      min={minDateTime}
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="300"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Question Paper Upload */}
                <div className="space-y-2">
                  <Label>Question Paper</Label>
                  <button
                    type="button"
                    data-ocid="tests.dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const dropped = e.dataTransfer.files[0];
                      if (dropped) setFile(dropped);
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
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                      <div>
                        <File className="w-7 h-7 mx-auto mb-1.5 text-primary" />
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-7 h-7 mx-auto mb-1.5 text-muted-foreground" />
                        <p className="text-sm text-foreground font-medium">
                          Drop PDF or image here
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Only accessible to students during the test window
                        </p>
                      </div>
                    )}
                  </button>
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading question paper…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    data-ocid="tests.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    data-ocid="tests.submit_button"
                    disabled={
                      !file ||
                      !title.trim() ||
                      !startDateTime ||
                      uploading ||
                      actorLoading ||
                      !storageClient
                    }
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Creating…
                      </>
                    ) : actorLoading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Initializing…
                      </>
                    ) : (
                      "Create Test"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">All Tests</CardTitle>
            <CardDescription>
              {tests?.length ?? 0} test{tests?.length !== 1 ? "s" : ""} created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !tests || tests.length === 0 ? (
              <div
                data-ocid="tests.empty_state"
                className="py-16 text-center text-muted-foreground"
              >
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No tests yet</p>
                <p className="text-sm mt-1">
                  Click "Create Test" to schedule your first assessment.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {tests.map((test, i) => (
                    <TestCard
                      key={test.id.toString()}
                      test={test}
                      onDelete={handleDelete}
                      storageClient={storageClient}
                      index={i + 1}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
