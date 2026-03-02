import React from "react";
import { useRecords } from "@/core/services/loaders/records-loaders";
import {
  FolderSearch,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

export default function Documents() {
  const queryParams = new URLSearchParams({ size: "100" }); // Get many records for doc list
  const { data: recordsData, isLoading } = useRecords(queryParams);

  // Extract all documents from transactions
  const allDocuments = React.useMemo(() => {
    if (!recordsData?.items) return [];

    const docs = [];
    for (const record of recordsData.items) {
      if (record.supporting_documents) {
        for (const doc of record.supporting_documents) {
          docs.push({
            name: doc,
            transactionId: record.id,
            transactionRef: record.ref_id,
            projectName: record.project_name,
            state: record.state,
            date: record.entered_at,
          });
        }
      }
    }
    return docs;
  }, [recordsData]);

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
                placeholder="Search document name or project reference..."
                className="pl-9 bg-muted/20"
              />
            </div>
          </div>
          <Button variant="outline" className="gap-2 h-10 px-6">
            <Filter className="w-4 h-4" /> Filter Type
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
                Linked Transaction
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                State/Origin
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                Audit Link
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
            ) : allDocuments.length > 0 ? (
              allDocuments.map((doc, idx) => (
                <TableRow
                  key={idx}
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
                          PDF Artifact
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">
                        {doc.transactionRef}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {doc.projectName}
                      </span>
                    </div>
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
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <LinkIcon className="w-3 h-3" />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        Verified Source
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-900">
                    <Button variant="ghost" size="icon" className="group">
                      <ExternalLink className="w-4 h-4 group-hover:text-primary transition-colors" />
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
                      No linked documents found in existing transactions.
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
