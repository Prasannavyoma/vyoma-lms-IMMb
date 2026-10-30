import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Mail, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type { Student } from "../../types/lms";

interface StudentForm {
  name: string;
  idCardNumber: string;
  rollNumber: string;
  username: string;
  password: string;
}

const EMPTY_FORM: StudentForm = {
  name: "",
  idCardNumber: "",
  rollNumber: "",
  username: "",
  password: "",
};

export default function StudentsPage() {
  const { session } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [lastAdded, setLastAdded] = useState<Student | null>(null);

  const teacherId = session?.type === "staff" ? session.user.id : "";
  const canWrite =
    session?.type === "staff"
      ? session.user.permissions.includes("write") ||
        session.user.permissions.includes("manage_students")
      : false;

  const refresh = useCallback(() => {
    if (!teacherId) return;
    setStudents(
      lmsStore.getStudents().filter((s) => s.teacherId === teacherId),
    );
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  const handleAdd = () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error("Name, username, and password are required.");
      return;
    }
    const exists = lmsStore
      .getStudents()
      .find((s) => s.username === form.username);
    if (exists) {
      toast.error("Username already exists.");
      return;
    }
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: form.name,
      idCardNumber: form.idCardNumber,
      rollNumber: form.rollNumber,
      username: form.username,
      password: form.password,
      teacherId,
      assignedMaterialIds: [],
      createdAt: new Date().toISOString(),
    };
    lmsStore.addStudent(newStudent);
    setLastAdded(newStudent);
    refresh();
    setAddOpen(false);
    setForm(EMPTY_FORM);
    toast.success(`${form.name} has been enrolled.`);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    lmsStore.deleteStudent(deleteId);
    refresh();
    setDeleteId(null);
    toast.success("Student removed.");
  };

  const handleGmail = (student: Student) => {
    const subject = encodeURIComponent("Your Vyoma LMS Login Credentials");
    const body = encodeURIComponent(
      `Hello ${student.name},\n\nYour login credentials for Vyoma LMS:\n\nUsername: ${student.username}\nPassword: ${student.password}\n\nPlease log in at: ${window.location.origin}\n\nRegards,\n${session.user.fullName}`,
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`,
      "_blank",
    );
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your enrolled students
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setAddOpen(true);
            }}
            data-ocid="students.add_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        )}
      </div>

      {lastAdded && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Student added: {lastAdded.name}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Username: <strong>{lastAdded.username}</strong> · Password:{" "}
              <strong>{lastAdded.password}</strong>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            onClick={() => handleGmail(lastAdded)}
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Send via Gmail
          </Button>
        </motion.div>
      )}

      {students.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl"
          data-ocid="students.empty_state"
        >
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No students enrolled yet</p>
          {canWrite && (
            <p className="text-sm mt-1">
              Click &quot;Add Student&quot; to enrol your first student.
            </p>
          )}
        </div>
      ) : (
        <div
          className="border rounded-xl overflow-hidden shadow-xs"
          data-ocid="students.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>ID Card</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, i) => (
                <TableRow key={student.id} data-ocid={`students.item.${i + 1}`}>
                  <TableCell className="font-semibold text-sm">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.rollNumber || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.idCardNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {student.username}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleGmail(student)}
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Gmail
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(student.id)}
                      data-ocid={`students.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" data-ocid="students.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Student</DialogTitle>
            <DialogDescription>
              Enrol a new student and set their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Arjun Kumar"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="students.name.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Roll Number</Label>
                <Input
                  placeholder="R-001"
                  value={form.rollNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, rollNumber: e.target.value }))
                  }
                  data-ocid="students.roll.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>ID Card Number</Label>
                <Input
                  placeholder="ID-2024-001"
                  value={form.idCardNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, idCardNumber: e.target.value }))
                  }
                  data-ocid="students.idcard.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Username *</Label>
                <Input
                  placeholder="arjun.kumar"
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  data-ocid="students.username.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <Input
                  type="text"
                  placeholder="Set a password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  data-ocid="students.password.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="students.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} data-ocid="students.submit_button">
              Enrol Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this student? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="students.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="students.confirm_button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
