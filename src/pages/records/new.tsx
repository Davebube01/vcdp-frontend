import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useInsight } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  useStates,
  useVcdpComponents,
  useThreefsComponents,
  useFundingSources,
  useCommodities,
  useFiscalYears,
  useValueChainSegments,
} from "@/core/services/loaders/meta-loaders";
import { useCreateRecordAction } from "@/core/services/actions/record-actions";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";

const formSchema = z.object({
  ref_id: z.string().min(1, "Ref ID is required"),
  project_name: z.string().min(1, "Project Name is required"),
  commodity: z.array(z.string()).min(1, "At least one commodity required"),
  fy_awarded: z.string().min(1, "FY Awarded is required"),
  fy_completed: z.string().min(1, "FY Completed is required"),
  programme_phase: z.string(),
  fiscal_quarter: z.string().min(1, "Fiscal Quarter is required"),
  vcdp_component: z.string().min(1, "VCDP Component is required"),
  vcdp_sub_components: z
    .array(z.string())
    .min(1, "At least one sub-component required"),
  state: z.string().min(1, "State is required"),
  lgas: z.array(z.string()).min(1, "At least one LGA required"),
  threeFS_primary: z
    .array(z.string())
    .min(1, "At least one 3FS Primary required"),
  threeFS_sub_components: z.array(z.string()),
  cofog_code: z.string(),
  funding_sources: z
    .array(z.string())
    .min(1, "At least one funding source required"),
  expenditure_fgn: z.coerce.number().min(0),
  expenditure_state: z.coerce.number().min(0),
  expenditure_ifad: z.coerce.number().min(0),
  expenditure_oof: z.coerce.number().min(0),
  expenditure_beneficiary: z.coerce.number().min(0),
  expenditure_other: z.coerce.number().min(0),
  beneficiary_categories: z.array(z.string()),
  beneficiary_total: z.coerce.number().min(0),
  beneficiary_male: z.coerce.number().min(0),
  beneficiary_female: z.coerce.number().min(0),
  beneficiary_youth_under35: z.coerce.number().min(0),
  value_chain_segments: z.array(z.string()),
  climate_flag: z.boolean(),
  data_source: z.string().min(1, "Data Source is required"),
  supporting_documents: z.array(z.string()),
  classification_notes: z.string().max(200).optional(),
});

