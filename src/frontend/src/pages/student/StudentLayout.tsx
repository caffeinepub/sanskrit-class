import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  Award,
  Bell,
  BookOpen,
  Check,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useMarkAllRead,
  useNotifications,
  useUnreadCount,
} from "../../hooks/useQueries";

const navItems = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/student/materials", label: "Materials", icon: BookOpen },
  { to: "/student/tests", label: "Tests", icon: ClipboardList },
  { to: "/student/grades", label: "Grades", icon: Award },
];

function NotificationsPanel({ email }: { email: string }) {
  const { data: notifications, isLoading } = useNotifications(email);
  const { data: unreadCount } = useUnreadCount(email);
  const markAllRead = useMarkAllRead();
  const [open, setOpen] = useState(false);

  const handleMarkAll = async () => {
    try {
      await markAllRead.mutateAsync(email);
    } catch {
      /* ignore */
    }
  };

  const count = Number(unreadCount ?? 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="notifications.bell_button"
          className="relative text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        >
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="notifications.popover"
        className="w-80 p-0"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display font-semibold text-sm">Notifications</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              data-ocid="notifications.mark_all_button"
              onClick={handleMarkAll}
              className="text-xs h-7 gap-1"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div
              data-ocid="notifications.empty_state"
              className="py-10 text-center text-muted-foreground text-sm"
            >
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="py-1">
              {[...notifications]
                .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                .map((notif, i) => (
                  <div
                    key={notif.id.toString()}
                    data-ocid={`notifications.item.${i + 1}`}
                    className={cn(
                      "px-4 py-3 text-sm border-b border-border/50 last:border-0",
                      !notif.isRead && "bg-accent/10",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-foreground leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            Number(notif.createdAt) / 1_000_000,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function StudentLayout() {
  const router = useRouter();
  const routerState = useRouterState();
  const email = localStorage.getItem("studentEmail") ?? "";
  const studentName = localStorage.getItem("studentName") ?? "Student";

  useEffect(() => {
    if (!email) {
      router.navigate({ to: "/join" });
    }
  }, [email, router]);

  const handleLogout = () => {
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentName");
    router.navigate({ to: "/" });
  };

  const currentPath = routerState.location.pathname;
  const isTestPage = currentPath.startsWith("/student/test/");

  // Don't show sidebar on test-taking page (full screen)
  if (isTestPage) {
    return <Outlet />;
  }

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
              <p className="text-xs text-sidebar-foreground/50 truncate max-w-[120px]">
                {studentName}
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
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
        <div className="p-4 border-t border-sidebar-border flex items-center gap-2">
          <div className="flex-1">
            <NotificationsPanel email={email} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1 justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
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
