import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Download,
  Eye,
  File,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LogOut,
  Monitor,
  Music,
  Paperclip,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type {
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  Flipbook,
  FormSubmission,
  LMSForm,
  Material,
  Notification,
  NotificationType,
  SubmissionStatus,
} from "../../types/lms";

// --- File type helpers (reuse from materials) ---
function FileTypeIcon({
  fileType,
  className,
}: { fileType: string; className?: string }) {
  const props = { className: className ?? "w-6 h-6" };
  switch (fileType) {
    case "video":
      return <Video {...props} />;
    case "audio":
      return <Music {...props} />;
    case "image":
      return <FileImage {...props} />;
    case "pdf":
      return <FileText {...props} />;
    case "excel":
      return <FileSpreadsheet {...props} />;
    case "presentation":
      return <Monitor {...props} />;
    default:
      return <File {...props} />;
  }
}

const FILE_TYPE_COLOR: Record<string, string> = {
  video: "bg-purple-100 text-purple-600",
  audio: "bg-pink-100 text-pink-600",
  image: "bg-green-100 text-green-600",
  pdf: "bg-red-100 text-red-600",
  excel: "bg-emerald-100 text-emerald-600",
  presentation: "bg-orange-100 text-orange-600",
  document: "bg-blue-100 text-blue-600",
};

const FILE_TYPE_LABEL: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  pdf: "PDF",
  excel: "Spreadsheet",
  presentation: "Presentation",
  document: "Document",
};

const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-700",
  late: "bg-orange-100 text-orange-700",
  graded: "bg-emerald-100 text-emerald-700",
};

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
};

