import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  ClipboardList,
  Clock,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import type { Test, TestAttempt } from "../../backend.d";
import { useMyAttempts, useTests } from "../../hooks/useQueries";

function getTestStatus(test: Test) {
  const now = Date.now();
  const startMs = Number(test.startTime) / 1_000_000;
  const endMs = startMs + Number(test.durationMinutes) * 60_000;
  if (now < startMs) return "upcoming";
  if (now >= startMs && now < endMs) return "active";
  return "ended";
}

function TestCard({
  test,
  attempt,
  index,
}: {
  test: Test;
  attempt?: TestAttempt;
  index: number;
}) {
  const status = getTestStatus(test);
  const startMs = Number(test.startTime) / 1_000_000;
  const endMs = startMs + Number(test.durationMinutes) * 60_000;
  const hasAttempted = !!attempt;
  const isComplete = attempt?.isComplete;

  const canStart = status === "active" && !hasAttempted;

  // If already started but not complete, allow re-entering
  const canContinue = status === "active" && hasAttempted && !isComplete;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      data-ocid={`tests.item.${index}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
    >
      <div className="flex-shrink-0 mt-0.5">
        {isComplete ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : status === "active" ? (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        ) : status === "ended" ? (
          <Lock className="w-6 h-6 text-muted-foreground/40" />
        ) : (
          <Circle className="w-6 h-6 text-muted-foreground/40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm text-foreground">
              {test.title}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {test.durationMinutes.toString()} minutes
              </span>
              <span>
                {status === "upcoming"
                  ? `Starts ${new Date(startMs).toLocaleString()}`
                  : status === "active"
                    ? `Ends ${new Date(endMs).toLocaleString()}`
                    : `Ended ${new Date(endMs).toLocaleDateString()}`}
              </span>
            </div>

            {attempt?.marks !== undefined && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Award className="w-3 h-3" />
                  Marks: {attempt.marks.toString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            {(canStart || canContinue) && (
              <Link
                to="/student/test/$testId"
                params={{ testId: test.id.toString() }}
              >
                <Button
                  size="sm"
                  data-ocid="test.start_button"
                  className="gap-1.5"
                >
                  {canContinue ? "Continue" : "Start Test"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {status === "active" && isComplete && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Submitted
              </Badge>
            )}
            {status === "ended" && !hasAttempted && (
              <Badge variant="outline" className="text-muted-foreground">
                Missed
              </Badge>
            )}
            {status === "upcoming" && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Upcoming
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Inline import since it's only used here
function Award({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <title>Award</title>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export default function StudentTestsPage() {
  const email = localStorage.getItem("studentEmail") ?? "";
  const { data: tests, isLoading: loadingTests } = useTests();
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts(email);

  const now = Date.now();

  const activeTests =
    tests?.filter((t) => {
      const startMs = Number(t.startTime) / 1_000_000;
      const endMs = startMs + Number(t.durationMinutes) * 60_000;
      return now >= startMs && now < endMs;
    }) ?? [];

  const upcomingTests =
    tests?.filter((t) => {
      const startMs = Number(t.startTime) / 1_000_000;
      return now < startMs;
    }) ?? [];

  const endedTests =
    tests?.filter((t) => {
      const startMs = Number(t.startTime) / 1_000_000;
      const endMs = startMs + Number(t.durationMinutes) * 60_000;
      return now >= endMs;
    }) ?? [];

  const getAttempt = (testId: bigint) =>
    attempts?.find((a) => a.testId === testId);

  const isLoading = loadingTests || loadingAttempts;

  const renderTests = (list: Test[], globalOffset = 0) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div
          data-ocid="tests.empty_state"
          className="py-12 text-center text-muted-foreground"
        >
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No tests in this category.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((test, i) => (
          <TestCard
            key={test.id.toString()}
            test={test}
            attempt={getAttempt(test.id)}
            index={globalOffset + i + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            Tests
          </h1>
          <p className="text-muted-foreground">
            Your assessments — past, present, and future.
          </p>
        </header>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger
              value="active"
              data-ocid="tests.tab"
              className="relative"
            >
              Active
              {activeTests.length > 0 && (
                <span className="ml-1.5 bg-green-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {activeTests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-ocid="tests.tab">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="ended" data-ocid="tests.tab">
              Ended
            </TabsTrigger>
          </TabsList>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <TabsContent value="active" className="mt-0">
                {renderTests(activeTests, 0)}
              </TabsContent>
              <TabsContent value="upcoming" className="mt-0">
                {renderTests(upcomingTests, 0)}
              </TabsContent>
              <TabsContent value="ended" className="mt-0">
                {renderTests(endedTests, 0)}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </motion.div>
    </div>
  );
}
