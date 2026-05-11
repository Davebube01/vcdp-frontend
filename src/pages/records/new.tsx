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
import { useInstitutions } from "@/core/services/loaders/institution-loaders";
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
    ref_id: z.string().optional(),
    project_name: z.string().min(1, "Activity Name is required"),
    activity_name: z.string().optional(),
    activity_type_code: z.string().optional(),
    category_costcode: z.string().optional(),
    commodity: z.array(z.string()).min(1, "At least one commodity required"),
    fy_awarded: z.string().min(1, "FY Awarded is required"),
    fy_completed: z.string().min(1, "FY Completed is required"),
    programme_phase: z.string(),
    fiscal_quarter: z.array(z.string()).min(1, "At least one quarter required"),
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
    cofog_divisions: z.array(z.string()),
    cofog_groups: z.array(z.string()),
    funding_sources: z
      .array(z.string())
      .min(1, "At least one funding source required"),
    sub_funding_sources: z.array(z.string()),
    sub_funding_oof_text: z.string().optional(),
    sub_funding_private_text: z.string().optional(),
    sub_funding_value_chain_text: z.string().optional(),
    expenditure_fgn: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_state: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_ifad: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_ifad_loan: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_ifad_grant: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_oof: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_beneficiary: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_other: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_private_sector: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    expenditure_value_chain: z
      .union([z.coerce.number().min(0), z.string().length(0)])
      .transform((v) => (v === "" ? 0 : Number(v))),
    currency: z.enum(["USD", "NGN"]),
    expenditure_total_reported: z
      .union([z.coerce.number().min(0, "Must be non-negative"), z.string().length(0)])
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
    unit: z.string().min(1, "Unit is required"),
    quarterly_beneficiary_data: z.record(
      z.string(),
      z.object({
        total: z.number().default(0),
        male: z.number().default(0),
        female: z.number().default(0),
        youth: z.number().default(0),
        plwd: z.number().default(0),
      })
    ).optional(),
    value_chain_segments: z.array(z.string()),
    value_chain_segments_other: z.string().optional(),
    climate_flag: z.boolean(),
    data_source: z
      .array(z.string())
      .min(1, "At least one Data Source required"),
    supporting_documents: z.array(z.string()),
    classification_notes: z.string().max(200).optional(),
    executing_agency: z.string().min(1, "Institution Name is required"),
    institution_code: z.string().min(1, "Institution Code is required"),
    status: z.enum(["PENDING", "REJECTED", "DRAFT", "PUBLISHED"]).optional(),
  })
  .refine(
    (data) => {
      const fy_completed = parseInt(data.fy_completed);
      const fy_awarded = parseInt(data.fy_awarded);
      if (isNaN(fy_completed) || isNaN(fy_awarded)) return true;
      return fy_completed >= fy_awarded;
    },
    {
      message: "FY Completed cannot be before FY Awarded",
      path: ["fy_completed"],
    },
  );
