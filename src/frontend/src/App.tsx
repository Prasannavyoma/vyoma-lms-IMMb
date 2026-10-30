import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherLayout from "./pages/teacher/TeacherLayout";

function AppContent() {
  const { currentPage } = useApp();
  switch (currentPage) {
    case "admin":
      return <AdminLayout />;
    case "teacher":
      return <TeacherLayout />;
    case "student":
      return <StudentDashboard />;
    default:
      return <LoginPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster richColors position="top-right" />
    </AppProvider>
  );
}