// --- Materials Tab ---
function MaterialsTab({
  studentId,
  teacherId,
}: { studentId: string; teacherId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    const all = lmsStore.getMaterials();
    setMaterials(
      all.filter(
        (m) =>
          m.uploadedByUserId === teacherId &&
          (m.assignedToStudentIds.length === 0 ||
            m.assignedToStudentIds.includes(studentId)),
      ),
    );
  }, [studentId, teacherId]);

  const handleDownload = (m: Material) => {
    const link = document.createElement("a");
    link.href = m.fileDataUrl;
    link.download = m.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (materials.length === 0)
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground"
        data-ocid="student.materials.empty_state"
      >
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No materials yet</p>
      </div>
    );

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-ocid="student.materials.list"
    >
      {materials.map((mat, i) => (
        <motion.div
          key={mat.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow"
          data-ocid={`student.material.item.${i + 1}`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              FILE_TYPE_COLOR[mat.fileType] ?? "bg-muted text-muted-foreground"
            }`}
          >
            <FileTypeIcon fileType={mat.fileType} className="w-6 h-6" />
          </div>
          <p className="font-display font-semibold text-sm mb-1 line-clamp-2">
            {mat.title}
          </p>
          {mat.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {mat.description}
            </p>
          )}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${
                FILE_TYPE_COLOR[mat.fileType] ?? "bg-muted"
              }`}
            >
              {FILE_TYPE_LABEL[mat.fileType] ?? mat.fileType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => window.open(mat.fileDataUrl, "_blank")}
              data-ocid={`student.material.view.${i + 1}`}
            >
              <Eye className="w-3 h-3 mr-1.5" />
              View
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => handleDownload(mat)}
              data-ocid={`student.material.download.${i + 1}`}
            >
              <Download className="w-3 h-3 mr-1.5" />
              Download
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// --- Assignments Tab ---
function AssignmentsTab({
  studentId,
  studentName,
  teacherId,
}: { studentId: string; studentName: string; teacherId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>(
    {},
  );
  const [responseFiles, setResponseFiles] = useState<
    Record<string, { dataUrl: string; name: string }>
  >({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const refresh = useCallback(() => {
    const allAssignments = lmsStore.getAssignments();
    const visible = allAssignments.filter(
      (a) =>
        a.createdByTeacherId === teacherId &&
        (a.assignedToStudentIds.length === 0 ||
          a.assignedToStudentIds.includes(studentId)),
    );
    setAssignments(visible);
    const allSubs = lmsStore.getAssignmentSubmissions();
    setSubmissions(allSubs.filter((s) => s.studentId === studentId));
  }, [studentId, teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSubmission = (assignmentId: string) =>
    submissions.find((s) => s.assignmentId === assignmentId);

  const handleFileChange = (assignmentId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) =>
      setResponseFiles((prev) => ({
        ...prev,
        [assignmentId]: {
          dataUrl: ev.target?.result as string,
          name: file.name,
        },
      }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (assignment: Assignment) => {
    const existing = getSubmission(assignment.id);
    if (existing && existing.status !== "pending") return;

    const responseText = responseTexts[assignment.id] ?? "";
    const responseFile = responseFiles[assignment.id];
    const isPast = new Date(assignment.dueDate) < new Date();
    const status: SubmissionStatus = isPast ? "late" : "submitted";

    const sub: AssignmentSubmission = {
      id: existing?.id ?? crypto.randomUUID(),
      assignmentId: assignment.id,
      studentId,
      responseText,
      fileDataUrl: responseFile?.dataUrl ?? "",
      fileName: responseFile?.name ?? "",
      submittedAt: new Date().toISOString(),
      score: null,
      maxScore: 100,
      feedback: "",
      gradedAt: null,
      status,
    };

    if (existing) {
      lmsStore.updateAssignmentSubmission(existing.id, sub);
    } else {
      lmsStore.addAssignmentSubmission(sub);
    }

    // Notify teacher that this student submitted
    lmsStore.addTeacherNotification({
      id: crypto.randomUUID(),
      teacherId,
      type: "assignment_submitted",
      message: `${studentName} submitted assignment: "${assignment.title}"`,
      studentName,
      relatedId: assignment.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    refresh();
    toast.success(
      status === "late" ? "Submitted (late)." : "Assignment submitted!",
    );
  };

  if (assignments.length === 0)
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground"
        data-ocid="student.assignments.empty_state"
      >
        <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No assignments yet</p>
      </div>
    );

  return (
    <div className="space-y-4" data-ocid="student.assignments.list">
      {assignments.map((a, i) => {
        const sub = getSubmission(a.id);
        const isPast = new Date(a.dueDate) < new Date();
        const status: SubmissionStatus = sub?.status ?? "pending";

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-2xl p-5 space-y-3"
            data-ocid={`student.assignment.item.${i + 1}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">{a.title}</p>
                {a.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {a.description}
                  </p>
                )}
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                  SUBMISSION_STATUS_COLORS[status]
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <p
              className={`text-xs ${
                isPast ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              Due: {new Date(a.dueDate).toLocaleDateString()}
            </p>
            {a.fileDataUrl && (
              <a
                href={a.fileDataUrl}
                download={a.fileName}
                className="text-xs text-primary flex items-center gap-1 underline"
              >
                <Paperclip className="w-3 h-3" /> {a.fileName}
              </a>
            )}

            {status === "graded" && sub && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                <p className="font-semibold text-emerald-800">
                  Score: {sub.score} / {sub.maxScore}
                </p>
                {sub.feedback && (
                  <p className="text-emerald-700 mt-1">{sub.feedback}</p>
                )}
              </div>
            )}

            {(status === "submitted" || status === "late") && sub && (
              <div className="bg-muted/40 rounded-xl p-3 text-sm">
                <p className="text-muted-foreground">Your submission:</p>
                {sub.responseText && <p className="mt-1">{sub.responseText}</p>}
                {sub.fileDataUrl && (
                  <a
                    href={sub.fileDataUrl}
                    download={sub.fileName}
                    className="text-xs text-primary underline flex items-center gap-1 mt-1"
                  >
                    <Paperclip className="w-3 h-3" /> {sub.fileName}
                  </a>
                )}
              </div>
            )}

            {status === "pending" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your response here…"
                  rows={3}
                  value={responseTexts[a.id] ?? ""}
                  onChange={(e) =>
                    setResponseTexts((prev) => ({
                      ...prev,
                      [a.id]: e.target.value,
                    }))
                  }
                  data-ocid={`student.assignment.textarea.${i + 1}`}
                />
                <div className="flex items-center gap-2">
                  <label
                    className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 border rounded-lg hover:bg-muted/50"
                    htmlFor={`assign-file-${a.id}`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {responseFiles[a.id]?.name ?? "Attach file"}
                    <input
                      id={`assign-file-${a.id}`}
                      type="file"
                      className="hidden"
                      ref={(el) => {
                        fileInputRefs.current[a.id] = el;
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(a.id, file);
                      }}
                    />
                  </label>
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(a)}
                    data-ocid={`student.assignment.submit.${i + 1}`}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// --- Assessments Tab ---
type TakingFormState = {
  formId: string;
  answers: Record<string, string>;
};

function AssessmentsTab({
  studentId,
  studentName,
  teacherId,
}: { studentId: string; studentName: string; teacherId: string }) {
  const [forms, setForms] = useState<LMSForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [taking, setTaking] = useState<TakingFormState | null>(null);

  const refresh = useCallback(() => {
    const allForms = lmsStore.getForms();
    const visible = allForms.filter(
      (f) =>
        f.createdByTeacherId === teacherId &&
        (f.assignedToStudentIds.length === 0 ||
          f.assignedToStudentIds.includes(studentId)),
    );
    setForms(visible);
    const allSubs = lmsStore.getFormSubmissions();
    setSubmissions(allSubs.filter((s) => s.studentId === studentId));
  }, [studentId, teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSubmission = (formId: string) =>
    submissions.find((s) => s.formId === formId);

  const handleSubmitForm = (form: LMSForm) => {
    if (!taking) return;
    const answers = form.questions.map((q) => ({
      questionId: q.id,
      answer: taking.answers[q.id] ?? "",
    }));

    // Auto-grade MCQ
    const mcqQuestions = form.questions.filter((q) => q.type === "mcq");
    let score: number | null = null;
    if (form.isGraded && mcqQuestions.length > 0) {
      score = mcqQuestions.filter(
        (q) => (taking.answers[q.id] ?? "") === q.correctAnswer,
      ).length;
    }

    const sub: FormSubmission = {
      id: crypto.randomUUID(),
      formId: form.id,
      studentId,
      answers,
      score,
      maxScore: mcqQuestions.length,
      feedback: "",
      submittedAt: new Date().toISOString(),
      gradedAt: score !== null ? new Date().toISOString() : null,
    };
    lmsStore.addFormSubmission(sub);

    // Notify teacher that this student submitted the assessment
    // Only notify if the form needs teacher grading (has written questions or is graded)
    if (form.isGraded) {
      lmsStore.addTeacherNotification({
        id: crypto.randomUUID(),
        teacherId,
        type: "assessment_submitted",
        message: `${studentName} submitted assessment: "${form.title}"`,
        studentName,
        relatedId: form.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    refresh();
    setTaking(null);
    toast.success("Assessment submitted!");
  };

  // Taking mode
  if (taking) {
    const form = forms.find((f) => f.id === taking.formId);
    if (!form) {
      setTaking(null);
      return null;
    }
    return (
      <div className="space-y-5 max-w-xl">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setTaking(null)}>
            ← Back
          </Button>
          <h2 className="font-display font-semibold">{form.title}</h2>
        </div>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
        {form.questions.map((q, qi) => (
          <div key={q.id} className="bg-card border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">
              {qi + 1}. {q.questionText}
            </p>
            {q.type === "mcq" && (
              <RadioGroup
                value={taking.answers[q.id] ?? ""}
                onValueChange={(v) =>
                  setTaking((prev) =>
                    prev
                      ? { ...prev, answers: { ...prev.answers, [q.id]: v } }
                      : prev,
                  )
                }
              >
                {q.options.map((opt, oi) => (
                  <div
                    key={`${q.id}-${oi}`}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem id={`q-${q.id}-opt-${oi}`} value={opt} />
                    <label
                      htmlFor={`q-${q.id}-opt-${oi}`}
                      className="text-sm cursor-pointer"
                    >
                      {opt}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {q.type === "short" && (
              <input
                type="text"
                placeholder="Your answer"
                value={taking.answers[q.id] ?? ""}
                onChange={(e) =>
                  setTaking((prev) =>
                    prev
                      ? {
                          ...prev,
                          answers: { ...prev.answers, [q.id]: e.target.value },
                        }
                      : prev,
                  )
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            {q.type === "long" && (
              <Textarea
                placeholder="Your answer"
                rows={3}
                value={taking.answers[q.id] ?? ""}
                onChange={(e) =>
                  setTaking((prev) =>
                    prev
                      ? {
                          ...prev,
                          answers: { ...prev.answers, [q.id]: e.target.value },
                        }
                      : prev,
                  )
                }
              />
            )}
          </div>
        ))}
        <Button
          onClick={() => handleSubmitForm(form)}
          className="w-full"
          data-ocid="student.assessment.submit.button"
        >
          Submit Assessment
        </Button>
      </div>
    );
  }

  if (forms.length === 0)
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground"
        data-ocid="student.assessments.empty_state"
      >
        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No assessments yet</p>
      </div>
    );

  return (
    <div className="space-y-4" data-ocid="student.assessments.list">
      {forms.map((form, i) => {
        const sub = getSubmission(form.id);
        return (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-2xl p-5 flex items-center gap-4"
            data-ocid={`student.assessment.item.${i + 1}`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm">{form.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={form.isGraded ? "default" : "secondary"}
                  className="text-xs"
                >
                  {form.isGraded ? "Assessment" : "Survey"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {form.questions.length} question
                  {form.questions.length !== 1 ? "s" : ""}
                </span>
              </div>
              {sub && sub.gradedAt !== null && sub.score !== null && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-600">
                    Score: {sub.score} / {sub.maxScore}
                  </p>
                  {sub.feedback && (
                    <p className="text-xs text-muted-foreground">
                      Feedback: {sub.feedback}
                    </p>
                  )}
                </div>
              )}
              {sub && sub.gradedAt === null && (
                <p className="text-xs text-amber-600 mt-1">
                  Submitted — awaiting grading
                </p>
              )}
            </div>
            <div>
              {sub ? (
                <Badge
                  className={
                    sub.gradedAt !== null
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  {sub.gradedAt !== null ? "Graded" : "Submitted"}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setTaking({ formId: form.id, answers: {} })}
                  data-ocid={`student.assessment.start.${i + 1}`}
                >
                  Start
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// --- Flipbooks Tab ---
function FlipbooksTab({
  studentId,
  teacherId,
}: { studentId: string; teacherId: string }) {
  const [flipbooks, setFlipbooks] = useState<Flipbook[]>([]);
  const [viewing, setViewing] = useState<Flipbook | null>(null);

  useEffect(() => {
    const all = lmsStore.getFlipbooks();
    setFlipbooks(
      all.filter(
        (f) =>
          f.createdByTeacherId === teacherId &&
          (f.assignedToStudentIds.length === 0 ||
            f.assignedToStudentIds.includes(studentId)),
      ),
    );
  }, [studentId, teacherId]);

  if (viewing) {
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setViewing(null)}>
          ← Back to Flipbooks
        </Button>
        <div
          className="border rounded-xl overflow-hidden"
          style={{ height: "60vh" }}
        >
          <iframe
            srcDoc={atob(
              viewing.htmlContent.replace("data:text/html;base64,", ""),
            )}
            title={viewing.title}
            className="w-full h-full"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    );
  }

  if (flipbooks.length === 0)
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground"
        data-ocid="student.flipbooks.empty_state"
      >
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No flipbooks yet</p>
      </div>
    );

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      data-ocid="student.flipbooks.list"
    >
      {flipbooks.map((fb, i) => (
        <motion.div
          key={fb.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border rounded-2xl p-5 space-y-3"
          data-ocid={`student.flipbook.item.${i + 1}`}
        >
          <p className="font-display font-semibold">{fb.title}</p>
          {fb.description && (
            <p className="text-sm text-muted-foreground">{fb.description}</p>
          )}
          <Button
            size="sm"
            onClick={() => setViewing(fb)}
            data-ocid={`student.flipbook.read.${i + 1}`}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Read
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// --- Attendance Tab ---
function AttendanceTab({
  studentId,
  teacherId,
}: { studentId: string; teacherId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const all = lmsStore.getAttendance();
    setRecords(
      all
        .filter((r) => r.studentId === studentId && r.teacherId === teacherId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    );
  }, [studentId, teacherId]);

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold">{records.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Days</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-emerald-700">
            {present}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Present</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-red-600">
            {absent}
          </p>
          <p className="text-xs text-red-500 mt-1">Absent</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-yellow-700">
            {late}
          </p>
          <p className="text-xs text-yellow-600 mt-1">Late</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground text-sm"
          data-ocid="student.attendance.empty_state"
        >
          <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No attendance records yet.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, i) => (
                <tr
                  key={rec.id}
                  className="border-t"
                  data-ocid={`student.attendance.item.${i + 1}`}
                >
                  <td className="px-4 py-3">{rec.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ATTENDANCE_STATUS_COLORS[rec.status]
                      }`}
                    >
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Notification Bell ---
function NotificationBell({
  studentId,
  onNavigate,
}: {
  studentId: string;
  onNavigate: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = () => {
    setNotifications(
      lmsStore
        .getNotifications(studentId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    );
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh is stable per render
  useEffect(() => {
    refresh();
  }, [studentId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    lmsStore.markAllAsRead(studentId);
    refresh();
  };

  const handleClick = (n: Notification) => {
    lmsStore.markAsRead(n.id);
    refresh();
    setOpen(false);
    const tabMap: Record<NotificationType, string> = {
      material_assigned: "materials",
      assessment_assigned: "assessments",
      assignment_assigned: "assignments",
      flipbook_assigned: "flipbooks",
      result_ready: "assessments",
    };
    onNavigate(tabMap[n.type]);
  };

  const typeTag = (type: NotificationType) => {
    const map: Record<NotificationType, { label: string; color: string }> = {
      material_assigned: {
        label: "Material",
        color: "bg-blue-100 text-blue-700",
      },
      assessment_assigned: {
        label: "Assessment",
        color: "bg-purple-100 text-purple-700",
      },
      assignment_assigned: {
        label: "Assignment",
        color: "bg-orange-100 text-orange-700",
      },
      flipbook_assigned: {
        label: "Flipbook",
        color: "bg-green-100 text-green-700",
      },
      result_ready: {
        label: "Result",
        color: "bg-emerald-100 text-emerald-700",
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
        className="relative h-9 w-9 p-0"
        onClick={() => {
          setOpen((o) => !o);
          refresh();
        }}
        data-ocid="student.notifications.bell"
      >
        <Bell className="w-5 h-5" />
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
            className="absolute right-0 top-11 z-50 w-80 bg-popover border rounded-xl shadow-lg overflow-hidden"
            data-ocid="student.notifications.panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-display font-semibold text-sm">
                Notifications
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
                  No notifications yet
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
                      data-ocid="student.notification.item"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 mt-0.5 ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug">{n.message}</p>
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

// --- Main Student Dashboard ---
export default function StudentDashboard() {
  const { session, logout } = useApp();
  const [activeTab, setActiveTab] = useState("materials");

  const studentId = session?.type === "student" ? session.student.id : "";

  useEffect(() => {
    if (!studentId) return;
    const unread = lmsStore.getUnreadCount(studentId);
    if (unread > 0) {
      toast.info(
        `You have ${unread} new notification${unread > 1 ? "s" : ""}`,
        {
          description: "Check the bell icon for details.",
          duration: 5000,
        },
      );
    }
  }, [studentId]);

  if (!session || session.type !== "student") return null;

  const { student } = session;
  const teacherId = student.teacherId;
  const studentName = student.name;
  const rollNumber = student.rollNumber;
  const username = student.username;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 80% 40% at 50% -10%, oklch(0.70 0.12 271 / 0.12), transparent), oklch(var(--background))",
      }}
    >
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-base">
                Vyoma LMS
              </span>
              <span className="text-muted-foreground text-xs ml-2">
                Student Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{studentName}</p>
              <p className="text-xs text-muted-foreground">
                {rollNumber ? `Roll: ${rollNumber}` : username}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">
                {studentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <NotificationBell studentId={studentId} onNavigate={setActiveTab} />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground"
              data-ocid="student.logout.button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">
            Welcome back, {studentName.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Access your learning materials, assignments, and assessments
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          data-ocid="student.tabs"
        >
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger
              value="materials"
              className="gap-1.5"
              data-ocid="student.materials.tab"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Materials
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="gap-1.5"
              data-ocid="student.assignments.tab"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Assignments
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="gap-1.5"
              data-ocid="student.assessments.tab"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Assessments
            </TabsTrigger>
            <TabsTrigger
              value="flipbooks"
              className="gap-1.5"
              data-ocid="student.flipbooks.tab"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Flipbooks
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="gap-1.5"
              data-ocid="student.attendance.tab"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <MaterialsTab studentId={studentId} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="assignments">
            <AssignmentsTab
              studentId={studentId}
              studentName={studentName}
              teacherId={teacherId}
            />
          </TabsContent>
          <TabsContent value="assessments">
            <AssessmentsTab
              studentId={studentId}
              studentName={studentName}
              teacherId={teacherId}
            />
          </TabsContent>
          <TabsContent value="flipbooks">
            <FlipbooksTab studentId={studentId} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceTab studentId={studentId} teacherId={teacherId} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-8">
        © {new Date().getFullYear()} Vyoma LMS. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