// Dynamic institutions will be fetched via hook

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
      activity_name: "",
      activity_type_code: "",
      category_costcode: "",
      commodity: [],
      fy_awarded: "",
      fy_completed: "",
      programme_phase: "VCDP Phase II",
      fiscal_quarter: [],
      unit: "Person",
      quarterly_beneficiary_data: {},
      vcdp_component: [],
      vcdp_sub_components: [],
      state: isNationalAdmin ? "" : user?.state || "",
      lgas: [],
      threeFS_primary: [],
      threeFS_sub_components: [],
      cofog_divisions: [],
      cofog_groups: [],
      funding_sources: [],
      sub_funding_sources: [],
      sub_funding_oof_text: "",
      sub_funding_private_text: "",
      sub_funding_value_chain_text: "",
      expenditure_fgn: "" as any,
      expenditure_state: "" as any,
      expenditure_ifad: "" as any,
      expenditure_ifad_loan: "" as any,
      expenditure_ifad_grant: "" as any,
      expenditure_oof: "" as any,
      expenditure_beneficiary: "" as any,
      expenditure_other: "" as any,
      expenditure_private_sector: "" as any,
      expenditure_value_chain: "" as any,
      expenditure_total_reported: "" as any,
      beneficiary_categories: [],
      beneficiary_total: "" as any,
      beneficiary_male: "" as any,
      beneficiary_female: "" as any,
      beneficiary_youth_under35: "" as any,
      beneficiary_plwd: "" as any,
      value_chain_segments: [],
      value_chain_segments_other: "",
      climate_flag: false,
      data_source: [],
      supporting_documents: [],
      classification_notes: "",
      executing_agency: "",
      institution_code: "",
      currency: "USD",
      status: isNationalAdmin ? "PUBLISHED" : "PENDING",
    },
  });

  const { setValue, getValues, control } = form;

  const watchedValues = useWatch({ control: form.control });

  const { data: institutionsList } = useInstitutions(watchedValues.state);

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
  const ifadTotal = useMemo(() => {
    return (Number(watchedValues.expenditure_ifad_loan) || 0) + (Number(watchedValues.expenditure_ifad_grant) || 0);
  }, [watchedValues.expenditure_ifad_loan, watchedValues.expenditure_ifad_grant]);

  const totalExpenditure = useMemo(() => {
    return (
      (Number(watchedValues.expenditure_fgn) || 0) +
      (Number(watchedValues.expenditure_state) || 0) +
      ifadTotal +
      (Number(watchedValues.expenditure_oof) || 0) +
      (Number(watchedValues.expenditure_beneficiary) || 0) +
      (Number(watchedValues.expenditure_private_sector) || 0) +
      (Number(watchedValues.expenditure_value_chain) || 0) +
      (Number(watchedValues.expenditure_other) || 0)
    );
  }, [watchedValues, ifadTotal]);

  // Logic: Filtered LGAs
  const filteredLGAs = useMemo(() => {
    const selectedStateName = watchedValues.state;
    if (!selectedStateName) return [];

    const selectedState = states?.find(
      (s) => s.name.toLowerCase() === selectedStateName.toLowerCase(),
    );
    const lgas = selectedState?.lgas.map((l) => l.name) || [];
    return ["All LGAs", ...lgas];
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

  // COFOG data structure
  const cofogMeta: Record<string, string[]> = {
    "Economic Affairs": [
      "Agriculture, forestry, fishing and hunting",
    ],
    "Environmental Protection": [
      "Waste management",
      "Pollution abatement",
      "Protection of biodiversity and landscape",
    ],
  };

  // Logic: Filtered COFOG Groups based on selected divisions
  const filteredCofogGroups = useMemo(() => {
    const selectedDivisions = watchedValues.cofog_divisions || [];
    if (selectedDivisions.length === 0) return [];
    return selectedDivisions.flatMap(
      (division) => cofogMeta[division] || [],
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.cofog_divisions]);

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

    const payload: any = {
      ...values,
      fy_awarded: parseInt(values.fy_awarded),
      fy_completed: parseInt(values.fy_completed),
      climate_flag: values.climate_flag ? "Yes" : "No",
      expenditure_ifad: (Number(values.expenditure_ifad_loan) || 0) + (Number(values.expenditure_ifad_grant) || 0),
    };

    // Aggregate quarterly data into top-level fields if not "All Quarters"
    if (!values.fiscal_quarter.includes("All Quarters") && values.quarterly_beneficiary_data) {
      let total = 0, male = 0, female = 0, youth = 0, plwd = 0;
      Object.values(values.quarterly_beneficiary_data).forEach((q: any) => {
        total += Number(q.total) || 0;
        male += Number(q.male) || 0;
        female += Number(q.female) || 0;
        youth += Number(q.youth) || 0;
        plwd += Number(q.plwd) || 0;
      });
      payload.beneficiary_total = total;
      payload.beneficiary_male = male;
      payload.beneficiary_female = female;
      payload.beneficiary_youth_under35 = youth;
      payload.beneficiary_plwd = plwd;
    }

    const t = Number(payload.beneficiary_total) || 0;
    const m = Number(payload.beneficiary_male) || 0;
    const f = Number(payload.beneficiary_female) || 0;
    const y = Number(payload.beneficiary_youth_under35) || 0;
    
    if (t > 0) {
      payload.beneficiary_male_percentage = parseFloat(((m / t) * 100).toFixed(1));
      payload.beneficiary_female_percentage = parseFloat(((f / t) * 100).toFixed(1));
      payload.beneficiary_youth_percentage = parseFloat(((y / t) * 100).toFixed(1));
    }

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
          <Card className="glass-card shadow-sm border-l-4 border-l-blue-500 relative z-50">
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ref_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID / Ref</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. VCDP/INV/001" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activity_type_code"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Activity Type/Code</FormLabel>
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
                                ? projectsList?.find((p) => p.activity_type_code === field.value)?.activity_type_code || field.value
                                : "Search Activity Code/Name"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search activity code or name..." />
                            <CommandList>
                              <CommandEmpty>No activity found.</CommandEmpty>
                              <CommandGroup>
                                {projectsList?.map((p) => (
                                  <CommandItem
                                    value={`${p.activity_type_code} ${p.name}`}
                                    key={p.id}
                                    onSelect={() => {
                                      form.setValue("activity_type_code", p.activity_type_code);
                                      form.setValue("project_name", p.name);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        p.activity_type_code === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="font-mono font-bold mr-2">{p.activity_type_code}</span> - {p.name}
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
                      <FormLabel>Activity Name (Full) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Search above or type activity name"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="activity_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name (Short)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Market linkages facilitation"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_costcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category / Costcode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Training, technical assistance..."
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                    <FormControl>
                      <MultiSelect
                        options={["Q1", "Q2", "Q3", "Q4", "All Quarters"]}
                        selected={field.value}
                        onChange={(vals) => {
                          if (vals.includes("All Quarters")) {
                            // If All Quarters was just selected, or already exists, ensure it's exclusive
                            const previouslyAll = field.value.includes("All Quarters");
                            if (!previouslyAll) {
                              field.onChange(["All Quarters"]);
                            } else {
                              const withoutAll = vals.filter(v => v !== "All Quarters");
                              if (withoutAll.length > 0) {
                                field.onChange(withoutAll);
                              } else {
                                field.onChange(["All Quarters"]);
                              }
                            }
                          } else {
                            field.onChange(vals);
                          }
                        }}
                        placeholder="Select Quarter(s)"
                      />
                    </FormControl>
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
                          onChange={(vals) => {
                            field.onChange(vals);
                            const currentSubs = form.getValues("vcdp_sub_components");
                            const newAllowed = vals.flatMap(
                              (c) => (vcdpMeta as Record<string, string[]>)?.[c] || []
                            );
                            form.setValue(
                              "vcdp_sub_components",
                              currentSubs.filter((s) => newAllowed.includes(s))
                            );
                          }}
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
                          onChange={(vals) => {
                            field.onChange(vals);
                            const currentSubs = form.getValues("threeFS_sub_components");
                            const newAllowed = vals.flatMap(
                              (p) => (threeFsMeta as Record<string, string[]>)?.[p] || []
                            );
                            form.setValue(
                              "threeFS_sub_components",
                              currentSubs.filter((s) => newAllowed.includes(s))
                            );
                          }}
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
                  name="executing_agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution / Executing Agency</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          const inst = institutionsList?.find(i => i.name === val);
                          if (inst) form.setValue("institution_code", inst.code);
                        }}
                        value={field.value}
                        disabled={!watchedValues.state}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={watchedValues.state ? "Select Institution" : "Select state first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {institutionsList?.map((inst) => (
                            <SelectItem key={inst.id} value={inst.name}>
                              {inst.code} - {inst.name}
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
                          onChange={(vals) => {
                            if (vals.includes("All LGAs")) {
                              const previouslyAll = field.value.includes("All LGAs");
                              if (!previouslyAll) {
                                field.onChange(["All LGAs"]);
                              } else {
                                const withoutAll = vals.filter(v => v !== "All LGAs");
                                if (withoutAll.length > 0) {
                                  field.onChange(withoutAll);
                                } else {
                                  field.onChange(["All LGAs"]);
                                }
                              }
                            } else {
                              field.onChange(vals);
                            }
                          }}
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
                          onChange={(vals) => {
                            field.onChange(vals);
                            const currentSubs = form.getValues("sub_funding_sources");
                            const newAllowed = vals.flatMap(
                              (f) => (fundMeta as Record<string, string[]>)?.[f] || []
                            );
                            form.setValue(
                              "sub_funding_sources",
                              currentSubs.filter((s) => newAllowed.includes(s))
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
                {/* Free-text: OOF description */}
                {watchedValues.sub_funding_sources?.includes("Other Official Flows (OOF)") && (
                  <FormField
                    control={form.control}
                    name="sub_funding_oof_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Other Official Flows (OOF) – specify source
                          <span className="ml-1 text-xs italic">(e.g. JICA)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. JICA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* Free-text: Private Sector Financing */}
                {watchedValues.funding_sources?.includes("Private Sector Financing") && (
                  <FormField
                    control={form.control}
                    name="sub_funding_private_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Private Sector Financing – specify source
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the private sector funding source" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* Free-text: Value Chain Financing */}
                {watchedValues.funding_sources?.includes("Value Chain Financing") && (
                  <FormField
                    control={form.control}
                    name="sub_funding_value_chain_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Value Chain Financing – specify source
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the value chain financing source" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="cofog_divisions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COFOG Division</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={Object.keys(cofogMeta)}
                          selected={field.value}
                          onChange={(vals) => {
                            field.onChange(vals);
                            // Reset groups when divisions change
                            const currentGroups = form.getValues("cofog_groups");
                            const newAllowed = vals.flatMap(
                              (d) => cofogMeta[d] || [],
                            );
                            form.setValue(
                              "cofog_groups",
                              currentGroups.filter((g) =>
                                newAllowed.includes(g),
                              ),
                            );
                          }}
                          placeholder="Select Division(s)"
                        />
                      </FormControl>
                      <FormDescription>
                        Classification of the Functions of Government
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cofog_groups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COFOG Group / Sub-Category</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredCofogGroups}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select Group(s)"
                          disabled={!watchedValues.cofog_divisions?.length}
                        />
                      </FormControl>
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
                Grant Details ({watchedValues.currency}) 
              </h3>
            </div>
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row gap-6 mb-8 p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-2 font-bold text-foreground">
                        Input Currency
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                      Allocated Budget
                    </p>
                    <p className="text-4xl font-display font-bold mt-1">
                      {watchedValues.currency === "NGN" ? "₦" : "$"}
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
                      {watchedValues.currency === "NGN" ? "₦" : "$"}
                      {(
                        watchedValues.expenditure_total_reported || 0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 mb-8">
                {/* Group 1: IFAD Financing */}
                <div className="p-6 rounded-xl bg-blue-50/50 border border-blue-100">
                  <h4 className="text-sm font-bold uppercase text-blue-700 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    IFAD Financing (ODA)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <FormField
                      control={form.control}
                      name="expenditure_ifad_loan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFAD Loan ({watchedValues.currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expenditure_ifad_grant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFAD Grant ({watchedValues.currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="p-3 bg-white rounded-lg border border-blue-200 flex justify-between items-center h-10">
                      <span className="text-xs font-bold text-blue-600">Total IFAD:</span>
                      <span className="font-display font-bold text-blue-700">
                        {watchedValues.currency === "NGN" ? "₦" : "$"}
                        {ifadTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group 2: Government & Community */}
                <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <h4 className="text-sm font-bold uppercase text-emerald-700 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Government & Community Contributions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="expenditure_fgn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FGN Budget ({watchedValues.currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
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
                          <FormLabel>State/LGA ({watchedValues.currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
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
                          <FormLabel>Beneficiary ({watchedValues.currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Group 3: Special & Private Financing */}
                <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
                  <h4 className="text-sm font-bold uppercase text-purple-700 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Special & Private Financing
                  </h4>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <FormField
                        control={form.control}
                        name="expenditure_oof"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFAD OOF (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                  field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sub_funding_oof_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OOF Description (Free Text)</FormLabel>
                            <FormControl>
                              <Input placeholder="Details about OOF..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <FormField
                        control={form.control}
                        name="expenditure_private_sector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Private Sector Financing (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                  field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sub_funding_private_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Private Sector Details (Free Text)</FormLabel>
                            <FormControl>
                              <Input placeholder="Company name, sector, etc..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <FormField
                        control={form.control}
                        name="expenditure_value_chain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Chain Financing (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                  field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sub_funding_value_chain_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Chain Details (Free Text)</FormLabel>
                            <FormControl>
                              <Input placeholder="Specific segment or activity..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="space-y-4">
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
                  {watchedValues.value_chain_segments?.includes("Others") && (
                    <FormField
                      control={form.control}
                      name="value_chain_segments_other"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Value Chain Segment(s)</FormLabel>
                          <FormControl>
                            <Input placeholder="Specify other segments..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="data_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source</FormLabel>
                      <MultiSelect
                        options={[
                          "Administrative documents (HR/Training reports)",
                          "Audit documents (Internal audit reports)",
                          "Financial documents (Bank statements, Invoices, SEOs, Memos)",
                          "Procurement: Goods",
                          "Procurement: Works",
                          "Procurement: Consulting services",
                          "Inventory documents (Asset registers, etc.)",
                          "M&E documents (AWPB, Studies, Supervision reports)",
                          "Correspondence",
                          "Beneficiary data",
                          "Technical reports",
                          "Annual reports",
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
              <CardDescription>
                Breakdown of beneficiaries or quantities per selected quarter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measurement <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Person", "Number", "Ha", "Km", "Kg", "Centres"].map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
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
                name="beneficiary_categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary Categories</FormLabel>
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

              {watchedValues.fiscal_quarter?.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-slate-50">
                  Please select at least one Fiscal Quarter in Section 1 to enter beneficiary data.
                </div>
              ) : (
                <div className="space-y-6">
                  {watchedValues.fiscal_quarter?.map((quarter) => (
                    <div key={quarter} className="p-6 border rounded-xl bg-slate-50/50 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                      <h4 className="font-bold text-rose-700 flex items-center gap-2">
                        {quarter === "All Quarters" ? "Cumulative Total" : `Quarterly Data: ${quarter}`}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField
                          control={form.control}
                          // We use the top-level fields for the "first" or "All" case to maintain compatibility,
                          // but for multi-quarter we should use the quarterly_beneficiary_data
                          name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_total" : `quarterly_beneficiary_data.${quarter}.total` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{watchedValues.unit === "Person" ? "Total Headcount" : "Total Quantity"} <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                    field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.unit === "Person" && (
                          <>
                            <FormField
                              control={form.control}
                              name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_male" : `quarterly_beneficiary_data.${quarter}.male` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Male</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_female" : `quarterly_beneficiary_data.${quarter}.female` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Female</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_youth_under35" : `quarterly_beneficiary_data.${quarter}.youth` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Youth (Under 35)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_plwd" : `quarterly_beneficiary_data.${quarter}.plwd` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PLWD</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
