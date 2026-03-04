import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Loader2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export default function LandingPage() {
  const router = useRouter();
  const { login, isLoggingIn, isInitializing, identity, clear } =
    useInternetIdentity();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const [notAdminError, setNotAdminError] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (identity && isAdmin === true && !checkingAdmin) {
      localStorage.setItem("isTeacher", "true");
      setNotAdminError(false);
      router.navigate({ to: "/teacher" });
    } else if (identity && isAdmin === false && !checkingAdmin) {
      // Logged in but not admin -- show error and clear session
      localStorage.removeItem("isTeacher");
      setNotAdminError(true);
      clear();
    }
  }, [identity, isAdmin, checkingAdmin, router, clear]);

  // Redirect if student session exists
  useEffect(() => {
    const studentEmail = localStorage.getItem("studentEmail");
    if (studentEmail && !identity) {
      router.navigate({ to: "/student" });
    }
  }, [identity, router]);

  const handleTeacherLogin = () => {
    setNotAdminError(false);
    login();
  };

  const handleStudentJoin = () => {
    router.navigate({ to: "/join" });
  };

  const isCheckingAuth =
    isInitializing || isLoggingIn || (identity && checkingAdmin);

  const features = [
    {
      icon: BookOpen,
      title: "Share Study Materials",
      desc: "Upload PDFs, images, and documents for your students.",
    },
    {
      icon: GraduationCap,
      title: "Conduct Online Tests",
      desc: "Create timed tests with secure question papers and anti-cheat.",
    },
    {
      icon: Users,
      title: "Manage Students",
      desc: "Class join codes, student tracking, and grade assignment.",
    },
  ];

  return (
    <div className="min-h-screen bg-texture flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-card"
          >
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-5xl md:text-6xl font-semibold text-foreground mb-4 tracking-tight"
          >
            Sanskrit Class
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed"
          >
            A scholarly platform for sharing knowledge and conducting secure
            online assessments.
          </motion.p>

          {/* CTA Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col gap-3 max-w-md mx-auto mb-16"
          >
            {notAdminError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                data-ocid="landing.not_admin_error_state"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  This identity is not registered as a teacher. Please log in
                  with the correct teacher identity.
                </span>
              </motion.div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                data-ocid="landing.teacher_button"
                onClick={handleTeacherLogin}
                disabled={isCheckingAuth || isLoggingIn}
                className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingAuth || isLoggingIn ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <GraduationCap className="w-8 h-8" />
                )}
                <span className="font-display font-semibold text-lg">
                  {isLoggingIn ? "Signing in…" : "I'm the Teacher"}
                </span>
                <span className="text-xs opacity-80">Login with Identity</span>
              </button>

              <button
                type="button"
                data-ocid="landing.student_button"
                onClick={handleStudentJoin}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-accent text-accent-foreground shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                <Users className="w-8 h-8" />
                <span className="font-display font-semibold text-lg">
                  I'm a Student
                </span>
                <span className="text-xs opacity-70">Join with class code</span>
              </button>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left"
          >
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.08, duration: 0.4 }}
                className="flex flex-col gap-2 p-5 rounded-xl bg-card shadow-xs border border-border"
              >
                <feat.icon className="w-5 h-5 text-primary" />
                <p className="font-sans font-semibold text-sm text-foreground">
                  {feat.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
