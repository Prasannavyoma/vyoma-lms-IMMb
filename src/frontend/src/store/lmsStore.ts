import type {
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  AttendanceStatus,
  Flipbook,
  FormSubmission,
  LMSForm,
  Material,
  Notification,
  StaffUser,
  Student,
  TeacherNotification,
} from "../types/lms";

const KEYS = {
  users: "vyoma_users",
  students: "vyoma_students",
  materials: "vyoma_materials",
  session: "vyoma_session",
  forms: "vyoma_forms",
  formSubmissions: "vyoma_form_submissions",
  assignments: "vyoma_assignments",
  assignmentSubmissions: "vyoma_assignment_submissions",
  flipbooks: "vyoma_flipbooks",
  attendance: "vyoma_attendance",
  notifications: "vyoma_notifications",
  teacherNotifications: "vyoma_teacher_notifications",
} as const;

const SEED_ADMIN: StaffUser = {
  id: "admin1",
  username: "vishwam@vyoma.org",
  password: "#vyoma@123",
  fullName: "Vishwam",
  email: "vishwam@vyoma.org",
  role: "super_admin",
  permissions: ["read", "write", "manage_students", "upload_materials"],
  isActive: true,
  createdAt: new Date().toISOString(),
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed on import
const _existingUsers = load<StaffUser[]>(KEYS.users, []);
if (_existingUsers.length === 0) {
  save(KEYS.users, [SEED_ADMIN]);
} else if (!_existingUsers.find((u) => u.role === "super_admin")) {
  save(KEYS.users, [SEED_ADMIN, ..._existingUsers]);
}

export const lmsStore = {
  // Users
  getUsers: (): StaffUser[] => load(KEYS.users, []),
  addUser: (user: StaffUser) =>
    save(KEYS.users, [...lmsStore.getUsers(), user]),
  updateUser: (id: string, updates: Partial<StaffUser>) =>
    save(
      KEYS.users,
      lmsStore.getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u)),
    ),
  deleteUser: (id: string) =>
    save(
      KEYS.users,
      lmsStore.getUsers().filter((u) => u.id !== id),
    ),
  findStaffByCredentials: (
    username: string,
    password: string,
  ): StaffUser | null => {
    const u = username.trim();
    const p = password.trim();
    return (
      lmsStore
        .getUsers()
        .find(
          (user) =>
            user.isActive &&
            user.username.trim() === u &&
            user.password.trim() === p,
        ) ?? null
    );
  },

  // Students
  getStudents: (): Student[] => load(KEYS.students, []),
  addStudent: (student: Student) =>
    save(KEYS.students, [...lmsStore.getStudents(), student]),
  updateStudent: (id: string, updates: Partial<Student>) =>
    save(
      KEYS.students,
      lmsStore
        .getStudents()
        .map((s) => (s.id === id ? { ...s, ...updates } : s)),
    ),
  deleteStudent: (id: string) =>
    save(
      KEYS.students,
      lmsStore.getStudents().filter((s) => s.id !== id),
    ),
  findStudentByCredentials: (
    username: string,
    password: string,
  ): Student | null => {
    const u = username.trim();
    const p = password.trim();
    return (
      lmsStore
        .getStudents()
        .find((s) => s.username.trim() === u && s.password.trim() === p) ?? null
    );
  },

  // Materials
  getMaterials: (): Material[] => load(KEYS.materials, []),
  addMaterial: (material: Material) =>
    save(KEYS.materials, [...lmsStore.getMaterials(), material]),
  updateMaterial: (id: string, updates: Partial<Material>) =>
    save(
      KEYS.materials,
      lmsStore
        .getMaterials()
        .map((m) => (m.id === id ? { ...m, ...updates } : m)),
    ),
  deleteMaterial: (id: string) =>
    save(
      KEYS.materials,
      lmsStore.getMaterials().filter((m) => m.id !== id),
    ),

  // Session
  getSession: (): { type: string; id: string } | null =>
    load(KEYS.session, null),
  setSession: (session: { type: string; id: string }) =>
    save(KEYS.session, session),
  clearSession: () => localStorage.removeItem(KEYS.session),

  // Forms
  getForms: (): LMSForm[] => load(KEYS.forms, []),
  addForm: (form: LMSForm) => save(KEYS.forms, [...lmsStore.getForms(), form]),
  updateForm: (id: string, updates: Partial<LMSForm>) =>
    save(
      KEYS.forms,
      lmsStore.getForms().map((f) => (f.id === id ? { ...f, ...updates } : f)),
    ),
  deleteForm: (id: string) =>
    save(
      KEYS.forms,
      lmsStore.getForms().filter((f) => f.id !== id),
    ),

  // Form Submissions
  getFormSubmissions: (): FormSubmission[] => load(KEYS.formSubmissions, []),
  addFormSubmission: (sub: FormSubmission) =>
    save(KEYS.formSubmissions, [...lmsStore.getFormSubmissions(), sub]),
  updateFormSubmission: (id: string, updates: Partial<FormSubmission>) =>
    save(
      KEYS.formSubmissions,
      lmsStore
        .getFormSubmissions()
        .map((s) => (s.id === id ? { ...s, ...updates } : s)),
    ),
  deleteFormSubmission: (id: string) =>
    save(
      KEYS.formSubmissions,
      lmsStore.getFormSubmissions().filter((s) => s.id !== id),
    ),

  // Assignments
  getAssignments: (): Assignment[] => load(KEYS.assignments, []),
  addAssignment: (a: Assignment) =>
    save(KEYS.assignments, [...lmsStore.getAssignments(), a]),
  updateAssignment: (id: string, updates: Partial<Assignment>) =>
    save(
      KEYS.assignments,
      lmsStore
        .getAssignments()
        .map((a) => (a.id === id ? { ...a, ...updates } : a)),
    ),
  deleteAssignment: (id: string) =>
    save(
      KEYS.assignments,
      lmsStore.getAssignments().filter((a) => a.id !== id),
    ),

  // Assignment Submissions
  getAssignmentSubmissions: (): AssignmentSubmission[] =>
    load(KEYS.assignmentSubmissions, []),
  addAssignmentSubmission: (sub: AssignmentSubmission) =>
    save(KEYS.assignmentSubmissions, [
      ...lmsStore.getAssignmentSubmissions(),
      sub,
    ]),
  updateAssignmentSubmission: (
    id: string,
    updates: Partial<AssignmentSubmission>,
  ) =>
    save(
      KEYS.assignmentSubmissions,
      lmsStore
        .getAssignmentSubmissions()
        .map((s) => (s.id === id ? { ...s, ...updates } : s)),
    ),
  deleteAssignmentSubmission: (id: string) =>
    save(
      KEYS.assignmentSubmissions,
      lmsStore.getAssignmentSubmissions().filter((s) => s.id !== id),
    ),

  // Flipbooks
  getFlipbooks: (): Flipbook[] => load(KEYS.flipbooks, []),
  addFlipbook: (fb: Flipbook) =>
    save(KEYS.flipbooks, [...lmsStore.getFlipbooks(), fb]),
  updateFlipbook: (id: string, updates: Partial<Flipbook>) =>
    save(
      KEYS.flipbooks,
      lmsStore
        .getFlipbooks()
        .map((f) => (f.id === id ? { ...f, ...updates } : f)),
    ),
  deleteFlipbook: (id: string) =>
    save(
      KEYS.flipbooks,
      lmsStore.getFlipbooks().filter((f) => f.id !== id),
    ),

  // Attendance
  getAttendance: (): AttendanceRecord[] => load(KEYS.attendance, []),
  addAttendanceRecord: (rec: AttendanceRecord) =>
    save(KEYS.attendance, [...lmsStore.getAttendance(), rec]),
  upsertAttendanceRecord: (
    studentId: string,
    teacherId: string,
    date: string,
    status: AttendanceStatus,
  ) => {
    const all = lmsStore.getAttendance();
    const existing = all.find(
      (r) => r.studentId === studentId && r.date === date,
    );
    if (existing) {
      save(
        KEYS.attendance,
        all.map((r) =>
          r.id === existing.id
            ? { ...r, status, createdAt: new Date().toISOString() }
            : r,
        ),
      );
    } else {
      save(KEYS.attendance, [
        ...all,
        {
          id: crypto.randomUUID(),
          studentId,
          teacherId,
          date,
          status,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  },
  deleteAttendanceRecord: (id: string) =>
    save(
      KEYS.attendance,
      lmsStore.getAttendance().filter((r) => r.id !== id),
    ),

  // Student Notifications
  getNotifications: (studentId: string): Notification[] =>
    load<Notification[]>(KEYS.notifications, []).filter(
      (n) => n.studentId === studentId,
    ),
  addNotification: (n: Notification) =>
    save(KEYS.notifications, [
      ...load<Notification[]>(KEYS.notifications, []),
      n,
    ]),
  markAsRead: (id: string) =>
    save(
      KEYS.notifications,
      load<Notification[]>(KEYS.notifications, []).map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    ),
  markAllAsRead: (studentId: string) =>
    save(
      KEYS.notifications,
      load<Notification[]>(KEYS.notifications, []).map((n) =>
        n.studentId === studentId ? { ...n, isRead: true } : n,
      ),
    ),
  getUnreadCount: (studentId: string): number =>
    load<Notification[]>(KEYS.notifications, []).filter(
      (n) => n.studentId === studentId && !n.isRead,
    ).length,

  // Teacher Notifications (student submissions)
  getTeacherNotifications: (teacherId: string): TeacherNotification[] =>
    load<TeacherNotification[]>(KEYS.teacherNotifications, [])
      .filter((n) => n.teacherId === teacherId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  addTeacherNotification: (n: TeacherNotification) =>
    save(KEYS.teacherNotifications, [
      ...load<TeacherNotification[]>(KEYS.teacherNotifications, []),
      n,
    ]),
  markTeacherNotificationRead: (id: string) =>
    save(
      KEYS.teacherNotifications,
      load<TeacherNotification[]>(KEYS.teacherNotifications, []).map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    ),
  markAllTeacherNotificationsRead: (teacherId: string) =>
    save(
      KEYS.teacherNotifications,
      load<TeacherNotification[]>(KEYS.teacherNotifications, []).map((n) =>
        n.teacherId === teacherId ? { ...n, isRead: true } : n,
      ),
    ),
  getTeacherUnreadCount: (teacherId: string): number =>
    load<TeacherNotification[]>(KEYS.teacherNotifications, []).filter(
      (n) => n.teacherId === teacherId && !n.isRead,
    ).length,

  // Teacher pending grading helpers
  getTeacherPendingAssessmentCount: (teacherId: string): number => {
    const forms = lmsStore
      .getForms()
      .filter((f) => f.createdByTeacherId === teacherId);
    const formIds = new Set(forms.map((f) => f.id));
    return lmsStore
      .getFormSubmissions()
      .filter((s) => formIds.has(s.formId) && s.gradedAt === null).length;
  },
  getTeacherPendingAssignmentCount: (teacherId: string): number => {
    const assignments = lmsStore
      .getAssignments()
      .filter((a) => a.createdByTeacherId === teacherId);
    const assignmentIds = new Set(assignments.map((a) => a.id));
    return lmsStore
      .getAssignmentSubmissions()
      .filter(
        (s) =>
          assignmentIds.has(s.assignmentId) &&
          (s.status === "submitted" || s.status === "late"),
      ).length;
  },
};
