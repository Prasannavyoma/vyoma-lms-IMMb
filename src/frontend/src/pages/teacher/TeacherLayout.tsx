import { Button } from "@/components/ui/button";
import {
  Bell,
  BookMarked,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  GraduationCap,
  LogOut,
  Menu,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type {
  TeacherNotification,
  TeacherNotificationType,
} from "../../types/lms";
import AssignMaterialsPage from "./AssignMaterialsPage";
import AssignmentsPage from "./AssignmentsPage";
import AttendancePage from "./AttendancePage";
import FlipbooksPage from "./FlipbooksPage";
import FormsPage from "./FormsPage";
import MaterialsPage from "./MaterialsPage";
import StudentsPage from "./StudentsPage";

type TeacherPage =
  | "students"
  | "materials"
  | "assign"
  | "forms"
  | "assignments"
  | "flipbooks"
  | "attendance";

const ROLE_LABELS: Record<string, string> = {
  teacher: "Teacher",
  co_teacher: "Co-Teacher",
  assistant_teacher: "Assistant Teacher",
};

// --- Teacher Notification Bell ---
function TeacherNotificationBell({
  teacherId,
  onNavigate,
}: {
  teacherId: string;
  onNavigate: (page: TeacherPage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);

  const refresh = () => {
    setNotifications(lmsStore.getTeacherNotifications(teacherId));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh is stable per render
  useEffect(() => {
    refresh();
    // Poll every 5 seconds so the teacher sees new submissions in real time
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [teacherId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    lmsStore.markAllTeacherNotificationsRead(teacherId);
    refresh();
  };

  const handleClick = (n: TeacherNotification) => {
    lmsStore.markTeacherNotificationRead(n.id);
    refresh();
    setOpen(false);
    const pageMap: Record<TeacherNotificationType, TeacherPage> = {
      assessment_submitted: "forms",
      assignment_submitted: "assignments",
    };
    onNavigate(pageMap[n.type]);
  };

  const typeTag = (type: TeacherNotificationType) => {
    const map: Record<
      TeacherNotificationType,
      { label: string; color: string }
    > = {
      assessment_submitted: {
        label: "Assessment",
        color: "bg-purple-100 text-purple-700",
      },
      assignment_submitted: {
        label: "Assignment",
        color: "bg-orange-100 text-orange-700",
      },
    };
    return map[type];
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => {
          setOpen((o) => !o);
          refresh();
        }}
        data-ocid="teacher.notifications.bell"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            role="presentation"
          />
          <div
            className="absolute left-0 top-11 z-50 w-80 bg-popover border rounded-xl shadow-lg overflow-hidden"
            data-ocid="teacher.notifications.panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-display font-semibold text-sm text-foreground">
                Student Submissions
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No submissions yet
                </div>
              ) : (
                notifications.map((n) => {
                  const tag = typeTag(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                      data-ocid="teacher.notification.item"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 mt-0.5 ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug text-foreground">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TeacherLayout() {
  const { session, logout } = useApp();
  const [activePage, setActivePage] = useState<TeacherPage>("students");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingAssessments, setPendingAssessments] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState(0);

  const teacherId = session?.type === "staff" ? session.user.id : "";

  // Poll pending counts every 5s so sidebar badges update when students submit
  useEffect(() => {
    if (!teacherId) return;
    const update = () => {
      setPendingAssessments(
        lmsStore.getTeacherPendingAssessmentCount(teacherId),
      );
      setPendingAssignments(
        lmsStore.getTeacherPendingAssignmentCount(teacherId),
      );
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [teacherId]);

  if (!session || session.type !== "staff") return null;

  const navItems = [
    { id: "students" as const, label: "Students", icon: Users, badge: 0 },
    { id: "materials" as const, label: "Materials", icon: BookOpen, badge: 0 },
    { id: "assign" as const, label: "Assign Materials", icon: Send, badge: 0 },
    {
      id: "forms" as const,
      label: "Forms & Assessments",
      icon: ClipboardList,
      badge: pendingAssessments,
    },
    {
      id: "assignments" as const,
      label: "Assignments",
      icon: FileCheck,
      badge: pendingAssignments,
    },
    {
      id: "flipbooks" as const,
      label: "Flipbooks",
      icon: BookMarked,
      badge: 0,
    },
    {
      id: "attendance" as const,
      label: "Attendance",
      icon: CalendarCheck,
      badge: 0,
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-sidebar-foreground text-base leading-tight block">
              Vyoma LMS
            </span>
            <span className="text-xs text-sidebar-foreground/40 leading-tight block">
              {ROLE_LABELS[session.user.role] ?? "Teacher"}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActivePage(item.id);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activePage === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
            data-ocid={`teacher.${item.id}.link`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge > 0 && (
              <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground text-xs font-bold">
              {session.user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-semibold truncate">
              {session.user.fullName}
            </p>
            <p className="text-sidebar-foreground/40 text-xs truncate">
              {ROLE_LABELS[session.user.role] ?? "Teacher"}
            </p>
          </div>
          <TeacherNotificationBell
            teacherId={teacherId}
            onNavigate={(page) => {
              setActivePage(page);
              setMobileOpen(false);
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          data-ocid="teacher.logout.button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex w-64 bg-sidebar flex-col shrink-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Vyoma LMS</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {activePage === "students" && <StudentsPage />}
          {activePage === "materials" && <MaterialsPage />}
          {activePage === "assign" && <AssignMaterialsPage />}
          {activePage === "forms" && <FormsPage />}
          {activePage === "assignments" && <AssignmentsPage />}
          {activePage === "flipbooks" && <FlipbooksPage />}
          {activePage === "attendance" && <AttendancePage />}
        </main>
      </div>
    </div>
  );
}
