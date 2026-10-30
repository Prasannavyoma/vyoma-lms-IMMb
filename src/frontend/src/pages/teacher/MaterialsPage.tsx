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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Monitor,
  Music,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type { Material } from "../../types/lms";

const ACCEPTED = ".mp4,.mp3,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png,.pdf";

function detectFileType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "avi", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "ogg"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "presentation";
  return "document";
}

function FileTypeIcon({
  fileType,
  className,
}: { fileType: string; className?: string }) {
  const props = { className: className ?? "w-5 h-5" };
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

export default function MaterialsPage() {
  const { session } = useApp();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = session?.type === "staff" ? session.user.id : "";
  const canUpload =
    session?.type === "staff"
      ? session.user.permissions.includes("upload_materials")
      : false;

  const refresh = useCallback(() => {
    if (!userId) return;
    setMaterials(
      lmsStore.getMaterials().filter((m) => m.uploadedByUserId === userId),
    );
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(
        "File is large (>5MB). This may exceed browser storage limits.",
      );
    }
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => setFileDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileDataUrl) {
      toast.error("Please select a file first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    setUploading(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      const material: Material = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        fileType: detectFileType(selectedFile),
        fileName: selectedFile.name,
        fileDataUrl,
        uploadedByUserId: userId,
        assignedToStudentIds: [],
        createdAt: new Date().toISOString(),
      };
      lmsStore.addMaterial(material);
      refresh();
      setSelectedFile(null);
      setFileDataUrl("");
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`"${material.title}" uploaded successfully.`);
    } catch {
      toast.error("Upload failed. File may be too large for storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    lmsStore.deleteMaterial(deleteId);
    refresh();
    setDeleteId(null);
    toast.success("Material removed.");
  };

  const handleView = (material: Material) => {
    window.open(material.fileDataUrl, "_blank");
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Materials</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload and manage learning materials
        </p>
      </div>

      {canUpload && (
        <div className="mb-8 bg-card border rounded-xl p-6">
          <h2 className="font-display text-base font-semibold mb-4">
            Upload New Material
          </h2>

          <label
            htmlFor="dropzone-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 block ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
            data-ocid="materials.dropzone"
          >
            <input
              id="dropzone-input"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {selectedFile ? (
              <div>
                <p className="font-medium text-sm text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  Drop file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, MP3, PPT, PPTX, XLSX, XLS, JPG, PNG, PDF
                </p>
              </div>
            )}
          </label>

          {selectedFile && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="space-y-1.5 flex-1">
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Material title"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileDataUrl("");
                      setTitle("");
                    }}
                    className="mt-6 text-muted-foreground hover:text-foreground"
                    aria-label="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description…"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  data-ocid="materials.upload_button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading…" : "Upload Material"}
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      <div>
        <h2 className="font-display text-base font-semibold mb-4">
          Uploaded Materials ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl"
            data-ocid="materials.empty_state"
          >
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No materials uploaded yet</p>
            {canUpload && (
              <p className="text-sm mt-1">
                Use the upload area above to add your first material.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3" data-ocid="materials.list">
            {materials.map((mat, i) => (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:shadow-xs transition-shadow"
                data-ocid={`materials.item.${i + 1}`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    FILE_TYPE_COLOR[mat.fileType] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  <FileTypeIcon fileType={mat.fileType} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{mat.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mat.fileName} · {mat.fileType.toUpperCase()} ·{" "}
                    {new Date(mat.createdAt).toLocaleDateString()}
                  </p>
                  {mat.assignedToStudentIds.length === 0 ? (
                    <span className="text-xs text-primary">
                      Visible to all students
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Assigned to {mat.assignedToStudentIds.length} student(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleView(mat)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(mat.id)}
                    data-ocid={`materials.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? Students will no
              longer have access to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="materials.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
