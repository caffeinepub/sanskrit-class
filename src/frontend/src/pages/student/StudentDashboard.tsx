import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useMyAttempts,
  useNotifications,
  useStudyMaterials,
  useTests,
  useUnreadCount,
} from "../../hooks/useQueries";

export default function StudentDashboard() {
  const email = localStorage.getItem("studentEmail") ?? "";
  const studentName = localStorage.getItem("studentName") ?? "Student";

  const { data: materials, isLoading: loadingMaterials } = useStudyMaterials();
  const { data: tests, isLoading: loadingTests } = useTests();
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts(email);
  const { data: notifications, isLoading: loadingNotifs } =
    useNotifications(email);
  const { data: unreadCount } = useUnreadCount(email);

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

  const completedAttempts = attempts?.filter((a) => a.isComplete) ?? [];

  const recentNotifs = notifications
    ? [...notifications]
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 5)
    : [];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            Welcome, {studentName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your Sanskrit class.
          </p>
        </header>

        {/* Active Test Alert */}
        {activeTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  Test is live now!
                </p>
                <p className="text-green-700 text-xs mt-0.5">
                  {activeTests[0].title} — Click to start
                </p>
              </div>
            </div>
            <Link
              to="/student/tests"
              className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors"
            >
              Go to Tests <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: BookOpen,
                  label: "Materials",
                  value: materials?.length ?? 0,
                  loading: loadingMaterials,
                  color: "bg-primary/10 text-primary",
                  link: "/student/materials",
                },
                {
                  icon: ClipboardList,
                  label: "Tests",
                  value: tests?.length ?? 0,
                  loading: loadingTests,
                  color: "bg-accent/60 text-accent-foreground",
                  link: "/student/tests",
                },
                {
                  icon: Award,
                  label: "Completed",
                  value: completedAttempts.length,
                  loading: loadingAttempts,
                  color: "bg-secondary text-secondary-foreground",
                  link: "/student/grades",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={stat.link}>
                    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
                      <CardContent className="p-4">
                        <div
                          className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${stat.color}`}
                        >
                          <stat.icon className="w-4 h-4" />
                        </div>
                        {stat.loading ? (
                          <Skeleton className="h-7 w-10" />
                        ) : (
                          <p className="text-2xl font-display font-semibold">
                            {stat.value}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                          {stat.label}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Upcoming Tests */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">
                    Upcoming Tests
                  </CardTitle>
                  <Link
                    to="/student/tests"
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTests ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : upcomingTests.length === 0 ? (
                  <div
                    data-ocid="tests.empty_state"
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No upcoming tests
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingTests.slice(0, 3).map((test) => {
                      const startMs = Number(test.startTime) / 1_000_000;
                      return (
                        <div
                          key={test.id.toString()}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                        >
                          <div>
                            <p className="font-medium text-sm">{test.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(startMs).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {test.durationMinutes.toString()} min
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications column */}
          <div>
            <Card className="shadow-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                    {Number(unreadCount ?? 0) > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                        {unreadCount?.toString()}
                      </span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingNotifs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : recentNotifs.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No notifications
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotifs.map((notif, i) => (
                      <div
                        key={notif.id.toString()}
                        data-ocid={`notifications.item.${i + 1}`}
                        className={`p-3 rounded-lg text-sm ${
                          !notif.isRead
                            ? "bg-primary/8 border border-primary/20"
                            : "bg-muted/30"
                        }`}
                      >
                        {!notif.isRead && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 mb-0.5 align-middle" />
                        )}
                        <span className="text-foreground">{notif.message}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            Number(notif.createdAt) / 1_000_000,
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
