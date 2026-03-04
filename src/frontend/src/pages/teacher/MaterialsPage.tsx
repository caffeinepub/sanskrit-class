import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  File,
  FileText,
  Image,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { StudyMaterial } from "../../backend.d";
import {
  useAddStudyMaterial,
  useDeleteStudyMaterial,
  useStudyMaterials,
} from "../../hooks/useQueries";
import { useStorageClient } from "../../hooks/useStorageClient";

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileText;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? ""))
    return Image;
  return File;
}

function MaterialCard({
  material,
  onDelete,
  storageClient,
  index,
}: {
  material: StudyMaterial;
  onDelete: (id: bigint) => void;
  storageClient: ReturnType<typeof useStorageClient>;
  index: number;
}) {
  const FileIcon = getFileIcon(material.fileName);

  const handleView = async () => {
    if (!storageClient) {
      toast.error("Storage not available");
      return;
    }
    try {
      const url = await storageClient.getDirectURL(material.blobId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open file");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      data-ocid={`materials.item.${index}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card transition-shadow duration-200"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {material.title}
        </p>
        {material.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {material.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {material.fileName} ·{" "}
          {new Date(
            Number(material.uploadedAt) / 1_000_000,
          ).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={handleView}>
          View
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-ocid={`materials.delete_button.${index}`}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="materials.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Material</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{material.title}"? This cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="materials.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="materials.confirm_button"
                onClick={() => onDelete(material.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

export default function MaterialsPage() {
  const { data: materials, isLoading } = useStudyMaterials();
  const addMaterial = useAddStudyMaterial();
  const deleteMaterial = useDeleteStudyMaterial();
  const storageClient = useStorageClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !storageClient) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) => {
        setUploadProgress(pct);
      });

      await addMaterial.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        blobId: hash,
        fileName: file.name,
      });

      toast.success("Material uploaded successfully!");
      setUploadOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteMaterial.mutateAsync(id);
      toast.success("Material deleted");
    } catch {
      toast.error("Failed to delete material");
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
              Study Materials
            </h1>
            <p className="text-muted-foreground">
              Upload PDFs, images, and documents for your students.
            </p>
          </div>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="materials.upload_button" className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Upload Study Material
                </DialogTitle>
                <DialogDescription>
                  Add a resource for your students to download.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mat-title">Title</Label>
                  <Input
                    id="mat-title"
                    placeholder="e.g. Chapter 3 Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mat-desc">Description (optional)</Label>
                  <Textarea
                    id="mat-desc"
                    placeholder="Brief description of this material…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Dropzone */}
                <button
                  type="button"
                  data-ocid="materials.dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "dropzone-active"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div>
                      <File className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-foreground font-medium">
                        Drop file here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, images, documents
                      </p>
                    </div>
                  )}
                </button>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadOpen(false)}
                    data-ocid="materials.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !file || !title.trim() || uploading || !storageClient
                    }
                    data-ocid="materials.submit_button"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              All Materials
            </CardTitle>
            <CardDescription>
              {materials?.length ?? 0} item{materials?.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !materials || materials.length === 0 ? (
              <div
                data-ocid="materials.empty_state"
                className="py-16 text-center text-muted-foreground"
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No materials uploaded yet</p>
                <p className="text-sm mt-1">
                  Click "Upload Material" to add your first resource.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {materials.map((material, i) => (
                    <MaterialCard
                      key={material.id.toString()}
                      material={material}
                      onDelete={handleDelete}
                      storageClient={storageClient}
                      index={i + 1}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
