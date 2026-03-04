import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import JoinPage from "./pages/JoinPage";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentGradesPage from "./pages/student/StudentGradesPage";
import StudentLayout from "./pages/student/StudentLayout";
import StudentMaterialsPage from "./pages/student/StudentMaterialsPage";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import TestTakingPage from "./pages/student/TestTakingPage";
import MaterialsPage from "./pages/teacher/MaterialsPage";
import SettingsPage from "./pages/teacher/SettingsPage";
import StudentsPage from "./pages/teacher/StudentsPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TestsPage from "./pages/teacher/TestsPage";

// ── Root ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// ── Public routes ────────────────────────────────────────────────────────────

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: JoinPage,
});

// ── Teacher routes ───────────────────────────────────────────────────────────

const teacherLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  component: TeacherLayout,
  beforeLoad: () => {
    const isTeacher = localStorage.getItem("isTeacher") === "true";
    if (!isTeacher) {
      throw redirect({ to: "/" });
    }
  },
});

const teacherDashboardRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: "/",
  component: TeacherDashboard,
});

const teacherStudentsRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: "/students",
  component: StudentsPage,
});

const teacherMaterialsRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: "/materials",
  component: MaterialsPage,
});

const teacherTestsRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: "/tests",
  component: TestsPage,
});

const teacherSettingsRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// ── Student routes ───────────────────────────────────────────────────────────

const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  component: StudentLayout,
  beforeLoad: () => {
    const email = localStorage.getItem("studentEmail");
    if (!email) {
      throw redirect({ to: "/join" });
    }
  },
});

const studentDashboardRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/",
  component: StudentDashboard,
});

const studentMaterialsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/materials",
  component: StudentMaterialsPage,
});

const studentTestsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/tests",
  component: StudentTestsPage,
});

const testTakingRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/test/$testId",
  component: TestTakingPage,
});

const studentGradesRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/grades",
  component: StudentGradesPage,
});

// ── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  landingRoute,
  joinRoute,
  teacherLayoutRoute.addChildren([
    teacherDashboardRoute,
    teacherStudentsRoute,
    teacherMaterialsRoute,
    teacherTestsRoute,
    teacherSettingsRoute,
  ]),
  studentLayoutRoute.addChildren([
    studentDashboardRoute,
    studentMaterialsRoute,
    studentTestsRoute,
    testTakingRoute,
    studentGradesRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
