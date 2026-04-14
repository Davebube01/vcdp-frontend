import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  ClipboardCheck,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useRecords } from "@/core/services/loaders/records-loaders";
import { Transaction } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/core/providers/AuthProvider";

export default function PendingSubmissions() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = React.useMemo(
    () =>
      new URLSearchParams({
        page: page.toString(),
        size: "15",
        status: "PENDING",
        ...(debouncedSearch && { search: debouncedSearch }),
      }),
    [page, debouncedSearch]
  );

  const { data: recordsData, isLoading } = useRecords(queryParams);

  if (!isAuthLoading && !isNationalAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

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
      header: "Date Submitted",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.entered_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild title="Review Submission">
          <Link to={`/submissions/${row.original.id}`}>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">
              Pending Approvals
            </h2>
            <p className="text-muted-foreground mt-1">
              Review and approve submissions from state coordinators.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search Pending Submissions..."
          className="pl-9 h-11 bg-card shadow-sm border-slate-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                      header.getContext()
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
                        cell.getContext()
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ClipboardCheck className="w-8 h-8 text-muted-foreground/50" />
                    <p>No pending submissions at the moment.</p>
                  </div>
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
