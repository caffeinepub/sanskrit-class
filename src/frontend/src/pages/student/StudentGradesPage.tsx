import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, CheckCircle, Clock, Trophy, XCircle } from "lucide-react";
import { motion } from "motion/react";
import type { Test, TestAttempt } from "../../backend.d";
import { useMyAttempts, useTests } from "../../hooks/useQueries";

function GradeRow({
  test,
  attempt,
  index,
}: {
  test: Test;
  attempt?: TestAttempt;
  index: number;
}) {
  const startMs = Number(test.startTime) / 1_000_000;
  const endMs = startMs + Number(test.durationMinutes) * 60_000;
  const hasEnded = Date.now() >= endMs;
  const hasAttempted = !!attempt;
  const hasMark = attempt?.marks !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      data-ocid={`grades.item.${index}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {hasMark ? (
          <Trophy className="w-6 h-6 text-amber-500" />
        ) : attempt?.isComplete ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : hasAttempted ? (
          <Clock className="w-6 h-6 text-blue-500" />
        ) : hasEnded ? (
          <XCircle className="w-6 h-6 text-muted-foreground/40" />
        ) : (
          <Clock className="w-6 h-6 text-muted-foreground/40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{test.title}</p>
        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>
            {new Date(startMs).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>{test.durationMinutes.toString()} min</span>
          {Number(attempt?.tabSwitchCount ?? 0) > 0 && (
            <span className="text-amber-600">
              ⚠ {attempt!.tabSwitchCount.toString()} tab switch
              {Number(attempt!.tabSwitchCount) > 1 ? "es" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Grade */}
      <div className="flex-shrink-0 text-right">
        {hasMark ? (
          <div>
            <p className="text-2xl font-display font-bold text-foreground">
              {attempt!.marks!.toString()}
            </p>
            <p className="text-xs text-muted-foreground">marks</p>
          </div>
        ) : attempt?.isComplete ? (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-xs"
          >
            Awaiting marks
          </Badge>
        ) : hasAttempted && !hasEnded ? (
          <Badge
            variant="outline"
            className="text-blue-700 bg-blue-50 border-blue-200 text-xs"
          >
            In progress
          </Badge>
        ) : hasEnded && !hasAttempted ? (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Not attempted
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Upcoming
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export default function StudentGradesPage() {
  const email = localStorage.getItem("studentEmail") ?? "";
  const { data: tests, isLoading: loadingTests } = useTests();
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts(email);

  const isLoading = loadingTests || loadingAttempts;

  const getAttempt = (testId: bigint) =>
    attempts?.find((a) => a.testId === testId);

  // Stats
  const gradedAttempts = attempts?.filter((a) => a.marks !== undefined) ?? [];
  const totalMarks = gradedAttempts.reduce(
    (sum, a) => sum + Number(a.marks ?? 0),
    0,
  );
  const avgMarks =
    gradedAttempts.length > 0
      ? (totalMarks / gradedAttempts.length).toFixed(1)
      : "–";

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            My Grades
          </h1>
          <p className="text-muted-foreground">
            Your performance across all assessments.
          </p>
        </header>

        {/* Summary cards */}
        {!isLoading && gradedAttempts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Tests Graded",
                value: gradedAttempts.length,
                icon: Trophy,
                color: "bg-amber-100 text-amber-700",
              },
              {
                label: "Total Marks",
                value: totalMarks,
                icon: Award,
                color: "bg-primary/10 text-primary",
              },
              {
                label: "Average Marks",
                value: avgMarks,
                icon: CheckCircle,
                color: "bg-green-100 text-green-700",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <div
                      className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-display font-bold">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">All Tests</CardTitle>
            <CardDescription>
              {tests?.length ?? 0} test{tests?.length !== 1 ? "s" : ""} in class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : !tests || tests.length === 0 ? (
              <div
                data-ocid="grades.empty_state"
                className="py-16 text-center text-muted-foreground"
              >
                <Award className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No tests yet</p>
                <p className="text-sm mt-1">
                  Your teacher hasn't created any tests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...tests]
                  .sort((a, b) => Number(b.startTime) - Number(a.startTime))
                  .map((test, i) => (
                    <GradeRow
                      key={test.id.toString()}
                      test={test}
                      attempt={getAttempt(test.id)}
                      index={i + 1}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
