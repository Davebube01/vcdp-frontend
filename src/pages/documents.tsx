import React from "react";
import {
  FolderSearch,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Search,
  Filter,
  PlusCircle,
  Upload,
  Trash2,
  FileDown,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStates } from "@/core/services/loaders/meta-loaders";
import {
  useDocuments,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  Document,
} from "@/core/services/loaders/documents-loaders";
import { toast } from "sonner";

const DATA_SOURCE_OPTIONS = [
  "Financial report",
  "Audit report",
  "Procurement record",
  "Beneficiary database",
  "AWPB excerpts",
  "Bank statements",
  "Geographic/location data",
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null);
  const [uploadData, setUploadData] = React.useState({
    name: "",
    state: "",
    dataSource: "",
    file: null as File | null,
  });

  const { data: states } = useStates();
  const { data: documents, isLoading } = useDocuments();
  const uploadMutation = useUploadDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  const filteredDocuments = React.useMemo(() => {
    if (!documents) return [];
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.data_source.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [documents, searchTerm]);

  const handleOpenUpload = () => {
    setEditingDoc(null);
    setUploadData({ name: "", state: "", dataSource: "", file: null });
    setIsUploadOpen(true);
  };

  const handleOpenEdit = (doc: Document) => {
    setEditingDoc(doc);
    setUploadData({
      name: doc.name,
      state: doc.state,
      dataSource: doc.data_source,
      file: null,
    });
    setIsUploadOpen(true);
  };

  const handleSave = async () => {
    if (
      !uploadData.name ||
      !uploadData.state ||
      !uploadData.dataSource ||
      (!editingDoc && !uploadData.file)
    ) {
      toast.error("Please fill all metadata fields and select a file.");
      return;
    }

    const formData = new FormData();
    if (uploadData.file) formData.append("file", uploadData.file);
    formData.append("name", uploadData.name);
    formData.append("state", uploadData.state);
    formData.append("data_source", uploadData.dataSource);

    try {
      if (editingDoc) {
        await updateMutation.mutateAsync({ id: editingDoc.id, formData });
        toast.success("Document updated successfully.");
      } else {
        await uploadMutation.mutateAsync(formData);
        toast.success("Document uploaded successfully.");
      }
      setIsUploadOpen(false);
      setUploadData({ name: "", state: "", dataSource: "", file: null });
    } catch (error) {
      toast.error(editingDoc ? "Failed to update document." : "Failed to upload document.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Document deleted.");
      } catch (error) {
        toast.error("Failed to delete document.");
      }
    }
  };

  const handleDownload = (id: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    window.open(`${baseUrl}/api/documents/${id}/file`, "_blank");
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Document Repository
          </h2>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Traceability & Audit Evidence Hub
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleOpenUpload}
            >
              <Upload className="w-4 h-4" /> Upload Reference Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Edit Document" : "Upload Document"}
              </DialogTitle>
              <DialogDescription>
                Assign metadata to help filter this document in record
                submissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Document Name</label>
                <Input
                  placeholder="e.g., Q1 Audit Report"
                  value={uploadData.name}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">State Tag</label>
                <Select
                  onValueChange={(val) =>
                    setUploadData({ ...uploadData, state: val })
                  }
                  value={uploadData.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states?.map((s: any) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">
                  Data Source Category
                </label>
                <Select
                  onValueChange={(val) =>
                    setUploadData({ ...uploadData, dataSource: val })
                  }
                  value={uploadData.dataSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Data Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">
                  {editingDoc ? "Replacement File (Optional)" : "File"}
                </label>
                <Input
                  type="file"
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={uploadMutation.isPending || updateMutation.isPending}
              >
                {uploadMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingDoc
                    ? "Update Document"
                    : "Save Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card shadow-sm border-b-0 overflow-visible">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              Search Documents
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, state, or category..."
                className="pl-9 bg-muted/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" className="gap-2 h-10 px-6">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30 text-slate-900">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px]">
                Document Name
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                Category
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                State/Origin
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                Upload Date
              </TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell colSpan={5}>
                    <div className="h-10 bg-muted rounded w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="hover:bg-muted/5 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{doc.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          {doc.filename.split(".").pop()} Artifact
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-[10px] font-bold"
                    >
                      {doc.data_source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-[10px] font-bold"
                    >
                      {doc.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc.id)}
                      title="Download"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(doc)}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FolderSearch className="w-12 h-12 text-muted-foreground/20" />
                    <p className="text-muted-foreground font-medium italic">
                      No documents found matching your search.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
