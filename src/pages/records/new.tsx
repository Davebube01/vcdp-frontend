import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useInsight } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { useDocuments } from "@/core/services/loaders/documents-loaders";
import { useProjects } from "@/core/services/loaders/project-loaders";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, Save, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";

const formSchema = z
  .object({
    ref_id: z.string().min(1, "Ref ID is required"),
    project_name: z.string().min(1, "Project Name is required"),
    commodity: z.array(z.string()).min(1, "At least one commodity required"),
    fy_awarded: z.string().min(1, "FY Awarded is required"),
    fy_completed: z.string().min(1, "FY Completed is required"),
    programme_phase: z.string(),
    fiscal_quarter: z.string().min(1, "Fiscal Quarter is required"),
    vcdp_component: z.array(z.string()).min(1, "At least one VCDP Component is required"),
    vcdp_sub_components: z
      .array(z.string())
      .min(1, "At least one sub-component required"),
    state: z.string().min(1, "State is required"),
    lgas: z.array(z.string()).min(1, "At least one LGA required"),
    threeFS_primary: z
      .array(z.string())
      .min(1, "At least one 3FS Primary required"),
    threeFS_sub_components: z.array(z.string()),
    cofog_code: z.string().optional(),
    funding_sources: z
      .array(z.string())
      .min(1, "At least one funding source required"),
    sub_funding_sources: z.array(z.string()),
    expenditure_fgn: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_state: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_ifad: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_oof: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_beneficiary: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_other: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_total_reported: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    beneficiary_categories: z.array(z.string()),
    beneficiary_total: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    beneficiary_male: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    beneficiary_female: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    beneficiary_youth_under35: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    beneficiary_plwd: z
      .union([z.coerce.number(), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    value_chain_segments: z.array(z.string()),
    climate_flag: z.boolean(),
    data_source: z
      .array(z.string())
      .min(1, "At least one Data Source required"),
    supporting_documents: z.array(z.string()),
    classification_notes: z.string().max(200).optional(),
    status: z.enum(["PENDING", "REJECTED", "DRAFT", "PUBLISHED"]).optional(),
  })
  .refine(
    (data) => {
      const fy_completed = parseInt(data.fy_completed);
      const fy_awarded = parseInt(data.fy_awarded);
      return fy_completed >= fy_awarded;
    },
    {
      message: "FY Completed cannot be before FY Awarded",
      path: ["fy_completed"],
    },
  )
  .refine(
    (data) => {
      return (
        data.beneficiary_male + data.beneficiary_female ===
        data.beneficiary_total
      );
    },
    {
      message: "Male + Female headcount must equal Total Headcount",
      path: ["beneficiary_total"],
    },
  )
  .refine(
    (data) => {
      return data.beneficiary_youth_under35 <= data.beneficiary_total;
    },
    {
      message: "Youth headcount cannot exceed Total Headcount",
      path: ["beneficiary_youth_under35"],
    },
  );

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
  const { data: projectsList } = useProjects();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      ref_id: "",
      project_name: "",
      commodity: [],
      fy_awarded: "",
      fy_completed: "",
      programme_phase: "VCDP Phase II",
      fiscal_quarter: "",
      vcdp_component: [],
      vcdp_sub_components: [],
      state: isNationalAdmin ? "" : user?.state || "",
      lgas: [],
      threeFS_primary: [],
      threeFS_sub_components: [],
      cofog_code: "",
      funding_sources: [],
      sub_funding_sources: [],
      expenditure_fgn: "" as any,
      expenditure_state: "" as any,
      expenditure_ifad: "" as any,
      expenditure_oof: "" as any,
      expenditure_beneficiary: "" as any,
      expenditure_other: "" as any,
      expenditure_total_reported: "" as any,
      beneficiary_categories: [],
      beneficiary_total: "" as any,
      beneficiary_male: "" as any,
      beneficiary_female: "" as any,
      beneficiary_youth_under35: "" as any,
      beneficiary_plwd: "" as any,
      value_chain_segments: [],
      climate_flag: false,
      data_source: [],
      supporting_documents: [],
      classification_notes: "",
      status: isNationalAdmin ? "PUBLISHED" : "PENDING",
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
    } else if (year >= 2019) {
      const currentPhase = form.getValues("programme_phase");
      if (currentPhase === "Original (2013-2018)") {
        form.setValue("programme_phase", "");
      }
    }
  }, [watchedValues.fy_awarded, form]);

  // Logic: Beneficiary Auto-population
  useEffect(() => {
    const total = Number(watchedValues.beneficiary_total) || 0;
    const male = Number(watchedValues.beneficiary_male) || 0;
    const female = Number(watchedValues.beneficiary_female) || 0;

    // Use a ref-like check or just ensure we don't trigger infinite loops
    // react-hook-form's setValue with shouldValidate: true might trigger re-renders
    if (total > 0) {
      if (document.activeElement?.getAttribute("name") === "beneficiary_male") {
        const calculatedFemale = Math.max(0, total - male);
        if (female !== calculatedFemale) {
          form.setValue("beneficiary_female", calculatedFemale);
        }
      } else if (
        document.activeElement?.getAttribute("name") === "beneficiary_female"
      ) {
        const calculatedMale = Math.max(0, total - female);
        if (male !== calculatedMale) {
          form.setValue("beneficiary_male", calculatedMale);
        }
      }
    }
  }, [
    watchedValues.beneficiary_total,
    watchedValues.beneficiary_male,
    watchedValues.beneficiary_female,
    form,
  ]);

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
    const selectedFilteredVcdpSubs = watchedValues.vcdp_component || []

    if (selectedFilteredVcdpSubs.length === 0) return []
    
    return selectedFilteredVcdpSubs.flatMap(
      (vcpdsubs) => (vcdpMeta as Record<string, string[]>)?.[vcpdsubs] || [],
    )
  }, [watchedValues.vcdp_component, vcdpMeta]);

  // Logic: Dynamic Supporting Documents
  const { data: allDocs } = useDocuments(watchedValues.state);
  const availableDocuments = useMemo(() => {
    if (
      !allDocs ||
      !watchedValues.data_source ||
      watchedValues.data_source.length === 0
    )
      return [];

    // Show documents that match the selected state and ANY of the selected data sources
    return allDocs
      .filter((doc: any) =>
        watchedValues.data_source?.includes(doc.data_source),
      )
      .map((doc: any) => doc.name);
  }, [allDocs, watchedValues.data_source]);

  // Logic: Filtered 3FS Sub-Components
  const filteredThreeFsSubs = useMemo(() => {
    const selectedPrimaries = watchedValues.threeFS_primary || [];
    if (selectedPrimaries.length === 0) return [];

    return selectedPrimaries.flatMap(
      (primary) => (threeFsMeta as Record<string, string[]>)?.[primary] || [],
    );
  }, [watchedValues.threeFS_primary, threeFsMeta]);

  // Logic: Filtered Sub-Funding Sources
  const filteredSubFundingSources = useMemo(() => {
    const selectedFoundations = watchedValues.funding_sources || [];
    if (selectedFoundations.length === 0) return [];

    return selectedFoundations.flatMap(
      (source) => (fundMeta as Record<string, string[]>)?.[source] || [],
    );
  }, [watchedValues.funding_sources, fundMeta]);

  const createRecordMutation = useCreateRecordAction();

  const fieldLabels: Record<string, string> = {
    ref_id: "Project Reference Number",
    project_name: "Project Name",
    commodity: "Commodity Value Chain",
    fy_awarded: "Fiscal Year (Awarded)",
    fy_completed: "Fiscal Year (Completed)",
    fiscal_quarter: "Fiscal Quarter",
    vcdp_component: "VCDP Component",
    vcdp_sub_components: "VCDP Sub-Component(s)",
    state: "State",
    lgas: "LGAs",
    threeFS_primary: "3FS Component (Primary)",
    funding_sources: "Funding Source",
    data_source: "Data Source",
    beneficiary_total: "Total Headcount",
    beneficiary_male: "Male Headcount",
    beneficiary_female: "Female Headcount",
  };

  const onInvalid = (errors: any) => {
    const errorFields = Object.keys(errors);
    const labels = errorFields
      .map((key) => fieldLabels[key] || key)
      .join(", ");
    
    toast({
      title: "Missing Information",
      description: `Please check the following fields: ${labels}`,
      variant: "destructive",
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (totalExpenditure <= 0) {
      toast({
        title: "Validation Error",
        description: "Total expenditure must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const t = Number(values.beneficiary_total) || 0;
    const m = Number(values.beneficiary_male) || 0;
    const f = Number(values.beneficiary_female) || 0;
    const y = Number(values.beneficiary_youth_under35) || 0;
    const p = Number(values.beneficiary_plwd) || 0;

    const payload = {
      ...values,
      fy_awarded: parseInt(values.fy_awarded),
      fy_completed: parseInt(values.fy_completed),
      climate_flag: values.climate_flag ? "Yes" : "No",
      beneficiary_male_percentage: t > 0 ? parseFloat(((m / t) * 100).toFixed(1)) : 0,
      beneficiary_female_percentage: t > 0 ? parseFloat(((f / t) * 100).toFixed(1)) : 0,
      beneficiary_youth_percentage: t > 0 ? parseFloat(((y / t) * 100).toFixed(1)) : 0,
      beneficiary_plwd: p,
    };

    createRecordMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Transaction record saved successfully.",
        });
        navigate("/submissions");
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
            New 3FS Record
          </h2>
          {/* <p className="text-muted-foreground mt-1 font-medium italic">
            Project Year
          </p> */}
        </div>
        <div className="hidden md:block">
          <FileCheck className="w-12 h-12 text-primary/20" />
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Project Reference Number/Transaction ID <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between bg-white text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? projectsList?.find((p) => p.ref_id === field.value)?.ref_id || field.value
                              : "Select Project"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput placeholder="Search projects..." />
                          <CommandList>
                            <CommandEmpty>No project found.</CommandEmpty>
                            <CommandGroup>
                              {projectsList?.map((p) => (
                                <CommandItem
                                  value={p.ref_id}
                                  key={p.id}
                                  onSelect={() => {
                                    form.setValue("ref_id", p.ref_id);
                                    form.setValue("project_name", p.name);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      p.ref_id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {p.ref_id} - {p.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name/Specific Activity Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-filled from project selection"
                        {...field}
                        readOnly
                        className="bg-slate-50 text-muted-foreground cursor-not-allowed"
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
                    <FormLabel>Commodity Value Chain <span className="text-red-500">*</span></FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Fiscal Year (Awarded) <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-muted/10",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? years?.find(
                                    (y) => y.toString() === field.value,
                                  )
                                : "Select Year"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search year..." />
                            <CommandList>
                              <CommandEmpty>No year found.</CommandEmpty>
                              <CommandGroup>
                                {years?.map((y) => (
                                  <CommandItem
                                    value={y.toString()}
                                    key={y}
                                    onSelect={() => {
                                      form.setValue("fy_awarded", y.toString());
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        y.toString() === field.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {y}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fy_completed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Year (Completed) <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-muted/10",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? years?.find(
                                    (y) => y.toString() === field.value,
                                  )
                                : "Select Year"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search year..." />
                            <CommandList>
                              <CommandEmpty>No year found.</CommandEmpty>
                              <CommandGroup>
                                {years
                                  ?.filter(
                                    (y) =>
                                      !watchedValues.fy_awarded ||
                                      y >= parseInt(watchedValues.fy_awarded),
                                  )
                                  .map((y) => (
                                    <CommandItem
                                      value={y.toString()}
                                      key={y}
                                      onSelect={() => {
                                        form.setValue(
                                          "fy_completed",
                                          y.toString(),
                                        );
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          y.toString() === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {y}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="programme_phase"
                render={({ field }) => {
                  const year = parseInt(watchedValues.fy_awarded || "0");
                  const isDropdown = year >= 2019;
                  return (
                    <FormItem>
                      <FormLabel>Programme Phase</FormLabel>
                      {isDropdown ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Programme Phase" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1st Additional Financing">
                              1st Additional Financing
                            </SelectItem>
                            <SelectItem value="2nd Additional Financing">
                              2nd Additional Financing
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="bg-slate-50 font-semibold text-blue-700"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="fiscal_quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Quarter <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>VCDP Component <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={vcdpMeta ? Object.keys(vcdpMeta) : []}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Component"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vcdp_sub_components"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VCDP Sub-Component(s) <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>3FS Component (Primary) </FormLabel>
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
                      <FormLabel>3FS Sub-Component</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredThreeFsSubs}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Sub 3FS"
                          disabled={watchedValues.threeFS_primary?.length === 0}
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
                      <FormLabel>Geographic Location (State) <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Sub-geographic Location (LGAs) <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Funding Source <span className="text-red-500">*</span></FormLabel>
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
                  name="sub_funding_sources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Funding Source(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredSubFundingSources}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Sub-Funding Source(s)"
                          disabled={watchedValues.funding_sources?.length === 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cofog_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COFOG Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 70421" {...field} />
                      </FormControl>
                      <FormDescription>
                        Classification of the Functions of Government
                      </FormDescription>
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
                Grant Details (USD) 
              </h3>
            </div>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                      Allocated Budget
                    </p>
                    <p className="text-4xl font-display font-bold mt-1">
                      $
                      {totalExpenditure.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  {/* <div className="text-right">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                      <FileCheck className="w-4 h-4" /> Hard Validated
                    </div>
                  </div> */}
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border-t-4 border-t-purple-500">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                      Total Expenditure (Reported)
                    </p>
                    <p className="text-4xl font-display font-bold mt-1 text-purple-400">
                      $
                      {(
                        watchedValues.expenditure_total_reported || 0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenditure_total_reported"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between text-purple-600 font-semibold">
                        Total Expenditure (from Data Source){" "}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          USD
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter total from document"
                          className="border-purple-200 focus-visible:ring-purple-500"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: Value Chain & Data Sources */}
          <Card className="glass-card shadow-sm border-l-4 border-l-indigo-500 relative z-40 overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                  6
                </span>
                Value Chain & Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <FormField
                  control={form.control}
                  name="data_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source</FormLabel>
                      <MultiSelect
                        options={[
                          "Financial report",
                          "Audit report",
                          "Procurement record",
                          "Beneficiary database",
                          "AWPB excerpts",
                          "Bank statements",
                          "Geographic/location data",
                        ]}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select Source(s)"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 7: Beneficiaries */}
          <Card className="glass-card shadow-sm border-l-4 border-l-rose-500 z-10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                  7
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
                    <FormLabel>Beneficiary Categories <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={[
                          "Farmers",
                          "Processors",
                          "Traders",
                          "Input Supplier",
                          "Service Providers or Infrastructure Developer",
                          "Farmer Organizations",
                        ]}
                        selected={field.value}
                        onChange={field.onChange}
                        
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="beneficiary_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Headcount <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Strip leading zeros unless it's just "0"
                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                            field.onChange(
                              cleanVal === ""
                                ? ""
                                : val.startsWith("0") && val.length > 1
                                  ? Number(cleanVal)
                                  : val,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_male"
                  render={({ field }) => {
                    const total = Number(watchedValues.beneficiary_total) || 0;
                    const male = Number(field.value) || 0;
                    const percentage = total > 0 ? ((male / total) * 100).toFixed(1) : "0.0";
                    return (
                      <FormItem>
                        <FormLabel>Male</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Strip leading zeros unless it's just "0"
                              const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                              field.onChange(
                                cleanVal === ""
                                  ? ""
                                  : val.startsWith("0") && val.length > 1
                                    ? Number(cleanVal)
                                    : val,
                              );
                            }}
                          />
                        </FormControl>
                        {total > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {percentage}% of Total Headcount
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_female"
                  render={({ field }) => {
                    const total = Number(watchedValues.beneficiary_total) || 0;
                    const female = Number(field.value) || 0;
                    const percentage = total > 0 ? ((female / total) * 100).toFixed(1) : "0.0";
                    return (
                      <FormItem>
                        <FormLabel>Female</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Strip leading zeros unless it's just "0"
                              const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                              field.onChange(
                                cleanVal === ""
                                  ? ""
                                  : val.startsWith("0") && val.length > 1
                                    ? Number(cleanVal)
                                    : val,
                              );
                            }}
                          />
                        </FormControl>
                        {total > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {percentage}% of Total Headcount
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_youth_under35"
                  render={({ field }) => {
                    const total = Number(watchedValues.beneficiary_total) || 0;
                    const youth = Number(field.value) || 0;
                    const percentage = total > 0 ? ((youth / total) * 100).toFixed(1) : "0.0";
                    return (
                      <FormItem>
                        <FormLabel>Youth (&lt;35)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Strip leading zeros unless it's just "0"
                              const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                              field.onChange(
                                cleanVal === ""
                                  ? ""
                                  : val.startsWith("0") && val.length > 1
                                    ? Number(cleanVal)
                                    : val,
                              );
                            }}
                          />
                        </FormControl>
                        {total > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {percentage}% of Total Headcount
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="beneficiary_plwd"
                  render={({ field }) => {
                    const total = Number(watchedValues.beneficiary_total) || 0;
                    const plwd = Number(field.value) || 0;
                    const percentage = total > 0 ? ((plwd / total) * 100).toFixed(1) : "0.0";
                    return (
                      <FormItem>
                        <FormLabel>PLWD (People Living With Disabilities)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                              field.onChange(
                                cleanVal === ""
                                  ? ""
                                  : val.startsWith("0") && val.length > 1
                                    ? Number(cleanVal)
                                    : val,
                              );
                            }}
                          />
                        </FormControl>
                        {total > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {percentage}% of Total Headcount
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 8: Finalization */}
          <Card className="glass-card shadow-sm border-l-4 border-l-gray-400 -z-30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs">
                  8
                </span>
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
                          Does this project support climate adaptation, mitigation, or environmental sustainability activities?
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
                          options={availableDocuments}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder={
                            watchedValues.state &&
                            (watchedValues.data_source?.length || 0) > 0
                              ? "Select Documents"
                              : "Select State & Data Source First"
                          }
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
                {isNationalAdmin && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PUBLISHED">Published (Live on Dashboard)</SelectItem>
                            <SelectItem value="DRAFT">Draft (Hidden from Dashboard)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Control whether this record is visible on the analytical dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* STICKY ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 z-50 flex justify-center">
            <div className="max-w-5xl w-full flex justify-between items-center gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/submissions")}
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
