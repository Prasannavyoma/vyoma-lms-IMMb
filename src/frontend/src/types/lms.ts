export type Permission =
  | "read"
  | "write"
  | "manage_students"
  | "upload_materials";

export type StaffRole =
  | "super_admin"
  | "teacher"
  | "co_teacher"
  | "assistant_teacher";

export interface StaffUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: StaffRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  idCardNumber: string;
  rollNumber: string;
  username: string;
  password: string;
  teacherId: string;
  assignedMaterialIds: string[];
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  fileType: string;
  fileName: string;
  fileDataUrl: string;
  uploadedByUserId: string;
  assignedToStudentIds: string[];
  createdAt: string;
}

export type UserSession =
  | { type: "staff"; user: StaffUser }
  | { type: "student"; student: Student };

// --- Forms & Assessments ---

export interface FormQuestion {
  id: string;
  type: "mcq" | "short" | "long";
  questionText: string;
  options: string[]; // for MCQ only
  correctAnswer: string; // for MCQ only (the correct option text)
  correctAnswerIndex: number; // -1 = not yet selected by teacher
}

export interface LMSForm {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  isGraded: boolean; // true = quiz/assessment, false = survey
  assignedToStudentIds: string[]; // empty = all students
  createdByTeacherId: string;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  studentId: string;
  answers: { questionId: string; answer: string }[];
  score: number | null; // null until graded
  maxScore: number;
  feedback: string;
  submittedAt: string;
  gradedAt: string | null;
}

// --- Assignments ---

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date
  fileDataUrl: string; // optional reference file
  fileName: string;
  assignedToStudentIds: string[]; // empty = all students
  createdByTeacherId: string;
  createdAt: string;
}

export type SubmissionStatus = "pending" | "submitted" | "late" | "graded";

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  responseText: string;
  fileDataUrl: string;
  fileName: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number;
  feedback: string;
  gradedAt: string | null;
  status: SubmissionStatus;
}

// --- Flipbooks ---

export interface Flipbook {
  id: string;
  title: string;
  description: string;
  htmlContent: string; // base64 data URL of .html file
  assignedToStudentIds: string[]; // empty = all students
  createdByTeacherId: string;
  createdAt: string;
}

// --- Attendance ---

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  createdAt: string;
}

// --- Student Notifications ---

export type NotificationType =
  | "material_assigned"
  | "assessment_assigned"
  | "assignment_assigned"
  | "flipbook_assigned"
  | "result_ready";

export interface Notification {
  id: string;
  studentId: string;
  type: NotificationType;
  message: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

// --- Teacher Notifications (for student submissions) ---

export type TeacherNotificationType =
  | "assessment_submitted"
  | "assignment_submitted";

export interface TeacherNotification {
  id: string;
  teacherId: string;
  type: TeacherNotificationType;
  message: string;
  studentName: string;
  relatedId: string; // formId or assignmentId
  isRead: boolean;
  createdAt: string;
}
