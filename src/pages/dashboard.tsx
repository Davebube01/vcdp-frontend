import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  DollarSign,
  Users,
  FileCheck,
  TrendingUp,
  Map,
  Filter,
  Download,
  Calendar,
  CloudSun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStates,
  useFiscalYears,
  useVcdpComponents,
  useThreefsComponents,
} from "@/core/services/loaders/meta-loaders";
import { useDashboardMetrics } from "@/core/services/loaders/dashboard-loaders";
import { recordsApi } from "@/core/services/API/records";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/core/providers/AuthProvider";

const COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";

  const filters = React.useMemo(
    () => ({
      state: !isNationalAdmin
        ? user?.state || "all"
        : searchParams.get("state") || "all",
      fy_awarded: searchParams.get("fy_awarded") || "all",
      vcdp_component: searchParams.get("vcdp_component") || "all",
      threeFS_primary: searchParams.get("threeFS_primary") || "all",
      funding_group: searchParams.get("funding_group") || "all",
      programme_phase: searchParams.get("programme_phase") || "all",
    }),
    [searchParams, isNationalAdmin, user?.state],
  );

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "all",
  ).length;

  const { data: states } = useStates();
  const { data: years } = useFiscalYears();
  const { data: vcdpDocs } = useVcdpComponents();
  const { data: threefsDocs } = useThreefsComponents();

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
    const newParams = new URLSearchParams(searchParams);
    Object.entries(tempFilters).forEach(([key, value]) => {
      if (value === "all") newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const freshParams = new URLSearchParams();
    if (!isNationalAdmin && user?.state) {
      freshParams.set("state", user.state);
    }
    setSearchParams(freshParams);
    setTempFilters({
      state: !isNationalAdmin ? user?.state || "all" : "all",
      fy_awarded: "all",
      vcdp_component: "all",
      threeFS_primary: "all",
      funding_group: "all",
      programme_phase: "all",
    });
    setIsFilterOpen(false);
  };

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    const effectiveState = !isNationalAdmin ? user?.state : filters.state;
    if (effectiveState && effectiveState !== "all")
      params.set("state", effectiveState);
    if (filters.fy_awarded !== "all")
      params.set("fy_awarded", filters.fy_awarded);
    if (filters.vcdp_component !== "all")
      params.set("vcdp_component", filters.vcdp_component);
    if (filters.threeFS_primary !== "all")
      params.set("threeFS_primary", filters.threeFS_primary);
    if (filters.funding_group !== "all")
      params.set("funding_group", filters.funding_group);
    if (filters.programme_phase !== "all")
      params.set("programme_phase", filters.programme_phase);
    return params;
  }, [filters, isNationalAdmin, user?.state]);

  const { data: metrics, isLoading } = useDashboardMetrics(queryParams);

  const handleExport = () => {
    const exportUrl = recordsApi.exportExcel(queryParams);
    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute("download", `VCDP_Dashboard_Export.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading)
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-4 gap-6">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            VCDP Executive Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time reporting & 3FS alignment tracking.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 relative"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-none h-5 px-1.5 min-w-[20px] flex items-center justify-center font-bold"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
              <div className="flex-1 overflow-y-auto p-6">
                <SheetHeader>
                  <SheetTitle>Dashboard Filters</SheetTitle>
                  <SheetDescription>
                    Refine dashboard analytics by selecting parameters below.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  {/* General Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      General Scope
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Implementation State
                        </Label>
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

                  {/* Classification Section */}
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
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select Component" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Components</SelectItem>
                            {vcdpDocs &&
                              Object.keys(vcdpDocs).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          3FS Primary Mapping
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
                            <SelectItem value="all">
                              All 3FS Standards
                            </SelectItem>
                            {threefsDocs &&
                              Object.keys(threefsDocs).map((c) => (
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

                  {/* Financial Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Financial Scope
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
                          <SelectItem value="all">
                            All Funding Sources
                          </SelectItem>
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
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 w-full sm:w-auto justify-center"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="glass-card shadow-sm group hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Total Expenditure
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-foreground">
              ${metrics?.kpis.total_expenditure.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" /> Cumulative (USD)
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm group hover:border-orange-500/50 transition-colors text-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Active States
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Map className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {metrics?.kpis.active_states}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Participating core states
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm group hover:border-blue-500/50 transition-colors text-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Submissions
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {metrics?.kpis.total_transactions}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Verified transaction records
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm group hover:border-emerald-500/50 transition-colors text-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Climate Alignment
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CloudSun className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {metrics?.kpis.climate_flagged_pct.toFixed(1)}%
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 font-bold">
              Climate-flagged activities
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart (Line) */}
        <Card className="glass-card shadow-sm overflow-hidden border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Expenditure Trend
              (2013 - {new Date().getFullYear()})
            </CardTitle>
            <CardDescription>
              Visualizing investment growth across all phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.charts.trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  fontWeight={600}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={15}
                />
                <YAxis
                  fontSize={10}
                  fontWeight={600}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(val) => `₦${(val / 1000).toLocaleString()}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(val: number) => [
                    `$${val.toLocaleString()}`,
                    "Expenditure",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="expenditure"
                  stroke="#0ea5e9"
                  strokeWidth={4}
                  dot={{
                    r: 4,
                    fill: "#0ea5e9",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3FS Component Breakdown (Pie) */}
        <Card className="glass-card shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Expenditure by 3FS Component
            </CardTitle>
            <CardDescription>
              Alignment with international COFOG standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.charts.threefs.map(item => ({
                    ...item,
                    name: item.name.includes("Component 1") ? "Agricultural Development" :
                          item.name.includes("Component 2") ? "Infrastructure" :
                          item.name.includes("Component 3") ? "Nutrition/Health" :
                          item.name.includes("Component 4") ? "Social Assistance" :
                          item.name.includes("Component 5") ? "Climate/Resources" : item.name
                  }))}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics?.charts.threefs.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => `₦${val.toLocaleString()}`}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    paddingTop: "20px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State Performance (Horizontal Bar) */}
        <Card className="glass-card shadow-sm border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              State Contribution Performance
            </CardTitle>
            <CardDescription>
              Top performing implementation states by expenditure.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.charts.state_performance}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={10}
                  fontWeight={600}
                  width={70}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => `₦${val.toLocaleString()}`}
                />
                <Bar
                  dataKey="value"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funding Sources (Stacked Bar) */}
        <Card className="glass-card shadow-sm border-t-4 border-t-purple-500">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Funding Source Distribution
            </CardTitle>
            <CardDescription>
              Domestic vs International vs Private Capital.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <BarChart
                data={metrics?.charts.funding_sources}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  fontWeight={700}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  width={35}
                  tickFormatter={(val) => `₦${(val / 1000).toLocaleString()}k`}
                />
                <Tooltip
                  formatter={(val: number) => `₦${val.toLocaleString()}`}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Separator({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      className={`bg-border ${orientation === "horizontal" ? "w-full h-px" : "h-full w-px"} ${className}`}
    />
  );
}
