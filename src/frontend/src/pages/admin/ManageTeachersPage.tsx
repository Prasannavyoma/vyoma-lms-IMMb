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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { lmsStore } from "../../store/lmsStore";
import type { Permission, StaffRole, StaffUser } from "../../types/lms";

const PERMISSIONS_LIST: { value: Permission; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "manage_students", label: "Manage Students" },
  { value: "upload_materials", label: "Upload Materials" },
];

const ROLE_LABELS: Record<string, string> = {
  teacher: "Teacher",
  co_teacher: "Co-Teacher",
  assistant_teacher: "Assistant Teacher",
};

const ROLE_BADGE: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700 border-blue-200",
  co_teacher: "bg-purple-100 text-purple-700 border-purple-200",
  assistant_teacher: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type TeacherRole = "teacher" | "co_teacher" | "assistant_teacher";

interface FormData {
  fullName: string;
  email: string;
  role: TeacherRole;
  username: string;
  password: string;
  permissions: Permission[];
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  fullName: "",
  email: "",
  role: "teacher",
  username: "",
  password: "",
  permissions: ["read", "write", "manage_students", "upload_materials"],
  isActive: true,
};

function TeacherForm({
  form,
  setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const togglePerm = (perm: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input
            placeholder="e.g. Priya Sharma"
            value={form.fullName}
            onChange={(e) =>
              setForm((p) => ({ ...p, fullName: e.target.value }))
            }
            data-ocid="teachers.fullname.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="priya@school.edu"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            data-ocid="teachers.email.input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Role *</Label>
        <Select
          value={form.role}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, role: v as TeacherRole }))
          }
        >
          <SelectTrigger data-ocid="teachers.role.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="co_teacher">Co-Teacher</SelectItem>
            <SelectItem value="assistant_teacher">Assistant Teacher</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Username *</Label>
          <Input
            placeholder="priya.sharma"
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
            data-ocid="teachers.username.input"
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
            data-ocid="teachers.password.input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2">
          {PERMISSIONS_LIST.map((perm) => (
            <div key={perm.value} className="flex items-center gap-2">
              <Checkbox
                id={`perm-${perm.value}`}
                checked={form.permissions.includes(perm.value)}
                onCheckedChange={() => togglePerm(perm.value)}
              />
              <Label
                htmlFor={`perm-${perm.value}`}
                className="cursor-pointer font-normal text-sm"
              >
                {perm.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Switch
          checked={form.isActive}
          onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
          data-ocid="teachers.switch"
        />
        <Label className="cursor-pointer">Account Active</Label>
      </div>
    </div>
  );
}

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const refresh = useCallback(() => {
    setTeachers(lmsStore.getUsers().filter((u) => u.role !== "super_admin"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };

  const handleOpenEdit = (t: StaffUser) => {
    setForm({
      fullName: t.fullName,
      email: t.email,
      role: t.role as TeacherRole,
      username: t.username,
      password: t.password,
      permissions: t.permissions,
      isActive: t.isActive,
    });
    setEditTarget(t);
  };

  const handleAdd = () => {
    if (
      !form.fullName.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      toast.error("Full name, username, and password are required.");
      return;
    }
    const exists = lmsStore
      .getUsers()
      .find((u) => u.username === form.username);
    if (exists) {
      toast.error("Username already exists.");
      return;
    }
    const newUser: StaffUser = {
      id: crypto.randomUUID(),
      fullName: form.fullName,
      email: form.email,
      role: form.role as StaffRole,
      username: form.username,
      password: form.password,
      permissions: form.permissions,
      isActive: form.isActive,
      createdAt: new Date().toISOString(),
    };
    lmsStore.addUser(newUser);
    refresh();
    setAddOpen(false);
    toast.success(`${form.fullName} has been added.`);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    lmsStore.updateUser(editTarget.id, {
      fullName: form.fullName,
      email: form.email,
      role: form.role as StaffRole,
      username: form.username,
      password: form.password,
      permissions: form.permissions,
      isActive: form.isActive,
    });
    refresh();
    setEditTarget(null);
    toast.success("Teacher updated successfully.");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    lmsStore.deleteUser(deleteId);
    refresh();
    setDeleteId(null);
    toast.success("Teacher removed.");
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Teachers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add and manage teaching staff accounts
          </p>
        </div>
        <Button onClick={handleOpenAdd} data-ocid="teachers.add_button">
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {teachers.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl"
          data-ocid="teachers.empty_state"
        >
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No teachers added yet</p>
          <p className="text-sm mt-1">
            Click &quot;Add Teacher&quot; to create the first account.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-xl overflow-hidden shadow-xs"
          data-ocid="teachers.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher, i) => (
                <TableRow key={teacher.id} data-ocid={`teachers.item.${i + 1}`}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">
                        {teacher.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {teacher.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {teacher.username}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        ROLE_BADGE[teacher.role] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROLE_LABELS[teacher.role] ?? teacher.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.permissions.map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {p.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        teacher.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {teacher.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenEdit(teacher)}
                        data-ocid={`teachers.edit_button.${i + 1}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(teacher.id)}
                        data-ocid={`teachers.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg" data-ocid="teachers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a login account for a new teaching staff member.
            </DialogDescription>
          </DialogHeader>
          <TeacherForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="teachers.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} data-ocid="teachers.submit_button">
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg" data-ocid="teachers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Teacher</DialogTitle>
            <DialogDescription>
              Update role, permissions, or credentials.
            </DialogDescription>
          </DialogHeader>
          <TeacherForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              data-ocid="teachers.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} data-ocid="teachers.save_button">
              Save Changes
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
            <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this teacher? Their student
              accounts and materials will remain but they will no longer be able
              to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="teachers.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="teachers.confirm_button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
