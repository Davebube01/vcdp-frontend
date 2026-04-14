import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRecord } from "@/core/services/loaders/records-loaders";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  UsersIcon,
  CloudSun,
  ExternalLink,
  Printer,
  History,
  FileCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/core/providers/AuthProvider";
import { useUpdateRecordStatusAction } from "@/core/services/actions/record-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);

  const { data: record, isLoading, error } = useRecord(id || "");
  const updateStatusMutation = useUpdateRecordStatusAction();

  const handleStatusUpdate = async (status: string, reason?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: id || "",
        status,
        reason,
      });
      toast({
        title: `Submission ${status.toLowerCase()}`,
        description: `The record has been moved to ${status.toLowerCase()} state.`,
      });
      if (status === "REJECTED") {
        setIsRejectDialogOpen(false);
        setRejectionReason("");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  if (error || !record) return <div>Record not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {record.status === "REJECTED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-rose-800 text-lg">Submission Rejected</h3>
            <p className="text-rose-700 text-sm mt-1 leading-relaxed">
              {record.rejection_reason || "No specific feedback provided. Please review all fields and resubmit."}
            </p>
          </div>
          {user?.role?.toUpperCase() === "STATE_COORDINATOR" && (
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shrink-0" asChild>
              <Link to={`/submissions/${id}/edit`}>
                Edit & Fix Submission
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/submissions")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {record.ref_id}
              </h2>
              {record.status === "PUBLISHED" ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 font-bold uppercase tracking-wide">
                  Published
                </Badge>
              ) : record.status === "PENDING" ? (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 font-bold uppercase tracking-wide">
                  Pending Review
                </Badge>
              ) : record.status === "REJECTED" ? (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 px-3 font-bold uppercase tracking-wide">
                  Rejected
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-3 font-bold uppercase tracking-wide">
                  Draft
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium">
              {record.project_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isNationalAdmin && record.status === "PENDING" && (
            <>
              <Dialog
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Submission</DialogTitle>
                    <DialogDescription>
                      Provide a reason for rejection so the state coordinator knows what to fix.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate("REJECTED", rejectionReason)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Confirm Rejection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Approval Destination</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex flex-col items-start gap-1 py-3"
                    onClick={() => handleStatusUpdate("PUBLISHED")}
                  >
                    <div className="font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Approve & Publish
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Make this live on all analytics dashboards immediately.
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex flex-col items-start gap-1 py-3"
                    onClick={() => handleStatusUpdate("DRAFT")}
                  >
                    <div className="font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Approve as Draft
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Finalize record but keep it hidden from dashboards.
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-card shadow-sm border-l-4 border-l-primary">
            <CardHeader className="bg-primary/5 border-b py-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <FileCheck className="w-5 h-5" /> Financial & Identification
                Core
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    FY Awarded
                  </p>
                  <p className="text-xl font-display font-bold">
                    {record.fy_awarded}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    FY Completed
                  </p>
                  <p className="text-xl font-display font-bold">
                    {record.fy_completed}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">
                    Programme Phase
                  </p>
                  <p className="text-lg font-bold text-blue-800">
                    {record.programme_phase}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Fiscal Quarter
                  </p>
                  <p className="text-xl font-display font-bold">
                    {record.fiscal_quarter}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Expenditure Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {[
                      {
                        label: "IFAD (Original ODA)",
                        value: record.expenditure_ifad,
                      },
                      {
                        label: "FGN (Federal Government)",
                        value: record.expenditure_fgn,
                      },
                      {
                        label: "State/LGA Contribution",
                        value: record.expenditure_state,
                      },
                      {
                        label: "Beneficiary (Private)",
                        value: record.expenditure_beneficiary,
                      },
                      { label: "IFAD OOF", value: record.expenditure_oof },
                      {
                        label: "Other / Private Capital",
                        value: record.expenditure_other,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-dashed"
                      >
                        <span className="text-sm text-muted-foreground font-medium">
                          {item.label}
                        </span>
                        <span className="font-mono font-bold">
                          ${(item.value ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="md:col-span-2 flex justify-between items-center py-4 px-6 bg-slate-900 text-white rounded-xl mt-4 shadow-xl">
                      <span className="text-sm font-bold uppercase tracking-wider">
                        Grand Total (USD)
                      </span>
                      <span className="text-3xl font-display font-bold">
                        ${(record.expenditure_total ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="bg-emerald-50/50 border-b py-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-800">
                <FileText className="w-5 h-5" /> Classification & Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">
                    VCDP Framework
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        VCDP Component(s)
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.vcdp_component.map((c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 border-emerald-200"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Sub-Components
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.vcdp_sub_components.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 border-emerald-200"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">
                    3FS International Standard
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        3FS Primary Mapping
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.threeFS_primary.map((s) => (
                          <Badge key={s} className="bg-slate-800 text-white">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        3FS Sub-Components
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.threeFS_sub_components.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="border-slate-300"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    COFOG Code
                  </h5>
                  <p className="font-mono text-xl font-bold bg-muted w-fit px-3 py-1 rounded-lg border">
                    {record.cofog_code || "N/A"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 relative overflow-hidden">
                  <CloudSun
                    className={`absolute -right-2 -bottom-2 w-16 h-16 ${record.climate_flag === "Yes" ? "text-emerald-500/10" : "text-slate-300/10"}`}
                  />
                  <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Climate Environment Flag
                  </h5>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${record.climate_flag === "Yes" ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <span
                      className={`font-bold ${record.climate_flag === "Yes" ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      {record.climate_flag === "Yes"
                        ? "High Alignment"
                        : "Neutral Alignment"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Metadata & Links */}
        <div className="space-y-8">
          <Card className="glass-card shadow-sm border-l-4 border-l-orange-500 overflow-hidden">
            <CardHeader className="bg-orange-50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
                <MapPin className="w-4 h-4" /> Geographic reach
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Implementation State
                </label>
                <p className="text-lg font-bold">{record.state}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Targeted LGAs ({record.lgas.length})
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {record.lgas.map((l) => (
                    <Badge
                      key={l}
                      variant="outline"
                      className="bg-orange-50/50 border-orange-100 text-orange-700 text-[10px]"
                    >
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Value Chain Segments
                </label>
                <p className="text-sm font-medium">
                  {record.value_chain_segments.join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm border-l-4 border-l-rose-500 overflow-hidden">
            <CardHeader className="bg-rose-50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-800">
                <UsersIcon className="w-4 h-4" /> Beneficiary Reach
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-display font-bold text-rose-600 mb-4">
                {(record.beneficiary_total ?? 0).toLocaleString()}{" "}
                <span className="text-xs text-muted-foreground font-sans font-medium uppercase ml-1">
                  Total Reach
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-2 border-rose-200 pl-3">
                  <p className="text-[10px] font-bold text-muted-foreground">Male</p>
                  <p className="text-lg font-bold">{record.beneficiary_male}</p>
                </div>
                <div className="border-l-2 border-rose-200 pl-3">
                  <p className="text-[10px] font-bold text-muted-foreground">Male %</p>
                  <p className="text-lg font-bold">{record.beneficiary_male_percentage ?? "0.0"}%</p>
                </div>
                
                <div className="border-l-2 border-rose-200 pl-3">
                  <p className="text-[10px] font-bold text-muted-foreground">Female</p>
                  <p className="text-lg font-bold">{record.beneficiary_female}</p>
                </div>
                <div className="border-l-2 border-rose-200 pl-3">
                  <p className="text-[10px] font-bold text-muted-foreground">Female %</p>
                  <p className="text-lg font-bold">{record.beneficiary_female_percentage ?? "0.0"}%</p>
                </div>

                <div className="border-l-2 border-rose-300 pl-3 bg-rose-50/50 p-2 rounded-r-lg">
                  <p className="text-[10px] font-bold text-rose-600">Youth (&lt;35)</p>
                  <p className="text-lg font-bold text-rose-700">{record.beneficiary_youth_under35 ?? 0}</p>
                </div>
                <div className="border-l-2 border-rose-200 pl-3">
                  <p className="text-[10px] font-bold text-muted-foreground">Youth %</p>
                  <p className="text-lg font-bold">{record.beneficiary_youth_percentage ?? "0.0"}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm border-l-4 border-l-blue-400 overflow-hidden">
            <CardHeader className="bg-blue-50/50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                <History className="w-4 h-4" /> Traceability & Docs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                  M&E Backend Supporting Documents
                </label>
                {record.supporting_documents.length > 0 ? (
                  record.supporting_documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs font-medium group hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <span className="truncate">{doc}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded">
                    No documents attached.
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">
                  Internal Notes
                </label>
                <p className="text-xs leading-relaxed text-muted-foreground italic border-l-2 pl-3 py-1">
                  "
                  {record.classification_notes ||
                    "No notes provided for this transaction."}
                  "
                </p>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium uppercase">
                  Entered By ID: {record.entered_by}
                </span>
                <span className="text-muted-foreground font-medium">
                  {format(new Date(record.entered_at), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