export default function NewRecord() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";
  const { toast } = useToast();
  const navigate = useNavigate();

  // Meta data hooks
  const { data: states } = useStates();
  const { data: vcdpMeta } = useVcdpComponents();
  const { data: threeFsMeta } = useThreefsComponents();
  const { data: fundMeta } = useFundingSources();
  const { data: commodities } = useCommodities();
  const { data: years } = useFiscalYears();
  const { data: segments } = useValueChainSegments();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ref_id: "",
      project_name: "",
      commodity: [],
      fy_awarded: "",
      fy_completed: "",
      programme_phase: "",
      fiscal_quarter: "",
      vcdp_component: "",
      vcdp_sub_components: [],
      state: !isNationalAdmin ? user?.state || "" : "",
      lgas: [],
      threeFS_primary: [],
      threeFS_sub_components: [],
      cofog_code: "",
      funding_sources: [],
      expenditure_fgn: 0,
      expenditure_state: 0,
      expenditure_ifad: 0,
      expenditure_oof: 0,
      expenditure_beneficiary: 0,
      expenditure_other: 0,
      beneficiary_categories: [],
      beneficiary_total: 0,
      beneficiary_male: 0,
      beneficiary_female: 0,
      beneficiary_youth_under35: 0,
      value_chain_segments: [],
      climate_flag: false,
      data_source: "",
      supporting_documents: [],
      classification_notes: "",
    },
  });

  const watchedValues = useWatch({ control: form.control });

  // Sync state for non-admins if it's empty
  useEffect(() => {
    if (
      !isAuthLoading &&
      !isNationalAdmin &&
      user?.state &&
      !form.getValues("state")
    ) {
      form.setValue("state", user.state);
    }
  }, [isAuthLoading, isNationalAdmin, user?.state, form]);

  // Logic: Programme Phase auto-fill
  useEffect(() => {
    const year = parseInt(watchedValues.fy_awarded || "0");
    if (year >= 2013 && year <= 2018) {
      form.setValue("programme_phase", "Original (2013-2018)");
    } else if (year >= 2019 && year <= 2021) {
      form.setValue("programme_phase", "1st AF");
    } else if (year >= 2022) {
      form.setValue("programme_phase", "2nd AF");
    }
  }, [watchedValues.fy_awarded, form]);

  // Logic: Expenditure Total (Display only)
  const totalExpenditure = useMemo(() => {
    return (
      (Number(watchedValues.expenditure_fgn) || 0) +
      (Number(watchedValues.expenditure_state) || 0) +
      (Number(watchedValues.expenditure_ifad) || 0) +
      (Number(watchedValues.expenditure_oof) || 0) +
      (Number(watchedValues.expenditure_beneficiary) || 0) +
      (Number(watchedValues.expenditure_other) || 0)
    );
  }, [watchedValues]);

  // Logic: Filtered LGAs
  const filteredLGAs = useMemo(() => {
    const selectedStateName = watchedValues.state;
    if (!selectedStateName) return [];

    const selectedState = states?.find(
      (s) => s.name.toLowerCase() === selectedStateName.toLowerCase(),
    );
    return selectedState?.lgas.map((l) => l.name) || [];
  }, [watchedValues.state, states]);

  // Logic: Filtered VCDP Sub-Components
  const filteredVcdpSubs = useMemo(() => {
    return (
      (vcdpMeta as Record<string, string[]>)?.[
        watchedValues.vcdp_component || ""
      ] || []
    );
  }, [watchedValues.vcdp_component, vcdpMeta]);

  const createRecordMutation = useCreateRecordAction();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (totalExpenditure <= 0) {
      toast({
        title: "Validation Error",
        description: "Total expenditure must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...values,
      fy_awarded: parseInt(values.fy_awarded),
      fy_completed: parseInt(values.fy_completed),
      climate_flag: values.climate_flag ? "Yes" : "No",
    };

    createRecordMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Transaction record saved successfully.",
        });
        navigate("/records");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to save record.",
          variant: "destructive",
        });
      },
    });
  }

  const isSubmitting = createRecordMutation.isPending;

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">
            New Transaction Entry
          </h2>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Single Source of Truth (2013-2025)
          </p>
        </div>
        <div className="hidden md:block">
          <FileCheck className="w-12 h-12 text-primary/20" />
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-20"
        >
          {/* SECTION 1: Identifiers */}
          <Card className="glass-card shadow-sm border-l-4 border-l-blue-500 relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Project Identification
              </CardTitle>
              <CardDescription>
                Core identifiers for the VCDP transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ref_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ref ID / Transaction ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. VCDP/LGA/2024/001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name / Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Market Development"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commodity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commodity</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={commodities || []}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select Commodities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fy_awarded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FY Awarded</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-muted/10">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years?.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fy_completed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FY Completed</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-muted/10">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years?.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="programme_phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programme Phase</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        className="bg-slate-50 font-semibold text-blue-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiscal_quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Quarter</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SECTION 2: Classifications */}
          <Card className="glass-card shadow-sm border-l-4 border-l-emerald-500 relative z-20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Classification & Reporting Mapping
              </CardTitle>
              <CardDescription>
                Link VCDP structures to international 3FS standards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vcdp_component"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VCDP Component</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("vcdp_sub_components", []);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Component" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vcdpMeta &&
                            Object.keys(vcdpMeta).map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vcdp_sub_components"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VCDP Sub-Component(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredVcdpSubs}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Sub-Components"
                          disabled={!watchedValues.vcdp_component}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="threeFS_primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3FS Primary Component(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={threeFsMeta ? Object.keys(threeFsMeta) : []}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Primary 3FS"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="threeFS_sub_components"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3FS Sub-Component(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={
                            threeFsMeta ? Object.values(threeFsMeta).flat() : []
                          }
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Sub 3FS"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Location & Funding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <Card className="glass-card shadow-sm border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                    3
                  </span>
                  Location & Scale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Implementation State</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("lgas", []);
                        }}
                        value={field.value}
                        disabled={!isNationalAdmin}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states
                            ?.filter(
                              (s) =>
                                isNationalAdmin ||
                                s.name.toLowerCase() ===
                                  user?.state?.toLowerCase(),
                            )
                            .map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lgas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Targeted LGA(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredLGAs}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select LGAs"
                          disabled={!watchedValues.state}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value_chain_segments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value Chain Segment(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={segments || []}
                          selected={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                    4
                  </span>
                  Funding Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="funding_sources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Funding Source(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={fundMeta ? Object.keys(fundMeta) : []}
                          selected={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Financial Report",
                            "Audit Report",
                            "Procurement Document",
                            "M&E Field Report",
                            "Other",
                          ].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* SECTION 4: Financials */}
          <Card className="glass-card shadow-sm border-t-4 border-t-primary overflow-hidden relative z-0">
            <div className="bg-primary/5 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-md">
                  5
                </span>
                Financial Expenditure (USD)
              </h3>
            </div>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="expenditure_ifad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        IFAD Contribution{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_fgn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        FGN Budget{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        State/LGA{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_beneficiary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        Beneficiary{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_oof"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        IFAD OOF{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        Other / Private{" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-lg font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                    Grand Total Expenditure
                  </p>
                  <p className="text-4xl font-display font-bold mt-1">
                    $
                    {totalExpenditure.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                    <FileCheck className="w-4 h-4" /> Hard Validated
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: Beneficiaries */}
          <Card className="glass-card shadow-sm border-l-4 border-l-rose-500">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                  6
                </span>
                Beneficiary Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="beneficiary_categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary Categories</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={[
                          "Smallholder Farmers",
                          "Processors",
                          "Marketers",
                          "Input Providers",
                          "Youth Groups",
                          "Women Groups",
                        ]}
                        selected={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="beneficiary_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Headcount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_male"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Male</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_female"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Female</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_youth_under35"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Youth (&lt;35)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: Finalization */}
          <Card className="glass-card shadow-sm border-l-4 border-l-gray-400">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Finalization & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="climate_flag"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-emerald-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold text-emerald-800">
                          Climate/Environment Flag
                        </FormLabel>
                        <FormDescription>
                          Is this activity primarily for climate adaptation?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classification_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain classification logic (max 30 words)..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {watchedValues.classification_notes
                          ?.split(/\s+/)
                          .filter(Boolean).length || 0}
                        /30 words
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="supporting_documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supporting Documents (Select placeholders)
                      </FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={[
                            "Financial Statement",
                            "Audit Report",
                            "Photographic Evidence",
                            "Attendance List",
                            "LGA Clearance",
                          ]}
                          selected={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm italic">
                  Make sure all linked documents are uploaded in the M&E backend
                  before final submission if a reference link is available.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STICKY ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 z-50 flex justify-center">
            <div className="max-w-5xl w-full flex justify-between items-center gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/records")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="px-10 h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Submit Record
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
