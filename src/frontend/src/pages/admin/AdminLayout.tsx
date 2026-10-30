import { Button } from "@/components/ui/button";
import { BarChart3, GraduationCap, LogOut, Menu, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import AnalyticsPage from "./AnalyticsPage";
import ManageTeachersPage from "./ManageTeachersPage";

type AdminPage = "analytics" | "manage-teachers";

const navItems = [
  { id: "analytics" as const, label: "Dashboard", icon: BarChart3 },
  { id: "manage-teachers" as const, label: "Manage Teachers", icon: Users },
];

export default function AdminLayout() {
  const { session, logout } = useApp();
  const [activePage, setActivePage] = useState<AdminPage>("analytics");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session || session.type !== "staff") return null;

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
              Super Admin
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
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
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
            data-ocid={`admin.${item.id}.link`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
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
              {session.user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          data-ocid="admin.logout.button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex w-60 bg-sidebar flex-col shrink-0">
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
          <aside className="absolute left-0 top-0 h-full w-60 bg-sidebar flex flex-col">
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
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          {activePage === "analytics" ? (
            <AnalyticsPage />
          ) : (
            <ManageTeachersPage />
          )}
        </main>
      </div>
    </div>
  );
}
