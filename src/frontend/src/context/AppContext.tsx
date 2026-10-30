import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { lmsStore } from "../store/lmsStore";
import type { UserSession } from "../types/lms";

export type AppPage = "login" | "admin" | "teacher" | "student";

interface AppContextType {
  session: UserSession | null;
  currentPage: AppPage;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState<AppPage>("login");

  useEffect(() => {
    const saved = lmsStore.getSession();
    if (!saved) return;
    if (saved.type === "staff") {
      const user = lmsStore.getUsers().find((u) => u.id === saved.id);
      if (user) {
        setSession({ type: "staff", user });
        setCurrentPage(user.role === "super_admin" ? "admin" : "teacher");
      }
    } else if (saved.type === "student") {
      const student = lmsStore.getStudents().find((s) => s.id === saved.id);
      if (student) {
        setSession({ type: "student", student });
        setCurrentPage("student");
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const staff = lmsStore.findStaffByCredentials(username, password);
    if (staff) {
      setSession({ type: "staff", user: staff });
      lmsStore.setSession({ type: "staff", id: staff.id });
      setCurrentPage(staff.role === "super_admin" ? "admin" : "teacher");
      return true;
    }
    const student = lmsStore.findStudentByCredentials(username, password);
    if (student) {
      setSession({ type: "student", student });
      lmsStore.setSession({ type: "student", id: student.id });
      setCurrentPage("student");
      return true;
    }
    return false;
  };

  const logout = () => {
    setSession(null);
    setCurrentPage("login");
    lmsStore.clearSession();
  };

  return (
    <AppContext.Provider value={{ session, currentPage, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
