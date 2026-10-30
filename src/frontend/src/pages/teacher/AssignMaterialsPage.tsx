import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, CheckCircle, Send, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type { Material, Student } from "../../types/lms";

function FileTypeBadge({ fileType }: { fileType: string }) {
  const colors: Record<string, string> = {
    video: "bg-purple-100 text-purple-700",
    audio: "bg-pink-100 text-pink-700",
    image: "bg-green-100 text-green-700",
    pdf: "bg-red-100 text-red-700",
    excel: "bg-emerald-100 text-emerald-700",
    presentation: "bg-orange-100 text-orange-700",
    document: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${
        colors[fileType] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {fileType}
    </span>
  );
}

export default function AssignMaterialsPage() {
  const { session } = useApp();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [assignToAll, setAssignToAll] = useState(false);
  const [assignHistory, setAssignHistory] = useState<
    { materialTitle: string; target: string; date: string }[]
  >([]);

  const userId = session?.type === "staff" ? session.user.id : "";

  const refresh = useCallback(() => {
    if (!userId) return;
    setMaterials(
      lmsStore.getMaterials().filter((m) => m.uploadedByUserId === userId),
    );
    setStudents(lmsStore.getStudents().filter((s) => s.teacherId === userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = () => {
    if (!selectedMaterialId) {
      toast.error("Please select a material.");
      return;
    }
    if (!assignToAll && selectedStudentIds.size === 0) {
      toast.error(
        'Please select at least one student or toggle "Assign to All".',
      );
      return;
    }

    const newIds = assignToAll ? [] : Array.from(selectedStudentIds);
    lmsStore.updateMaterial(selectedMaterialId, {
      assignedToStudentIds: newIds,
    });

    const target = assignToAll
      ? `all ${students.length} students`
      : `${selectedStudentIds.size} student(s)`;

    const mat = materials.find((m) => m.id === selectedMaterialId);
    if (mat) {
      setAssignHistory((prev) => [
        { materialTitle: mat.title, target, date: new Date().toISOString() },
        ...prev,
      ]);
      // Notify students
      const affected = assignToAll
        ? students
        : students.filter((s) => selectedStudentIds.has(s.id));
      for (const s of affected) {
        lmsStore.addNotification({
          id: crypto.randomUUID(),
          studentId: s.id,
          type: "material_assigned",
          message: `New material assigned: "${mat.title}"`,
          relatedId: mat.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    refresh();
    setSelectedMaterialId("");
    setSelectedStudentIds(new Set());
    setAssignToAll(false);
    toast.success(`Material assigned to ${target}.`);
  };

  const noMaterials = materials.length === 0;
  const noStudents = students.length === 0;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Assign Materials</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a material and choose which students should have access
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Step 1: Select Material */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              1
            </div>
            <h2 className="font-display font-semibold">Select Material</h2>
          </div>

          {noMaterials ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="assign.empty_state"
            >
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No materials uploaded yet. Go to Materials tab to upload.
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setSelectedMaterialId(mat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedMaterialId === mat.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-muted/50"
                  }`}
                  data-ocid="assign.material.select"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mat.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <FileTypeBadge fileType={mat.fileType} />
                      {mat.assignedToStudentIds.length === 0 ? (
                        <span className="text-xs text-primary">
                          All students
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {mat.assignedToStudentIds.length} assigned
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedMaterialId === mat.id && (
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Students */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              2
            </div>
            <h2 className="font-display font-semibold">Select Students</h2>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 bg-muted/40 rounded-lg">
            <Switch
              checked={assignToAll}
              onCheckedChange={(v) => {
                setAssignToAll(v);
                if (v) setSelectedStudentIds(new Set());
              }}
              data-ocid="assign.all.toggle"
            />
            <Label className="cursor-pointer font-medium text-sm">
              Assign to All Students
            </Label>
            {assignToAll && (
              <Badge variant="secondary" className="ml-auto">
                {students.length} students
              </Badge>
            )}
          </div>

          {noStudents ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No students enrolled yet.
            </div>
          ) : (
            <div
              className={`space-y-2 ${assignToAll ? "opacity-40 pointer-events-none" : ""}`}
            >
              {students.map((student, i) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={selectedStudentIds.has(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                    data-ocid={`assign.student.checkbox.${i + 1}`}
                  />
                  <Label
                    htmlFor={`student-${student.id}`}
                    className="cursor-pointer flex-1"
                  >
                    <span className="text-sm font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {student.rollNumber}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleAssign}
        disabled={
          !selectedMaterialId || (!assignToAll && selectedStudentIds.size === 0)
        }
        className="mb-8"
        data-ocid="assign.submit_button"
      >
        <Send className="w-4 h-4 mr-2" />
        Assign Material
      </Button>

      {assignHistory.length > 0 && (
        <div>
          <h2 className="font-display text-base font-semibold mb-3">
            Recent Assignments
          </h2>
          <div className="space-y-2">
            {assignHistory.map((entry, i) => (
              <motion.div
                key={`${entry.materialTitle}-${entry.date}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-card border rounded-lg text-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{entry.materialTitle}</strong> assigned to{" "}
                  <strong>{entry.target}</strong>
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
