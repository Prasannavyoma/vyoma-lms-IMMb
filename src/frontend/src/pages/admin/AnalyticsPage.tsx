import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, UserCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { lmsStore } from "../../store/lmsStore";

export default function AnalyticsPage() {
  const { stats, recentActivity } = useMemo(() => {
    const users = lmsStore.getUsers().filter((u) => u.role !== "super_admin");
    const students = lmsStore.getStudents();
    const materials = lmsStore.getMaterials();

    const s = {
      teachers: users.length,
      students: students.length,
      materials: materials.length,
      activeTeachers: users.filter((u) => u.isActive).length,
    };

    const activity = [
      ...users.map((u) => ({
        key: `user-${u.id}`,
        label: `Teacher added: ${u.fullName}`,
        date: u.createdAt,
        color: "bg-primary",
      })),
      ...students.map((st) => ({
        key: `student-${st.id}`,
        label: `Student enrolled: ${st.name}`,
        date: st.createdAt,
        color: "bg-green-500",
      })),
      ...materials.map((m) => ({
        key: `material-${m.id}`,
        label: `Material uploaded: ${m.title}`,
        date: m.createdAt,
        color: "bg-amber-500",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    return { stats: s, recentActivity: activity };
  }, []);

  const statCards = [
    {
      title: "Total Teachers",
      value: stats.teachers,
      icon: Users,
      bg: "bg-primary/10",
      fg: "text-primary",
    },
    {
      title: "Total Students",
      value: stats.students,
      icon: GraduationCap,
      bg: "bg-emerald-100",
      fg: "text-emerald-600",
    },
    {
      title: "Total Materials",
      value: stats.materials,
      icon: BookOpen,
      bg: "bg-amber-100",
      fg: "text-amber-600",
    },
    {
      title: "Active Teachers",
      value: stats.activeTeachers,
      icon: UserCheck,
      bg: "bg-violet-100",
      fg: "text-violet-600",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform analytics and recent activity
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            data-ocid="admin.analytics.card"
          >
            <Card className="border shadow-xs">
              <CardContent className="p-5">
                <div
                  className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}
                >
                  <card.icon className={`w-4 h-4 ${card.fg}`} />
                </div>
                <p className="font-display text-3xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.title}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground text-sm"
              data-ocid="analytics.empty_state"
            >
              No activity yet. Start by adding teachers.
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 py-2.5 border-b last:border-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${item.color}`}
                  />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
