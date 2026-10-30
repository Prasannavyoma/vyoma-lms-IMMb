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
  BookMarked,
  BookOpen,
  CheckCircle,
  Eye,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type { Flipbook, Student } from "../../types/lms";

function PreviewDialog({
  flipbook,
  open,
  onClose,
}: {
  flipbook: Flipbook | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!flipbook) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl w-full h-[80vh] flex flex-col"
        data-ocid="flipbooks.preview.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">{flipbook.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 rounded-lg overflow-hidden border">
          <iframe
            srcDoc={atob(
              flipbook.htmlContent.replace("data:text/html;base64,", ""),
            )}
            title={flipbook.title}
            className="w-full h-full"
            sandbox="allow-scripts"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FlipbooksPage() {
  const { session } = useApp();
  const [flipbooks, setFlipbooks] = useState<Flipbook[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview
  const [previewFlipbook, setPreviewFlipbook] = useState<Flipbook | null>(null);

  const teacherId = session?.type === "staff" ? session.user.id : "";

  const refresh = useCallback(() => {
    if (!teacherId) return;
    setFlipbooks(
      lmsStore.getFlipbooks().filter((f) => f.createdByTeacherId === teacherId),
    );
    setStudents(
      lmsStore.getStudents().filter((s) => s.teacherId === teacherId),
    );
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast.error("Only .html files are accepted.");
      return;
    }
    setHtmlFile(file);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setHtmlContent(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!htmlContent) {
      toast.error("Please upload an HTML file.");
      return;
    }
    const fb: Flipbook = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      htmlContent,
      assignedToStudentIds: assignToAll ? [] : Array.from(selectedStudentIds),
      createdByTeacherId: teacherId,
      createdAt: new Date().toISOString(),
    };
    lmsStore.addFlipbook(fb);

    // Notify students
    const affected = assignToAll
      ? students
      : students.filter((s) => selectedStudentIds.has(s.id));
    for (const s of affected) {
      lmsStore.addNotification({
        id: crypto.randomUUID(),
        studentId: s.id,
        type: "flipbook_assigned",
        message: `New flipbook available: "${fb.title}"`,
        relatedId: fb.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    refresh();
    setTitle("");
    setDescription("");
    setHtmlFile(null);
    setHtmlContent("");
    setAssignToAll(true);
    setSelectedStudentIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`Flipbook "${fb.title}" uploaded.`);
  };

  const handleDelete = (id: string) => {
    lmsStore.deleteFlipbook(id);
    refresh();
    toast.success("Flipbook deleted.");
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Flipbooks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload HTML flipbooks and assign them to students
        </p>
      </div>

      {/* Upload section */}
      <div className="bg-card border rounded-xl p-5 mb-8 space-y-4">
        <h2 className="font-display font-semibold">Upload Flipbook</h2>
        <button
          type="button"
          className="w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="flipbooks.dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            className="hidden"
            onChange={handleFileChange}
          />
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {htmlFile ? (
            <p className="text-sm font-medium">{htmlFile.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Click to upload HTML file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Only .html and .htm files are accepted
              </p>
            </>
          )}
        </button>

        {htmlContent && (
          <>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Flipbook title"
                data-ocid="flipbooks.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={2}
                data-ocid="flipbooks.description.textarea"
              />
            </div>
          </>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Switch
              checked={assignToAll}
              onCheckedChange={(v) => {
                setAssignToAll(v);
                if (v) setSelectedStudentIds(new Set());
              }}
              data-ocid="flipbooks.assign_all.toggle"
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
                    id={`fb-student-${s.id}`}
                    checked={selectedStudentIds.has(s.id)}
                    onCheckedChange={() =>
                      setSelectedStudentIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id);
                        else next.add(s.id);
                        return next;
                      })
                    }
                    data-ocid={`flipbooks.student.checkbox.${i + 1}`}
                  />
                  <Label
                    htmlFor={`fb-student-${s.id}`}
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
          disabled={!htmlContent}
          data-ocid="flipbooks.upload_button"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Flipbook
        </Button>
      </div>

      {/* Flipbooks list */}
      <div>
        <h2 className="font-display font-semibold mb-4">
          Uploaded Flipbooks ({flipbooks.length})
        </h2>
        {flipbooks.length === 0 ? (
          <div
            className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground"
            data-ocid="flipbooks.empty_state"
          >
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No flipbooks uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="flipbooks.list">
            {flipbooks.map((fb, i) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border rounded-xl p-4 flex items-center gap-4"
                data-ocid={`flipbooks.item.${i + 1}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookMarked className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{fb.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {fb.assignedToStudentIds.length === 0
                        ? "All students"
                        : `${fb.assignedToStudentIds.length} student(s)`}
                    </Badge>
                  </div>
                  {fb.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {fb.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setPreviewFlipbook(fb)}
                    data-ocid={`flipbooks.preview.button.${i + 1}`}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(fb.id)}
                    data-ocid={`flipbooks.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PreviewDialog
        flipbook={previewFlipbook}
        open={!!previewFlipbook}
        onClose={() => setPreviewFlipbook(null)}
      />
    </div>
  );
}
