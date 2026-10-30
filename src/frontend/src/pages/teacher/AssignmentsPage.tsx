import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileCheck,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type {
  Assignment,
  AssignmentSubmission,
  Student,
  SubmissionStatus,
} from "../../types/lms";

type View = "list" | "create";

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-700",
  late: "bg-orange-100 text-orange-700",
  graded: "bg-emerald-100 text-emerald-700",
};

function SubmissionsDialog({
  assignment,
  students,
  open,
  onClose,
}: {
  assignment: Assignment;
  students: Student[];
  open: boolean;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { score: string; maxScore: string; feedback: string }>
  >({});

  const loadSubmissions = () => {
    const all = lmsStore.getAssignmentSubmissions();
    setSubmissions(all.filter((s) => s.assignmentId === assignment.id));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadSubmissions is stable
  useEffect(() => {
    if (!open) return;
    loadSubmissions();
  }, [open]);

  const assignedStudents =
    assignment.assignedToStudentIds.length === 0
      ? students
      : students.filter((s) => assignment.assignedToStudentIds.includes(s.id));

  const pendingGradingCount = submissions.filter(
    (s) => s.status === "submitted" || s.status === "late",
  ).length;

  const handleGrade = (sub: AssignmentSubmission) => {
    const inp = gradeInputs[sub.id];
    if (!inp) return;
    const score = Number(inp.score);
    const maxScore = Number(inp.maxScore);
    if (Number.isNaN(score) || Number.isNaN(maxScore) || !inp.maxScore) {
      toast.error("Enter valid score and max score.");
      return;
    }
    lmsStore.updateAssignmentSubmission(sub.id, {
      score,
      maxScore,
      feedback: inp.feedback,
      gradedAt: new Date().toISOString(),
      status: "graded",
    });

    // Notify student
    lmsStore.addNotification({
      id: crypto.randomUUID(),
      studentId: sub.studentId,
      type: "result_ready",
      message: `Your assignment "${assignment.title}" has been graded. Score: ${score}/${maxScore}`,
      relatedId: assignment.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    loadSubmissions();
    toast.success(
      `Graded! Score: ${score}/${maxScore}. Result sent to student.`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        data-ocid="assignments.submissions.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Submissions — {assignment.title}
          </DialogTitle>
        </DialogHeader>

        {pendingGradingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{pendingGradingCount}</strong> submission
              {pendingGradingCount > 1 ? "s need" : " needs"} grading
            </span>
          </div>
        )}

        <div className="space-y-4 mt-2">
          {assignedStudents.map((student) => {
            const sub = submissions.find((s) => s.studentId === student.id);
            const status: SubmissionStatus = sub?.status ?? "pending";
            return (
              <div
                key={student.id}
                className={`border rounded-xl p-4 space-y-3 ${
                  status === "submitted" || status === "late"
                    ? "border-amber-300 bg-amber-50/50"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{student.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[status]
                    }`}
                  >
                    {status === "submitted"
                      ? "Submitted — Needs grading"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                {sub && sub.status !== "pending" && (
                  <div className="space-y-2">
                    {sub.responseText && (
                      <p className="text-sm bg-muted/40 rounded-lg p-3">
                        {sub.responseText}
                      </p>
                    )}
                    {sub.fileDataUrl && (
                      <a
                        href={sub.fileDataUrl}
                        download={sub.fileName}
                        className="text-xs text-primary underline flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" /> {sub.fileName}
                      </a>
                    )}
                    {sub.status === "graded" ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-emerald-700">
                          Score:{" "}
                          <strong>
                            {sub.score} / {sub.maxScore}
                          </strong>
                        </span>
                        {sub.feedback && (
                          <span className="text-sm text-muted-foreground">
                            — {sub.feedback}
                          </span>
                        )}
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs ml-auto">
                          Result sent to student
                        </Badge>
                      </div>
                    ) : (
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Input
                            placeholder="Score"
                            className="w-20 h-8 text-sm"
                            value={gradeInputs[sub.id]?.score ?? ""}
                            onChange={(e) =>
                              setGradeInputs((p) => ({
                                ...p,
                                [sub.id]: {
                                  ...p[sub.id],
                                  score: e.target.value,
                                },
                              }))
                            }
                            data-ocid="assignments.score.input"
                          />
                          <span className="text-muted-foreground">/</span>
                          <Input
                            placeholder="Max"
                            className="w-20 h-8 text-sm"
                            value={gradeInputs[sub.id]?.maxScore ?? ""}
                            onChange={(e) =>
                              setGradeInputs((p) => ({
                                ...p,
                                [sub.id]: {
                                  ...p[sub.id],
                                  maxScore: e.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            placeholder="Feedback (optional)"
                            className="flex-1 h-8 text-sm min-w-32"
                            value={gradeInputs[sub.id]?.feedback ?? ""}
                            onChange={(e) =>
                              setGradeInputs((p) => ({
                                ...p,
                                [sub.id]: {
                                  ...p[sub.id],
                                  feedback: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleGrade(sub)}
                          data-ocid="assignments.grade.save_button"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Grade &amp; Send to Student
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {assignedStudents.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No students assigned.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentsPage() {
  const { session } = useApp();
  const [view, setView] = useState<View>("list");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refFileDataUrl, setRefFileDataUrl] = useState("");
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);

  const teacherId = session?.type === "staff" ? session.user.id : "";

  const refresh = useCallback(() => {
    if (!teacherId) return;
    setAssignments(
      lmsStore
        .getAssignments()
        .filter((a) => a.createdByTeacherId === teacherId),
    );
    setStudents(
      lmsStore.getStudents().filter((s) => s.teacherId === teacherId),
    );
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setRefFile(null);
    setRefFileDataUrl("");
    setAssignToAll(true);
    setSelectedStudentIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setRefFileDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!dueDate) {
      toast.error("Please set a due date.");
      return;
    }
    const assignedIds = assignToAll ? [] : Array.from(selectedStudentIds);
    const a: Assignment = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      fileDataUrl: refFileDataUrl,
      fileName: refFile?.name ?? "",
      assignedToStudentIds: assignedIds,
      createdByTeacherId: teacherId,
      createdAt: new Date().toISOString(),
    };
    lmsStore.addAssignment(a);

    // Notify students
    const affected = assignToAll
      ? students
      : students.filter((s) => selectedStudentIds.has(s.id));
    for (const s of affected) {
      lmsStore.addNotification({
        id: crypto.randomUUID(),
        studentId: s.id,
        type: "assignment_assigned",
        message: `New assignment: "${a.title}" — due ${new Date(a.dueDate).toLocaleDateString()}`,
        relatedId: a.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    refresh();
    resetCreate();
    setView("list");
    toast.success(`Assignment "${a.title}" created.`);
  };

  const handleDelete = (id: string) => {
    lmsStore.deleteAssignment(id);
    refresh();
    toast.success("Assignment deleted.");
  };

  const getSubmissionSummary = (
    assignmentId: string,
    assignedStudentIds: string[],
  ) => {
    const all = lmsStore.getAssignmentSubmissions();
    const subs = all.filter(
      (s) => s.assignmentId === assignmentId && s.status !== "pending",
    );
    const needsGrading = subs.filter(
      (s) => s.status === "submitted" || s.status === "late",
    ).length;
    const total =
      assignedStudentIds.length === 0
        ? students.length
        : assignedStudentIds.length;
    return { submitted: subs.length, total, needsGrading };
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage student assignments
          </p>
        </div>
        {view === "list" ? (
          <Button
            onClick={() => {
              resetCreate();
              setView("create");
            }}
            data-ocid="assignments.create.primary_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setView("list")}
            data-ocid="assignments.back.button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        )}
      </div>

      {view === "list" && (
        <div>
          {assignments.length === 0 ? (
            <div
              className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground"
              data-ocid="assignments.empty_state"
            >
              <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-display font-semibold text-lg">
                No assignments yet
              </p>
              <p className="text-sm mt-2">Create your first assignment.</p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="assignments.list">
              {assignments.map((a, i) => {
                const summary = getSubmissionSummary(
                  a.id,
                  a.assignedToStudentIds,
                );
                const isPast = new Date(a.dueDate) < new Date();
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border rounded-xl p-4 flex items-center gap-4"
                    data-ocid={`assignments.item.${i + 1}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {a.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            isPast ? "text-red-500" : "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {summary.submitted}/{summary.total} submitted
                        </span>
                        {summary.needsGrading > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            {summary.needsGrading} need grading
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={
                          summary.needsGrading > 0 ? "default" : "outline"
                        }
                        className="h-8 text-xs"
                        onClick={() => setViewAssignment(a)}
                        data-ocid={`assignments.view_submissions.button.${i + 1}`}
                      >
                        {summary.needsGrading > 0
                          ? `Grade (${summary.needsGrading})`
                          : "Submissions"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(a.id)}
                        data-ocid={`assignments.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="max-w-xl space-y-5">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold">Assignment Details</h2>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Essay on Climate Change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-ocid="assignments.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description / Instructions</Label>
              <Textarea
                placeholder="Describe the assignment requirements…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-ocid="assignments.description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-ocid="assignments.duedate.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reference File (optional)</Label>
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-lg text-sm hover:bg-muted/50 transition-colors"
                  htmlFor="assignment-file"
                >
                  <Paperclip className="w-4 h-4" />
                  {refFile ? refFile.name : "Attach file"}
                  <input
                    id="assignment-file"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {refFile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setRefFile(null);
                      setRefFileDataUrl("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <h2 className="font-display font-semibold">Assign To</h2>
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
              <Switch
                checked={assignToAll}
                onCheckedChange={(v) => {
                  setAssignToAll(v);
                  if (v) setSelectedStudentIds(new Set());
                }}
                data-ocid="assignments.assign_all.toggle"
              />
              <Label className="cursor-pointer text-sm font-medium">
                All Students ({students.length})
              </Label>
            </div>
            {!assignToAll && (
              <div className="space-y-1">
                {students.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40"
                  >
                    <Checkbox
                      id={`as-student-${s.id}`}
                      checked={selectedStudentIds.has(s.id)}
                      onCheckedChange={() =>
                        setSelectedStudentIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
                      data-ocid={`assignments.student.checkbox.${i + 1}`}
                    />
                    <Label
                      htmlFor={`as-student-${s.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {s.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            className="w-full"
            data-ocid="assignments.save.primary_button"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      )}

      {viewAssignment && (
        <SubmissionsDialog
          assignment={viewAssignment}
          students={students}
          open={!!viewAssignment}
          onClose={() => setViewAssignment(null)}
        />
      )}
    </div>
  );
}
