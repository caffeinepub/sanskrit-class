import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ClipboardList, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import {
  useStudents,
  useStudyMaterials,
  useTests,
} from "../../hooks/useQueries";

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  color: string;
}) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-display font-semibold text-foreground">
                {value}
              </p>
            )}
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: materials, isLoading: loadingMaterials } = useStudyMaterials();
  const { data: tests, isLoading: loadingTests } = useTests();

  const now = Date.now();
  const activeTests =
    tests?.filter((t) => {
      const startMs = Number(t.startTime) / 1_000_000;
      const endMs = startMs + Number(t.durationMinutes) * 60_000;
      return now >= startMs && now < endMs;
    }).length ?? 0;

  const stats = [
    {
      icon: Users,
      label: "Students",
      value: students?.length ?? 0,
      loading: loadingStudents,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: BookOpen,
      label: "Study Materials",
      value: materials?.length ?? 0,
      loading: loadingMaterials,
      color: "bg-accent/60 text-accent-foreground",
    },
    {
      icon: ClipboardList,
      label: "Total Tests",
      value: tests?.length ?? 0,
      loading: loadingTests,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      icon: TrendingUp,
      label: "Active Tests",
      value: activeTests,
      loading: loadingTests,
      color: "bg-green-100 text-green-700",
    },
  ];

  const recentTests = tests?.slice(-3).reverse() ?? [];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            Welcome back, Teacher
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your Sanskrit class.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Recent Tests */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Recent Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : recentTests.length === 0 ? (
                <div
                  data-ocid="tests.empty_state"
                  className="py-10 text-center text-muted-foreground"
                >
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No tests created yet.</p>
                  <p className="text-xs mt-1">
                    Go to Tests to create your first one.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTests.map((test) => {
                    const startMs = Number(test.startTime) / 1_000_000;
                    const endMs =
                      startMs + Number(test.durationMinutes) * 60_000;
                    const isActive = now >= startMs && now < endMs;
                    const isUpcoming = now < startMs;

                    return (
                      <div
                        key={test.id.toString()}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                      >
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {test.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Number(test.durationMinutes)} min ·{" "}
                            {new Date(startMs).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            isActive
                              ? "bg-green-100 text-green-700"
                              : isUpcoming
                                ? "bg-blue-100 text-blue-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : isUpcoming
                              ? "Upcoming"
                              : "Ended"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
