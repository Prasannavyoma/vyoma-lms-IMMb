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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  GripVertical,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type {
  FormQuestion,
  FormSubmission,
  LMSForm,
  Student,
} from "../../types/lms";

type View = "list" | "create";

function emptyQuestion(type: FormQuestion["type"]): FormQuestion {
  return {
    id: crypto.randomUUID(),
    type,
    questionText: "",
    options: type === "mcq" ? ["", "", "", ""] : [],
    correctAnswer: "",
    correctAnswerIndex: -1,
  };
}

function QuestionEditor({
  q,
  index,
  onChange,
  onDelete,
}: {
  q: FormQuestion;
  index: number;
  onChange: (updated: FormQuestion) => void;
  onDelete: () => void;
}) {
  // Use the explicit index — never derive from text matching.
  // -1 means the teacher has not selected a correct answer yet.
  const selectedIndex = q.correctAnswerIndex ?? -1;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Q{index + 1} ·{" "}
              {q.type === "mcq"
                ? "Multiple Choice"
                : q.type === "short"
                  ? "Short Answer"
                  : "Long Answer"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Input
            placeholder={`Question ${index + 1}`}
            value={q.questionText}
            onChange={(e) => onChange({ ...q, questionText: e.target.value })}
            data-ocid="forms.question.input"
          />
          {q.type === "mcq" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Enter options — click the radio button to mark the correct
                answer:
              </p>
              {q.options.map((opt, oi) => {
                const isSelected = selectedIndex === oi;
                return (
                  <div
                    key={`${q.id}-${oi}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-emerald-50 border border-emerald-200"
                        : "border border-transparent"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={isSelected}
                      onChange={() => {
                        // Store both the index AND the current text at that index.
                        onChange({
                          ...q,
                          correctAnswerIndex: oi,
                          correctAnswer: q.options[oi],
                        });
                      }}
                      className="accent-emerald-600 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...q.options];
                        newOpts[oi] = e.target.value;
                        // If this option is currently selected as correct,
                        // keep correctAnswer text in sync with the new text.
                        const newCorrect =
                          selectedIndex === oi
                            ? e.target.value
                            : q.correctAnswer;
                        onChange({
                          ...q,
                          options: newOpts,
                          correctAnswer: newCorrect,
                        });
                      }}
                      className={`h-8 text-sm ${
                        isSelected
                          ? "border-emerald-300 focus-visible:ring-emerald-400"
                          : ""
                      }`}
                    />
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
              {selectedIndex === -1 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Select the correct answer by clicking a radio button
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionsDialog({
  form,
  students,
  open,
  onClose,
}: {
  form: LMSForm;
  students: Student[];
  open: boolean;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { score: string; feedback: string }>
  >({});

  const loadSubmissions = () => {
    const all = lmsStore.getFormSubmissions();
    setSubmissions(all.filter((s) => s.formId === form.id));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadSubmissions is stable
  useEffect(() => {
    if (!open) return;
    loadSubmissions();
  }, [open]);

  const assignedStudents =
    form.assignedToStudentIds.length === 0
      ? students
      : students.filter((s) => form.assignedToStudentIds.includes(s.id));

  // Count pending grading (submitted but not graded) for written-answer forms
  const needsGradingCount = submissions.filter(
    (s) => s.score === null && s.gradedAt === null,
  ).length;

  const handleGrade = (subId: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    // Calculate MCQ auto-score
    const mcqQuestions = form.questions.filter((q) => q.type === "mcq");
    const writtenQuestions = form.questions.filter(
      (q) => q.type === "short" || q.type === "long",
    );

    let mcqScore = 0;
    if (mcqQuestions.length > 0) {
      mcqScore = mcqQuestions.filter((q) => {
        const ans = sub.answers.find((a) => a.questionId === q.id);
        return ans?.answer === q.correctAnswer;
      }).length;
    }

    // Manual score for written questions
    let writtenScore = 0;
    let writtenMax = writtenQuestions.length;
    if (writtenQuestions.length > 0) {
      const inp = gradeInputs[subId];
      if (!inp?.score) {
        toast.error("Enter a score for the written answers before grading.");
        return;
      }
      writtenScore = Number(inp.score);
      if (Number.isNaN(writtenScore)) {
        toast.error("Enter a valid score.");
        return;
      }
    }

    const totalScore = mcqScore + writtenScore;
    const totalMax = mcqQuestions.length + writtenMax;
    const feedback = gradeInputs[subId]?.feedback ?? "";

    lmsStore.updateFormSubmission(subId, {
      score: totalScore,
      maxScore: totalMax,
      feedback,
      gradedAt: new Date().toISOString(),
    });

    // Notify student
    lmsStore.addNotification({
      id: crypto.randomUUID(),
      studentId: sub.studentId,
      type: "result_ready",
      message: `Your assessment "${form.title}" has been graded. Score: ${totalScore}/${totalMax}`,
      relatedId: form.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    loadSubmissions();
    toast.success(
      `Graded! Score: ${totalScore}/${totalMax}. Result sent to student.`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        data-ocid="forms.submissions.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Submissions — {form.title}
          </DialogTitle>
        </DialogHeader>

        {needsGradingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{needsGradingCount}</strong> submission
              {needsGradingCount > 1 ? "s need" : " needs"} manual grading
            </span>
          </div>
        )}

        <div className="space-y-4 mt-2">
          {assignedStudents.map((student) => {
            const sub = submissions.find((s) => s.studentId === student.id);
            const isGraded = sub?.gradedAt !== null && sub?.score !== null;
            const needsGrading = sub && !isGraded;

            return (
              <div
                key={student.id}
                className={`border rounded-xl p-4 space-y-3 ${
                  needsGrading ? "border-amber-300 bg-amber-50/50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{student.name}</p>
                  {!sub ? (
                    <Badge variant="secondary">Not submitted</Badge>
                  ) : isGraded ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Graded
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      Submitted — Needs grading
                    </Badge>
                  )}
                </div>

                {sub && (
                  <div className="space-y-3">
                    {/* Show all answers */}
                    {form.questions.map((q, qi) => {
                      const ans = sub.answers.find(
                        (a) => a.questionId === q.id,
                      );
                      return (
                        <div key={q.id} className="text-sm">
                          <p className="font-medium text-muted-foreground">
                            Q{qi + 1}: {q.questionText}
                          </p>
                          <p className="mt-1 pl-2 border-l-2 border-muted">
                            {ans?.answer || (
                              <span className="text-muted-foreground italic">
                                No answer
                              </span>
                            )}
                          </p>
                          {q.type === "mcq" && (
                            <p
                              className={`text-xs mt-0.5 pl-2 ${
                                ans?.answer === q.correctAnswer
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }`}
                            >
                              {ans?.answer === q.correctAnswer
                                ? "✓ Correct"
                                : `✗ Correct answer: ${q.correctAnswer}`}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {form.isGraded && (
                      <div className="border-t pt-3 space-y-2">
                        {isGraded ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-emerald-700">
                              Score: {sub.score} / {sub.maxScore}
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
                          <div className="space-y-2">
                            {/* Auto-score preview for MCQ */}
                            {(() => {
                              const mcqQs = form.questions.filter(
                                (q) => q.type === "mcq",
                              );
                              const writtenQs = form.questions.filter(
                                (q) => q.type === "short" || q.type === "long",
                              );
                              const autoScore =
                                mcqQs.length > 0
                                  ? mcqQs.filter((q) => {
                                      const a = sub.answers.find(
                                        (a) => a.questionId === q.id,
                                      );
                                      return a?.answer === q.correctAnswer;
                                    }).length
                                  : null;
                              return (
                                <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                                  {autoScore !== null && (
                                    <p className="text-xs text-muted-foreground">
                                      MCQ auto-score:{" "}
                                      <strong className="text-foreground">
                                        {autoScore} / {mcqQs.length}
                                      </strong>
                                    </p>
                                  )}
                                  {writtenQs.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted-foreground">
                                        Written questions ({writtenQs.length}):
                                        enter score out of {writtenQs.length}
                                      </p>
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder={`Score (0–${writtenQs.length})`}
                                          className="w-32 h-8 text-sm"
                                          value={
                                            gradeInputs[sub.id]?.score ?? ""
                                          }
                                          onChange={(e) =>
                                            setGradeInputs((p) => ({
                                              ...p,
                                              [sub.id]: {
                                                ...p[sub.id],
                                                score: e.target.value,
                                              },
                                            }))
                                          }
                                          data-ocid="forms.grade.input"
                                        />
                                        <Input
                                          placeholder="Feedback (optional)"
                                          className="flex-1 h-8 text-sm"
                                          value={
                                            gradeInputs[sub.id]?.feedback ?? ""
                                          }
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
                                    </div>
                                  )}
                                  {writtenQs.length === 0 && (
                                    <Input
                                      placeholder="Feedback (optional)"
                                      className="h-8 text-sm"
                                      value={
                                        gradeInputs[sub.id]?.feedback ?? ""
                                      }
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
                                  )}
                                </div>
                              );
                            })()}
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => handleGrade(sub.id)}
                              data-ocid="forms.grade.save_button"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Calculate Score &amp; Send to Student
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {assignedStudents.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No students assigned to this form.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FormsPage() {
  const { session } = useApp();
  const [view, setView] = useState<View>("list");
  const [forms, setForms] = useState<LMSForm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGraded, setIsGraded] = useState(false);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [addType, setAddType] = useState<FormQuestion["type"]>("mcq");
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  const [submissionsForm, setSubmissionsForm] = useState<LMSForm | null>(null);

  const teacherId = session?.type === "staff" ? session.user.id : "";

  const refresh = useCallback(() => {
    if (!teacherId) return;
    setForms(
      lmsStore.getForms().filter((f) => f.createdByTeacherId === teacherId),
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
    setIsGraded(false);
    setQuestions([]);
    setAssignToAll(true);
    setSelectedStudentIds(new Set());
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(addType)]);
  };

  const handleSaveForm = () => {
    if (!title.trim()) {
      toast.error("Please enter a form title.");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      if (!q.questionText.trim()) {
        toast.error("All questions must have text.");
        return;
      }
      if (q.type === "mcq") {
        if (q.options.some((o) => !o.trim())) {
          toast.error(`MCQ question ${qi + 1}: please fill in all options.`);
          return;
        }
        if ((q.correctAnswerIndex ?? -1) < 0) {
          toast.error(
            `MCQ question ${qi + 1}: please select the correct answer by clicking a radio button.`,
          );
          return;
        }
      }
    }

    const assignedIds = assignToAll ? [] : Array.from(selectedStudentIds);
    const form: LMSForm = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      questions,
      isGraded,
      assignedToStudentIds: assignedIds,
      createdByTeacherId: teacherId,
      createdAt: new Date().toISOString(),
    };
    lmsStore.addForm(form);

    // Notify students
    const affected = assignToAll
      ? students
      : students.filter((s) => selectedStudentIds.has(s.id));
    for (const s of affected) {
      lmsStore.addNotification({
        id: crypto.randomUUID(),
        studentId: s.id,
        type: "assessment_assigned",
        message: `New ${isGraded ? "assessment" : "survey"} assigned: "${form.title}"`,
        relatedId: form.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    refresh();
    resetCreate();
    setView("list");
    toast.success(`Form "${form.title}" created and assigned.`);
  };

  const handleDeleteForm = (id: string) => {
    lmsStore.deleteForm(id);
    refresh();
    toast.success("Form deleted.");
  };

  // Count pending submissions across all forms for the badge
  const getPendingCount = (form: LMSForm) => {
    const subs = lmsStore
      .getFormSubmissions()
      .filter((s) => s.formId === form.id);
    return subs.filter((s) => s.gradedAt === null).length;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Forms &amp; Assessments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create surveys, quizzes, and graded assessments
          </p>
        </div>
        {view === "list" ? (
          <Button
            onClick={() => {
              resetCreate();
              setView("create");
            }}
            data-ocid="forms.create.primary_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setView("list")}
            data-ocid="forms.back.button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        )}
      </div>

      {view === "list" && (
        <div>
          {forms.length === 0 ? (
            <div
              className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground"
              data-ocid="forms.empty_state"
            >
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-display font-semibold text-lg">No forms yet</p>
              <p className="text-sm mt-2">
                Create your first form or assessment.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="forms.list">
              {forms.map((form, i) => {
                const pendingCount = getPendingCount(form);
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border rounded-xl p-4 flex items-center gap-4"
                    data-ocid={`forms.item.${i + 1}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {form.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                        <span className="text-xs text-muted-foreground">
                          ·{" "}
                          {form.assignedToStudentIds.length === 0
                            ? "All students"
                            : `${form.assignedToStudentIds.length} student(s)`}
                        </span>
                        {pendingCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            {pendingCount} pending grading
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={pendingCount > 0 ? "default" : "outline"}
                        className="h-8 text-xs"
                        onClick={() => setSubmissionsForm(form)}
                        data-ocid={`forms.view_submissions.button.${i + 1}`}
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {pendingCount > 0
                          ? `Grade (${pendingCount})`
                          : "Submissions"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteForm(form.id)}
                        data-ocid={`forms.delete_button.${i + 1}`}
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
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold">Form Details</h2>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Chapter 3 Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-ocid="forms.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional instructions for students…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                data-ocid="forms.description.textarea"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
              <Switch
                checked={isGraded}
                onCheckedChange={setIsGraded}
                data-ocid="forms.graded.toggle"
              />
              <div>
                <p className="text-sm font-medium">
                  {isGraded ? "Graded Assessment" : "Survey / Feedback Form"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isGraded
                    ? "MCQ answers will be auto-scored; written answers require manual scoring"
                    : "Ungraded form — responses collected for feedback"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold">
                Questions ({questions.length})
              </h2>
              <div className="flex items-center gap-2">
                <Select
                  value={addType}
                  onValueChange={(v) => setAddType(v as FormQuestion["type"])}
                >
                  <SelectTrigger
                    className="h-8 w-44 text-xs"
                    data-ocid="forms.question_type.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="short">Short Answer</SelectItem>
                    <SelectItem value="long">Long Answer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddQuestion}
                  data-ocid="forms.add_question.button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Question
                </Button>
              </div>
            </div>
            {questions.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No questions yet. Add your first question above.
              </div>
            )}
            {questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                q={q}
                index={i}
                onChange={(updated) =>
                  setQuestions((prev) =>
                    prev.map((x) => (x.id === updated.id ? updated : x)),
                  )
                }
                onDelete={() =>
                  setQuestions((prev) => prev.filter((x) => x.id !== q.id))
                }
              />
            ))}
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
                data-ocid="forms.assign_all.toggle"
              />
              <Label className="cursor-pointer text-sm font-medium">
                All Students ({students.length})
              </Label>
            </div>
            {!assignToAll && (
              <div className="space-y-2">
                {students.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40"
                  >
                    <Checkbox
                      id={`form-student-${s.id}`}
                      checked={selectedStudentIds.has(s.id)}
                      onCheckedChange={() =>
                        setSelectedStudentIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
                      data-ocid={`forms.student.checkbox.${i + 1}`}
                    />
                    <Label
                      htmlFor={`form-student-${s.id}`}
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
            onClick={handleSaveForm}
            className="w-full"
            data-ocid="forms.save.primary_button"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Save &amp; Assign Form
          </Button>
        </div>
      )}

      {submissionsForm && (
        <SubmissionsDialog
          form={submissionsForm}
          students={students}
          open={!!submissionsForm}
          onClose={() => setSubmissionsForm(null)}
        />
      )}
    </div>
  );
}
