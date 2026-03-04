import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useIsAdmin } from "../../hooks/useQueries";

const navItems = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/teacher/students", label: "Students", icon: Users },
  { to: "/teacher/materials", label: "Materials", icon: BookOpen },
  { to: "/teacher/tests", label: "Tests", icon: ClipboardList },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

export default function TeacherLayout() {
  const router = useRouter();
  const routerState = useRouterState();
  const { clear, identity } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useIsAdmin();

  // Redirect if not admin once we know
  useEffect(() => {
    if (!isLoading && isAdmin === false) {
      localStorage.removeItem("isTeacher");
      router.navigate({ to: "/" });
    }
  }, [isAdmin, isLoading, router]);

  // Redirect if no identity
  useEffect(() => {
    if (!identity && !isLoading) {
      localStorage.removeItem("isTeacher");
      router.navigate({ to: "/" });
    }
  }, [identity, isLoading, router]);

  const handleLogout = () => {
    clear();
    localStorage.removeItem("isTeacher");
    router.navigate({ to: "/" });
  };

  const currentPath = routerState.location.pathname;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Brand */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold text-sidebar-foreground text-sm leading-tight">
                Sanskrit Class
              </p>
              <p className="text-xs text-sidebar-foreground/75">
                Teacher Portal
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? currentPath === item.to
              : currentPath.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={`nav.${item.label.toLowerCase()}_link`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground sidebar-item-active"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
