import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Calendar,
  Pencil,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStates,
  useFiscalYears,
  useVcdpComponents,
  useThreefsComponents,
} from "@/core/services/loaders/meta-loaders";
import { useRecords } from "@/core/services/loaders/records-loaders";
import { recordsApi } from "@/core/services/API/records";
import { Transaction } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/core/providers/AuthProvider";
import { useCurrency } from "@/core/providers/CurrencyProvider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useBulkDeleteRecordsAction,
  useDeleteAllRecordsAction,
} from "@/core/services/actions/record-actions";
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

export default function Records() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { formatValue } = useCurrency();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    state: !isNationalAdmin ? user?.state || "all" : "all",
    fy_awarded: "all",
    vcdp_component: "all",
    threeFS_primary: "all",
    funding_group: "all",
    programme_phase: "all",
    status: "all",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (
      !isAuthLoading &&
      !isNationalAdmin &&
      user?.state &&
      filters.state === "all"
    ) {
      setFilters((prev) => ({ ...prev, state: user.state as string }));
    }
  }, [isAuthLoading, isNationalAdmin, user?.state, filters.state]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "all",
  ).length;

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: states } = useStates();
  const { data: years } = useFiscalYears();
  const { data: vcdpMeta } = useVcdpComponents();
  const { data: threefsMeta } = useThreefsComponents();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Sync temp filters when modal opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);

  const updateTempFilter = (key: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const fresh = {
      state: !isNationalAdmin ? user?.state || "all" : "all",
      fy_awarded: "all",
      vcdp_component: "all",
      threeFS_primary: "all",
      funding_group: "all",
      programme_phase: "all",
      status: "all",
    };
    setFilters(fresh);
    setTempFilters(fresh);
    setPage(1);
    setIsFilterOpen(false);
  };

  const queryParams = React.useMemo(
    () =>
      new URLSearchParams({
        page: page.toString(),
        size: "15",
        ...(filters.programme_phase !== "all" && {
          programme_phase: filters.programme_phase,
        }),
        ...(filters.state !== "all" && { state: filters.state }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(debouncedSearch && { search: debouncedSearch }),
      }),
    [page, filters, debouncedSearch, isNationalAdmin, user?.state],
  );

  const { data: recordsData, isLoading } = useRecords(queryParams);
  const { mutate: bulkDelete } = useBulkDeleteRecordsAction();
  const { mutate: deleteAll } = useDeleteAllRecordsAction();
  const { toast } = useToast();

  const [rowSelection, setRowSelection] = useState({});
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "ref_id",
      header: "Ref ID",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.ref_id}</span>
      ),
    },
    {
      accessorKey: "project_name",
      header: "Project Name",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block font-medium">
          {row.original.project_name}
        </span>
      ),
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50">
          {row.original.state}
        </Badge>
      ),
    },
    {
      accessorKey: "executing_agency",
      header: "Agency",
      cell: ({ row }) => (
        <span className="text-[10px] font-bold text-orange-600 uppercase truncate max-w-[120px] block" title={row.original.executing_agency || ""}>
          {row.original.executing_agency || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "fy_awarded",
      header: "FY",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.fy_awarded}</span>
      ),
    },
    {
      accessorKey: "vcdp_component",
      header: "Component",
      cell: ({ row }) => {
        const val = row.original.vcdp_component;
        const displayVal = Array.isArray(val) ? val.join(", ") : (val || "N/A");
        return (
          <span className="text-xs uppercase font-semibold text-slate-500 truncate max-w-[250px] block">
            {displayVal}
          </span>
        );
      },
    },
    {
      accessorKey: "expenditure_total",
      header: () => <div className="text-right">Total Expenditure</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-primary">
          {formatValue(row.original.expenditure_total, row.original.currency as any)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        let color = "bg-slate-100 text-slate-600";
        if (s === "PUBLISHED") color = "bg-emerald-100 text-emerald-700";
        if (s === "PENDING") color = "bg-amber-100 text-amber-700 border-amber-200";
        if (s === "REJECTED") color = "bg-rose-100 text-rose-700 border-rose-200";
        if (s === "DRAFT") color = "bg-slate-200 text-slate-700";

        return (
          <Badge className={`${color} border-none font-bold text-[10px] uppercase`}>
            {s}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entered_at",
      header: "Date Entered",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.entered_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="View Details">
            <Link to={`/activities/${row.original.id}`}>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="Edit Record" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Link to={`/activities/${row.original.id}/edit`}>
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: recordsData?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const handleBulkDelete = () => {
    bulkDelete(selectedIds, {
      onSuccess: () => {
        setRowSelection({});
        setShowBulkDeleteConfirm(false);
        toast({
          title: "Records Deleted",
          description: `Successfully deleted ${selectedIds.length} records.`,
        });
      },
    });
  };

  const handleDeleteAll = () => {
    deleteAll(undefined, {
      onSuccess: () => {
        setShowDeleteAllConfirm(false);
        toast({
          title: "All Records Cleared",
          description: "Every submission has been removed from the system.",
        });
      },
    });
  };

  const handleExport = () => {
    window.open(recordsApi.exportExcel(queryParams), "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">
            VCDP Submissions
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and track all submission records.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 shadow-sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" /> Export
          </Button>

          {isNationalAdmin && selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="gap-2 shadow-sm animate-in fade-in slide-in-from-right-2"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </Button>
          )}

          {isNationalAdmin && (
            <Button
              variant="outline"
              className="gap-2 shadow-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              onClick={() => setShowDeleteAllConfirm(true)}
            >
              <CheckSquare className="w-4 h-4" /> Clear All Submissions
            </Button>
          )}

          <Button asChild className="gap-2 shadow-lg shadow-primary/20">
            <Link to="/submissions/new">
              <Plus className="w-4 h-4" />
              New Submission
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Reference ID, Project Name..."
            className="pl-9 h-11 bg-card shadow-sm border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 gap-2 relative bg-card shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <Badge className="h-5 px-1.5 min-w-[20px] bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
              <div className="flex-1 overflow-y-auto p-6">
                <SheetHeader>
                  <SheetTitle>Filter Submissions</SheetTitle>
                  <SheetDescription>
                    Apply filters to find specific transaction records.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      General
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">State</Label>
                        <Select
                          value={tempFilters.state}
                          onValueChange={(v) => updateTempFilter("state", v)}
                          disabled={!isNationalAdmin}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            {isNationalAdmin && (
                              <SelectItem value="all">All States</SelectItem>
                            )}
                            {states
                              ?.filter(
                                (s) =>
                                  isNationalAdmin || s.name === user?.state,
                              )
                              .map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Fiscal Year
                        </Label>
                        <Select
                          value={tempFilters.fy_awarded}
                          onValueChange={(v) =>
                            updateTempFilter("fy_awarded", v)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {years?.map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Programme Phase
                        </Label>
                        <Select
                          value={tempFilters.programme_phase}
                          onValueChange={(v) =>
                            updateTempFilter("programme_phase", v)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Phases" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Phases</SelectItem>
                            <SelectItem value="Original">
                              Original financing (2013-2018)
                            </SelectItem>
                            <SelectItem value="1st AF">
                              1st Additional Financing
                            </SelectItem>
                            <SelectItem value="2nd AF">
                              2nd Additional Financing
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Classification
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          VCDP Component
                        </Label>
                        <Select
                          value={tempFilters.vcdp_component}
                          onValueChange={(v) =>
                            updateTempFilter("vcdp_component", v)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Component" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Components</SelectItem>
                            {vcdpMeta &&
                              Object.keys(vcdpMeta).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          3FS Primary
                        </Label>
                        <Select
                          value={tempFilters.threeFS_primary}
                          onValueChange={(v) =>
                            updateTempFilter("threeFS_primary", v)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select Mapping" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Mappings</SelectItem>
                            {threefsMeta &&
                              Object.keys(threefsMeta).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Financial
                    </h4>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Funding Group
                      </Label>
                      <Select
                        value={tempFilters.funding_group}
                        onValueChange={(v) =>
                          updateTempFilter("funding_group", v)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Funding" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="domestic">
                            Domestic Public
                          </SelectItem>
                          <SelectItem value="international">
                            International (IFAD)
                          </SelectItem>
                          <SelectItem value="private">
                            Private Sector
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Status</Label>
                      <Select
                        value={tempFilters.status}
                        onValueChange={(v) => updateTempFilter("status", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <SheetFooter className="p-6 bg-background border-t gap-3 flex-col sm:flex-row shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={clearFilters}
                >
                  Reset
                </Button>
                <Button className="flex-2" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-bold text-xs uppercase text-muted-foreground"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4 border-t bg-muted/10">
          <p className="text-sm text-muted-foreground font-medium">
            Page {page} of {recordsData?.pages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (recordsData?.pages || 1)}
              className="gap-1 rounded-lg"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedIds.length} selected activities. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600">DANGER: Delete ALL Submissions?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-900 font-medium">
              This is a highly destructive action. You are about to wipe EVERY activity submission from the database.
              <br /><br />
              All progress, charts, and historical data will be cleared instantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my data</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-rose-600 text-white hover:bg-rose-700">
              Yes, Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
