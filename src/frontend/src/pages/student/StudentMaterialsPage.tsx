import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Download, File, FileText, Image } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { StudyMaterial } from "../../backend.d";
import { useStudyMaterials } from "../../hooks/useQueries";
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
  storageClient,
  index,
}: {
  material: StudyMaterial;
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
      transition={{ delay: index * 0.04, duration: 0.3 }}
      data-ocid={`materials.item.${index}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card transition-shadow duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileIcon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">
          {material.title}
        </p>
        {material.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {material.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          {material.fileName} ·{" "}
          {new Date(Number(material.uploadedAt) / 1_000_000).toLocaleDateString(
            undefined,
            { year: "numeric", month: "short", day: "numeric" },
          )}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleView}
        className="flex-shrink-0 gap-2"
        data-ocid={`materials.download_button.${index}`}
      >
        <Download className="w-3.5 h-3.5" />
        View
      </Button>
    </motion.div>
  );
}

export default function StudentMaterialsPage() {
  const { data: materials, isLoading } = useStudyMaterials();
  const storageClient = useStorageClient();

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">
            Study Materials
          </h1>
          <p className="text-muted-foreground">
            Resources uploaded by your teacher.
          </p>
        </header>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Available Resources
            </CardTitle>
            <CardDescription>
              {materials?.length ?? 0} material
              {materials?.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !materials || materials.length === 0 ? (
              <div
                data-ocid="materials.empty_state"
                className="py-16 text-center text-muted-foreground"
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No materials yet</p>
                <p className="text-sm mt-1">
                  Your teacher hasn't uploaded any resources yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((mat, i) => (
                  <MaterialCard
                    key={mat.id.toString()}
                    material={mat}
                    storageClient={storageClient}
                    index={i + 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
