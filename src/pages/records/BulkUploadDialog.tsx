import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recordsApi } from "@/core/services/API/records";

export function BulkUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    success_count: number;
    error_count: number;
    errors: { sheet: string; row: number; error: string }[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDownloadTemplate = () => {
    // API endpoint for downloading template
    window.open(recordsApi.downloadTemplate(), "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid .xlsx Excel file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null); // Reset previous results
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Direct fetch or use api client if bulkUpload exists
      // Assuming proxy is set up or we use the direct API base
      const token = localStorage.getItem("auth_token"); // adjust based on auth pattern
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/records/bulk-upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadResult(data);
      
      if (data.success_count > 0) {
        toast({
          title: "Upload Successful",
          description: `Imported ${data.success_count} records successfully.`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200",
        });
        // Invalidate queries to refresh table
        queryClient.invalidateQueries({ queryKey: ["records"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      }

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200 border">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Bulk Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Records</DialogTitle>
          <DialogDescription>
            Download the master template, fill it out, and upload it to import multiple records at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto pr-2 flex-1">
          {/* Step 1: Download */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
              <h4 className="font-semibold text-sm">Download Master Template</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              This template contains dedicated tabs for each state. Do not rename the tabs.
            </p>
            <Button variant="outline" className="ml-11 w-fit gap-2" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
              <h4 className="font-semibold text-sm">Upload Completed File</h4>
            </div>
            
            <div className="ml-11 mt-2">
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {!selectedFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600">Click to select an Excel file (.xlsx)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>Remove</Button>
                </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          {uploadResult && (
            <div className="space-y-3">
              <Alert variant={uploadResult.success_count > 0 ? "default" : "destructive"} className={uploadResult.success_count > 0 ? "bg-emerald-50 border-emerald-200" : ""}>
                {uploadResult.success_count > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className={uploadResult.success_count > 0 ? "text-emerald-800" : ""}>
                  {uploadResult.message}
                </AlertTitle>
                <AlertDescription className={uploadResult.success_count > 0 ? "text-emerald-700" : ""}>
                  {uploadResult.success_count} records imported. {uploadResult.error_count} errors found.
                </AlertDescription>
              </Alert>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Tab (State)</th>
                        <th className="px-3 py-2 font-semibold">Row</th>
                        <th className="px-3 py-2 font-semibold">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {uploadResult.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium">{err.sheet}</td>
                          <td className="px-3 py-2">{err.row}</td>
                          <td className="px-3 py-2 text-red-600">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Close</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">Uploading...</span>
            ) : (
              <><Upload className="w-4 h-4" /> Import Records</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
