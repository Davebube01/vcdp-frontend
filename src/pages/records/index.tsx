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

export default function Records() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    state: !isNationalAdmin ? user?.state || "all" : "all",
    fy_awarded: "all",
    vcdp_component: "all",
    threeFS_primary: "all",
    funding_group: "all",
    programme_phase: "all",
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
        ...(debouncedSearch && { search: debouncedSearch }),
      }),
    [page, filters, debouncedSearch, isNationalAdmin, user?.state],
  );

  const { data: recordsData, isLoading } = useRecords(queryParams);

  const columns: ColumnDef<Transaction>[] = [
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
      accessorKey: "fy_awarded",
      header: "FY",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.fy_awarded}</span>
      ),
    },
    {
      accessorKey: "vcdp_component",
      header: "Component",
      cell: ({ row }) => (
        <span className="text-xs uppercase font-semibold text-slate-500">
          {row.original.vcdp_component}
        </span>
      ),
    },
    {
      accessorKey: "expenditure_total",
      header: () => <div className="text-right">Expenditure (USD)</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-primary">
          ${row.original.expenditure_total.toLocaleString()}
        </div>
      ),
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
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/records/${row.original.id}`}>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: recordsData?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            Manage and track all transaction records.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 shadow-sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button asChild className="gap-2 shadow-lg shadow-primary/20">
            <Link to="/records/new">
              <Plus className="w-4 h-4" />
              New Record
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

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
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
    </div>
  );
}
